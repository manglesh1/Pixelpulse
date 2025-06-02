const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
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


exports.addPlayerScores = async (req, res) => {
  const { players } = req.body; // players is an array of player objects

  if (!Array.isArray(players) || players.length === 0) {
    return res.status(400).send({ message: 'Invalid players array' });
  }

  try {
    const createdScores = await Promise.all(
      players.map(async (player) => {
        // Fetch the associated WristbandTran record based on wristbandCode and status flag
        const wristbandTran = await db.WristbandTran.findOne({
          where: {
            wristbandCode: player.wristbandCode,
            wristbandStatusFlag: 'R',
		            [Op.and]: [
              { count: { [Op.gte]: 0 } }, // Ensure currentTime is after or equal to playerStartTime
              
            ]
          },
          order: [['WristbandTranDate', 'DESC']],
        });
        
        if (wristbandTran) {
			  console.log(`WristbandTran found: ${JSON.stringify(wristbandTran)}`);
			  console.log(`PlayerID: ${wristbandTran.PlayerID}`); // Check this value

			  if (!wristbandTran.PlayerID) {
				throw new Error(`PlayerID is null or undefined for wristbandCode ${player.wristbandCode}`);
			  }
			  
			  // Fetch the associated GamesVariant record
			  const gamesVariant = await db.GamesVariant.findOne({
				  where: { name: player.GamesVariantCode },
			  });

			  if (!gamesVariant) {
				throw new Error(`Invalid GamesVariantCode for player ${player.wristbandCode}`);
			  }

			  // Create the PlayerScore entry
			  const playerScore = await PlayerScore.create({
          PlayerID: wristbandTran.PlayerID, // Ensure PlayerID is not null
          GameID: gamesVariant.GameId,
          GamesVariantId: gamesVariant.ID,
          WristbandTranID: wristbandTran.WristbandTranID,
          LevelPlayed: player.LevelPlayed,
          Points: player.Points,
          StartTime: new Date( player.playerStartTime),
          EndTime: new Date( player.playerEndTime),
				
			  });

        wristbandTran.count = wristbandTran.count - 1;
        wristbandTran.save();

        return playerScore;
			}
      return players;  
    }));

    res.status(201).send(createdScores);
  } catch (err) {
	  console.log(err);
    res.status(500).send({ message: err.message });
  }
};

