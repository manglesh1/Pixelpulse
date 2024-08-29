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
          order: [['WristbandTranID', 'DESC']],
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
			}

       
      })
    );

    res.status(201).send(createdScores);
  } catch (err) {
	  console.log(err);
    res.status(500).send({ message: err.message });
  }
};



