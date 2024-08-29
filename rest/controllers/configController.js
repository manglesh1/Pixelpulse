const db = require('../models');
const Config = db.Config;
const logger = require('../utils/logger');

exports.create = async (req, res) => {
  try {
    const config = await Config.create(req.body);
    res.status(201).send(config);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const configs = await Config.findAll();
    res.status(200).send(configs);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const config = await Config.findByPk(req.params.id);
    if (!config) {
      return res.status(404).send({ message: 'Config not found' });
    }
    res.status(200).send(config);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Config.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'Config not found' });
    }
    const updatedConfig = await Config.findByPk(req.params.id);
    res.status(200).send(updatedConfig);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Config.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'Config not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
