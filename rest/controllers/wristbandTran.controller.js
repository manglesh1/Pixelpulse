const db = require("../models");
const { Op, QueryTypes } = require("sequelize");
const WristbandTran = db.WristbandTran;
const Player = db.Player;
const PlayerScore = db.PlayerScore;
const logger = require("../utils/logger");

// ------------------------
// helpers
// ------------------------
function requireLoc(req, res) {
  const loc = req.ctx?.locationId;
  if (!loc) {
    res.status(403).json({ message: "Missing location scope" });
    return null;
  }
  return loc;
}

async function findActiveWristband(locationId, whereExtra = {}) {
  return await WristbandTran.findOne({
    where: {
      LocationID: locationId,
      wristbandStatusFlag: "R",
      playerStartTime: { [Op.lte]: new Date().toISOString() },
      playerEndTime: { [Op.gte]: new Date().toISOString() },
      ...whereExtra,
    },
    include: [{ model: Player, as: "player" }],
    order: [["WristbandTranDate", "DESC"]],
  });
}

async function assertPlayerInLocation(db, playerID, locationId) {
  if (playerID == null) return null; // allow anonymous
  const pid = Number(playerID);
  if (!Number.isFinite(pid) || pid <= 0) {
    const err = new Error("Invalid playerID");
    err.statusCode = 400;
    throw err;
  }

  const player = await db.Player.findByPk(pid);
  if (!player) {
    const err = new Error("Player not found");
    err.statusCode = 404;
    throw err;
  }

  const playerLoc = Number(player.LocationID);
  const reqLoc = Number(locationId);

  if (
    Number.isFinite(playerLoc) &&
    Number.isFinite(reqLoc) &&
    playerLoc !== reqLoc
  ) {
    const err = new Error("Forbidden: Player belongs to a different location");
    err.statusCode = 403;
    throw err;
  }

  return player;
}

// ------------------------
// hasActivePlayersInternal: used by automations
// NOTE: if automations are per-location, add LocationID filter + pass location in
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
      999,
    ),
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

// ------------------------
// GET: Get play summary of wristband
// ------------------------
exports.getPlaySummary = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  try {
    const wristbandTrans = await findActiveWristband(locationId, {
      wristbandCode: req.query.wristbanduid,
    });

    if (!wristbandTrans || !wristbandTrans.player) {
      return res
        .status(404)
        .send({ message: "Valid wristband transaction not found" });
    }

    const playerScores = await PlayerScore.findAll({
      where: { PlayerID: wristbandTrans.PlayerID, LocationID: locationId },
    });

    const totalScore = playerScores.reduce(
      (acc, s) => acc + (s.Points || 0),
      0,
    );

    const now = new Date();
    const start = new Date(wristbandTrans.playerStartTime);
    const end = new Date(wristbandTrans.playerEndTime);

    const timeSpentMinutes = Math.floor((now - start) / 1000 / 60);
    const remaining = Math.floor((end - now) / 1000 / 60);

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

// ------------------------
// GET: Find all wristbands (location restricted)
// ------------------------
exports.findAll = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  try {
    const where = { LocationID: locationId };
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

// ------------------------
// GET: Find one wristband (location restricted)
// ------------------------
exports.findOne = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  try {
    const where = { LocationID: locationId };

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

// ------------------------
// POST: DELETE
// (optional: also check LocationID before deleting)
// ------------------------
exports.delete = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  try {
    const deleted = await WristbandTran.destroy({
      where: { WristbandTranID: req.params.id, LocationID: locationId },
    });

    if (!deleted)
      return res.status(404).send({ message: "WristbandTran not found" });

    res.status(204).send();
  } catch (err) {
    logger.error("delete error:", err);
    res.status(500).send({ message: err.message });
  }
};

// ------------------------
// POST: add time (location restricted)
// ------------------------
exports.addTimeToWristband = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  try {
    const { uid, addHours } = req.body;

    if (!uid || addHours == null)
      return res.status(400).send({ message: "uid and addHours required" });

    const hours = parseFloat(addHours);
    if (isNaN(hours) || hours <= 0)
      return res.status(400).send({ message: "Invalid addHours value" });

    const record = await findActiveWristband(locationId, {
      wristbandCode: uid,
    });
    if (!record)
      return res
        .status(404)
        .send({ message: "No valid wristband record found" });

    const currentEnd = new Date(record.playerEndTime);
    const newEnd = new Date(currentEnd.getTime() + hours * 60 * 60 * 1000);

    record.playerEndTime = newEnd.toISOString();
    await record.save();

    res.status(200).send(record);
  } catch (err) {
    logger.error("addTimeToWristband error:", err);
    res.status(500).send({ message: err.message });
  }
};

// ------------------------
// PUT: Update Wristband Record (location restricted)
// ------------------------
exports.update = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

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

    if (!uid || !currentstatus) {
      return res
        .status(400)
        .json({ message: "uid and currentstatus are required" });
    }

    const record = await WristbandTran.findOne({
      where: {
        LocationID: locationId,
        wristbandCode: uid,
        wristbandStatusFlag: currentstatus,
      },
      order: [["WristbandTranDate", "DESC"]],
    });

    if (!record) {
      return res
        .status(404)
        .json({ message: "Wristband transaction not found" });
    }

    // If caller is setting/changing PlayerID, enforce player belongs to this location
    if (
      playerID !== undefined &&
      playerID !== null &&
      Number(playerID) !== Number(record.PlayerID)
    ) {
      await assertPlayerInLocation(req.db, playerID, locationId);
    }

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
    return res.status(200).json(record);
  } catch (err) {
    const code = err.statusCode || 500;
    logger.error("update error:", err);
    return res.status(code).json({ message: err.message });
  }
};

