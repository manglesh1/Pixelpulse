const asyncHandler = require("../middleware/asyncHandler");

// POST: Create a new location (Admin only)
exports.create = asyncHandler(async (req, res) => {
  if (!req.ctx.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }

  const location = await req.db.Location.create(req.body);
  res.status(201).json(location);
});

// GET: List all locations (admins see all, users only their own)
exports.findAll = asyncHandler(async (req, res) => {
  let where = {};
  if (!req.ctx.isAdmin && req.ctx.locationId) {
    where.LocationID = req.ctx.locationId;
  }

  const locations = await req.db.Location.findAll({
    where,
    order: [["Name", "ASC"]],
  });
  res.json(locations);
});

// GET: Single location
exports.findOne = asyncHandler(async (req, res) => {
  const location = await req.db.Location.findByPk(req.params.LocationID);
  if (!location) return res.status(404).json({ error: "Location not found" });

  // Non-admins can only view their own location
  if (!req.ctx.isAdmin && req.ctx.locationId !== location.LocationID) {
    return res
      .status(403)
      .json({ error: "Forbidden: Cannot access this location" });
  }

  res.json(location);
});

// PUT: Update a location (Admin only)
exports.update = asyncHandler(async (req, res) => {
  if (!req.ctx.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }

  const [updated] = await req.db.Location.update(req.body, {
    where: { LocationID: req.params.LocationID },
  });
  if (!updated) return res.status(404).json({ error: "Location not found" });

  const updatedLocation = await req.db.Location.findByPk(req.params.LocationID);
  res.json(updatedLocation);
});

exports.remove = asyncHandler(async (req, res) => {
  if (!req.ctx.isAdmin)
    return res.status(403).json({ error: "Forbidden: Admins only" });

  const id = req.params.LocationID;

  try {
    // 1️⃣ Check dependencies before deletion
    const hasWristbands = await req.db.WristbandTran.count({
      where: { LocationID: id },
    });
    const hasPlayerScores = await req.db.PlayerScore.count({
      include: [
        {
          model: req.db.GameLocation,
          as: "room", // ✅ match alias from association
          where: { LocationID: id },
        },
      ],
    });
    const hasVariants = await req.db.LocationVariant.count({
      include: [
        {
          model: req.db.GameLocation,
          as: "room", // ✅ match alias here too if defined as room
          where: { LocationID: id },
        },
      ],
    });

    if (hasWristbands > 0 || hasPlayerScores > 0 || hasVariants > 0) {
      return res.status(400).json({
        error: "Cannot delete location with active data.",
        details: {
          wristbands: hasWristbands,
          playerScores: hasPlayerScores,
          locationVariants: hasVariants,
        },
      });
    }

    // 2️⃣ Check GameLocation dependency
    const hasGameLocations = await req.db.GameLocation.count({
      where: { LocationID: id },
    });
    if (hasGameLocations > 0) {
      return res.status(400).json({
        error:
          "Cannot delete location while linked GameLocation entries exist.",
      });
    }

    // 3️⃣ Finally, delete the Location safely
    const deleted = await req.db.Location.destroy({
      where: { LocationID: id },
    });

    if (!deleted) return res.status(404).json({ error: "Location not found" });

    res.status(204).end();
  } catch (err) {
    console.error("Error deleting location:", err);
    res.status(500).json({
      error: "Failed to delete location",
      details: err.message,
    });
  }
});

exports.disable = asyncHandler(async (req, res) => {
  if (!req.ctx.isAdmin)
    return res.status(403).json({ error: "Forbidden: Admins only" });

  const id = req.params.LocationID;

  try {
    const location = await req.db.Location.findByPk(id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    if (!location.isActive) {
      return res.status(400).json({ error: "Location is already disabled" });
    }

    await location.update({ isActive: false });

    res.json({
      message: "Location disabled successfully",
      LocationID: id,
    });
  } catch (err) {
    console.error("Error disabling location:", err);
    res.status(500).json({
      error: "Failed to disable location",
      details: err.message,
    });
  }
});

exports.enable = asyncHandler(async (req, res) => {
  if (!req.ctx.isAdmin)
    return res.status(403).json({ error: "Forbidden: Admins only" });

  const id = req.params.LocationID;

  try {
    const location = await req.db.Location.findByPk(id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    if (location.isActive) {
      return res.status(400).json({ error: "Location is already active" });
    }

    await location.update({ isActive: true });

    res.json({
      message: "Location enabled successfully",
      LocationID: id,
    });
  } catch (err) {
    console.error("Error enabling location:", err);
    res.status(500).json({
      error: "Failed to enable location",
      details: err.message,
    });
  }
});
