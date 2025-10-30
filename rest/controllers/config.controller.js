// controllers/configController.js
const logger = require("../utils/logger");

/**
 * Location-aware Config controller
 * Assumptions:
 * - req.db is attached by attachDbAndCtx
 * - req.ctx = { isAdmin?, role, locationId, ... }
 * - Config table supports an optional LocationID column (null = global)
 */
module.exports = {
  // POST /configs
  // Non-admins: always write to their own location (LocationID forced)
  // Admins: may write global (LocationID = null) or any location
  create: async (req, res) => {
    const db = req.db;
    const Config = db.Config;

    try {
      const body = { ...req.body };

      if (!req.ctx?.isAdmin) {
        if (!req.ctx?.locationId) {
          return res.status(403).json({ message: "Missing location scope" });
        }
        body.LocationID = req.ctx.locationId; // never trust client LocationID
      } else {
        // admin can create global or per-location; if client omitted, keep as provided (including null)
        // (optional) coerce empty string to null for LocationID
        if (body.LocationID === "") body.LocationID = null;
      }

      const config = await Config.create(body);
      res.status(201).json(config);
    } catch (err) {
      logger.error("Config.create error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // GET /configs
  // Admins: list all (optionally filter by ?locationId)
  // Users: only see their location + global
  findAll: async (req, res) => {
    const db = req.db;
    const Config = db.Config;

    try {
      const where = {};

      if (req.ctx?.isAdmin) {
        if (req.query.locationId === "null") {
          where.LocationID = null;
        } else if (req.query.locationId) {
          where.LocationID = req.query.locationId;
        }
        // else: all configs
      } else {
        if (!req.ctx?.locationId) {
          return res.status(403).json({ message: "Missing location scope" });
        }
        // user can see global and their own location
        where.LocationID = [req.ctx.locationId, null];
      }

      const configs = await Config.findAll({ where, order: [["id", "DESC"]] });
      res.status(200).json(configs);
    } catch (err) {
      logger.error("Config.findAll error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // GET /configs/:id
  // Users: can read only if config is global or matches their location
  findOne: async (req, res) => {
    const db = req.db;
    const Config = db.Config;

    try {
      const config = await Config.findByPk(req.params.id);
      if (!config) return res.status(404).json({ message: "Config not found" });

      if (!req.ctx?.isAdmin) {
        if (!req.ctx?.locationId) {
          return res.status(403).json({ message: "Missing location scope" });
        }
        if (
          config.LocationID != null &&
          String(config.LocationID) !== String(req.ctx.locationId)
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: Cross-location access denied" });
        }
      }

      res.status(200).json(config);
    } catch (err) {
      logger.error("Config.findOne error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // GET /configs/byKey?configKey=...
  // Returns best match with precedence:
  //  1) exact match for user's location (or ?locationId for admin)
  //  2) global (LocationID = null)
  // If neither exists → 404
  findByConfigKey: async (req, res) => {
    const db = req.db;
    const Config = db.Config;

    try {
      const { configKey } = req.query;
      if (!configKey) {
        return res.status(400).json({ message: "configKey is required" });
      }

      const desiredLocationId = req.ctx?.isAdmin
        ? req.query.locationId === "null"
          ? null
          : req.query.locationId ?? req.ctx?.locationId ?? null
        : req.ctx?.locationId ?? null;

      // Try location-specific first (if we have a location)
      let cfg = null;
      if (desiredLocationId != null) {
        cfg = await Config.findOne({
          where: { configKey, LocationID: desiredLocationId },
        });
      }

      // Then fallback to global
      if (!cfg) {
        cfg = await Config.findOne({
          where: { configKey, LocationID: null },
        });
      }

      if (!cfg) {
        return res.status(404).json({ message: "Config not found" });
      }

      // Non-admins: ensure they are allowed to see it
      if (!req.ctx?.isAdmin) {
        if (
          cfg.LocationID != null &&
          String(cfg.LocationID) !== String(req.ctx.locationId)
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: Cross-location access denied" });
        }
      }

      res.status(200).json(cfg);
    } catch (err) {
      logger.error("Config.findByConfigKey error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // PUT /configs/:id
  // Non-admins: can update only configs for their location; cannot change LocationID
  // Admins: can update any config; LocationID may be changed
  update: async (req, res) => {
    const db = req.db;
    const Config = db.Config;

    try {
      const config = await Config.findByPk(req.params.id);
      if (!config) return res.status(404).json({ message: "Config not found" });

      if (!req.ctx?.isAdmin) {
        if (!req.ctx?.locationId) {
          return res.status(403).json({ message: "Missing location scope" });
        }
        if (
          config.LocationID == null || // global configs cannot be edited by non-admins
          String(config.LocationID) !== String(req.ctx.locationId)
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: Cross-location access denied" });
        }
      }

      const updates = { ...req.body };
      // Prevent non-admins from changing LocationID
      if (!req.ctx?.isAdmin && "LocationID" in updates) {
        delete updates.LocationID;
      }

      await config.update(updates);
      res.status(200).json(config);
    } catch (err) {
      logger.error("Config.update error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // DELETE /configs/:id
  // Non-admins: can delete only their location’s configs (not global)
  // Admins: can delete any
  delete: async (req, res) => {
    const db = req.db;
    const Config = db.Config;

    try {
      const config = await Config.findByPk(req.params.id);
      if (!config) return res.status(404).json({ message: "Config not found" });

      if (!req.ctx?.isAdmin) {
        if (!req.ctx?.locationId) {
          return res.status(403).json({ message: "Missing location scope" });
        }
        if (
          config.LocationID == null || // prevent deleting global as non-admin
          String(config.LocationID) !== String(req.ctx.locationId)
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: Cross-location access denied" });
        }
      }

      await config.destroy();
      res.status(204).end();
    } catch (err) {
      logger.error("Config.delete error:", err);
      res.status(500).json({ message: err.message });
    }
  },
};
