const db = require('../models');
const WristbandTran = db.WristbandTran;
const PlayerScore = db.PlayerScore;
exports.create = async (req, res) => {
  try {
    const WristbandTran = await WristbandTran.create(req.body);
    res.status(201).send(WristbandTran);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


exports.getPlaySummary = async (req, res) => {
  try {
    // Fetch the WristbandTran record based on the wristband UID
    const wristbandTrans = await WristbandTran.findOne({
      where: { wristbandCode: req.query.wristbanduid },
      include: [{ model: db.Player, as: 'player' }]
    });

    if (!wristbandTrans) {
      return res.status(404).send({ message: 'Wristband transaction not found' });
    }

    // Fetch the PlayerScore records for the player associated with this wristband
    const playerScores = await PlayerScore.findAll({
      where: {
        PlayerID: wristbandTrans.PlayerID,
        WristbandTranID: wristbandTrans.WristbandTranID
      }
    });

    // Calculate the total score
    const totalScore = playerScores.reduce((acc, score) => acc + score.Points, 0);

    // Calculate the time spent in minutes
    const startTime = new Date(wristbandTrans.playerStartDate);

    const endTime = new Date(wristbandTrans.playerEndDate);
    const currentTime = new Date();
    const timeSpentMinutes = Math.floor((currentTime - startTime) / 1000 / 60);
    const timeleft = Math.floor((endTime - currentTime) / 1000 / 60);
    const reward = 'None';
    if(totalScore> 50)
    {
      reward = 'Bronze';
    }else if(totalScore > 100)
      reward = 'Silver';
    else if(totalScore > 150)
      reward = 'Gold';
    else if(totalScore > 200)
      reward = 'Platinum';
    else if(totalScore > 250)
      reward = 'Diamond';
    else if(totalScore > 300)
      reward = 'Master';

    res.status(200).send({
      player: wristbandTrans.player,
      totalScore,
      timeSpentMinutes,
      timeleft,
      reward      
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
    const WristbandTran = await WristbandTran.findByPk( {
      include: [{ model: db.Player, as: 'players' }]
    });
    if (!WristbandTran) {
      return res.status(404).send({ message: 'WristbandTran not found' });
    }
    res.status(200).send(WristbandTran);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await WristbandTran.update(req.body, {
      where: { WristbandTranID: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'WristbandTran not found' });
    }
    const updatedWristbandTran = await WristbandTran.findByPk(req.params.id);
    res.status(200).send(updatedWristbandTran);
  } catch (err) {
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
