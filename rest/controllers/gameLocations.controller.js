const asyncHandler = require("../middleware/asyncHandler");
const { scopedFindAll, scopedFindOne } = require("../utils/scopedQuery");

// GET: list all GameLocations (scoped to location)
exports.findAll = asyncHandler(async (req, res) => {
  const gameLocations = await scopedFindAll(req, req.db.GameLocation, {
    include: [
      { model: req.db.Game, as: "game" },
      { model: req.db.Location, as: "location" },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json(gameLocations);
});

// GET: all games assigned to a given location
exports.findByLocation = asyncHandler(async (req, res) => {
  const locationId = req.params.locationId;

  // Admins can view any location; regular users only their own
  if (req.ctx.role !== "admin" && locationId != req.ctx.locationId) {
    return res
      .status(403)
      .json({ error: "Forbidden: Cross-location access denied" });
  }

  const rows = await req.db.GameLocation.findAll({
    where: { LocationID: locationId },
    include: [{ model: req.db.Game, as: "game" }],
  });

  res.json(rows);
});

// GET: all locations assigned to a given game
exports.findByGame = asyncHandler(async (req, res) => {
  const rows = await scopedFindAll(req, req.db.GameLocation, {
    where: { GameID: req.params.gameId },
    include: [{ model: req.db.Location, as: "location" }],
  });

  res.json(rows);
});

// POST: assign game to location
exports.create = asyncHandler(async (req, res) => {
  // forceLocationOnBody middleware should already inject req.ctx.locationId if not admin
  const record = await req.db.GameLocation.create(req.body);
  res.status(201).json(record);
});

// DELETE: remove a link
exports.remove = asyncHandler(async (req, res) => {
  const record = await scopedFindOne(req, req.db.GameLocation, {
    where: { id: req.params.id },
  });

  if (!record)
    return res.status(404).json({ message: "GameLocation not found" });

  await record.destroy();
  res.status(204).end();
});
