const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { Sequelize } = require("../models");

module.exports = {
  // ---------------------------------------------------------------------
  // Create new PlayerScore (scoped by Player's Location)
  // ---------------------------------------------------------------------
  create: async (req, res) => {
    const db = req.db;
    const { PlayerScore, Player } = db;

    try {
      const body = { ...req.body };
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });
      if (!body.PlayerID)
        return res.status(400).json({ message: "PlayerID is required" });

      const player = await Player.findByPk(body.PlayerID);
      if (!player || player.LocationID !== locationId)
        return res
          .status(403)
          .json({ message: "Player does not belong to this location" });

      const playerScore = await PlayerScore.create(body);
      res.status(201).json(playerScore);
    } catch (err) {
      logger.error("Error creating player score:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Get all PlayerScores (location-scoped through Player)
  // ---------------------------------------------------------------------
  findAll: async (req, res) => {
    const db = req.db;
    const { PlayerScore, Player } = db;

    try {
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });

      const scores = await PlayerScore.findAll({
        include: [
          {
            model: Player,
            as: "player",
            where: { LocationID: locationId },
            attributes: ["FirstName", "LastName", "email"],
          },
        ],
      });
      res.status(200).json(scores);
    } catch (err) {
      logger.error("Error fetching all player scores:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Find a single PlayerScore (location-scoped through Player)
  // ---------------------------------------------------------------------
  findOne: async (req, res) => {
    const db = req.db;
    const { PlayerScore, Player, Game, GamesVariant } = db;

    try {
      const id = req.params.id;
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

      if (!id) return res.status(400).json({ message: "ScoreID is required" });
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });

      const score = await PlayerScore.findOne({
        where: { ScoreID: id }, // ✅ fixed
        include: [
          {
            model: Player,
            as: "player",
            where: { LocationID: locationId },
            attributes: ["FirstName", "LastName", "email"],
          },
          { model: Game, as: "game", attributes: ["gameName"] },
          { model: GamesVariant, as: "GamesVariant", attributes: ["name"] },
        ],
      });

      if (!score)
        return res.status(404).json({ message: "PlayerScore not found" });
      res.status(200).json(score);
    } catch (err) {
      logger.error("Error fetching single player score:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Update PlayerScore (location-scoped through Player)
  // ---------------------------------------------------------------------
  update: async (req, res) => {
    const db = req.db;
    const { PlayerScore, Player } = db;

    try {
      const id = req.params.id;
      const body = req.body;
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

      if (!id) return res.status(400).json({ message: "ScoreID required" });
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });

      const score = await PlayerScore.findOne({
        where: { ScoreID: id }, // ✅ fixed
        include: [
          { model: Player, as: "player", where: { LocationID: locationId } },
        ],
      });
      if (!score)
        return res
          .status(404)
          .json({ message: "PlayerScore not found or not in this location" });

      await score.update(body);
      res.status(200).json(score);
    } catch (err) {
      logger.error("Error updating player score:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Delete PlayerScore (location-scoped through Player)
  // ---------------------------------------------------------------------
  delete: async (req, res) => {
    const db = req.db;
    const { PlayerScore, Player } = db;

    try {
      const id = req.params.id;
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

      if (!id) return res.status(400).json({ message: "ScoreID required" });
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });

      const score = await PlayerScore.findOne({
        where: { ScoreID: id }, // ✅ fixed
        include: [
          { model: Player, as: "player", where: { LocationID: locationId } },
        ],
      });
      if (!score)
        return res
          .status(404)
          .json({ message: "PlayerScore not found or not in this location" });

      await score.destroy();
      res.status(204).end();
    } catch (err) {
      logger.error("Error deleting player score:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Find all scores for a specific PlayerID (validated through Player)
  // ---------------------------------------------------------------------
  findAllScoresByPlayerID: async (req, res) => {
    const db = req.db;
    const { PlayerScore, GamesVariant, Game, Player } = db;

    try {
      const playerID = req.params.playerID;
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

      if (!playerID)
        return res.status(400).json({ message: "PlayerID is required" });
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });

      const player = await Player.findByPk(playerID);
      if (!player || player.LocationID !== locationId)
        return res
          .status(403)
          .json({ message: "Player does not belong to this location" });

      const playerScores = await PlayerScore.findAll({
        where: { PlayerID: playerID },
        include: [
          { model: GamesVariant, as: "GamesVariant", attributes: ["name"] },
          { model: Game, as: "game", attributes: ["gameName"] },
        ],
        order: [["StartTime", "DESC"]],
      });

      if (!playerScores.length)
        return res
          .status(404)
          .json({ message: "No scores found for this player" });

      res.status(200).json(playerScores);
    } catch (err) {
      logger.error(`Error fetching player scores by PlayerID: ${err.message}`);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Paged list (location-scoped through Player)
  // ---------------------------------------------------------------------
  findPaged: async (req, res) => {
    const db = req.db;
    const { PlayerScore, Player, Game, GamesVariant } = db;

    try {
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 10);
      const offset = (page - 1) * pageSize;
      const { gamesVariantId, startDate, endDate, search } = req.query;

      const sortByRaw = (req.query.sortBy || "StartTime").toLowerCase();
      const sortDirRaw = (req.query.sortDir || "DESC").toUpperCase();

      const allowedSortColumns = {
        starttime: ["StartTime"],
        firstname: ["player", "FirstName"],
        lastname: ["player", "LastName"],
        email: ["player", "email"],
        gamename: ["game", "gameName"],
        variant: ["GamesVariant", "name"],
      };

      const sortColumn = allowedSortColumns[sortByRaw] || ["StartTime"];
      const sortDir = sortDirRaw === "ASC" ? "ASC" : "DESC";

      const where = {};
      if (gamesVariantId) where.GamesVariantId = gamesVariantId;

      const isValidDate = (d) => !isNaN(Date.parse(d));
      if (startDate || endDate) {
        where.StartTime = {};
        if (isValidDate(startDate))
          where.StartTime[Op.gte] = new Date(startDate);
        if (isValidDate(endDate)) where.StartTime[Op.lte] = new Date(endDate);
      }

      const playerInclude = {
        model: Player,
        as: "player",
        attributes: ["FirstName", "LastName", "email"],
        where: { LocationID: locationId },
      };

      if (search && search.trim()) {
        const terms = search.trim().split(/\s+/);
        const anded = terms.map((term) => ({
          [Op.or]: [
            { FirstName: { [Op.like]: `%${term}%` } },
            { LastName: { [Op.like]: `%${term}%` } },
            { email: { [Op.like]: `%${term}%` } },
          ],
        }));
        playerInclude.where = {
          LocationID: locationId,
          [Op.and]: anded,
        };
      }

      const { rows, count } = await PlayerScore.findAndCountAll({
        where,
        limit: pageSize,
        offset,
        order: [[...sortColumn, sortDir]],
        include: [
          playerInclude,
          { model: GamesVariant, as: "GamesVariant", attributes: ["name"] },
          { model: Game, as: "game", attributes: ["gameName"] },
        ],
      });

      res.status(200).json({
        data: rows,
        pagination: {
          page,
          pageSize,
          totalItems: count,
          totalPages: Math.ceil(count / pageSize),
        },
      });
    } catch (err) {
      logger.error("Error in findPaged player scores:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Get top score for a player in a specific game variant
  // ---------------------------------------------------------------------
  getTopScoresForPlayerinGameVariant: async (req, res) => {
    const db = req.db;
    const { gamesVariantId, playerId } = req.params;
    const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

    try {
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });
      if (!gamesVariantId || !playerId)
        return res
          .status(400)
          .json({ message: "Both gamesVariantId and playerId are required" });

      // Validate player belongs to this location
      const player = await db.Player.findByPk(playerId);
      if (!player || player.LocationID !== locationId)
        return res
          .status(403)
          .json({ message: "Player does not belong to this location" });

      // ✅ RAW SQL query — no duplicate ORDER BY issue
      const [results] = await db.sequelize.query(
        `
      SELECT TOP 1
        ps.ScoreID,
        ps.PlayerID,
        ps.GamesVariantId,
        ps.GameID,
        ps.Points,
        ps.LevelPlayed,
        ps.StartTime,
        ps.EndTime,
        gv.name AS VariantName
      FROM PlayerScores ps
      INNER JOIN Players p ON ps.PlayerID = p.PlayerID
      INNER JOIN GamesVariants gv ON ps.GamesVariantId = gv.ID
      WHERE ps.PlayerID = :playerId
        AND ps.GamesVariantId = :gamesVariantId
        AND p.LocationID = :locationId
      ORDER BY ps.Points DESC;
      `,
        {
          replacements: { playerId, gamesVariantId, locationId },
          type: db.Sequelize.QueryTypes.SELECT,
        }
      );

      if (!results) {
        return res
          .status(404)
          .json({ message: "No score found for this player/variant" });
      }

      res.status(200).json(results);
    } catch (err) {
      logger.error("Error fetching top score for player/variant:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Get all scores for a specific GamesVariant (location-scoped)
  // ---------------------------------------------------------------------
  getAllScoresForVariant: async (req, res) => {
    const db = req.db;
    const { PlayerScore, Player, GamesVariant, Game } = db;
    const { Sequelize } = require("sequelize");
    const { Op } = Sequelize;

    try {
      const gamesVariantId = req.params.gamesVariantId;
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;
      const { startDate, endDate } = req.query;

      if (!gamesVariantId)
        return res.status(400).json({ message: "GamesVariantId required" });
      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });

      // 🕒 Optional date range
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.StartTime = {}; // use StartTime column, not createdAt
        if (startDate) dateFilter.StartTime[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.StartTime[Op.lte] = new Date(endDate);
      }

      // 🎯 Top 100 by Points
      const scores = await PlayerScore.unscoped().findAll({
        // 🚀 disable default order
        where: {
          GamesVariantId: gamesVariantId,
          ...dateFilter,
        },
        include: [
          {
            model: Player,
            as: "player",
            where: { LocationID: locationId },
            attributes: ["FirstName", "LastName", "email"],
          },
          { model: GamesVariant, as: "GamesVariant", attributes: ["name"] },
          { model: Game, as: "game", attributes: ["gameName"] },
        ],
        order: [
          ["Points", "DESC"],
          ["ScoreID", "DESC"], // ✅ tie-breaker
        ],
        limit: 10,
      });

      res.status(200).json(scores);
    } catch (err) {
      console.error("Error fetching all scores for variant:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Add scores in batch (location-scoped through Player)
  // ---------------------------------------------------------------------
  addPlayerScores: async (req, res) => {
    const db = req.db;
    const { PlayerScore, WristbandTran, GamesVariant, Player } = db;

    try {
      const { players } = req.body;
      const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

      if (!locationId)
        return res.status(400).json({ message: "Location ID not provided" });
      if (!Array.isArray(players) || !players.length)
        return res.status(400).json({ message: "Invalid players array" });

      const createdScores = await Promise.all(
        players.map(async (player) => {
          const tran = await WristbandTran.findOne({
            where: {
              wristbandCode: player.wristbandCode,
              wristbandStatusFlag: "R",
            },
            include: [
              {
                model: Player,
                as: "player",
                where: { LocationID: locationId },
              },
            ],
            order: [["WristbandTranDate", "DESC"]],
          });

          if (!tran || !tran.PlayerID) return null;

          const variant = await GamesVariant.findOne({
            where: { name: player.GamesVariantCode },
          });
          if (!variant)
            throw new Error(
              `Invalid GamesVariantCode: ${player.GamesVariantCode}`
            );

          const newScore = await PlayerScore.create({
            PlayerID: tran.PlayerID,
            GameID: variant.GameId,
            GamesVariantId: variant.ID,
            WristbandTranID: tran.WristbandTranID,
            LevelPlayed: player.LevelPlayed,
            Points: player.Points,
            StartTime: new Date(player.playerStartTime),
            EndTime: new Date(player.playerEndTime),
          });

          return newScore;
        })
      );

      res.status(201).json(createdScores.filter(Boolean));
    } catch (err) {
      logger.error("Error in addPlayerScores:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Top All-Time (location-scoped through Player)
  // ---------------------------------------------------------------------
  getTopAllTime: async (req, res) => {
    const db = req.db;
    const limit = parseInt(req.query.limit, 10) || 5;
    const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

    if (!locationId)
      return res.status(400).json({ message: "Location ID not provided" });

    try {
      const results = await db.sequelize.query(
        `
        SELECT TOP (:limit)
            t.PlayerID,
            SUM(t.TopPoints) AS TotalTopPoints,
            MAX(t.StartTime) AS LastPlayed,
            p.FirstName, p.LastName
        FROM (
            SELECT ps.PlayerID, ps.GamesVariantId, MAX(ps.Points) AS TopPoints, MAX(ps.StartTime) AS StartTime
            FROM PlayerScores ps
            JOIN Players p2 ON ps.PlayerID = p2.PlayerID
            WHERE ps.Points > 0 AND p2.LocationID = :locationId
            GROUP BY ps.PlayerID, ps.GamesVariantId
        ) t
        JOIN Players p ON t.PlayerID = p.PlayerID
        GROUP BY t.PlayerID, p.FirstName, p.LastName
        ORDER BY TotalTopPoints DESC
      `,
        {
          replacements: { limit, locationId },
          type: db.Sequelize.QueryTypes.SELECT,
        }
      );

      res.status(200).json(results);
    } catch (err) {
      logger.error("Error fetching top all-time scores:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // ---------------------------------------------------------------------
  // Top Recent (location-scoped through Player)
  // ---------------------------------------------------------------------
  getTopRecent: async (req, res) => {
    const db = req.db;
    const days = parseInt(req.query.days, 10) || 30;
    const limit = parseInt(req.query.limit, 10) || 5;
    const locationId = req.locationScope?.LocationID ?? req.auth?.locationId;

    if (!locationId)
      return res.status(400).json({ message: "Location ID not provided" });

    try {
      const query = `
        SELECT TOP ${limit}
            t.PlayerID,
            SUM(t.TopPoints) AS TotalTopPoints,
            MAX(t.StartTime) AS LastPlayed,
            p.FirstName,
            p.LastName
        FROM (
            SELECT ps.PlayerID,
                   ps.GamesVariantId,
                   MAX(ps.Points) AS TopPoints,
                   MAX(ps.StartTime) AS StartTime
            FROM PlayerScores ps
            JOIN Players p2 ON ps.PlayerID = p2.PlayerID
            WHERE ps.Points > 0
              AND p2.LocationID = :locationId
              AND ps.StartTime > DATEADD(DAY, -${days}, GETDATE())
            GROUP BY ps.PlayerID, ps.GamesVariantId
        ) t
        JOIN Players p ON t.PlayerID = p.PlayerID
        GROUP BY t.PlayerID, p.FirstName, p.LastName
        ORDER BY TotalTopPoints DESC;
      `;

      const results = await db.sequelize.query(query, {
        replacements: { locationId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      res.status(200).json(results);
    } catch (err) {
      logger.error("Error fetching recent top scores:", err);
      res.status(500).json({ message: err.message });
    }
  },
};