exports.getTopScoresForVariants = async (req, res) => {
  const { gameCode } = req.params;

  if (!gameCode) {
    return res.status(400).send({ message: 'gameCode is required' });
  }

  try {
    const game = await db.Game.findOne({
      where: { gameCode: gameCode },
      attributes: ['GameID'],
    })
    // Fetch all variants for the given gameCode
    const variants = await db.GamesVariant.findAll({
      where: { gameId: game.GameID },
      attributes: ['ID', 'name'],
    });

    if (!variants.length) {
      return res.status(404).send({ message: 'No game variants found for the provided gameCode' });
    }

    // Fetch top scores for each variant
    const variantScores = await Promise.all(
      variants.map(async (variant) => {
        const dailyTopScore = await getTopScore(variant.ID, 'day');
        const monthlyTopScore = await getTopScore(variant.ID, 'month');
        const allTimeTopScore = await getTopScore(variant.ID, null);

        return {
          variantID: variant.ID,
          variantName: variant.name,
          topDailyScore: dailyTopScore,
          topMonthlyScore: monthlyTopScore,
          topAllTimeScore: allTimeTopScore,
        };
      })
    );

    res.status(200).send(variantScores);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
};

// Helper function to get the top score for a specific variant and time period
const getTopScore = async (variantId, period) => {
  let timeFilter;

  // Define time filter based on the period
  const currentDate = new Date();
  if (period === 'day') {
    timeFilter = {
      [Op.gte]: new Date(currentDate.setHours(0, 0, 0, 0)), // Start of today
    };
  } else if (period === 'month') {
    timeFilter = {
      [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), // Start of the month
    };
  } else if (period === 'year') {
    timeFilter = {
      [Op.gte]: new Date(currentDate.getFullYear(), 0, 1), // Start of the year
    };
  }

  // Query for the top score
  const topScore = await PlayerScore.findOne({
    attributes: ['Points', 'PlayerID', 'StartTime'],
    where: {
      GamesVariantId: variantId,
      ...(timeFilter ? { StartTime: timeFilter } : {}), // Apply time filter if applicable
    },
    include: [
      {
        model: db.Player, // Include the Player model
        attributes: ['FirstName', 'LastName'], // Fetch only player names
        as: "player",
      },
    ],
    order: [['Points', 'DESC']], // Order by highest Points
  });

  return topScore
    ? {
        Points: topScore.Points,
        Players: topScore.player,
        StartTime: topScore.StartTime,
      }
    : null; // Return null if no scores are found
};

exports.getTopScoresForPlayerinGameVariant = async (req, res) => {
  const { gamesVariantId, playerId } = req.params;

  if (!gamesVariantId || !playerId) {
    return res.status(400).send({ message: 'gamesVariantId and playerId are required' });
  }

  try {
    // Define time filter based on the period
    const currentDate = new Date();
    const timeFilter = {
      [Op.gte]: new Date(currentDate.getFullYear(), 0, 1), // Start of the year
    };

    // Query for the top score
    const topScore = await PlayerScore.findOne({  
      attributes: ['Points'],
      where: {
        GamesVariantId: gamesVariantId,
        PlayerID: playerId,
        ...(timeFilter ? { StartTime: timeFilter } : {}), // Apply time filter if applicable
      },
      order: [['Points', 'DESC']], // Order by highest Points
    });

    res.status(200).send(topScore);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
};

exports.getAllScoresForVariant = async (req, res) => {
  const gamesVariantId = req.params.gamesVariantId; 
  const { startDate, endDate, limit } = req.query;

  if (!gamesVariantId) {
    return res.status(400).send({ message: 'gamesVariantId is required' });
  }

  let where = { GamesVariantId: gamesVariantId };

  if (startDate || endDate) {
    where.StartTime = {};
    if (startDate) where.StartTime[db.Sequelize.Op.gte] = new Date(startDate);
    if (endDate)   where.StartTime[db.Sequelize.Op.lte] = new Date(endDate);
  }

  let findOptions = {
    where,
    order: [['Points', 'DESC']],
    include: [
      {
        model: db.Player,
        as: 'player',
        attributes: ['FirstName', 'LastName'],
      }
    ]
  };

  if (limit && !isNaN(Number(limit))) {
    findOptions.limit = Number(limit);
  }

  try {
    const scores = await db.PlayerScore.findAll(findOptions);
    res.status(200).send(scores);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getTopAllTime = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  try {
    const results = await db.sequelize.query(`
      SELECT TOP (:limit)
          t.PlayerID,
          SUM(t.TopPoints) AS TotalTopPoints,
          MAX(t.StartTime) AS LastPlayed,
          p.FirstName,
          p.LastName
      FROM (
          SELECT
              ps.PlayerID,
              ps.GamesVariantId,
              MAX(ps.Points) AS TopPoints,
              MAX(ps.StartTime) AS StartTime
          FROM PlayerScores ps
          WHERE ps.Points > 0
          GROUP BY ps.PlayerID, ps.GamesVariantId
      ) t
      JOIN Players p ON t.PlayerID = p.PlayerID
      GROUP BY t.PlayerID, p.FirstName, p.LastName
      ORDER BY TotalTopPoints DESC
    `, {
      replacements: { limit },
      type: db.Sequelize.QueryTypes.SELECT
    });
    res.status(200).send(results); 
  } catch (err) {
    res.status(500).send({ message: err.message || 'Unknown error in CumulativeTopAllTime' });
  }
};

exports.getTopRecent = async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const limit = parseInt(req.query.limit, 10) || 5;
  try {
    const results = await db.sequelize.query(`
      SELECT TOP (${limit})
          t.PlayerID,
          SUM(t.TopPoints) AS TotalTopPoints,
          MAX(t.StartTime) AS LastPlayed,
          p.FirstName,
          p.LastName
      FROM (
          SELECT
              ps.PlayerID,
              ps.GamesVariantId,
              MAX(ps.Points) AS TopPoints,
              MAX(ps.StartTime) AS StartTime
          FROM PlayerScores ps
          WHERE ps.Points > 0
            AND ps.StartTime > DATEADD(DAY, -${days}, GETDATE())
          GROUP BY ps.PlayerID, ps.GamesVariantId
      ) t
      JOIN Players p ON t.PlayerID = p.PlayerID
      GROUP BY t.PlayerID, p.FirstName, p.LastName
      ORDER BY TotalTopPoints DESC
    `, {
      type: db.Sequelize.QueryTypes.SELECT
    });

    res.status(200).send(results);
  } catch (err) {
    console.error("TopRecent error:", err);
    res.status(500).send({ message: err.message || 'Unknown error in CumulativeTopRecent' });
  }
};




