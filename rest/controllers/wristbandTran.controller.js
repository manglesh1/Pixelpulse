const db = require("../models");
const { Op, QueryTypes } = require("sequelize");
const WristbandTran = db.WristbandTran;
const Player = db.Player;
const PlayerScore = db.PlayerScore;
const logger = require("../utils/logger");

// ------------------------
// helper: find active wristband
// ------------------------
async function findActiveWristband(whereExtra = {}) {
  return await WristbandTran.findOne({
    where: {
      wristbandStatusFlag: "R",
      playerStartTime: { [Op.lte]: new Date().toISOString() },
      playerEndTime: { [Op.gte]: new Date().toISOString() },
      ...whereExtra,
    },
    include: [{ model: Player, as: "player" }],
    order: [["WristbandTranDate", "DESC"]],
  });
}

// ------------------------
// hasActivePlayersInternal: used by automations
// ------------------------
const hasActivePlayersInternal = async () => {
  const now = new Date();
  const endOfToday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

  const count = await WristbandTran.count({
    where: {
      wristbandStatusFlag: "R",
      playerStartTime: { [Op.lte]: now },
      playerEndTime: { [Op.gte]: now, [Op.lte]: endOfToday },
    },
  });

  return count > 0;
};

// GET: Get play summary of wristband
exports.getPlaySummary = async (req, res) => {
  try {
    const wristbandTrans = await findActiveWristband({
      wristbandCode: req.query.wristbanduid,
    });

    if (!wristbandTrans || !wristbandTrans.player) {
      return res
        .status(404)
        .send({ message: "Valid wristband transaction not found" });
    }

    const playerScores = await PlayerScore.findAll({
      where: { PlayerID: wristbandTrans.PlayerID },
    });

    const totalScore = playerScores.reduce((acc, s) => acc + s.Points, 0);
    const now = new Date();
    const start = new Date(wristbandTrans.playerStartTime);
    const end = new Date(wristbandTrans.playerEndTime);

    const timeSpentMinutes = Math.floor((now - start) / 1000 / 60);
    const remaining = Math.floor((end - now) / 1000 / 60);

    // Reward tiers
    let reward = "None";
    if (totalScore > 15000) reward = "Master";
    else if (totalScore > 10000) reward = "Diamond";
    else if (totalScore > 5000) reward = "Platinum";
    else if (totalScore > 2500) reward = "Gold";
    else if (totalScore > 1000) reward = "Silver";
    else if (totalScore > 500) reward = "Bronze";

    res.status(200).send({
      player: wristbandTrans.player,
      totalScore,
      timeSpentMinutes,
      remaining,
      reward,
      gameType: wristbandTrans.gameType,
    });
  } catch (err) {
    logger.error("getPlaySummary failed:", err);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Get: Find all wristbands
exports.findAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.playerID) where.PlayerID = req.query.playerID;

    const data = await WristbandTran.findAll({
      where,
      include: [{ model: Player, as: "player" }],
      order: [["WristbandTranDate", "DESC"]],
    });

    res.status(200).send(data);
  } catch (err) {
    logger.error("Wristband findAll error:", err);
    res.status(500).send({ message: err.message });
  }
};

// GET: Find one wristband
exports.findOne = async (req, res) => {
  try {
    const where = {};
    if (req.query.wristbandcode) where.wristbandCode = req.query.wristbandcode;
    if (req.query.flag) where.wristbandStatusFlag = req.query.flag;
    if (!req.query.task || req.query.task !== "renew") {
      where.playerEndTime = { [Op.gt]: new Date().toISOString() };
    }

    const data = await WristbandTran.findOne({
      where,
      include: [{ model: Player, as: "player" }],
      order: [["WristbandTranDate", "DESC"]],
    });

    if (!data) return res.status(404).send({ message: "Wristband not found" });
    res.status(200).send(data);
  } catch (err) {
    logger.error("findOne error:", err);
    res.status(500).send({ message: err.message });
  }
};

// POST: DELETE
exports.delete = async (req, res) => {
  try {
    const deleted = await WristbandTran.destroy({
      where: { WristbandTranID: req.params.id },
    });
    if (!deleted)
      return res.status(404).send({ message: "WristbandTran not found" });
    res.status(204).send();
  } catch (err) {
    logger.error("delete error:", err);
    res.status(500).send({ message: err.message });
  }
};

// PUT: Add Time To Wristband
exports.addTimeToWristband = async (req, res) => {
  try {
    const { uid, addHours } = req.body;
    if (!uid || !addHours)
      return res.status(400).send({ message: "uid and addHours required" });

    const record = await findActiveWristband({ wristbandCode: uid });
    if (!record)
      return res
        .status(404)
        .send({ message: "No valid wristband record found" });

    const newEnd = new Date(record.playerEndTime);
    newEnd.setHours(newEnd.getHours() + parseFloat(addHours));

    record.playerEndTime = newEnd.toISOString();
    await record.save();

    res.status(200).send(record);
  } catch (err) {
    logger.error("addTimeToWristband error:", err);
    res.status(500).send({ message: err.message });
  }
};

