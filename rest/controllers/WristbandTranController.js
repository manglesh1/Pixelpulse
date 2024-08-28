const db = require('../models');
const WristbandTran = db.WristbandTran;
const PlayerScore = db.PlayerScore;

exports.create = async (req, res) => {
  try {
    const wristbandTran = await WristbandTran.create({
      ...req.body, // Include gameType
    });
    res.status(201).send(wristbandTran);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};



exports.getPlaySummary = async (req, res) => {
  try {
    const wristbandTrans = await WristbandTran.findOne({
      where: { wristbandCode: req.query.wristbanduid },
      include: [{ model: db.Player, as: 'player' }]
    });

    if (!wristbandTrans) {
      return res.status(404).send({ message: 'Wristband transaction not found' });
    }

    const playerScores = await PlayerScore.findAll({
      where: {
        PlayerID: wristbandTrans.PlayerID,
        WristbandTranID: wristbandTrans.WristbandTranID
      }
    });

    const totalScore = playerScores.reduce((acc, score) => acc + score.Points, 0);

    let timeSpentMinutes = null;
    let timeleft = null;

    // Calculate timeSpentMinutes and timeleft only if startDate and endDate are not null
    if (wristbandTrans.playerStartDate && wristbandTrans.playerEndDate) {
      const startTime = new Date(wristbandTrans.playerStartDate);
      const endTime = new Date(wristbandTrans.playerEndDate);
      const currentTime = new Date();
      timeSpentMinutes = Math.floor((currentTime - startTime) / 1000 / 60);
      timeleft = Math.floor((endTime - currentTime) / 1000 / 60);
    }

    // Determine the remaining time or count based on gameType
    let remaining = timeleft;
    if (wristbandTrans.gameType === 'count') {
      remaining = wristbandTrans.count; // If gameType is 'count', return remaining count
    }

    // Calculate reward based on totalScore
    let reward = 'None';
    if (totalScore > 50) reward = 'Bronze';
    if (totalScore > 100) reward = 'Silver';
    if (totalScore > 150) reward = 'Gold';
    if (totalScore > 200) reward = 'Platinum';
    if (totalScore > 250) reward = 'Diamond';
    if (totalScore > 300) reward = 'Master';

    res.status(200).send({
      player: wristbandTrans.player,
      totalScore,
      timeSpentMinutes,
      remaining, // Return remaining time or count based on gameType
      reward,
      gameType: wristbandTrans.gameType // Include gameType in response
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
      // Initialize an empty where clause object
      let whereClause = {};

      // Check if wristbandcode is in the query and add it to the where clause
      if (req.query.wristbandcode) {
          whereClause.wristbandCode = req.query.wristbandcode;
      }
      if (req.query.flag) {
        whereClause.wristbandStatusFlag = req.query.flag;
      }
      if (req.query.timelimit) {
        whereClause.WristbandTranDate> new Date(new Date() - 1 * req.query.timelimit * 60 * 1000) // Last hour}
      }
     
     

      // You can extend this by adding more conditions based on other possible query parameters
      // For example:
      // if (req.query.someOtherParam) {
      //     whereClause.someOtherField = req.query.someOtherParam;
      // }

      // Use the dynamically constructed where clause in the findOne operation
      const wristbandTran = await db.WristbandTran.findOne({
          where: whereClause,
          include: [{ model: db.Player, as: 'player' }]          
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
  const status = req.body.status;
console.log(req.body)
  try {
      if (status === "I") { // Corrected from = to === for comparison
          // Delegate to the create function if status is "I"
          this.create(req, res);
      } else {
          const uid = req.body.uid;
          const src = req.body.src;
          const playerID = req.body.playerID;
          const count = req.body.count;
          // Assuming additional fields might be updated, included in the request body
          const existingRecord = await db.WristbandTran.findOne({
              where: {
                  wristbandCode: uid, wristbandStatusFlag:req.body.currentstatus
              }
          });

          if (existingRecord) {
              // Update the existing record with new data from the request
              existingRecord.wristbandStatusFlag = status; // Update status or other fields
              existingRecord.src = src;
              existingRecord.PlayerID = playerID;
              existingRecord.gameType = gameType; // Update gameType
              existingRecord.count = count; // Update count
              // Add any other fields that need updating
              existingRecord.updatedAt = new Date(); // Update the timestamp for the record update

              await existingRecord.save();

              res.status(200).send(existingRecord);
          } else {
              res.status(404).send({ message: "Wristband transaction not found." });
          }
      }
  } catch (err) {
      res.status(500).send({ message: err.message });
  }
};


exports.create = async (req, res) => {
  const uid = req.body.uid; // Assuming UID is passed in the body

  try {
      const existingCount = await db.WristbandTran.count({
          where: {
              wristbandCode: uid,
              WristbandTranDate: {
                  [db.Sequelize.Op.gt]: new Date(new Date() - 1 * 60 * 60 * 1000) // Last hour
              }
          }
      });

      if (existingCount === 0) {
          const newTran = await db.WristbandTran.create({
              wristbandCode: uid,
              wristbandStatusFlag: 'I',
              WristbandTranDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
          });
          res.status(201).send(newTran);
      } else {
          res.status(400).send("Record already exists within the last hour.");
      }
  } catch (err) {
      res.status(500).send({ message: err.message });
  }
};
