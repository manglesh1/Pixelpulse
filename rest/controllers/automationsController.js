// controllers/automationsController.js
const { Op } = require("sequelize");
const {
  SmartDeviceAutomation,
  SmartDeviceAutomationLog,
} = require("../models");
const { normalizeMac } = require("../services/tplinkDiscovery");
const registry = require("../services/deviceRegistry");
const smart = require("./smartDevicesController"); // uses resolveIp(), set by MAC/Alias

// --- helpers ---
function toJSONString(val) {
  if (val == null) return null;
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return null;
  }
}

function sanitizeBody(body) {
  const b = { ...body };
  if ("macAddress" in b && b.macAddress)
    b.macAddress = normalizeMac(b.macAddress);
  if ("quietHoursJson" in b) b.quietHoursJson = toJSONString(b.quietHoursJson);
  if ("deviceIp" in b && b.deviceIp === "") b.deviceIp = null;
  if ("cron" in b && b.cron === "") b.cron = null;
  return b;
}

async function log(automationId, event, reason, extra = {}) {
  try {
    const row = await SmartDeviceAutomation.findByPk(automationId);
    if (!row) return;
    const resolvedIp = await smart
      .resolveIp({
        mac: row.macAddress,
        alias: row.deviceAlias,
        ip: row.deviceIp,
      })
      .catch(() => null);

    await SmartDeviceAutomationLog.create({
      automationId,
      deviceAlias: row.deviceAlias,
      macAddress: row.macAddress || null,
      resolvedIp,
      event,
      reason,
      contextJson: extra,
    });
  } catch {}
}

module.exports = {
  // ---- CRUD ----
  list: async (req, res) => {
    const { enabled, q } = req.query;
    const where = {};
    if (enabled === "true") where.enabled = true;
    if (enabled === "false") where.enabled = false;
    if (q) {
      where[Op.or] = [
        { deviceAlias: { [Op.like]: `%${q}%` } },
        { macAddress: { [Op.like]: `%${q}%` } },
      ];
    }
    const rows = await SmartDeviceAutomation.findAll({
      where,
      order: [["id", "ASC"]],
    });
    res.json(rows);
  },

  get: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  },

  create: async (req, res) => {
    const body = sanitizeBody(req.body);
    if (!body.deviceAlias)
      return res.status(400).json({ error: "deviceAlias is required" });
    // You should provide at least a macAddress or an initial deviceIp; alias will also work with discovery.
    const row = await SmartDeviceAutomation.create(body);
    res.status(201).json(row);
  },

  update: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });

    const body = sanitizeBody(req.body);
    await row.update(body);
    res.json(row);
  },

  remove: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });
    await row.destroy();
    res.json({ ok: true });
  },

  enable: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });
    await row.update({ enabled: true });
    res.json(row);
  },

  disable: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });
    await row.update({ enabled: false, status: "off" });
    res.json(row);
  },

  // ---- Logs ----
  logs: async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const rows = await SmartDeviceAutomationLog.findAll({
      where: { automationId: req.params.id },
      order: [["createdAt", "DESC"]],
      limit,
    });
    res.json(rows);
  },

  // ---- Discovery binding / sync ----
  // Try to bind/update deviceIp/mac by alias or mac for a single automation row
  bindFromDiscovery: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });

    await registry.refresh();
    // Priority: mac if present, else alias
    let device = null;
    if (row.macAddress) device = await registry.getByMac(row.macAddress);
    if (!device && row.deviceAlias)
      device = await registry.getByAlias(row.deviceAlias);

    if (!device) {
      return res
        .status(404)
        .json({ error: "device not found on LAN via discovery" });
    }

    const updates = {};
    if (device.ip && device.ip !== row.deviceIp) updates.deviceIp = device.ip;
    if (device.alias && device.alias !== row.deviceAlias)
      updates.deviceAlias = device.alias;
    if (
      device.mac &&
      normalizeMac(device.mac) !== normalizeMac(row.macAddress)
    ) {
      updates.macAddress = normalizeMac(device.mac);
    }

    if (Object.keys(updates).length) await row.update(updates);

    res.json({ ok: true, automation: row, discovered: device });
  },

  // ---- Manual actions / tests ----
  // Resolve current IP the engine will use (debug)
  resolveTarget: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });
    const ip = await smart.resolveIp({
      mac: row.macAddress,
      alias: row.deviceAlias,
      ip: row.deviceIp,
    });
    res.json({ ip, mac: row.macAddress, alias: row.deviceAlias });
  },

  // Force ON immediately (override) and optionally auto-off after ms
  forceOn: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });

    const ip = await smart.setDevicePowerByMacInternal(
      row.macAddress || "",
      "on"
    );
    row.lastOnAt = new Date();
    row.status = "on";
    await row.save({ fields: ["lastOnAt", "status"] });
    await log(row.id, "on", "manual_force_on", { via: "controller", ip });

    const autoOffMs = Number(req.query.autoOffMs || 0);
    if (autoOffMs > 0) {
      setTimeout(async () => {
        try {
          const ip2 = await smart.setDevicePowerByMacInternal(
            row.macAddress || "",
            "off"
          );
          row.lastOffAt = new Date();
          row.status = "off";
          await row.save({ fields: ["lastOffAt", "status"] });
          await log(row.id, "off", "manual_auto_off", { ip: ip2 });
        } catch (e) {
          await log(row.id, "error", "manual_auto_off_failed", {
            message: e.message,
          });
        }
      }, autoOffMs);
    }

    res.json({ ok: true, ip });
  },

  // Force OFF immediately
  forceOff: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });

    const ip = await smart.setDevicePowerByMacInternal(
      row.macAddress || "",
      "off"
    );
    row.lastOffAt = new Date();
    row.status = "off";
    await row.save({ fields: ["lastOffAt", "status"] });
    await log(row.id, "off", "manual_force_off", { via: "controller", ip });

    res.json({ ok: true, ip });
  },

  // Quick pulse now (ignore minInterval, for testing)
  pulseNow: async (req, res) => {
    const row = await SmartDeviceAutomation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });

    const onMs = Number(req.query.onMs || row.onDurationMs || 60000);

    const ip = await smart.setDevicePowerByMacInternal(
      row.macAddress || "",
      "on"
    );
    row.lastOnAt = new Date();
    row.status = "on";
    await row.save({ fields: ["lastOnAt", "status"] });
    await log(row.id, "on", "manual_pulse_start", { ip, onMs });

    setTimeout(async () => {
      try {
        const ip2 = await smart.setDevicePowerByMacInternal(
          row.macAddress || "",
          "off"
        );
        row.lastOffAt = new Date();
        row.status = "off";
        await row.save({ fields: ["lastOffAt", "status"] });
        await log(row.id, "off", "manual_pulse_end", { ip: ip2 });
      } catch (e) {
        await log(row.id, "error", "manual_pulse_off_failed", {
          message: e.message,
        });
      }
    }, onMs);

    res.json({ ok: true, ip, onMs });
  },
};
