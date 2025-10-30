// controllers/stats.controller.js
const dayjs = require("dayjs");

// Toronto display convenience (you already had this idea)
const TZ_OFFSET_HOURS = -4;

// ----- Toronto-day helpers -----
function getTorontoDayUtcBounds(dateLike) {
  const torontoNow = dateLike
    ? new Date(
        new Date(dateLike).toLocaleString("en-US", {
          timeZone: "America/Toronto",
        })
      )
    : new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Toronto" })
      );

  const y = torontoNow.getFullYear();
  const m = torontoNow.getMonth();
  const d = torontoNow.getDate();

  const startLocal = new Date(y, m, d, 0, 0, 0);
  const endLocal = new Date(y, m, d + 1, 0, 0, 0);

  return {
    startUtcISO: startLocal.toISOString(),
    endUtcISO: endLocal.toISOString(),
  };
}

const clampInt = (v, min, max, fallback) => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

function getUtcBoundsFromQuery(q) {
  const { date, startDate, endDate, startUtc, endUtc } = q || {};

  // 1) Explicit UTC bounds win
  if (startUtc && endUtc) {
    return {
      startUtcISO: new Date(startUtc).toISOString(),
      endUtcISO: new Date(endUtc).toISOString(),
    };
  }

  // 2) Range of Toronto local dates (YYYY-MM-DD)
  if (startDate && endDate) {
    const { startUtcISO: s } = getTorontoDayUtcBounds(startDate);
    const { endUtcISO: e } = getTorontoDayUtcBounds(endDate);
    return { startUtcISO: s, endUtcISO: e };
  }

  // 3) Single Toronto day (or today)
  const { startUtcISO, endUtcISO } = getTorontoDayUtcBounds(date);
  return { startUtcISO, endUtcISO };
}

// ----- location scoping helpers (raw SQL) -----
// For queries over PlayerScores as "ps"
function scoresScopeSql(req) {
  const isAdmin = req?.ctx?.role === "admin";
  const locId = req?.ctx?.locationId;
  if (isAdmin || !locId) {
    return { join: "", whereAnd: "", repl: {} };
  }
  // Force INNER JOIN players and filter by LocationID
  return {
    join: " JOIN Players p ON p.PlayerID = ps.PlayerID ",
    whereAnd: " AND p.LocationID = :locId ",
    repl: { locId: String(locId) },
  };
}

// For queries over WristbandTrans as "wt"
function wristScopeSql(req) {
  const isAdmin = req?.ctx?.role === "admin";
  const locId = req?.ctx?.locationId;
  if (isAdmin || !locId) {
    return { join: "", whereAnd: "", repl: {} };
  }
  return {
    join: " JOIN Players p ON p.PlayerID = wt.PlayerID ",
    whereAnd: " AND p.LocationID = :locId ",
    repl: { locId: String(locId) },
  };
}

// ----- ORM-scoped include (for PlayerScore ORM paths) -----
function playerIncludeIfScoped(req) {
  const isAdmin = req?.ctx?.role === "admin";
  const locId = req?.ctx?.locationId;
  if (isAdmin || !locId) return null;
  return {
    model: req.db.Player,
    as: "player",
    attributes: [], // not needed, just scoping
    where: { LocationID: String(locId) },
    required: true,
  };
}

