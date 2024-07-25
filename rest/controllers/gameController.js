const db = require('../models');
const Game = db.Game;

exports.create = async (req, res) => {
  try {
    console.log(req.body);
    const game = await Game.create(req.body);
   
    res.status(201).send(game);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const games = await Game.findAll();
    res.status(200).send(games);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

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

exports.update = async (req, res) => {
  try {
    const [updated] = await Game.update(req.body, {
      where: { GameID: req.params.GameID }
    });
    if (!updated) {
      return res.status(404).send({ message: 'Game not found' });
    }
    const updatedGame = await Game.findByPk(req.params.Gamecode);
    res.status(200).send(updatedGame);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

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
