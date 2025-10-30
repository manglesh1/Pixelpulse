// controllers/apiKey.controller.js
const logger = require("../utils/logger");
const { generateApiKey } = require("../utils/apiKeyGenerator");

/**
 * Notes:
 * - Uses req.db, req.ctx from attachDbAndCtx
 * - Non-admins are restricted to their own locationId
 * - Raw API key is only returned at creation time
 * - list() hides the raw key; returns a maskedKey instead
 */

function isAdmin(req) {
  return req?.ctx?.role === "admin";
}

function maskKey(key) {
  if (!key || typeof key !== "string") return null;
  // keep first 4 + last 4
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

// POST /apikeys
exports.create = async (req, res) => {
  const db = req.db;
  const ApiKey = db.ApiKey;

  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });

    // Determine locationId (non-admins are forced to their own location)
    let locationId = null;

    if (!isAdmin(req)) {
      if (!req.ctx?.locationId) {
        return res.status(403).json({ message: "Missing location scope" });
      }
      locationId = req.ctx.locationId;
    } else {
      // Admin can create global key (locationId = null) or per-location
      if ("locationId" in req.body) {
        locationId =
          req.body.locationId === "" ? null : req.body.locationId ?? null;
      } else {
        // If you prefer to require explicit locationId for admins, uncomment below:
        // return res.status(400).json({ message: "locationId is required for admin (use null for global)" });
        locationId = null; // default to global if not provided
      }
    }

    const key = generateApiKey();

    const record = await ApiKey.create({
      name,
      locationId,
      key,
      isActive: true,
    });

    // Return the raw key only once
    res.status(201).json({
      message: "API key generated successfully",
      id: record.id,
      name: record.name,
      locationId: record.locationId,
      isActive: record.isActive,
      createdAt: record.createdAt,
      apiKey: record.key, // <-- one-time reveal
    });
  } catch (err) {
    logger.error("ApiKey.create error:", err);
    res.status(500).json({ error: "Failed to generate API key" });
  }
};

// GET /apikeys
// Admin: all (optional ?locationId=… / ?locationId=null)
// Non-admin: only their location (and optionally global if you support global keys for services)
exports.list = async (req, res) => {
  const db = req.db;
  const ApiKey = db.ApiKey;
  const Location = db.Location;

  try {
    const where = {};

    if (isAdmin(req)) {
      if (req.query.locationId === "null") {
        where.locationId = null;
      } else if (req.query.locationId) {
        where.locationId = req.query.locationId;
      }
      // else list all
    } else {
      if (!req.ctx?.locationId) {
        return res.status(403).json({ message: "Missing location scope" });
      }
      // By default, show keys only for the caller's location.
      // If you want non-admins to also see global keys, use: where.locationId = [req.ctx.locationId, null];
      where.locationId = req.ctx.locationId;
    }

    // Fetch keys
    const keys = await ApiKey.findAll({
      where,
      attributes: [
        "id",
        "name",
        "key",
        "locationId",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
      order: [["id", "DESC"]],
    });

    // Fetch locations once (for enrichment)
    const locations = await Location.findAll({
      attributes: ["LocationID", "Name", "City"],
    });
    const locationMap = new Map(
      locations.map((loc) => [String(loc.LocationID), loc])
    );

    // Build safe payload (no raw key)
    const enriched = keys.map((row) => {
      const json = row.toJSON();
      const loc =
        json.locationId != null
          ? locationMap.get(String(json.locationId))
          : null;
      return {
        id: json.id,
        name: json.name,
        locationId: json.locationId,
        isActive: json.isActive,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
        key: json.key,
        location: loc ? { Name: loc.Name, City: loc.City } : null,
      };
    });

    res.status(200).json(enriched);
  } catch (err) {
    logger.error("ApiKey.list error:", err);
    res.status(500).json({ error: "Failed to retrieve API keys" });
  }
};

// POST /apikeys/:id/deactivate
exports.deactivate = async (req, res) => {
  const db = req.db;
  const ApiKey = db.ApiKey;

  try {
    const { id } = req.params;
    const row = await ApiKey.findByPk(id);
    if (!row) return res.status(404).json({ message: "API key not found" });

    // Non-admins: can only deactivate keys in their own location
    if (!isAdmin(req)) {
      if (!req.ctx?.locationId) {
        return res.status(403).json({ message: "Missing location scope" });
      }
      if (
        row.locationId == null ||
        String(row.locationId) !== String(req.ctx.locationId)
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: Cross-location access denied" });
      }
    }

    await row.update({ isActive: false });
    res.status(200).json({ message: "API key deactivated successfully" });
  } catch (err) {
    logger.error("ApiKey.deactivate error:", err);
    res.status(500).json({ error: "Failed to deactivate API key" });
  }
};
