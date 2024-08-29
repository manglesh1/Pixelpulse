const db = require('../models');
const { Op } = require('sequelize');
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

  const currentTime = new Date(); // Define the current time

  try {
    const createdScores = await Promise.all(
      players.map(async (player) => {
        // Fetch the associated WristbandTran record based on wristbandCode and status flag
        const wristbandTran = await db.WristbandTran.findOne({
          where: {
            wristbandCode: player.wristbandCode,
            wristbandStatusFlag: 'R',
            [Op.and]: [
              { playerStartTime: { [Op.lte]: currentTime } }, // Ensure currentTime is after or equal to playerStartTime
              { playerEndTime: { [Op.gte]: currentTime } } // Ensure currentTime is before or equal to playerEndTime
            ]
          }
        });

        if (!wristbandTran) {
          throw new Error(`Invalid or expired wristbandCode for player ${player.wristbandCode}`);
        }

        // Fetch the associated GamesVariant record based on name (assuming GamesVariantCode corresponds to the name)
        const gamesVariant = await db.GamesVariant.findOne({
          where: { name: player.GamesVariantCode },
        });

        if (!gamesVariant) {
          throw new Error(`Invalid GamesVariantCode for player ${player.wristbandCode}`);
        }

        // Create the PlayerScore entry
        const playerScore = await PlayerScore.create({
          PlayerID: wristbandTran.playerID, // PlayerID is associated through WristbandTran
          GameID: gamesVariant.GameId, // GameID is referenced from GamesVariant's GameId
          GamesVariantId: gamesVariant.ID, // Directly using the ID from GamesVariant
          WristbandTranID: wristbandTran.WristbandTranID, // Using the WristbandTranID from the found record
          LevelPlayed: player.LevelPlayed, // Assuming LevelPlayed is directly from player object
          Points: player.Points, // Points from player object
          StartTime: wristbandTran.playerStartTime, // StartTime from WristbandTran
          EndTime: wristbandTran.playerEndTime, // EndTime from WristbandTran
          CreatedDate: new Date(), // Automatically set to now
        });

        return playerScore;
      })
    );

    res.status(201).send(createdScores);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};



