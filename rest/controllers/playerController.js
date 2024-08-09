const db = require('../models');
const Player = db.Player;

exports.create = async (req, res) => {
  try {
    console.log(req);
    console.log('create');
    const player = await Player.create(req.body);
    res.status(201).send(player);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    let players;
    if(req.query.email) {
      players = await Player.findAll({ where: { email: req.query.email } });
    } else if(req.query.signeeid) {
      players = await Player.findAll({ where: { email: req.query.signeeid } });
    }
    else {
      players = await Player.findAll();
     }
    res.status(200).send(players);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    let player;

    // Check if the ID parameter contains an '@' symbol, indicating it's an email
    if (req.params.id.includes('@')) {
      player = await Player.findOne({ where: { email: req.params.id } });
    } else {
      player = await Player.findByPk(req.params.id);
    }

    // If player is not found, send a 404 response
    if (!player) {
      return res.status(404).send({ message: 'Player not found' });
    }

    // Send the found player data
    res.status(200).send(player);

  } catch (err) {
    // Handle any errors that occurred during the process
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Player.update(req.body, {
      where: { PlayerID: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'Player not found' });
    }
    const updatedPlayer = await Player.findByPk(req.params.id);
    res.status(200).send(updatedPlayer);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Player.destroy({
      where: { PlayerID: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'Player not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