// ------------------------
// POST: Create a new WristbandTran (location restricted)
// ------------------------
exports.create = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  const uid = req.body.uid;
  const addHours = parseFloat(req.body.addHours) || 1;

  try {
    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    // If playerID is provided, it must belong to this location
    if (req.body.playerID != null) {
      await assertPlayerInLocation(req.db, req.body.playerID, locationId);
    }

    const activeCount = await WristbandTran.count({
      where: {
        LocationID: locationId,
        wristbandCode: uid,
        wristbandStatusFlag: "R",
        playerEndTime: { [Op.gt]: new Date().toISOString() },
      },
    });

    if (activeCount > 0) {
      return res
        .status(400)
        .type("text/plain")
        .send("Wristband still has time and count.");
    }

    const newTran = await WristbandTran.create({
      LocationID: locationId,
      wristbandCode: uid,
      wristbandStatusFlag: req.body.wristbandStatusFlag ?? "I",
      count: req.body.count ?? 0,
      playerStartTime: new Date().toISOString(),
      playerEndTime: new Date(
        Date.now() + addHours * 3600 * 1000,
      ).toISOString(),
      WristbandTranDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      PlayerID: req.body.playerID ?? null,
    });

    return res.status(201).json(newTran);
  } catch (err) {
    const code = err.statusCode || 500;
    logger.error("create error:", err);
    return res.status(code).json({ message: err.message });
  }
};

// ------------------------
// GET: Lookup wristband by UID (location restricted)
// ------------------------
exports.lookupByUid = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  const uid = req.query.uid;
  if (!uid) return res.status(400).send({ message: "Missing UID parameter" });

  try {
    const results = await db.sequelize.query(
      `
      SELECT wt.*, p.*
      FROM WristbandTrans wt
      LEFT JOIN Players p ON wt.PlayerID = p.PlayerID
      WHERE wt.wristbandCode = :uid
        AND wt.LocationID = :loc
        AND wt.wristbandStatusFlag = 'R'
        AND wt.playerStartTime <= GETUTCDATE()
        AND wt.playerEndTime >= GETUTCDATE()
      ORDER BY wt.WristbandTranDate DESC
      OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
      `,
      {
        replacements: { uid, loc: locationId },
        type: QueryTypes.SELECT,
      },
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

// ------------------------
// Validate wristband (location restricted)
// ------------------------
exports.validate = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  try {
    const record = await findActiveWristband(locationId, {
      wristbandCode: req.query.wristbandCode,
    });

    if (record) {
      return res.status(200).send({ message: "valid", wristbandTran: record });
    }

    const initialized = await WristbandTran.findOne({
      where: {
        LocationID: locationId,
        wristbandCode: req.query.wristbandCode,
        wristbandStatusFlag: "I",
        playerStartTime: { [Op.lte]: new Date().toISOString() },
        playerEndTime: { [Op.gte]: new Date().toISOString() },
      },
      order: [["WristbandTranDate", "DESC"]],
    });

    if (initialized) return res.status(404).send({ message: "not registered" });

    res.status(404).send({ message: "not valid" });
  } catch (err) {
    logger.error("validate error:", err);
    res.status(500).send({ message: err.message });
  }
};

// ------------------------
// validatePlayer (location restricted)
// ------------------------
exports.validatePlayer = async (req, res) => {
  const locationId = requireLoc(req, res);
  if (!locationId) return;

  try {
    const playerID = req.query.PlayerID;

    const record = await findActiveWristband(locationId, {
      PlayerID: playerID,
    });

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
// export internal helper
// ------------------------
exports.hasActivePlayersInternal = hasActivePlayersInternal;
