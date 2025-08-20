// controllers/automationsController.js
const { Op } = require("sequelize");
const {
  SmartDeviceAutomation,
  SmartDeviceAutomationLog,
} = require("../models");
const { normalizeMac } = require("../services/tplinkDiscovery");
const registry = require("../services/deviceRegistry");
const smart = require("./smartDevicesController"); // uses setDevicePowerInternal

// ----------------- helpers -----------------
function toJSONString(val) {
  if (val == null) return null;
  if (typeof val === "string") return val;
  try { return JSON.stringify(val); } catch { return null; }
}

function sanitizeBody(body) {
  const b = { ...body };
  if ("macAddress" in b && b.macAddress) b.macAddress = normalizeMac(b.macAddress);
  if ("quietHoursJson" in b) b.quietHoursJson = toJSONString(b.quietHoursJson);
  if ("deviceIp" in b && b.deviceIp === "") b.deviceIp = null;
  if ("cron" in b && b.cron === "") b.cron = null;
  return b;
}

// Resolve current IP for a given automation row using the same discovery/registry
// strategy as smartDevices: prefer existing deviceIp, otherwise bind via MAC, else alias.
// Optionally refresh discovery if the first pass misses.
async function resolveIpForRow(row, { allowRefresh = true } = {}) {
  // 1) If we already have deviceIp, use it
  if (row.deviceIp) return row.deviceIp;

  // 2) Try registry lookups without refresh
  if (row.macAddress) {
    const d = await registry.getByMac(row.macAddress).catch(() => null);
    if (d?.ip) return d.ip;
  }
  if (row.deviceAlias) {
    const d = await registry.getByAlias(row.deviceAlias).catch(() => null);
    if (d?.ip) return d.ip;
  }

  // 3) If allowed, refresh discovery and retry
  if (allowRefresh) {
    await registry.refresh().catch(() => {});
    if (row.macAddress) {
      const d2 = await registry.getByMac(row.macAddress).catch(() => null);
      if (d2?.ip) return d2.ip;
    }
    if (row.deviceAlias) {
      const d2 = await registry.getByAlias(row.deviceAlias).catch(() => null);
      if (d2?.ip) return d2.ip;
    }
  }

  return null;
}

// Centralized log helper (safe)
async function log(automationId, event, reason, extra = {}) {
  try {
    const row = await SmartDeviceAutomation.findByPk(automationId);
    if (!row) return;
    const resolvedIp = await resolveIpForRow(row, { allowRefresh: false }).catch(() => null);
    await SmartDeviceAutomationLog.create({
      automationId,
      deviceAlias: row.deviceAlias,
      macAddress: row.macAddress || null,
      resolvedIp,
      event,
      reason,
      contextJson: extra,
    });
  } catch {
    /* swallow logging errors */
  }
}

// Thin wrapper to drive the device exactly like smartDevices controller
async function setPower(ip, state) {
  // state: 'on' | 'off'
  await smart.setDevicePowerInternal(ip, state);
}

