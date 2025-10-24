const db = require("../models");
const { generateApiKey } = require("../utils/apiKeyGenerator");
const ApiKey = db.ApiKey;
const Location = db.Location;

// Create new API Key
exports.create = async (req, res) => {
  try {
    const { name, locationId } = req.body;

    if (!name || !locationId) {
      return res
        .status(400)
        .json({ message: "name and locationId are required" });
    }

    const key = generateApiKey();

    const record = await ApiKey.create({
      name,
      locationId,
      key,
      isActive: true,
    });

    res.status(201).json({
      message: "API key generated successfully",
      apiKey: record.key,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate API key" });
  }
};

// List all API Keys (for admin use)
exports.list = async (req, res) => {
  try {
    // Fetch all API keys first
    const keys = await ApiKey.findAll({
      attributes: [
        "id",
        "name",
        "key",
        "locationId",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });

    // Fetch all locations once
    const locations = await Location.findAll({
      attributes: ["LocationID", "Name", "City"],
    });

    // Map locations by ID for fast lookup
    const locationMap = new Map(locations.map((loc) => [loc.LocationID, loc]));

    // Merge location info into each key
    const enrichedKeys = keys.map((key) => {
      const loc = locationMap.get(key.locationId);
      return {
        ...key.toJSON(),
        location: loc ? { Name: loc.Name, City: loc.City } : null,
      };
    });

    res.status(200).json(enrichedKeys);
  } catch (err) {
    console.error("Error retrieving API keys:", err.message);
    res.status(500).json({ error: "Failed to retrieve API keys" });
  }
};

// Deactivate / delete key
exports.deactivate = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await ApiKey.update(
      { isActive: false },
      { where: { id } }
    );

    if (!updated) return res.status(404).json({ message: "API key not found" });
    res.status(200).json({ message: "API key deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to deactivate API key" });
  }
};
