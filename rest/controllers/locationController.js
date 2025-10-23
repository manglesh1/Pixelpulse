const db = require("../models");
const Location = db.Location;
const logger = require("../utils/logger");

// POST: Create a new Location
exports.create = async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).send(location);
  } catch (err) {
    logger.error("Error creating location: ", err);
    res.status(500).send({ message: err.message });
  }
};

// GET: Find all locations
exports.findAll = async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.status(200).json(locations);
  } catch (err) {
    logger.error("Error fetching locations: ", err);
    res.status(500).send({ message: err.message });
  }
};

// GET: Find a location by LocationID
exports.findOne = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.LocationID);
    if (!location) {
      return res.status(404).send({ message: "Location not found" });
    }
    res.status(200).send(location);
  } catch (err) {
    logger.error("Error fetching location: ", err);
    res.status(500).send({ message: err.message });
  }
};

// PUT: Update a location by LocationID
exports.update = async (req, res) => {
  try {
    const [updated] = await Location.update(req.body, {
      where: { LocationID: req.params.LocationID },
    });
    if (!updated) {
      return res.status(404).send({ message: "Location not found" });
    }
    const updatedLocation = await Location.findByPk(req.params.LocationID);
    res.status(200).send(updatedLocation);
  } catch (err) {
    logger.error("Error updating location: ", err);
    res.status(500).send({ message: err.message });
  }
};

// DELETE: Delete a location by LocationID
exports.delete = async (req, res) => {
  try {
    const deleted = await Location.destroy({
      where: { LocationID: req.params.LocationID },
    });
    if (!deleted) {
      return res.status(404).send({ message: "Location not found" });
    }
    res.status(204).send();
  } catch (err) {
    logger.error("Error deleting location: ", err);
    res.status(500).send({ message: err.message });
  }
};