// ----------------- controller -----------------
module.exports = {
  // ---- CRUD ----
  list: async (req, res) => {
    try {
      const { enabled, q } = req.query;
      const where = {};
      if (enabled === "true") where.enabled = true;
      if (enabled === "false") where.enabled = false;
      if (q) {
        where[Op.or] = [
          { deviceAlias: { [Op.like]: `%${q}%` } },
          { macAddress:  { [Op.like]: `%${q}%` } },
          { notes:       { [Op.like]: `%${q}%` } },
        ];
      }
      const rows = await SmartDeviceAutomation.findAll({ where, order: [["id", "ASC"]] });
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: "list failed", message: e.message });
    }
  },

  get: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: "get failed", message: e.message });
    }
  },

  create: async (req, res) => {
    try {
      const body = sanitizeBody(req.body);
      if (!body.deviceAlias) {
        return res.status(400).json({ error: "deviceAlias is required" });
      }
      const row = await SmartDeviceAutomation.create(body);
      res.status(201).json(row);
    } catch (e) {
      res.status(500).json({ error: "create failed", message: e.message });
    }
  },

  update: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });
      const body = sanitizeBody(req.body);
      await row.update(body);
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: "update failed", message: e.message });
    }
  },

  remove: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });
      await row.destroy();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "remove failed", message: e.message });
    }
  },

  enable: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });
      await row.update({ enabled: true });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: "enable failed", message: e.message });
    }
  },

  disable: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });
      await row.update({ enabled: false, status: "off" });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: "disable failed", message: e.message });
    }
  },

  // ---- Logs ----
  logs: async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 200, 1000);
      const rows = await SmartDeviceAutomationLog.findAll({
        where: { automationId: req.params.id },
        order: [["createdAt", "DESC"]],
        limit,
      });
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: "logs failed", message: e.message });
    }
  },

  // ---- Discovery binding / sync ----
  bindFromDiscovery: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });

      await registry.refresh();

      // Priority: mac if present, else alias
      let device = null;
      if (row.macAddress) device = await registry.getByMac(row.macAddress);
      if (!device && row.deviceAlias) device = await registry.getByAlias(row.deviceAlias);

      if (!device) {
        return res.status(404).json({ error: "device not found on LAN via discovery" });
      }

      const updates = {};
      if (device.ip && device.ip !== row.deviceIp) updates.deviceIp = device.ip;
      if (device.alias && device.alias !== row.deviceAlias) updates.deviceAlias = device.alias;
      if (device.mac && normalizeMac(device.mac) !== normalizeMac(row.macAddress)) {
        updates.macAddress = normalizeMac(device.mac);
      }

      if (Object.keys(updates).length) await row.update(updates);

      res.json({ ok: true, automation: row, discovered: device });
    } catch (e) {
      res.status(500).json({ error: "bindFromDiscovery failed", message: e.message });
    }
  },

  // ---- Manual actions / tests ----
  resolveTarget: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      res.json({ ip, mac: row.macAddress, alias: row.deviceAlias });
    } catch (e) {
      res.status(500).json({ error: "resolveTarget failed", message: e.message });
    }
  },

  // Force ON immediately (override) and optionally auto-off after ms
  forceOn: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      if (!ip) return res.status(404).json({ error: "device IP unresolved" });

      await setPower(ip, "on");
      row.lastOnAt = new Date();
      row.status = "on";
      await row.save({ fields: ["lastOnAt", "status"] });
      await log(row.id, "on", "manual_force_on", { via: "controller", ip });

      const autoOffMs = Number(req.query.autoOffMs || 0);
      if (autoOffMs > 0) {
        setTimeout(async () => {
          try {
            await setPower(ip, "off");
            row.lastOffAt = new Date();
            row.status = "off";
            await row.save({ fields: ["lastOffAt", "status"] });
            await log(row.id, "off", "manual_auto_off", { ip });
          } catch (e) {
            await log(row.id, "error", "manual_auto_off_failed", { message: e.message });
          }
        }, autoOffMs);
      }

      res.json({ ok: true, ip });
    } catch (e) {
      res.status(500).json({ error: "forceOn failed", message: e.message });
    }
  },

  // Force OFF immediately
  forceOff: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      if (!ip) return res.status(404).json({ error: "device IP unresolved" });

      await setPower(ip, "off");
      row.lastOffAt = new Date();
      row.status = "off";
      await row.save({ fields: ["lastOffAt", "status"] });
      await log(row.id, "off", "manual_force_off", { via: "controller", ip });

      res.json({ ok: true, ip });
    } catch (e) {
      res.status(500).json({ error: "forceOff failed", message: e.message });
    }
  },

  // Quick pulse now (ignore minInterval, for testing)
  pulseNow: async (req, res) => {
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });

      const onMs = Number(req.query.onMs || row.onDurationMs || 60000) || 60000;

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      if (!ip) return res.status(404).json({ error: "device IP unresolved" });

      // Turn ON now
      await setPower(ip, "on");
      row.lastOnAt = new Date();
      row.status = "on";
      await row.save({ fields: ["lastOnAt", "status"] });
      await log(row.id, "on", "manual_pulse_start", { ip, onMs });

      // Schedule OFF (fire-and-forget; guard its own errors)
      setTimeout(async () => {
        try {
          await setPower(ip, "off");
          row.lastOffAt = new Date();
          row.status = "off";
          await row.save({ fields: ["lastOffAt", "status"] });
          await log(row.id, "off", "manual_pulse_end", { ip });
        } catch (e) {
          await log(row.id, "error", "manual_pulse_off_failed", { message: e.message });
        }
      }, onMs);

      res.json({ ok: true, ip, onMs });
    } catch (e) {
      res.status(500).json({ error: "pulseNow failed", message: e.message });
    }
  },
};