// ======================================================================
// Controller
// ======================================================================
module.exports = {
  // Replaces getHighestScores (scoped)
  getHighestScores: async (req, res) => {
    const { PlayerScore, Sequelize } = req.db;
    try {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOf90 = new Date(now);
      startOf90.setDate(startOf90.getDate() - 90);
      const startOf360 = new Date(now);
      startOf360.setDate(startOf360.getDate() - 360);

      const playerInclude = playerIncludeIfScoped(req);

      const [highestToday, highest90, highest360] = await Promise.all([
        PlayerScore.findOne({
          where: { StartTime: { [Sequelize.Op.gte]: startOfToday } },
          order: [["Points", "DESC"]],
          attributes: [
            "Points",
            "PlayerID",
            "GameID",
            "GamesVariantId",
            "StartTime",
          ],
          include: playerInclude ? [playerInclude] : [],
        }),
        PlayerScore.findOne({
          where: { StartTime: { [Sequelize.Op.gte]: startOf90 } },
          order: [["Points", "DESC"]],
          attributes: [
            "Points",
            "PlayerID",
            "GameID",
            "GamesVariantId",
            "StartTime",
          ],
          include: playerInclude ? [playerInclude] : [],
        }),
        PlayerScore.findOne({
          where: { StartTime: { [Sequelize.Op.gte]: startOf360 } },
          order: [["Points", "DESC"]],
          attributes: [
            "Points",
            "PlayerID",
            "GameID",
            "GamesVariantId",
            "StartTime",
          ],
          include: playerInclude ? [playerInclude] : [],
        }),
      ]);

      res.status(200).send({
        highestToday: highestToday ? highestToday.Points : null,
        highest90Days: highest90 ? highest90.Points : null,
        highest360Days: highest360 ? highest360.Points : null,
      });
    } catch (err) {
      console.error("Error fetching highest scores:", err);
      res.status(500).send({ message: err.message });
    }
  },

  // Big dashboard bundle (scoped)
  getGameStats: async (req, res) => {
    const { sequelize } = req.db;
    try {
      // Toronto day range
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Toronto" })
      );
      const y = now.getFullYear(),
        m = now.getMonth(),
        d = now.getDate();
      const startOfTodayToronto = new Date(y, m, d, 0, 0, 0);
      const startOfTomorrowToronto = new Date(y, m, d + 1, 0, 0, 0);
      const startUtc = startOfTodayToronto.toISOString();
      const endUtc = startOfTomorrowToronto.toISOString();

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 30);

      // location-scoped SQL fragments
      const S = scoresScopeSql(req);
      const W = wristScopeSql(req);

      const replacements = {
        startUtc,
        endUtc,
        startDate: past30.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
        startOfWeek: startOfWeek.toISOString().split("T")[0],
        startOfMonth: startOfMonth.toISOString().split("T")[0],
        ...S.repl,
        ...W.repl,
      };

      const [
        dailyPlays,
        hourlyTodayPlays,
        topVariants,
        todayPlays,
        weekPlays,
        monthPlays,
        popularToday,
        topVariantsToday,
        playersInFacilityToday,
        playersInFacilityNow,
      ] = await Promise.all([
        sequelize.query(
          `
            SELECT CONVERT(DATE, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime)) AS date, COUNT(*) AS totalPlays
            FROM PlayerScores ps
            ${S.join}
            WHERE ps.StartTime >= :startDate AND ps.StartTime < DATEADD(DAY, 1, :endDate)
            ${S.whereAnd}
            GROUP BY CONVERT(DATE, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime))
            ORDER BY date ASC
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT DATEPART(HOUR, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime)) AS hour, COUNT(*) AS totalPlays
            FROM PlayerScores ps
            ${S.join}
            WHERE ps.StartTime >= :startUtc AND ps.StartTime < :endUtc
            ${S.whereAnd}
            GROUP BY DATEPART(HOUR, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime))
            ORDER BY hour ASC
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT TOP 5 gv.name, COUNT(*) AS plays
            FROM PlayerScores ps
            ${S.join}
            JOIN GamesVariants gv ON ps.GamesVariantId = gv.id
            WHERE ps.StartTime >= :startDate AND ps.StartTime < DATEADD(DAY, 1, :endDate)
            ${S.whereAnd}
            GROUP BY gv.name
            ORDER BY plays DESC
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT COUNT(*) AS count
            FROM PlayerScores ps
            ${S.join}
            WHERE ps.StartTime >= :startUtc AND ps.StartTime < :endUtc
            ${S.whereAnd}
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT COUNT(*) AS count
            FROM PlayerScores ps
            ${S.join}
            WHERE ps.StartTime >= :startOfWeek
            ${S.whereAnd}
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT COUNT(*) AS count
            FROM PlayerScores ps
            ${S.join}
            WHERE ps.StartTime >= :startOfMonth
            ${S.whereAnd}
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT TOP 1 gv.name, COUNT(*) AS plays
            FROM PlayerScores ps
            ${S.join}
            JOIN GamesVariants gv ON ps.GamesVariantId = gv.id
            WHERE ps.StartTime >= :startUtc AND ps.StartTime < :endUtc
            ${S.whereAnd}
            GROUP BY gv.name
            ORDER BY plays DESC
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT gv.name, COUNT(ps.ScoreID) AS plays
            FROM GamesVariants gv
            LEFT JOIN PlayerScores ps
              ON ps.GamesVariantId = gv.id
             AND ps.StartTime >= :startUtc AND ps.StartTime < :endUtc
            ${S.join.replace(
              "JOIN Players p ON p.PlayerID = ps.PlayerID",
              "JOIN Players p ON p.PlayerID = ps.PlayerID"
            )} -- keep same filter path
            ${S.whereAnd}
            GROUP BY gv.name
            ORDER BY plays DESC
            `,
          { replacements, type: sequelize.QueryTypes.SELECT }
        ),

        sequelize.query(
          `
            SELECT COUNT(DISTINCT wt.PlayerID) AS count
            FROM WristbandTrans wt
            ${W.join}
            WHERE
              wt.PlayerID IS NOT NULL
              AND wt.playerStartTime IS NOT NULL
              AND wt.playerEndTime   IS NOT NULL
              AND wt.playerStartTime >= CAST(:startUtc AS DATE)
              AND wt.playerEndTime   <  DATEADD(DAY, 1, CAST(:startUtc AS DATE))
              AND DATEDIFF(DAY, wt.playerStartTime, wt.playerEndTime) <= 10
              AND DATEDIFF(MINUTE, wt.playerStartTime, wt.playerEndTime) BETWEEN 1 AND 300
            ${W.whereAnd}
            `,
          {
            replacements: { startUtc, ...W.repl },
            type: sequelize.QueryTypes.SELECT,
          }
        ),

        sequelize.query(
          `
            SELECT COUNT(DISTINCT wt.PlayerID) AS count
            FROM WristbandTrans wt
            ${W.join}
            WHERE
              wt.PlayerID IS NOT NULL
              AND wt.playerStartTime IS NOT NULL
              AND wt.playerEndTime   IS NOT NULL
              AND wt.wristbandStatusFlag = 'R'
              AND wt.playerStartTime <= GETUTCDATE()
              AND wt.playerEndTime   >= GETUTCDATE()
              AND DATEDIFF(MINUTE, wt.playerStartTime, wt.playerEndTime) BETWEEN 1 AND 300
            ${W.whereAnd}
            `,
          { replacements: { ...W.repl }, type: sequelize.QueryTypes.SELECT }
        ),
      ]);

      res.json({
        dailyPlays,
        hourlyTodayPlays,
        topVariants,
        todayPlays: todayPlays[0]?.count || 0,
        weekPlays: weekPlays[0]?.count || 0,
        monthPlays: monthPlays[0]?.count || 0,
        mostPopularToday: popularToday[0] || null,
        topVariantsToday,
        playersInFacilityToday: playersInFacilityToday[0]?.count || 0,
        playersInFacilityNow: playersInFacilityNow[0]?.count || 0,
      });
    } catch (error) {
      console.error("Raw SQL stats error:", error);
      res
        .status(500)
        .json({
          error: "Failed to generate stats",
          detail: error.message || "",
        });
    }
  },

  getHourlyPlaysForDay: async (req, res) => {
    const { sequelize } = req.db;
    try {
      const { date } = req.query; // YYYY-MM-DD (Toronto)
      const { startUtcISO, endUtcISO } = getTorontoDayUtcBounds(date);
      const S = scoresScopeSql(req);

      const rows = await sequelize.query(
        `
        SELECT DATEPART(HOUR, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime)) AS hour, COUNT(*) AS totalPlays
        FROM PlayerScores ps
        ${S.join}
        WHERE ps.StartTime >= :startUtc AND ps.StartTime < :endUtc
        ${S.whereAnd}
        GROUP BY DATEPART(HOUR, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime))
        ORDER BY hour ASC
        `,
        {
          replacements: { startUtc: startUtcISO, endUtc: endUtcISO, ...S.repl },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.json({ date: date || "today", hourly: rows });
    } catch (e) {
      console.error("getHourlyPlaysForDay error:", e);
      res.status(500).json({ error: "Failed to fetch hourly plays" });
    }
  },

  getTopVariants: async (req, res) => {
    const { sequelize } = req.db;
    try {
      const days = clampInt(req.query.days, 1, 360, 30);
      const limit = clampInt(req.query.limit, 1, 50, 10);
      const endParam = req.query.end;

      const { startUtcISO: endUtcISO } = getTorontoDayUtcBounds(endParam);
      const startUtcISO = new Date(
        new Date(endUtcISO).getTime() - (days - 1) * 24 * 3600 * 1000
      ).toISOString();

      const S = scoresScopeSql(req);

      const rows = await sequelize.query(
        `
        SELECT TOP (:limit) gv.name, COUNT(*) AS plays
        FROM PlayerScores ps
        ${S.join}
        JOIN GamesVariants gv ON ps.GamesVariantId = gv.id
        WHERE ps.StartTime >= :startUtc AND ps.StartTime < DATEADD(DAY, 1, :endUtc)
        ${S.whereAnd}
        GROUP BY gv.name
        ORDER BY plays DESC
        `,
        {
          replacements: {
            startUtc: startUtcISO,
            endUtc: endUtcISO,
            limit,
            ...S.repl,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.json({ days, end: endParam || "today", top: rows });
    } catch (e) {
      console.error("getTopVariants error:", e);
      res.status(500).json({ error: "Failed to fetch top variants" });
    }
  },

  getGameShareForDay: async (req, res) => {
    const { sequelize } = req.db;
    try {
      const { startUtcISO, endUtcISO } = getUtcBoundsFromQuery(req.query);
      const S = scoresScopeSql(req);

      // We need game list + scoped scores
      // LEFT JOIN scores (scoped) to include zero rows games
      const rows = await sequelize.query(
        `
        SELECT
          g.gameName AS name,
          COUNT(ps.ScoreID) AS plays
        FROM Games g
        LEFT JOIN PlayerScores ps
          ON ps.GameID = g.GameID
         AND ps.StartTime >= :startUtc
         AND ps.StartTime <  :endUtc
        ${S.join.replace(
          "JOIN Players p ON p.PlayerID = ps.PlayerID",
          "JOIN Players p ON p.PlayerID = ps.PlayerID"
        )}
        ${S.whereAnd}
        GROUP BY g.gameName
        ORDER BY plays DESC
        `,
        {
          replacements: { startUtc: startUtcISO, endUtc: endUtcISO, ...S.repl },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.json({ startUtc: startUtcISO, endUtc: endUtcISO, share: rows });
    } catch (e) {
      console.error("getGameShareForDay error:", e);
      res.status(500).json({ error: "Failed to fetch game share" });
    }
  },

  getWeekdayHourHeatmap: async (req, res) => {
    const { sequelize } = req.db;
    try {
      const weeks = clampInt(req.query.weeks, 1, 52, 12);
      const nowBounds = getTorontoDayUtcBounds();
      const endUtcISO = nowBounds.startUtcISO;
      const startUtcISO = new Date(
        new Date(endUtcISO).getTime() - (weeks * 7 - 1) * 24 * 3600 * 1000
      ).toISOString();

      const S = scoresScopeSql(req);

      const rows = await sequelize.query(
        `
        SELECT
          DATEPART(WEEKDAY, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime)) AS weekday, -- 1=Sun..7=Sat
          DATEPART(HOUR,    DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime)) AS hour,
          COUNT(*) AS total
        FROM PlayerScores ps
        ${S.join}
        WHERE ps.StartTime >= :startUtc AND ps.StartTime < DATEADD(DAY, 1, :endUtc)
        ${S.whereAnd}
        GROUP BY
          DATEPART(WEEKDAY, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime)),
          DATEPART(HOUR,    DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime))
        ORDER BY weekday, hour
        `,
        {
          replacements: { startUtc: startUtcISO, endUtc: endUtcISO, ...S.repl },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.json({ weeks, matrix: rows });
    } catch (e) {
      console.error("getWeekdayHourHeatmap error:", e);
      res.status(500).json({ error: "Failed to fetch heatmap" });
    }
  },

  getGameLengthAverages: async (req, res) => {
    const { sequelize } = req.db;
    try {
      const { startUtcISO, endUtcISO } = getUtcBoundsFromQuery(req.query);
      const minSeconds = clampInt(req.query.minSeconds, 0, 36000, 5);
      const maxSeconds = clampInt(req.query.maxSeconds, 1, 36000, 3600);

      const S = scoresScopeSql(req);
      const replacements = {
        startUtc: startUtcISO,
        endUtc: endUtcISO,
        minSeconds,
        maxSeconds,
        ...S.repl,
      };

      const overall = await sequelize.query(
        `
        SELECT
          AVG(CAST(DATEDIFF(SECOND, ps.StartTime, ps.EndTime) AS FLOAT)) AS avgSeconds,
          COUNT(*) AS plays
        FROM PlayerScores ps
        ${S.join}
        WHERE
          ps.EndTime IS NOT NULL
          AND ps.EndTime > ps.StartTime
          AND ps.StartTime >= :startUtc
          AND ps.StartTime <  :endUtc
          AND DATEDIFF(SECOND, ps.StartTime, ps.EndTime) BETWEEN :minSeconds AND :maxSeconds
        ${S.whereAnd}
        `,
        { replacements, type: sequelize.QueryTypes.SELECT }
      );

      const byGame = await sequelize.query(
        `
        SELECT
          ps.GameID,
          COALESCE(g.gameName, CONCAT('Game ', ps.GameID)) AS gameName,
          AVG(CAST(DATEDIFF(SECOND, ps.StartTime, ps.EndTime) AS FLOAT)) AS avgSeconds,
          COUNT(*) AS plays
        FROM PlayerScores ps
        ${S.join}
        LEFT JOIN Games g ON g.GameID = ps.GameID
        WHERE
          ps.EndTime IS NOT NULL
          AND ps.EndTime > ps.StartTime
          AND ps.StartTime >= :startUtc
          AND ps.StartTime <  :endUtc
          AND DATEDIFF(SECOND, ps.StartTime, ps.EndTime) BETWEEN :minSeconds AND :maxSeconds
        ${S.whereAnd}
        GROUP BY ps.GameID, g.gameName
        ORDER BY avgSeconds DESC
        `,
        { replacements, type: sequelize.QueryTypes.SELECT }
      );

      const byVariant = await sequelize.query(
        `
        SELECT
          gv.id AS gamesVariantId,
          gv.name AS variantName,
          AVG(CAST(DATEDIFF(SECOND, ps.StartTime, ps.EndTime) AS FLOAT)) AS avgSeconds,
          COUNT(*) AS plays
        FROM PlayerScores ps
        ${S.join}
        JOIN GamesVariants gv ON gv.id = ps.GamesVariantId
        WHERE
          ps.EndTime IS NOT NULL
          AND ps.EndTime > ps.StartTime
          AND ps.StartTime >= :startUtc
          AND ps.StartTime <  :endUtc
          AND DATEDIFF(SECOND, ps.StartTime, ps.EndTime) BETWEEN :minSeconds AND :maxSeconds
        ${S.whereAnd}
        GROUP BY gv.id, gv.name
        ORDER BY avgSeconds DESC
        `,
        { replacements, type: sequelize.QueryTypes.SELECT }
      );

      const overallAvgSeconds =
        overall[0]?.avgSeconds != null ? Number(overall[0].avgSeconds) : null;
      const overallPlays =
        overall[0]?.plays != null ? Number(overall[0].plays) : 0;

      const mapWithMinutes = (rows) =>
        rows.map((r) => ({
          ...r,
          avgSeconds: r.avgSeconds !== null ? Number(r.avgSeconds) : null,
          avgMinutes: r.avgSeconds !== null ? Number(r.avgSeconds) / 60 : null,
          plays: Number(r.plays),
        }));

      res.json({
        startUtc: startUtcISO,
        endUtc: endUtcISO,
        minSeconds,
        maxSeconds,
        overall: {
          avgSeconds: overallAvgSeconds,
          avgMinutes: overallAvgSeconds != null ? overallAvgSeconds / 60 : null,
          plays: overallPlays,
        },
        byGame: mapWithMinutes(byGame),
        byVariant: mapWithMinutes(byVariant),
      });
    } catch (e) {
      console.error("getGameLengthAverages error:", e);
      res.status(500).json({ error: "Failed to fetch game length averages" });
    }
  },

  getDailyPlays: async (req, res) => {
    const { sequelize } = req.db;
    try {
      const days = clampInt(req.query.days, 1, 360, 30);
      const endParm = req.query.end;

      const { startUtcISO: endUtcISO } = getTorontoDayUtcBounds(endParm);
      const startUtcISO = new Date(
        new Date(endUtcISO).getTime() - (days - 1) * 24 * 3600 * 1000
      ).toISOString();

      const S = scoresScopeSql(req);

      const rows = await sequelize.query(
        `
        SELECT
          CONVERT(DATE, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime)) AS date,
          COUNT(*) AS plays
        FROM PlayerScores ps
        ${S.join}
        WHERE ps.StartTime >= :startUtc
          AND ps.StartTime <  :endUtc
        ${S.whereAnd}
        GROUP BY CONVERT(DATE, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, ps.StartTime))
        ORDER BY date ASC
        `,
        {
          replacements: { startUtc: startUtcISO, endUtc: endUtcISO, ...S.repl },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.json({ days, end: endParm || "today", plays: rows });
    } catch (e) {
      console.error("getDailyPlays error:", e);
      res.status(500).json({ error: "Failed to fetch daily plays" });
    }
  },

  // Variant-focused analytics (ORM + scoped include)
  getGameVariantAnalytics: async (req, res) => {
    const { PlayerScore, Player, sequelize, Sequelize } = req.db;
    try {
      const variantID = Number.parseInt(req.params.variantId, 10);
      if (!Number.isFinite(variantID)) {
        return res
          .status(400)
          .json({ error: "variantId is required and must be a number" });
      }

      const todayStart = dayjs().startOf("day").toDate();
      const sevenDaysAgo = dayjs().subtract(6, "day").startOf("day").toDate();

      const variantWhere = { GamesVariantId: variantID };
      const playerInclude = playerIncludeIfScoped(req);

      // Basic aggregates (scoped)
      const [
        todayPlays,
        last7DaysPlays,
        totalPlaysAllTime,
        totalUniquePlayers,
      ] = await Promise.all([
        PlayerScore.count({
          where: {
            ...variantWhere,
            createdAt: { [Sequelize.Op.gte]: todayStart },
          },
          include: playerInclude ? [playerInclude] : [],
        }),
        PlayerScore.count({
          where: {
            ...variantWhere,
            createdAt: { [Sequelize.Op.gte]: sevenDaysAgo },
          },
          include: playerInclude ? [playerInclude] : [],
        }),
        PlayerScore.count({
          where: { ...variantWhere },
          include: playerInclude ? [playerInclude] : [],
        }),
        PlayerScore.count({
          where: { ...variantWhere },
          distinct: true,
          col: "PlayerID",
          include: playerInclude ? [playerInclude] : [],
        }),
      ]);

      // Averages (raw, scoped by players)
      let avgDurationSeconds = 0;
      let avgLevelReached = 0;
      try {
        const S = scoresScopeSql(req);
        const [row] = await sequelize.query(
          `
          SELECT
            AVG(CAST(DATEDIFF(MINUTE, ps.StartTime, ps.EndTime) AS FLOAT)) * 60 AS avgDuration,
            AVG(TRY_CONVERT(FLOAT, NULLIF(ps.LevelPlayed, '')))            AS avgLevel
          FROM PlayerScores ps
          ${S.join}
          WHERE ps.GamesVariantId = :variantID
            AND ps.StartTime IS NOT NULL
            AND ps.EndTime   IS NOT NULL
            AND ps.EndTime   > ps.StartTime
            AND DATEDIFF(MINUTE, ps.StartTime, ps.EndTime) BETWEEN 1 AND 600
          ${S.whereAnd}
          `,
          {
            replacements: { variantID, ...S.repl },
            type: sequelize.QueryTypes.SELECT,
          }
        );
        avgDurationSeconds = Number(row?.avgDuration ?? 0) || 0;
        avgLevelReached = Number(row?.avgLevel ?? 0) || 0;
      } catch (e) {
        console.warn("Averages (raw) query failed:", e?.message);
      }

      // Plays per day (last 7 days) — ORM, scoped
      let playsPerDay = [];
      try {
        const dateExpr = sequelize.literal(
          "CONVERT(date, [PlayerScore].[createdAt])"
        );
        const playsPerDayRaw = await PlayerScore.findAll({
          attributes: [
            [dateExpr, "date"],
            [sequelize.literal("COUNT(*)"), "count"],
          ],
          where: {
            ...variantWhere,
            createdAt: { [Sequelize.Op.gte]: sevenDaysAgo },
          },
          group: [dateExpr],
          order: [[dateExpr, "ASC"]],
          raw: true,
          include: playerInclude ? [playerInclude] : [],
        });

        const countsByDate = Object.fromEntries(
          playsPerDayRaw.map((r) => [
            dayjs(r.date).format("YYYY-MM-DD"),
            parseInt(r.count, 10) || 0,
          ])
        );

        playsPerDay = Array.from({ length: 7 }, (_, i) => {
          const d = dayjs()
            .subtract(6 - i, "day")
            .format("YYYY-MM-DD");
          return { date: d, count: countsByDate[d] ?? 0 };
        });
      } catch (e) {
        console.warn("playsPerDay query failed:", e?.message);
        playsPerDay = Array.from({ length: 7 }, (_, i) => ({
          date: dayjs()
            .subtract(6 - i, "day")
            .format("YYYY-MM-DD"),
          count: 0,
        }));
      }

      // Recent 10 (scoped)
      let topRecentScoresRaw;
      try {
        topRecentScoresRaw = await PlayerScore.findAll({
          where: variantWhere,
          include: [
            {
              model: Player,
              as: "player",
              attributes: ["FirstName", "LastName"],
            },
            ...(playerInclude ? [playerInclude] : []),
          ],
          order: [["createdAt", "DESC"]],
          limit: 10,
        });
      } catch (e) {
        console.warn("Include failed, fallback without include:", e?.message);
        topRecentScoresRaw = await PlayerScore.findAll({
          where: variantWhere,
          order: [["createdAt", "DESC"]],
          limit: 10,
          raw: true,
        });
        // manual join to players + scope
        const ids = [
          ...new Set(topRecentScoresRaw.map((s) => s.PlayerID).filter(Boolean)),
        ];
        const wherePlayers = { PlayerID: { [Sequelize.Op.in]: ids } };
        if (playerInclude)
          wherePlayers.LocationID = playerInclude.where.LocationID;

        const players = await Player.findAll({
          where: wherePlayers,
          attributes: ["PlayerID", "FirstName", "LastName"],
          raw: true,
        });
        const byId = Object.fromEntries(players.map((p) => [p.PlayerID, p]));
        topRecentScoresRaw = topRecentScoresRaw.map((s) => ({
          ...s,
          player: byId[s.PlayerID] || null,
        }));
      }

      const topRecentScores = topRecentScoresRaw.map((score) => {
        const p = score.player ?? score.Player ?? null;
        const durationSeconds =
          score.Duration ??
          (score.StartTime && score.EndTime
            ? Math.max(
                0,
                Math.round(
                  (new Date(score.EndTime) - new Date(score.StartTime)) / 1000
                )
              )
            : null);
        return {
          playerName: `${p?.FirstName || "—"} ${p?.LastName || ""}`.trim(),
          points: score.Points ?? null,
          date: score.createdAt ?? score.StartTime ?? null,
          level: score.Level ?? score.LevelPlayed ?? null,
          durationSeconds,
        };
      });

      const avgPlaysPerDay = last7DaysPlays / 7;

      res.json({
        todayPlays,
        last7DaysPlays,
        avgPlaysPerDay,
        avgDurationSeconds,
        avgLevelReached,
        totalUniquePlayers,
        totalPlaysAllTime,
        playsPerDay,
        topRecentScores,
      });
    } catch (err) {
      console.error(
        "Error in getGameVariantAnalytics:",
        err?.message,
        err?.stack
      );
      res.status(500).json({ error: "Failed to load analytics" });
    }
  },
};
