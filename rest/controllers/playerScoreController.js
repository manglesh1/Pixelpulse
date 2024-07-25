const db = require('../models');
const PlayerScore = db.PlayerScore;

exports.create = async (req, res) => {
  try {
    const playerScore = await PlayerScore.create(req.body);
    res.status(201).send(playerScore);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const playerScores = await PlayerScore.findAll();
    res.status(200).send(playerScores);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const playerScore = await PlayerScore.findByPk(req.params.id);
    if (!playerScore) {
      return res.status(404).send({ message: 'PlayerScore not found' });
    }
    res.status(200).send(playerScore);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await PlayerScore.update(req.body, {
      where: { ScoreID: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'PlayerScore not found' });
    }
    const updatedPlayerScore = await PlayerScore.findByPk(req.params.id);
    res.status(200).send(updatedPlayerScore);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await PlayerScore.destroy({
      where: { ScoreID: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'PlayerScore not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