// PUT: Update Wristband Record
exports.update = async (req, res) => {
  try {
    const {
      uid,
      src,
      playerID,
      count,
      currentstatus,
      status,
      playerStartTime,
      playerEndTime,
    } = req.body;

    const record = await WristbandTran.findOne({
      where: { wristbandCode: uid, wristbandStatusFlag: currentstatus },
      order: [["WristbandTranDate", "DESC"]],
    });

    if (!record)
      return res
        .status(404)
        .send({ message: "Wristband transaction not found" });

    Object.assign(record, {
      wristbandStatusFlag: status || record.wristbandStatusFlag,
      src: src || record.src,
      PlayerID: playerID ?? record.PlayerID,
      count: count ?? record.count,
      playerStartTime: playerStartTime ?? record.playerStartTime,
      playerEndTime: playerEndTime ?? record.playerEndTime,
      updatedAt: new Date().toISOString(),
    });

    await record.save();
    res.status(200).send(record);
  } catch (err) {
    logger.error("update error:", err);
    res.status(500).send({ message: err.message });
  }
};

// POST: Create a new WristbandTran
exports.create = async (req, res) => {
  const uid = req.body.uid;
  const addHours = parseFloat(req.body.addHours) || 1;

  try {
    const activeCount = await WristbandTran.count({
      where: {
        wristbandCode: uid,
        wristbandStatusFlag: "R",
        playerEndTime: { [Op.gt]: new Date().toISOString() },
      },
    });

    if (activeCount > 0) {
      return res
        .status(400)
        .send({ message: "Wristband still has active time." });
    }

    const newTran = await WristbandTran.create({
      wristbandCode: uid,
      wristbandStatusFlag: req.body.wristbandStatusFlag ?? "I",
      count: req.body.count ?? 0,
      playerStartTime: new Date().toISOString(),
      playerEndTime: new Date(
        Date.now() + addHours * 3600 * 1000
      ).toISOString(),
      WristbandTranDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      PlayerID: req.body.playerID ?? null,
    });

    res.status(201).send(newTran);
  } catch (err) {
    logger.error("create error:", err);
    res.status(500).send({ message: err.message });
  }
};

// GET: Lookup wristband by UID
exports.lookupByUid = async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).send({ message: "Missing UID parameter" });

  try {
    const [results] = await db.sequelize.query(
      `
      SELECT wt.*, p.*
      FROM WristbandTrans wt
      LEFT JOIN Players p ON wt.PlayerID = p.PlayerID
      WHERE wt.wristbandCode = :uid
        AND wt.wristbandStatusFlag = 'R'
        AND wt.playerStartTime <= GETUTCDATE()
        AND wt.playerEndTime >= GETUTCDATE()
      ORDER BY wt.WristbandTranDate DESC
      OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
    `,
      { replacements: { uid } }
    );

    if (!results || results.length === 0)
      return res
        .status(404)
        .send({ message: "No active wristband transaction found" });

    res.status(200).send(results[0]);
  } catch (err) {
    logger.error("lookupByUid error:", err);
    res.status(500).send({ message: "Server error during UID lookup" });
  }
};

// Validate wristband
exports.validate = async (req, res) => {
  try {
    const record = await findActiveWristband({
      wristbandCode: req.query.wristbandCode,
    });

    if (record) {
      return res.status(200).send({ message: "valid", wristbandTran: record });
    }

    // Check for 'I' (initialized but not registered)
    const initialized = await WristbandTran.findOne({
      where: {
        wristbandCode: req.query.wristbandCode,
        wristbandStatusFlag: "I",
        playerStartTime: { [Op.lte]: new Date().toISOString() },
        playerEndTime: { [Op.gte]: new Date().toISOString() },
      },
    });

    if (initialized) return res.status(404).send({ message: "not registered" });

    res.status(404).send({ message: "not valid" });
  } catch (err) {
    logger.error("validate error:", err);
    res.status(500).send({ message: err.message });
  }
};

// ------------------------
// 👤 validatePlayer
// ------------------------
exports.validatePlayer = async (req, res) => {
  try {
    const playerID = req.query.PlayerID;
    const record = await findActiveWristband({ PlayerID: playerID });

    if (!record)
      return res.status(404).send({
        message: `No valid wristband transaction found for player ${playerID}`,
      });

    res.status(200).send({ message: "valid", wristbandTran: record });
  } catch (err) {
    logger.error("validatePlayer error:", err);
    res.status(500).send({ message: err.message });
  }
};

// ------------------------
// 📦 export internal helper
// ------------------------
exports.hasActivePlayersInternal = hasActivePlayersInternal;
