const db = require('../models');
const Player = db.Player;
const WristbandTran   = db.WristbandTran;
const logger = require('../utils/logger');
const { Op, fn, col, where } = require('sequelize');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

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
  const { firstName, lastName = '.', signeeId, email = null } = req.body;

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
      email  // Optional email for child
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

exports.getFamilyByEmail = async (req, res) => {
  const input = req.params.email?.trim();

  if (!input || input.length < 3) {
    return res.status(400).send({ message: 'Invalid email input' });
  }

  try {
    const [parents] = await sequelize.query(`
      SELECT 
        PlayerID, 
        FirstName, 
        LastName, 
        email, 
        SigneeID 
      FROM 
        Players 
      WHERE 
        email = :email 
        AND SigneeID = PlayerID
    `, {
      replacements: { email: input }
    });


      if (!parents || parents.length === 0) {
        return res.status(404).send({ message: 'No matching players found' });
      }

      const result = [];

      for (const parent of parents) {
        // Get children
      const [children] = await sequelize.query(`
        SELECT 
          PlayerID, 
          FirstName, 
          LastName, 
          email, 
          SigneeID 
        FROM 
          Players 
        WHERE 
          SigneeID = :signeeId 
          AND PlayerID != :signeeId
      `, {
        replacements: { signeeId: parent.PlayerID }
      });

      // Collect all player IDs
      const allIds = [parent.PlayerID, ...children.map(c => c.PlayerID)];

      // Fetch all wristbands for those IDs
      const [wristbands] = await sequelize.query(`
        SELECT 
          WristbandTranID,
          wristbandStatusFlag,
          wristbandCode,
          playerStartTime,
          playerEndTime,
          PlayerID
        FROM 
          WristbandTrans 
        WHERE 
          PlayerID 
          IN (${allIds.map(() => '?').join(',')})
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
    console.error('Error in getFamilyByEmail:', err.message);
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
  const id = req.params.id;
  const t  = await sequelize.transaction();

  try {
    // 1) delete all _other_ players signed by this id
    await Player.destroy({
      where: {
        SigneeID: id,
        PlayerID: { [Op.ne]: id }
      }
    }, { transaction: t });

    // 2) delete the player themself
    const deleted = await Player.destroy({
      where: { PlayerID: id }
    }, { transaction: t });

    if (!deleted) {
      await t.rollback();
      return res.status(404).send({ message: 'Player not found' });
    }

    await t.commit();
    return res.status(204).send();
  } catch (err) {
    await t.rollback();
    console.error('Failed to delete player cascade:', err);
    return res.status(500).send({ message: err.message });
  }
};

exports.findPaged = async (req, res) => {
  try {
    // parse & sanitize params
    const page       = Math.max(1, parseInt(req.query.page, 10)      || 1);
    const pageSize   = Math.max(1, parseInt(req.query.pageSize, 10)  || 10);
    const offset     = (page - 1) * pageSize;
    const validOnly  = req.query.validOnly  === 'true';
    const masterOnly = req.query.masterOnly === 'true';
    const playingNow = req.query.playingNow === 'true';
    const search = decodeURIComponent(req.query.search || '')
        .trim()
        .replace(/'/g, "''")
        .replace(/[%_]/g, char => `\\${char}`);

    // build dynamic WHERE clauses
    const wh = [];

    if (search) {
      // Split search terms by spaces and filter out empty strings
      const searchTerms = search.split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => `(
          p.FirstName  LIKE '%${term}%' ESCAPE '\\'
          OR p.LastName  LIKE '%${term}%' ESCAPE '\\'
          OR p.email     LIKE '%${term}%' ESCAPE '\\'
          OR CAST(p.PlayerID AS VARCHAR) LIKE '%${term}%' ESCAPE '\\'
        )`);

        wh.push(`(${searchConditions.join(' AND ')})`);
      }
    }

    if (validOnly) {
      // any wristband currently valid (masters allowed)
      wh.push(`
        p.PlayerID IN (
          SELECT DISTINCT wt.PlayerID
          FROM WristbandTrans wt
          WHERE wt.wristbandStatusFlag = 'R'
            AND wt.playerStartTime <= GETUTCDATE()
            AND wt.playerEndTime   >= GETUTCDATE()
        )
      `);
    }

        if (playingNow) {
      // only “short” wristbands currently valid (exclude any >24h)
      wh.push(`
        p.PlayerID IN (
          SELECT DISTINCT wt.PlayerID
          FROM WristbandTrans wt
          WHERE wt.wristbandStatusFlag = 'R'
            AND wt.playerStartTime <= GETUTCDATE()
            AND wt.playerEndTime   >= GETUTCDATE()
            -- DATEDIFF in minutes ≤ 1440 (24×60)
            AND DATEDIFF(DAY, wt.playerStartTime, wt.playerEndTime) <= 1
        )
      `);
    }

    if (masterOnly) {
      // any wristband lasting >= 10 days
      wh.push(`
        p.PlayerID IN (
          SELECT DISTINCT wt.PlayerID
          FROM WristbandTrans wt
          WHERE DATEDIFF(day, wt.playerStartTime, wt.playerEndTime) >= 10
          AND wt.wristbandStatusFlag = 'R'
        )
      `);
    }

    const whereClause = wh.length ? `WHERE ${wh.join(' AND ')}` : '';

    // final SQL using window-function for total count
    const sql = `
      SELECT
        p.PlayerID,
        p.FirstName,
        p.LastName,
        p.DateOfBirth,
        p.email,
        p.SigneeID,
        COUNT(*) OVER() AS total
      FROM Players p
      ${whereClause}
      ORDER BY p.PlayerID DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY;
    `;

    const rows = await sequelize.query(sql, { type: QueryTypes.SELECT });

    const total = rows.length ? rows[0].total : 0;
    res.json({
      total,
      page,
      pageSize,
      players: rows.map(r => {
        // drop the total field per-row
        const { total, ...player } = r;
        return player;
      })
    });
  } catch (err) {
    console.error('getPaged error:', err);
    res.status(500).json({ message: err.message });
  }
};
exports.getEmailSuggestions = async (req, res) => {
  const prefix = req.query.prefix?.trim();

  if (!prefix || prefix.length < 2) {
    return res.status(400).send({ message: 'Prefix too short' });
  }

  try {
    const [results] = await sequelize.query(`
      SELECT DISTINCT TOP 10 email
      FROM Players
      WHERE email LIKE :search
        AND email IS NOT NULL
        AND email != ''
      ORDER BY email ASC
    `, {
      replacements: { search: `${prefix}%` }
    });



    const emails = results.map(row => row.email);
    res.status(200).send(emails);
  } catch (err) {
    console.error('Error in getEmailSuggestions:', err.message);
    res.status(500).send({ message: err.message || 'Query error' });
  }
};
