const db = require('../models');
const WristbandTran = db.WristbandTran;
const PlayerScore = db.PlayerScore;
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const hasActivePlayersInternal = async () => {
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const count = await WristbandTran.count({
    where: {
      wristbandStatusFlag: 'R',
      playerStartTime: { [Op.lte]: now },
      playerEndTime: {
        [Op.gte]: now,
        [Op.lte]: endOfToday
      }
    }
  });

  return count > 0;
};
exports.getPlaySummary = async (req, res) => {
  try {
    const wristbandTrans = await WristbandTran.findOne({
      where: {
        wristbandCode: req.query.wristbanduid,
        wristbandStatusFlag: 'R',
        PlayerID: { [db.Sequelize.Op.ne]: null }
      },
      include: [{ model: db.Player, as: 'player' }],
      order: [['WristbandTranDate', 'DESC']]
    });

    if (!wristbandTrans || !wristbandTrans.player) {
      return res.status(404).send({ message: 'Valid wristband transaction not found' });
    }

    const playerScores = await PlayerScore.findAll({
      where: { PlayerID: wristbandTrans.PlayerID }
    });

    const totalScore = playerScores.reduce((acc, score) => acc + score.Points, 0);

    let timeSpentMinutes = null;
    let timeleft = null;

    if (wristbandTrans.playerStartTime && wristbandTrans.playerEndTime) {
      const startTime = new Date(wristbandTrans.playerStartTime);
      const endTime = new Date(wristbandTrans.playerEndTime);
      const currentTime = new Date();
      timeSpentMinutes = Math.floor((currentTime - startTime) / 1000 / 60);
      timeleft = Math.floor((endTime - currentTime) / 1000 / 60);
    }

    // Determine remaining based on game type
    let remaining = timeleft;
    // Uncomment this block if using count mode
    // if (wristbandTrans.gameType === 'count') {
    //   remaining = wristbandTrans.count;
    // }

    // Determine reward
    let reward = 'None';
    if (totalScore > 15000) reward = 'Master';
    else if (totalScore > 10000) reward = 'Diamond';
    else if (totalScore > 5000) reward = 'Platinum';
    else if (totalScore > 2500) reward = 'Gold';
    else if (totalScore > 1000) reward = 'Silver';
    else if (totalScore > 500) reward = 'Bronze';

    res.status(200).send({
      player: wristbandTrans.player,
      totalScore,
      timeSpentMinutes,
      remaining,
      reward,
      gameType: wristbandTrans.gameType
    });
  } catch (err) {
    console.error('Error fetching play summary:', err);
    res.status(500).send({ message: err.message });
  }
};


