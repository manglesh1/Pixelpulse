const db = require('../models');
const GameroomType = db.GameroomType;

exports.create = async (req, res) => {
  try {
    const gameroomType = await GameroomType.create(req.body);
    console.log(req.body);
    console.log('creating gae rppm type');
    res.status(201).send(gameroomType);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const gameroomTypes = await GameroomType.findAll();
    res.status(200).send(gameroomTypes);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const gameroomType = await GameroomType.findByPk(req.params.id);
    if (!gameroomType) {
      return res.status(404).send({ message: 'GameroomType not found' });
    }
    res.status(200).send(gameroomType);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await GameroomType.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'GameroomType not found' });
    }
    const updatedGameroomType = await GameroomType.findByPk(req.params.id);
    res.status(200).send(updatedGameroomType);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await GameroomType.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'GameroomType not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
