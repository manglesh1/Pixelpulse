const db = require('../models');
const GameRoomDevice = db.GameRoomDevice;
const Game = db.Game;
const logger = require('../utils/logger');

// Create a new device
exports.create = async (req, res) => {
  try {
    const device = await GameRoomDevice.create(req.body);
    res.status(201).send(device);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all devices (optionally filter by GameID)
exports.findAll = async (req, res) => {
  try {
    const whereClause = req.query.GameID ? { GameID: req.query.GameID } : {};
    const devices = await GameRoomDevice.findAll({
      where: whereClause,
      include: [{ model: Game, as: 'game' }]
    });
    res.status(200).json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single device by ID
exports.findOne = async (req, res) => {
  try {
    const device = await GameRoomDevice.findByPk(req.params.id, {
      include: [{ model: Game, as: 'game' }]
    });
    if (!device) {
      return res.status(404).send({ message: 'Device not found' });
    }
    res.status(200).send(device);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update a device
exports.update = async (req, res) => {
  try {
    const [updated] = await GameRoomDevice.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'Device not found' });
    }
    const updatedDevice = await GameRoomDevice.findByPk(req.params.id);
    res.status(200).send(updatedDevice);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete a device
exports.delete = async (req, res) => {
  try {
    const deleted = await GameRoomDevice.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'Device not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