exports.findAll = async (req, res) => {
  try {
    let wristbandTrans;
    console.log(req.query.wristbanduid);
    
    if (req.query.wristbanduid) {
      wristbandTrans = await WristbandTran.findAll({
        where: { wristbandCode: req.query.wristbanduid },
        include: [{ model: db.Player, as: 'player' }]
      });
    } else {
      wristbandTrans = await WristbandTran.findAll({
        include: [{ model: db.Player, as: 'player' }]
      });
    }
    
    res.status(200).send(wristbandTrans);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
	try {
		console.log('findone called');
		// Initialize an empty where clause object
		let whereClause = {};

		// Check if wristbandcode is in the query and add it to the where clause
		if (req.query.wristbandcode) {
			whereClause.wristbandCode = req.query.wristbandcode;
		}
		if (req.query.flag) {
			whereClause.wristbandStatusFlag = req.query.flag;
		}
		whereClause.playerEndTime > new Date().toISOString();
		// whereClause.count > 0;

		// You can extend this by adding more conditions based on other possible query parameters
		// For example:
		// if (req.query.someOtherParam) {
		//     whereClause.someOtherField = req.query.someOtherParam;
		// }

		// Use the dynamically constructed where clause in the findOne operation
		const wristbandTran = await db.WristbandTran.findOne({
			where: whereClause,
			include: [{ model: db.Player, as: 'player' }],
			order: [['WristbandTranDate', 'DESC']]
		});

		if (!wristbandTran) {
			return res.status(404).send({ message: 'Wristband transaction not found' });
		}

		res.status(200).send(wristbandTran);
	} catch (err) {
		console.error('Error fetching wristband transaction:', err);
		res.status(500).send({ message: err.message });
	}
};

exports.delete = async (req, res) => {
  try {
    const deleted = await WristbandTran.destroy({
      where: { WristbandTranID: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'WristbandTran not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
    console.log(req.body);  // Log request body for debugging

    try {
        const { uid, src, playerID, count, currentstatus, status, playerStartTime, playerEndTime } = req.body;

        const existingRecord = await db.WristbandTran.findOne({
            where: {
                wristbandCode: uid,
                wristbandStatusFlag: currentstatus
            },
            order: [['WristbandTranDate', 'DESC']]
        });

        if (existingRecord) {
            if (status) existingRecord.wristbandStatusFlag = status;
            if (src) existingRecord.src = src;
            if (playerID) existingRecord.PlayerID = playerID;
            if (count !== undefined) existingRecord.count = count;

            if (playerStartTime) existingRecord.playerStartTime = playerStartTime;
            if (playerEndTime) existingRecord.playerEndTime = playerEndTime;

            existingRecord.updatedAt = new Date().toISOString();

            console.log('before save');
            await existingRecord.save();

            res.status(200).send(existingRecord);
        } else {
            res.status(404).send({ message: "Wristband transaction not found." });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ message: err.message });
    }
};

exports.create = async (req, res) => {
	const uid = req.body.uid; // Assuming UID is passed in the body

	try {
		const existingCount = await db.WristbandTran.count({
			where: {
				wristbandCode: uid,
        wristbandStatusFlag: "R",
				playerEndTime: {
					[db.Sequelize.Op.gt]: new Date().toISOString(), // Last hour
				},
				// count: {
				// 	[db.Sequelize.Op.gt]: 0
				// }
			}
		});


		if (existingCount === 0) {
			const newTran = await db.WristbandTran.create({
				wristbandCode: uid,
				wristbandStatusFlag: 'I',
				count: req.body.count ?? 0,
				playerStartTime: new Date().toISOString(),
				playerEndTime: new Date(Date.now() + (parseFloat(req.body.addHours))*1000 * 60 * 60).toISOString(), 
				WristbandTranDate: new Date().toISOString(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});
			res.status(201).send(newTran);
		} else {
			res.status(400).send("Wristband still has time and count.");
		}
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
};

exports.validate = async (req, res) => {
  try {
	  console.log(req.query.wristbandCode);
    const wristbandTran = await WristbandTran.findOne({
      where: {
        wristbandCode: req.query.wristbandCode, // Assuming the wristband ID is passed in the query
        wristbandStatusFlag: 'R', // Status should be 'R'
        playerStartTime: {
          [db.Sequelize.Op.lte]: new Date().toISOString(), // playerStartTime should be less than or equal to current time
        },
        playerEndTime: {
          [db.Sequelize.Op.gte]: new Date().toISOString(), // playerEndTime should be greater than or equal to current time
        },
        // count: {
        //   [db.Sequelize.Op.gt]: 0 // Count should be greater than 0
        // }
      }
    });

    if (!wristbandTran) {
      console.log("record not found");
      return res.status(404).send({ message: 'Wristband transaction is not valid or not found.' });
    }
    console.log("valid wristband record  found");

    res.status(200).send({ message: 'Wristband transaction is valid.', wristbandTran });
  } catch (err) {
    console.error('Error validating wristband transaction:', err);
    res.status(500).send({ message: err.message });
  }
};

exports.validatePlayer = async (req, res) => {
  try {
    const playerID = req.query.PlayerID;
	  console.log("Validating player " + playerID);
    const wristbandTran = await WristbandTran.findOne({
      where: {
        PlayerID: playerID, // Assuming the wristband ID is passed in the query
        wristbandStatusFlag: 'R', // Status should be 'R'
        playerStartTime: {
          [db.Sequelize.Op.lte]: new Date().toISOString(), // playerStartTime should be less than or equal to current time
        },
        playerEndTime: {
          [db.Sequelize.Op.gte]: new Date().toISOString(), // playerEndTime should be greater than or equal to current time
        },
        // count: {
        //   [db.Sequelize.Op.gt]: 0 // Count should be greater than 0
        // }
      }
    });

    if (!wristbandTran) {
      return res.status(404).send({ message: 'Player wristband transaction is not valid or not found for player ID: ', playerID  });
    }

    res.status(200).send({ message: 'Wristband transaction is valid.', wristbandTran });
  } catch (err) {
    console.error('Error validating wristband transaction:', err);
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  hasActivePlayersInternal,
};
