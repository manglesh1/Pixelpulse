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

// GET: Find active game variants by gameCode
exports.findActiveGamesByGameCode = asyncHandler(async (req, res) => {
  const game = await scopedFindOne(req, req.db.Game, {
    where: { gameCode: req.query.gameCode },
    include: [
      {
        model: req.db.GamesVariant,
        as: "variants",
        where: { IsActive: 1 },
        required: false,
      },
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
