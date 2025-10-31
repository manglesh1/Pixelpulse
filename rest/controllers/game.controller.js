const asyncHandler = require("../middleware/asyncHandler");
const { scopedFindAll, scopedFindOne } = require("../utils/scopedQuery");

// GET: Find all games (with optional gameCode)
exports.findAll = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.gameCode) where.gameCode = req.query.gameCode;

  const games = await scopedFindAll(req, req.db.Game, {
    where,
    include: [
      { model: req.db.GamesVariant, as: "variants" },
      {
        model: req.db.GameLocation,
        as: "locations",
        include: [
          { model: req.db.Location, as: "location" },
          { model: req.db.GameRoomDevice, as: "devices" },
        ],
      },
    ],
    order: [["gameName", "ASC"]],
  });

  res.json(games);
});

// GET: Find one game by GameID
exports.findOne = asyncHandler(async (req, res) => {
  const game = await scopedFindOne(req, req.db.Game, {
    where: { GameID: req.params.GameID },
    include: [
      { model: req.db.GamesVariant, as: "variants" },
      {
        model: req.db.GameLocation,
        as: "locations",
        include: [
          { model: req.db.Location, as: "location" },
          { model: req.db.GameRoomDevice, as: "devices" },
        ],
      },
    ],
  });

  if (!game) return res.status(404).json({ message: "Game not found" });

  res.json(game);
});

// POST: Create new game
exports.create = asyncHandler(async (req, res) => {
  try {
    const row = await req.db.Game.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    console.error("Game creation failed:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update game
exports.update = asyncHandler(async (req, res) => {
  const [updated] = await req.db.Game.update(req.body, {
    where: { GameID: req.params.GameID },
  });

  if (!updated) return res.status(404).json({ message: "Game not found" });

  const row = await req.db.Game.findByPk(req.params.GameID);
  res.json(row);
});

// DELETE: Delete game
exports.delete = asyncHandler(async (req, res) => {
  const deleted = await req.db.Game.destroy({
    where: { GameID: req.params.GameID },
  });

  if (!deleted) return res.status(404).json({ message: "Game not found" });

  res.status(204).end();
});

// GET: Find a game by gameCode
exports.findByGameCode = asyncHandler(async (req, res) => {
  const where = { gameCode: req.query.gameCode };

  const game = await scopedFindOne(req, req.db.Game, {
    where,
    include: [
      { model: req.db.GamesVariant, as: "variants" },
      {
        model: req.db.GameLocation,
        as: "locations",
        include: [
          { model: req.db.Location, as: "location" },
          { model: req.db.GameRoomDevice, as: "devices" },
        ],
      },
    ],
  });

  if (!game) return res.status(404).json({ message: "Game not found" });

  res.json(game);
});

exports.findActiveGamesByGameCode = asyncHandler(async (req, res) => {
  try {
    const gameCode = req.query.gameCode;
    if (!gameCode) {
      return res.status(400).json({ message: "Missing gameCode parameter" });
    }

    // Determine location scope from auth or request context
    const locationId =
      req.ctx?.locationId ||
      req.ctx?.locationScope?.LocationID ||
      req.locationScope?.LocationID ||
      req.query.locationId || // fallback for manual testing
      null;

    if (!locationId) {
      return res.status(400).json({ message: "Missing location scope" });
    }

    // Query game with location-scoped active variants
    const game = await scopedFindOne(req, req.db.Game, {
      where: { gameCode },
      include: [
        {
          model: req.db.GamesVariant,
          as: "variants",
          required: false,
          include: [
            {
              model: req.db.LocationVariant,
              as: "locationVariants",
              required: true, // only include if linked to this location
              where: {
                LocationID: locationId,
                isActive: true,
              },
            },
          ],
        },
        {
          model: req.db.GameLocation,
          as: "locations",
          required: false,
          include: [
            {
              model: req.db.Location,
              as: "location",
              required: false,
            },
            {
              model: req.db.GameRoomDevice,
              as: "devices",
              required: false,
            },
          ],
        },
      ],
      order: [
        [{ model: req.db.GamesVariant, as: "variants" }, "Name", "ASC"],
      ],
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Optional: flatten only the variants relevant to the current location
    const filteredVariants = (game.variants || []).filter(
      (v) =>
        v.locationVariants &&
        v.locationVariants.some(
          (lv) => lv.LocationID === locationId && lv.isActive
        )
    );

    res.json({
      ...game.toJSON(),
      variants: filteredVariants,
    });
  } catch (err) {
    console.error("findActiveGamesByGameCode error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      detail: err.message,
    });
  }
});


