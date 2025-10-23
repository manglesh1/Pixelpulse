const db = require('../models');
const Game = db.Game;
const GamesVariant = db.GamesVariant;
const GameRoomDevice = db.GameRoomDevice;
const Location = db.Location;
const logger = require('../utils/logger');

// Create a new game
exports.create = async (req, res) => {
  try {
    const game = await Game.create(req.body);
    res.status(201).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Find all games
exports.findAll = async (req, res) => {
  try {
    let games;

    const includes = [
      { model: GamesVariant, as: 'variants' },
      { model: GameRoomDevice, as: 'devices' },
      { model: Location, as : 'location' }
    ];

    if (req.query.gameCode) {
      games = await Game.findAll({
        where: { gameCode: req.query.gameCode },
        include: includes
      });
    } else {
      games = await Game.findAll({
        include: [
          { model: GamesVariant, as: 'variants' },
          { model: GameRoomDevice, as: 'devices' },
          { model: Location, as: 'location' }
        ]
      });
    }
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Find a game by GameID
exports.findOne = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.GameID, {
      include: [
        { model: GamesVariant, as: 'variants' },
        { model: GameRoomDevice, as: 'devices' }
      ]
    });
    if (!game) {
      return res.status(404).send({ message: 'Game not found' });
    }
    res.status(200).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


// Update a game by GameID
exports.update = async (req, res) => {
  try {
    const [updated] = await Game.update(req.body, {
      where: { GameID: req.params.GameID }
    });
    if (!updated) {
      return res.status(404).send({ message: 'Game not found' });
    }
    const updatedGame = await Game.findByPk(req.params.GameID);
    res.status(200).send(updatedGame);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete a game by GameID
exports.delete = async (req, res) => {
  try {
    const deleted = await Game.destroy({
      where: { GameID: req.params.GameID }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'Game not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Find a game by gameCode and include its variants + devices
exports.findByGameCode = async (req, res) => {
  try {
    const game = await Game.findOne({
      where: { gameCode: req.query.gameCode },
      include: [
        { model: GamesVariant, as: 'variants' },
        { model: GameRoomDevice, as: 'devices' }
      ]
    });

    if (!game) {
      return res.status(404).send({ message: 'Game not found' });
    }
    res.status(200).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Find a game by gameCode and include its variants + devices and return only active variants
exports.findActiveGamesByGameCode = async (req, res) => {
  try {
    const game = await Game.findOne({
      where: { gameCode: req.query.gameCode },
      include: [
        {
          model: GamesVariant,
          as: 'variants',
          where: { IsActive: 1 }, // filter only active variants
          required: false // this allows the game to still load even if no active variants are found
        },
        {
          model: GameRoomDevice,
          as: 'devices'
        }
      ]
    });

    if (!game) {
      return res.status(404).send({ message: 'Game not found' });
    }

    res.status(200).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
