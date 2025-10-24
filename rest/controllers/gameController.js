const db = require("../models");
const Game = db.Game;
const GamesVariant = db.GamesVariant;
const GameRoomDevice = db.GameRoomDevice;
const Location = db.Location;
const logger = require("../utils/logger");

// POST: Create a new Game
exports.create = async (req, res) => {
  try {
    const game = await Game.create(req.body);
    res.status(201).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// GET: Find all games, with optional filtering by gameCode
exports.findAll = async (req, res) => {
  try {
    const includes = [
      { model: GamesVariant, as: "variants" },
      { model: GameRoomDevice, as: "devices" },
      { model: Location, as: "location" },
    ];

    // Base query filters
    const where = {};

    // Optional gameCode filter
    if (req.query.gameCode) {
      where.gameCode = req.query.gameCode;
    }

    // Restrict by location if set
    if (req.locationScope) {
      where.LocationID = req.locationScope;
    }

    // Query games
    const games = await Game.findAll({
      where,
      include: includes,
      order: [["gameName", "ASC"]],
    });

    res.status(200).json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET: Find a game by GameID
exports.findOne = async (req, res) => {
  try {
    const includes = [
      { model: GamesVariant, as: "variants" },
      { model: GameRoomDevice, as: "devices" },
      { model: Location, as: "location" },
    ];

    // Fetch the game by ID
    const game = await Game.findByPk(req.params.GameID, { include: includes });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Enforce location scope
    if (req.locationScope && game.LocationID !== req.locationScope) {
      return res.status(403).json({
        error: "Forbidden: You do not have access to this game's location",
      });
    }

    // Admins or location-matched users
    return res.status(200).json(game);
  } catch (err) {
    console.error("Error fetching game:", err);
    return res.status(500).json({ message: err.message });
  }
};

// PUT: Update a game by GameID
exports.update = async (req, res) => {
  try {
    const [updated] = await Game.update(req.body, {
      where: { GameID: req.params.GameID },
    });
    if (!updated) {
      return res.status(404).send({ message: "Game not found" });
    }
    const updatedGame = await Game.findByPk(req.params.GameID);
    res.status(200).send(updatedGame);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// DELETE: Delete a game by GameID
exports.delete = async (req, res) => {
  try {
    const deleted = await Game.destroy({
      where: { GameID: req.params.GameID },
    });
    if (!deleted) {
      return res.status(404).send({ message: "Game not found" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// GET: Find a game by gameCode and include its variants + devices
exports.findByGameCode = async (req, res) => {
  try {
    const includes = [
      { model: GamesVariant, as: "variants" },
      { model: GameRoomDevice, as: "devices" },
      { model: Location, as: "location" },
    ];

    // Build where clause
    const where = { gameCode: req.query.gameCode };

    // Enforce location scope if present
    if (req.locationScope) {
      where.LocationID = req.locationScope;
    }

    const game = await Game.findOne({
      where,
      include: includes,
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.status(200).json(game);
  } catch (err) {
    console.error("Error fetching game by gameCode:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET: Find active game variants by gameCode
exports.findActiveGamesByGameCode = async (req, res) => {
  try {
    const game = await Game.findOne({
      where: { gameCode: req.query.gameCode },
      include: [
        {
          model: GamesVariant,
          as: "variants",
          where: { IsActive: 1 }, // filter only active variants
          required: false, // this allows the game to still load even if no active variants are found
        },
        {
          model: GameRoomDevice,
          as: "devices",
        },
      ],
    });

    if (!game) {
      return res.status(404).send({ message: "Game not found" });
    }

    res.status(200).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
