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

// PUT: update overrides for current location + game
exports.updateOverridesForGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const locationId = req.locationScope;

  const record = await req.db.GameLocation.findOne({
    where: {
      GameID: gameId,
      LocationID: locationId,
    },
  });

  if (!record) {
    return res.status(404).json({
      message: "GameLocation not found for this location",
    });
  }

  // Only allow override fields
  const allowedFields = [
    "IpAddress",
    "LocalPort",
    "RemotePort",
    "SocketBReceiverPort",
    "NoOfControllers",
    "NoOfLedPerDevice",
    "columns",
    "MaxPlayers",
    "SmartPlugIP",
    "config",
  ];

  const updates = {};
  for (const key of allowedFields) {
    if (key in req.body) {
      updates[key] = req.body[key];
    }
  }

  // If client sent config as a JSON string, parse it. If they sent an
  // object, keep it. Anything else becomes null.
  if ("config" in updates) {
    const c = updates.config;
    if (typeof c === "string" && c.trim().length > 0) {
      try {
        updates.config = JSON.parse(c);
      } catch {
        return res.status(400).json({ error: "config must be valid JSON" });
      }
    } else if (c !== null && typeof c !== "object") {
      return res.status(400).json({ error: "config must be a JSON object or null" });
    }
  }

  await record.update(updates);

  res.json(record);
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

// PUT: Update ONLY the config JSON for a GameLocation row by id (Admin).
// Accepts config as a JSON object or JSON string; null clears it.
exports.updateConfigById = asyncHandler(async (req, res) => {
  const record = await scopedFindOne(req, req.db.GameLocation, {
    where: { id: req.params.id },
    include: [
      { model: req.db.Game, as: "game" },
      { model: req.db.Location, as: "location" },
    ],
  });
  if (!record) return res.status(404).json({ message: "GameLocation not found" });

  let { config } = req.body;
  if (typeof config === "string") {
    const trimmed = config.trim();
    if (!trimmed) {
      config = null;
    } else {
      try { config = JSON.parse(trimmed); }
      catch { return res.status(400).json({ error: "config must be valid JSON" }); }
    }
  } else if (config !== null && config !== undefined && typeof config !== "object") {
    return res.status(400).json({ error: "config must be a JSON object, string, or null" });
  }

  // instance.update() so the model's setter stringifies the object.
  await record.update({ config: config ?? null });

  // Reload so the getter returns the parsed object back to the client.
  await record.reload();
  res.json(record);
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
