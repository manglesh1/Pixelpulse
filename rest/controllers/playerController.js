const db = require('../models');
const Player = db.Player;
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

exports.findOrCreate = async (req, res) => {
  const { firstName, lastName, email } = req.body;

  if (!email || !firstName?.trim()) {
    return res.status(400).send({ message: 'Email and first name are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  console.log(normalizedEmail);

  const fName = firstName.trim();
  const lName = lastName.trim() || '.';

  try {
    const anyPlayerWithEmail = await Player.findOne({
      where: {
        email: normalizedEmail
      }
    });

    if (anyPlayerWithEmail && anyPlayerWithEmail.SigneeID) {
      const existing = await Player.findOne({
        where: {
          email: normalizedEmail,
          PlayerID: anyPlayerWithEmail.SigneeID
        }
      });
      if (existing) return res.status(200).send(existing);
    }


    const newPlayer = await Player.create({
      FirstName: fName,
      LastName: lName,
      email: normalizedEmail,
      SigneeID : anyPlayerWithEmail ? anyPlayerWithEmail.PlayerID : null 
    });

    if (!anyPlayerWithEmail) {
      newPlayer.SigneeID = newPlayer.PlayerID;
      await newPlayer.save();
    }

    return res.status(201).send(newPlayer);
  } catch (err) {
    console.error('Error in findOrCreate:', err.message);
    return res.status(500).send({ message: 'Internal server error' });
  }
};


exports.findOrCreateChild = async (req, res) => {
  const { firstName, lastName = '.', signeeId } = req.body;

  if (!signeeId || !firstName?.trim()) {
    return res.status(400).send({ message: 'Signee ID and first name are required' });
  }

  const fName = firstName.trim();
  const lName = lastName.trim() || '.';

  try {
    // Check if child already exists under same parent
    const existing = await Player.findOne({
      where: {
        FirstName: fName,
        LastName: lName,
        SigneeID: signeeId
      }
    });

    if (existing) return res.status(200).send(existing);

    const newChild = await Player.create({
      FirstName: fName,
      LastName: lName,
      SigneeID: signeeId,
      email: req.body.email || null // Optional email for child
    });

    return res.status(201).send(newChild);
  } catch (err) {
    console.error('Error in findOrCreateChild:', err.message);
    return res.status(500).send({ message: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    console.log(req);
    console.log('create');
    const player = await Player.create(req.body);
    res.status(201).send(player);
  } catch (err) {
    console.error('Failed to create player:', err); 
    res.status(500).send({ message: err.message });
  }
};

exports.getWithChildrenByEmail = async (req, res) => {
  const input = req.params.email?.trim();

  if (!input || input.length < 3) {
    return res.status(400).send({ message: 'Invalid email input' });
  }

  try {
    const [parents] = await sequelize.query(`
      SELECT * FROM Players 
      WHERE email LIKE :email 
        AND SigneeID = PlayerID
    `, {
      replacements: { email: `%${input}%` }
    });


      if (!parents || parents.length === 0) {
        return res.status(404).send({ message: 'No matching players found' });
      }

      const result = [];

      for (const parent of parents) {
        // Get children
      const [children] = await sequelize.query(`
        SELECT * FROM Players 
        WHERE SigneeID = :signeeId AND PlayerID != :signeeId
      `, {
        replacements: { signeeId: parent.PlayerID }
      });

      // Collect all player IDs
      const allIds = [parent.PlayerID, ...children.map(c => c.PlayerID)];

      // Fetch all wristbands for those IDs
      const [wristbands] = await sequelize.query(`
        SELECT * FROM WristbandTrans WHERE PlayerID IN (${allIds.map(() => '?').join(',')})
      `, {
        replacements: allIds
      });

      // Group by PlayerID
      const wristbandMap = {};
      for (const wb of wristbands) {
        if (!wristbandMap[wb.PlayerID]) wristbandMap[wb.PlayerID] = [];
        wristbandMap[wb.PlayerID].push(wb);
      }

      // Attach wristbands to parent
      const parentWithBands = {
        ...parent,
        Wristbands: wristbandMap[parent.PlayerID] || []
      };

      // Attach wristbands to each child
      const childrenWithBands = children.map(child => ({
        ...child,
        Wristbands: wristbandMap[child.PlayerID] || []
      }));

      result.push({
        Parent: parentWithBands,
        Children: childrenWithBands
      });
    }

    res.status(200).send(result);
  } catch (err) {
    console.error('Error in getWithChildrenByEmail:', err.message);
    res.status(500).send({ message: err.message || 'Query error' });
  }
};

exports.findAll = async (req, res) => {
  try {
    let players;
    if(req.query.email) {
      players = await Player.findAll({ where: { email: req.query.email } });
    } else if(req.query.signeeid) {
      players = await Player.findAll({ where: { SigneeID: req.query.signeeid } });
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
