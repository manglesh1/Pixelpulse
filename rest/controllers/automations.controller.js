const { Op } = require("sequelize");
const logger = require("../utils/logger");

const smart = require("./smartDevices.controller"); 
const registry = require("../services/deviceRegistry");
const { normalizeMac } = require("../services/tplinkDiscovery");

// helpers
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

async function log(db, automationId, event, reason, extra = {}) {
  try {
    const { SmartDeviceAutomation, SmartDeviceAutomationLog } = db;
    const row = await SmartDeviceAutomation.findByPk(automationId);
    if (!row) return;
    const resolvedIp = await resolveIpForRow(row, {
      allowRefresh: false,
    }).catch(() => null);
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

async function setPower(ip, state) {
  // state: 'on' | 'off'
  await smart.setDevicePowerInternal(ip, state);
}

function isAdmin(req) {
  return req?.ctx?.role === "admin";
}

// Build common includes to expose location via associations
function includesWithLocation(db) {
  const { GameLocation, LocationVariant } = db;
  return [
    {
      model: GameLocation,
      as: "room",
      required: false,
      attributes: ["id", "LocationID", "GameID", "alias"],
    },
    {
      model: LocationVariant,
      as: "locationVariant",
      required: false,
      attributes: ["id", "LocationID", "GamesVariantId", "GameLocationID"],
    },
  ];
}

// Top-level WHERE that enforces location for non-admin via virtual aliased paths
function whereForLocation(req) {
  if (isAdmin(req)) return {}; // admins unrestricted
  const locId = req.ctx?.locationId;
  if (!locId) return { id: { [Op.eq]: null } }; // force empty if no scope
  return {
    [Op.or]: [
      { "$room.LocationID$": String(locId) },
      { "$locationVariant.LocationID$": String(locId) },
    ],
  };
}

// Ensure this specific row is visible to the requester (for get/update/delete/act)
function assertRowAccessOrThrow(req, row) {
  if (isAdmin(req)) return;
  const locId = req.ctx?.locationId;
  if (!locId) {
    const err = new Error("Missing location scope");
    err.status = 403;
    throw err;
  }
  const rowLoc =
    row?.room?.LocationID ?? row?.locationVariant?.LocationID ?? null;

  if (rowLoc != null && String(rowLoc) !== String(locId)) {
    const err = new Error("Forbidden: Cross-location access denied");
    err.status = 403;
    throw err;
  }
}

// Validate that payload references a room/variant in caller's location (for create/update)
async function assertPayloadLocationOrThrow(req, db, body) {
  if (isAdmin(req)) return;

  const locId = req.ctx?.locationId;
  if (!locId) {
    const err = new Error("Missing location scope");
    err.status = 403;
    throw err;
  }

  const { GameLocationID, LocationVariantID } = body;

  // Require at least one anchor for non-admins
  if (!GameLocationID && !LocationVariantID) {
    const err = new Error(
      "Non-admin must provide GameLocationID or LocationVariantID"
    );
    err.status = 400;
    throw err;
  }

  if (GameLocationID) {
    const gl = await db.GameLocation.findByPk(GameLocationID, {
      attributes: ["id", "LocationID"],
    });
    if (!gl || String(gl.LocationID) !== String(locId)) {
      const err = new Error(
        "Forbidden: GameLocation does not belong to your location"
      );
      err.status = 403;
      throw err;
    }
  }

  if (LocationVariantID) {
    const lv = await db.LocationVariant.findByPk(LocationVariantID, {
      attributes: ["id", "LocationID"],
    });
    if (!lv || String(lv.LocationID) !== String(locId)) {
      const err = new Error(
        "Forbidden: LocationVariant does not belong to your location"
      );
      err.status = 403;
      throw err;
    }
  }
}

// controller
module.exports = {
  // ---- CRUD ----
  list: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const { enabled, q } = req.query;

      const where = whereForLocation(req);

      if (enabled === "true") where.enabled = true;
      if (enabled === "false") where.enabled = false;
      if (q) {
        where[Op.or] = [
          { deviceAlias: { [Op.like]: `%${q}%` } },
          { macAddress: { [Op.like]: `%${q}%` } },
          { notes: { [Op.like]: `%${q}%` } },
        ];
      }

      const rows = await SmartDeviceAutomation.findAll({
        where,
        include: includesWithLocation(db),
        order: [["id", "ASC"]],
      });

      res.json(rows);
    } catch (e) {
      logger.error("automations.list error:", e);
      res.status(500).json({ error: "list failed", message: e.message });
    }
  },

  get: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);
      res.json(row);
    } catch (e) {
      logger.error("automations.get error:", e);
      res
        .status(e.status || 500)
        .json({ error: "get failed", message: e.message });
    }
  },

  create: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const body = sanitizeBody(req.body);
      if (!body.deviceAlias) {
        return res.status(400).json({ error: "deviceAlias is required" });
      }

      // For non-admins, require & validate room/variant location
      await assertPayloadLocationOrThrow(req, db, body);

      const row = await SmartDeviceAutomation.create(body);
      const withLoc = await SmartDeviceAutomation.findByPk(row.id, {
        include: includesWithLocation(db),
      });
      res.status(201).json(withLoc);
    } catch (e) {
      logger.error("automations.create error:", e);
      res
        .status(e.status || 500)
        .json({ error: "create failed", message: e.message });
    }
  },

  update: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);

      const body = sanitizeBody(req.body);
      // If non-admin attempts to change anchors, re-validate
      if (
        !isAdmin(req) &&
        ("GameLocationID" in body || "LocationVariantID" in body)
      ) {
        await assertPayloadLocationOrThrow(req, db, {
          GameLocationID: body.GameLocationID ?? row.GameLocationID,
          LocationVariantID: body.LocationVariantID ?? row.LocationVariantID,
        });
      }

      await row.update(body);
      const fresh = await SmartDeviceAutomation.findByPk(row.id, {
        include: includesWithLocation(db),
      });
      res.json(fresh);
    } catch (e) {
      logger.error("automations.update error:", e);
      res
        .status(e.status || 500)
        .json({ error: "update failed", message: e.message });
    }
  },

  remove: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);

      await row.destroy();
      res.json({ ok: true });
    } catch (e) {
      logger.error("automations.remove error:", e);
      res
        .status(e.status || 500)
        .json({ error: "remove failed", message: e.message });
    }
  },

  enable: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);

      await row.update({ enabled: true });
      res.json(row);
    } catch (e) {
      logger.error("automations.enable error:", e);
      res
        .status(e.status || 500)
        .json({ error: "enable failed", message: e.message });
    }
  },

  disable: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;
    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);

      await row.update({ enabled: false, status: "off" });
      res.json(row);
    } catch (e) {
      logger.error("automations.disable error:", e);
      res
        .status(e.status || 500)
        .json({ error: "disable failed", message: e.message });
    }
  },

  // logs
  logs: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation, SmartDeviceAutomationLog } = db;

    try {
      const limit = Math.min(Number(req.query.limit) || 200, 1000);

      // fetch the automation with location to enforce access
      const auto = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!auto) return res.status(404).json({ error: "not found" });
      assertRowAccessOrThrow(req, auto);

      const rows = await SmartDeviceAutomationLog.findAll({
        where: { automationId: req.params.id },
        order: [["createdAt", "DESC"]],
        limit,
      });
      res.json(rows);
    } catch (e) {
      logger.error("automations.logs error:", e);
      res
        .status(e.status || 500)
        .json({ error: "logs failed", message: e.message });
    }
  },

  // ---- Discovery binding / sync ----
  bindFromDiscovery: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });
      assertRowAccessOrThrow(req, row);

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
    } catch (e) {
      logger.error("automations.bindFromDiscovery error:", e);
      res
        .status(e.status || 500)
        .json({ error: "bindFromDiscovery failed", message: e.message });
    }
  },

  // ---- Manual actions / tests ----
  resolveTarget: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });
      assertRowAccessOrThrow(req, row);

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      res.json({ ip, mac: row.macAddress, alias: row.deviceAlias });
    } catch (e) {
      logger.error("automations.resolveTarget error:", e);
      res
        .status(e.status || 500)
        .json({ error: "resolveTarget failed", message: e.message });
    }
  },

  // Force ON immediately (override) and optionally auto-off after ms
  forceOn: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      if (!ip) return res.status(404).json({ error: "device IP unresolved" });

      await setPower(ip, "on");
      row.lastOnAt = new Date();
      row.status = "on";
      await row.save({ fields: ["lastOnAt", "status"] });
      await log(db, row.id, "on", "manual_force_on", { via: "controller", ip });

      const autoOffMs = Number(req.query.autoOffMs || 0);
      if (autoOffMs > 0) {
        setTimeout(async () => {
          try {
            await setPower(ip, "off");
            row.lastOffAt = new Date();
            row.status = "off";
            await row.save({ fields: ["lastOffAt", "status"] });
            await log(db, row.id, "off", "manual_auto_off", { ip });
          } catch (e) {
            await log(db, row.id, "error", "manual_auto_off_failed", {
              message: e.message,
            });
          }
        }, autoOffMs);
      }

      res.json({ ok: true, ip });
    } catch (e) {
      logger.error("automations.forceOn error:", e);
      res
        .status(e.status || 500)
        .json({ error: "forceOn failed", message: e.message });
    }
  },

  // Force OFF immediately
  forceOff: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      if (!ip) return res.status(404).json({ error: "device IP unresolved" });

      await setPower(ip, "off");
      row.lastOffAt = new Date();
      row.status = "off";
      await row.save({ fields: ["lastOffAt", "status"] });
      await log(db, row.id, "off", "manual_force_off", {
        via: "controller",
        ip,
      });

      res.json({ ok: true, ip });
    } catch (e) {
      logger.error("automations.forceOff error:", e);
      res
        .status(e.status || 500)
        .json({ error: "forceOff failed", message: e.message });
    }
  },

  // Quick pulse now (ignore minInterval, for testing)
  pulseNow: async (req, res) => {
    const db = req.db;
    const { SmartDeviceAutomation } = db;

    try {
      const row = await SmartDeviceAutomation.findByPk(req.params.id, {
        include: includesWithLocation(db),
      });
      if (!row) return res.status(404).json({ error: "not found" });

      assertRowAccessOrThrow(req, row);

      const onMs = Number(req.query.onMs || row.onDurationMs || 60000) || 60000;

      const ip = await resolveIpForRow(row, { allowRefresh: true });
      if (!ip) return res.status(404).json({ error: "device IP unresolved" });

      // Turn ON now
      await setPower(ip, "on");
      row.lastOnAt = new Date();
      row.status = "on";
      await row.save({ fields: ["lastOnAt", "status"] });
      await log(db, row.id, "on", "manual_pulse_start", { ip, onMs });

      // Schedule OFF (fire-and-forget; guard its own errors)
      setTimeout(async () => {
        try {
          await setPower(ip, "off");
          row.lastOffAt = new Date();
          row.status = "off";
          await row.save({ fields: ["lastOffAt", "status"] });
          await log(db, row.id, "off", "manual_pulse_end", { ip });
        } catch (e) {
          await log(db, row.id, "error", "manual_pulse_off_failed", {
            message: e.message,
          });
        }
      }, onMs);

      res.json({ ok: true, ip, onMs });
    } catch (e) {
      logger.error("automations.pulseNow error:", e);
      res
        .status(e.status || 500)
        .json({ error: "pulseNow failed", message: e.message });
    }
  },
};
