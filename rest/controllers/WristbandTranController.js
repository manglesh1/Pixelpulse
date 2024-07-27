const db = require('../models');
const WristbandTran = db.WristbandTran;

exports.create = async (req, res) => {
  try {
    const WristbandTran = await WristbandTran.create(req.body);
    res.status(201).send(WristbandTran);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const WristbandTrans = await WristbandTran.findAll();
    res.status(200).send(WristbandTrans);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const WristbandTran = await WristbandTran.findByPk(req.params.id);
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
