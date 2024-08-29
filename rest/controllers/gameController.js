const db = require('../models');
const Game = db.Game;
const GamesVariant = db.GamesVariant;
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
    if (req.query.gameCode) {
      games = await Game.findAll({
        where: { gameCode: req.query.gameCode },
        include: [{ model: GamesVariant, as: 'variants' }]
      });
    } else {
      games = await Game.findAll({
        include: [{ model: GamesVariant, as: 'variants' }]
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
    const game = await Game.findByPk(req.params.GameID);
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

// Find a game by gameCode and include its variants
exports.findByGameCode = async (req, res) => {
  try {
   console.log('gamecode');
   console.warn( req.query.gameCode);
      const game = await Game.findOne(
      { where: { gameCode: req.query.gameCode } ,
      include: [{ model: GamesVariant, as: 'variants' }]
    });
    
    if (!game) {
      return res.status(404).send({ message: 'Game not found' });
    }
    res.status(200).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
