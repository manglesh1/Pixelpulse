const db = require('../models');
const GamesVariant = db.GamesVariant;

exports.create = async (req, res) => {
  try {
    const gamesVariant = await GamesVariant.create(req.body);
    res.status(201).send(gamesVariant);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const gamesVariants = await GamesVariant.findAll();
    res.status(200).send(gamesVariants);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const gamesVariant = await GamesVariant.findByPk(req.params.id);
    if (!gamesVariant) {
      return res.status(404).send({ message: 'GamesVariant not found' });
    }
    res.status(200).send(gamesVariant);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await GamesVariant.update(req.body, {
      where: { ID: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'GamesVariant not found' });
    }
    const updatedGamesVariant = await GamesVariant.findByPk(req.params.id);
    res.status(200).send(updatedGamesVariant);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await GamesVariant.destroy({
      where: { ID: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'GamesVariant not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status_500.send({ message: err.message });
  }
};
