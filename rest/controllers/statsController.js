const logger = require('../utils/logger');
const dayjs = require("dayjs");
const { sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { PlayerScore, GamesVariant, Player } = require('../models');
const { QueryTypes } = require('sequelize');

const TZ_OFFSET_HOURS = -4;

function getTorontoDayUtcBounds(dateLike) {
  const torontoNow = dateLike
    ? new Date(new Date(dateLike).toLocaleString('en-US', { timeZone: 'America/Toronto' }))
    : new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));

  const y = torontoNow.getFullYear();
  const m = torontoNow.getMonth();
  const d = torontoNow.getDate();
  const startLocal = new Date(y, m, d, 0, 0, 0);
  const endLocal   = new Date(y, m, d + 1, 0, 0, 0);

  return { startUtcISO: startLocal.toISOString(), endUtcISO: endLocal.toISOString() };
}

const clampInt = (v, min, max, fallback) => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const getHighestScore = async (startDate) => {
  const formattedStartDate = new Date(startDate);

  const highestScore = await PlayerScore.findOne({
    where: {
      StartTime: {
        [Op.gte]: formattedStartDate
      }
    },
    order: [['Points', 'DESC']],
    attributes: ['Points', 'PlayerID', 'GameID', 'GamesVariantId', 'StartTime'],
  });

  return highestScore;
};

function getUtcBoundsFromQuery(q) {
  const { date, startDate, endDate, startUtc, endUtc } = q || {};

  // 1) If explicit UTC bounds are provided, trust them.
  if (startUtc && endUtc) {
    return { startUtcISO: new Date(startUtc).toISOString(), endUtcISO: new Date(endUtc).toISOString() };
  }

  // 2) If Toronto local start/end dates are provided (YYYY-MM-DD),
  //    cover the whole closed-open range [start, end+1day).
  if (startDate && endDate) {
    const { startUtcISO: s } = getTorontoDayUtcBounds(startDate);
    const { endUtcISO: e }   = getTorontoDayUtcBounds(endDate); // end-of-day for 'endDate'
    return { startUtcISO: s, endUtcISO: e };
  }

  // 3) Legacy single-day param (or default to today in Toronto)
  const { startUtcISO, endUtcISO } = getTorontoDayUtcBounds(date);
  return { startUtcISO, endUtcISO };
}

exports.getHighestScores = async (req, res) => {
  try {
    // Get the current date
    const today = new Date();

    // Calculate dates for today and 90 days ago
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const startOf90DaysAgo = new Date(today);
    startOf90DaysAgo.setDate(startOf90DaysAgo.getDate() - 90);

    const startOf360DaysAgo = new Date(today);
    startOf360DaysAgo.setDate(startOf360DaysAgo.getDate() - 360);

    // Fetch highest scores
    const highestToday = await getHighestScore(startOfToday);
    const highest90Days = await getHighestScore(startOf90DaysAgo);
    const highest360Days = await getHighestScore(startOf360DaysAgo);

    res.status(200).send({
      highestToday: highestToday ? highestToday.Points : null,
      highest90Days: highest90Days ? highest90Days.Points : null,
      highest360Days: highest360Days ? highest360Days.Points : null,
    });
  } catch (err) {
    console.error('Error fetching highest scores:', err);
    res.status(500).send({ message: err.message });
  }
};

exports.getGameStats = async (req, res) => {
  try {
    // Current time in Toronto timezone
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Toronto" }));
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    // Start of today and tomorrow in Toronto time (local)
    const startOfTodayToronto = new Date(year, month, day, 0, 0, 0);
    const startOfTomorrowToronto = new Date(year, month, day + 1, 0, 0, 0);

    // Convert to UTC ISO strings for querying UTC timestamps
    const startUtc = startOfTodayToronto.toISOString();
    const endUtc = startOfTomorrowToronto.toISOString();

    // For week/month/past30, still using date strings but could improve similarly if needed
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const past30 = new Date(now);
    past30.setDate(now.getDate() - 30);

    const replacements = {
      now,
      startUtc,
      endUtc,
      startDate: past30.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      startOfWeek: startOfWeek.toISOString().split('T')[0],
      startOfMonth: startOfMonth.toISOString().split('T')[0]
    };

    const dailyPlays = await sequelize.query(
      `SELECT CONVERT(DATE, DATEADD(HOUR, -4, StartTime)) AS date, COUNT(*) AS totalPlays
       FROM PlayerScores
       WHERE StartTime >= :startDate AND StartTime < DATEADD(DAY, 1, :endDate)
       GROUP BY CONVERT(DATE, DATEADD(HOUR, -4, StartTime))
       ORDER BY date ASC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const hourlyTodayPlays = await sequelize.query(
      `SELECT DATEPART(HOUR, DATEADD(HOUR, -4, StartTime)) AS hour, COUNT(*) AS totalPlays
       FROM PlayerScores
       WHERE StartTime >= :startUtc AND StartTime < :endUtc
       GROUP BY DATEPART(HOUR, DATEADD(HOUR, -4, StartTime))
       ORDER BY hour ASC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const topVariants = await sequelize.query(
      `SELECT TOP 5 gv.name, COUNT(*) AS plays
       FROM PlayerScores ps
       JOIN GamesVariants gv ON ps.GamesVariantId = gv.id
       WHERE ps.StartTime >= :startDate AND ps.StartTime < DATEADD(DAY, 1, :endDate)
       GROUP BY gv.name
       ORDER BY plays DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const todayPlays = await sequelize.query(
      `SELECT COUNT(*) AS count FROM PlayerScores WHERE StartTime >= :startUtc AND StartTime < :endUtc`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const weekPlays = await sequelize.query(
      `SELECT COUNT(*) AS count FROM PlayerScores WHERE StartTime >= :startOfWeek`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const monthPlays = await sequelize.query(
      `SELECT COUNT(*) AS count FROM PlayerScores WHERE StartTime >= :startOfMonth`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const popularToday = await sequelize.query(
      `SELECT TOP 1 gv.name, COUNT(*) AS plays
       FROM PlayerScores ps
       JOIN GamesVariants gv ON ps.GamesVariantId = gv.id
       WHERE ps.StartTime >= :startUtc AND ps.StartTime < :endUtc
       GROUP BY gv.name
       ORDER BY plays DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const topVariantsToday = await sequelize.query(
      `SELECT gv.name, COUNT(ps.ScoreID) AS plays
       FROM GamesVariants gv
       LEFT JOIN PlayerScores ps 
         ON ps.GamesVariantId = gv.id 
         AND ps.StartTime >= :startUtc AND ps.StartTime < :endUtc
       GROUP BY gv.name
       ORDER BY plays DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const playersInFacilityToday = await sequelize.query(
      `
      SELECT COUNT(DISTINCT PlayerID) AS count
      FROM WristbandTrans
      WHERE
        PlayerID          IS NOT NULL
        AND playerStartTime IS NOT NULL
        AND playerEndTime   IS NOT NULL

        -- only sessions that start on or after UTC‐midnight today
        AND playerStartTime >= CAST(:startUtc AS DATE)
        -- and end strictly before UTC‐midnight tomorrow
        AND playerEndTime   <  DATEADD(DAY, 1, CAST(:startUtc AS DATE))

        -- drop “master” bands lasting more than 10 days
        AND DATEDIFF(DAY, playerStartTime, playerEndTime) <= 10

        -- only sessions between 1 minute and 5 hours long
        AND DATEDIFF(MINUTE, playerStartTime, playerEndTime) BETWEEN 1 AND 300
      `,
      {
        replacements: { startUtc },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const playersInFacilityNow = await sequelize.query(
      `SELECT COUNT(DISTINCT PlayerID) AS count
       FROM WristbandTrans
       WHERE
         PlayerID IS NOT NULL
         AND playerStartTime IS NOT NULL
         AND playerEndTime IS NOT NULL
         AND wristbandStatusFlag = 'R'
         AND playerStartTime <= GETUTCDATE()
         AND playerEndTime >= GETUTCDATE()
         AND DATEDIFF(MINUTE, playerStartTime, playerEndTime) BETWEEN 1 AND 300`,
      { type: sequelize.QueryTypes.SELECT }
    );

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
      playersInFacilityNow: playersInFacilityNow[0]?.count || 0
    });
  } catch (error) {
    console.error('Raw SQL stats error:', error);
    res.status(500).json({ error: 'Failed to generate stats', detail: error.message || '' });
  }
};

exports.getHourlyPlaysForDay = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD in Toronto
    const { startUtcISO, endUtcISO } = getTorontoDayUtcBounds(date);

    const rows = await sequelize.query(
      `
      SELECT DATEPART(HOUR, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, StartTime)) AS hour, COUNT(*) AS totalPlays
      FROM PlayerScores
      WHERE StartTime >= :startUtc AND StartTime < :endUtc
      GROUP BY DATEPART(HOUR, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, StartTime))
      ORDER BY hour ASC
      `,
      { replacements: { startUtc: startUtcISO, endUtc: endUtcISO }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ date: date || 'today', hourly: rows });
  } catch (e) {
    console.error('getHourlyPlaysForDay error:', e);
    res.status(500).json({ error: 'Failed to fetch hourly plays' });
  }
};

exports.getTopVariants = async (req, res) => {
  try {
    const days  = clampInt(req.query.days, 1, 360, 30);
    const limit = clampInt(req.query.limit, 1, 50, 10);
    const endParam = req.query.end;
    const { startUtcISO: endUtcISO } = getTorontoDayUtcBounds(endParam);
    const startUtcISO = new Date(new Date(endUtcISO).getTime() - (days - 1) * 24*3600*1000).toISOString();

    const rows = await sequelize.query(
      `
      SELECT TOP (:limit) gv.name, COUNT(*) AS plays
      FROM PlayerScores ps
      JOIN GamesVariants gv ON ps.GamesVariantId = gv.id
      WHERE ps.StartTime >= :startUtc AND ps.StartTime < DATEADD(DAY, 1, :endUtc)
      GROUP BY gv.name
      ORDER BY plays DESC
      `,
      { replacements: { startUtc: startUtcISO, endUtc: endUtcISO, limit }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ days, end: endParam || 'today', top: rows });
  } catch (e) {
    console.error('getTopVariants error:', e);
    res.status(500).json({ error: 'Failed to fetch top variants' });
  }
};

exports.getGameShareForDay = async (req, res) => {
  try {
    const { startUtcISO, endUtcISO } = getUtcBoundsFromQuery(req.query);

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
      GROUP BY g.gameName
      ORDER BY plays DESC
      `,
      {
        replacements: { startUtc: startUtcISO, endUtc: endUtcISO },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Echo back what was asked (prefer explicit params; otherwise date 'today')
    res.json({
      startUtc: startUtcISO,
      endUtc: endUtcISO,
      share: rows
    });
  } catch (e) {
    console.error('getGameShareForDay error:', e);
    res.status(500).json({ error: 'Failed to fetch game share' });
  }
};



exports.getWeekdayHourHeatmap = async (req, res) => {
  try {
    const weeks = clampInt(req.query.weeks, 1, 52, 12);
    const nowBounds = getTorontoDayUtcBounds(); // today start in Toronto -> UTC
    const endUtcISO = nowBounds.startUtcISO;
    const startUtcISO = new Date(new Date(endUtcISO).getTime() - (weeks * 7 - 1) * 24*3600*1000).toISOString();

    const rows = await sequelize.query(
      `
      SELECT
        DATEPART(WEEKDAY, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, StartTime)) AS weekday, -- 1=Sunday..7=Saturday
        DATEPART(HOUR,    DATEADD(HOUR, ${TZ_OFFSET_HOURS}, StartTime)) AS hour,
        COUNT(*) AS total
      FROM PlayerScores
      WHERE StartTime >= :startUtc AND StartTime < DATEADD(DAY, 1, :endUtc)
      GROUP BY
        DATEPART(WEEKDAY, DATEADD(HOUR, ${TZ_OFFSET_HOURS}, StartTime)),
        DATEPART(HOUR,    DATEADD(HOUR, ${TZ_OFFSET_HOURS}, StartTime))
      ORDER BY weekday, hour
      `,
      { replacements: { startUtc: startUtcISO, endUtc: endUtcISO }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ weeks, matrix: rows });
  } catch (e) {
    console.error('getWeekdayHourHeatmap error:', e);
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
};

exports.getGameLengthAverages = async (req, res) => {
  try{
    const { startUtcISO, endUtcISO } = getUtcBoundsFromQuery(req.query);

    const minSeconds = clampInt(req.query.minSeconds, 0, 36000, 5);
    const maxSeconds = clampInt(req.query.maxSeconds, 1, 36000, 3600);

    const replacements = {
      startUtc: startUtcISO,
      endUtc: endUtcISO,
      minSeconds, 
      maxSeconds
    };

    const overall = await sequelize.query(
      `
      SELECT
        AVG(CAST(DATEDIFF(SECOND, StartTime, EndTime) AS FLOAT)) AS avgSeconds,
        COUNT(*) AS plays
      FROM PlayerScores
      WHERE
        EndTime IS NOT NULL
        AND EndTime > StartTime
        AND StartTime >= :startUtc
        AND StartTime <  :endUtc
        AND DATEDIFF(SECOND, StartTime, EndTime) BETWEEN :minSeconds AND :maxSeconds
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
      LEFT JOIN Games g ON g.GameID = ps.GameID
      WHERE
        ps.EndTime IS NOT NULL
        AND ps.EndTime > ps.StartTime
        AND ps.StartTime >= :startUtc
        AND ps.StartTime <  :endUtc
        AND DATEDIFF(SECOND, ps.StartTime, ps.EndTime) BETWEEN :minSeconds AND :maxSeconds
      GROUP BY ps.GameID, g.gameName
      ORDER BY avgSeconds DESC
      `,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    // By variant (uses GamesVariants for a friendly name)
    const byVariant = await sequelize.query(
      `
      SELECT
        gv.id AS gamesVariantId,
        gv.name AS variantName,
        AVG(CAST(DATEDIFF(SECOND, ps.StartTime, ps.EndTime) AS FLOAT)) AS avgSeconds,
        COUNT(*) AS plays
      FROM PlayerScores ps
      JOIN GamesVariants gv ON gv.id = ps.GamesVariantId
      WHERE
        ps.EndTime IS NOT NULL
        AND ps.EndTime > ps.StartTime
        AND ps.StartTime >= :startUtc
        AND ps.StartTime <  :endUtc
        AND DATEDIFF(SECOND, ps.StartTime, ps.EndTime) BETWEEN :minSeconds AND :maxSeconds
      GROUP BY gv.id, gv.name
      ORDER BY avgSeconds DESC
      `,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const overallAvgSeconds = overall[0]?.avgSeconds ? Number(overall[0].avgSeconds) : null;
    const overallPlays = overall[0]?.plays ? Number(overall[0].plays) : 0;

    const mapWithMinutes = rows =>
      rows.map(r => ({
        ...r,
        avgSeconds: r.avgSeconds !== null ? Number(r.avgSeconds) : null,
        avgMinutes: r.avgSeconds !== null ? Number(r.avgSeconds) / 60 : null,
        plays: Number(r.plays)
      }));

    res.json({
      startUtc: startUtcISO,
      endUtc: endUtcISO,
      minSeconds,
      maxSeconds,
      overall: {
        avgSeconds: overallAvgSeconds,
        avgMinutes: overallAvgSeconds !== null ? overallAvgSeconds / 60 : null,
        plays: overallPlays
      },
      byGame: mapWithMinutes(byGame),
      byVariant: mapWithMinutes(byVariant)
    });

  } catch (e) {
    console.error('getGameLengthAverages error:', e);
    res.status(500).json({ error: 'Failed to fetch game length averages' });
  }
};

exports.getDailyPlays = async (req, res) => {
  try {
    const days = clampInt(req.query.days, 1, 360, 30);
    const endParam = req.query.end; // YYYY-MM-DD (Toronto) optional

    // End = Toronto midnight of the given day (or today) -> UTC
    const { startUtcISO: endUtcISO } = getTorontoDayUtcBounds(endParam);
    // Start = (days-1) days before end
    const startUtcISO = new Date(new Date(endUtcISO).getTime() - (days - 1) * 24*3600*1000).toISOString();

    const rows = await sequelize.query(
      `
      SELECT
        CONVERT(DATE, DATEADD(HOUR, -4, StartTime)) AS date,   -- Toronto day
        COUNT(*) AS plays
      FROM PlayerScores
      WHERE StartTime >= :startUtc
        AND StartTime <  :endUtc                              -- closed-open
      GROUP BY CONVERT(DATE, DATEADD(HOUR, -4, StartTime))
      ORDER BY date ASC
      `,
      { replacements: { startUtc: startUtcISO, endUtc: endUtcISO }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ days, end: endParam || 'today', plays: rows });
  } catch (e) {
    console.error('getDailyPlays error:', e);
    res.status(500).json({ error: 'Failed to fetch daily plays' });
  }
};


exports.getGameVariantAnalytics = async (req, res) => {
  const variantID = Number.parseInt(req.params.variantId, 10);
  if (!Number.isFinite(variantID)) {
    return res.status(400).json({ error: 'variantId is required and must be a number' });
  }

  const todayStart = dayjs().startOf('day').toDate();
  const sevenDaysAgo = dayjs().subtract(6, 'day').startOf('day').toDate();

  const variantWhere = { GamesVariantId: variantID };

  try {
    // --- Basic aggregates ---
    const [todayPlays, last7DaysPlays, totalPlaysAllTime, totalUniquePlayers] = await Promise.all([
      PlayerScore.count({ where: { ...variantWhere, createdAt: { [Op.gte]: todayStart } } }),
      PlayerScore.count({ where: { ...variantWhere, createdAt: { [Op.gte]: sevenDaysAgo } } }),
      PlayerScore.count({ where: variantWhere }),
      PlayerScore.count({ where: variantWhere, distinct: true, col: 'PlayerID' }),
    ]);

    // --- Averages (use MINUTE to avoid overflow, then *60) ---
    let avgDurationSeconds = 0;
    let avgLevelReached = 0;
    try {
      const [row] = await sequelize.query(
        `
        SELECT
          AVG(CAST(DATEDIFF(MINUTE, StartTime, EndTime) AS FLOAT)) * 60 AS avgDuration,
          AVG(TRY_CONVERT(FLOAT, NULLIF(LevelPlayed, '')))            AS avgLevel
        FROM PlayerScores
        WHERE GamesVariantId = :variantID
          AND StartTime IS NOT NULL
          AND EndTime   IS NOT NULL
          AND EndTime   > StartTime
          -- keep to sane sessions (adjust if you expect longer)
          AND DATEDIFF(MINUTE, StartTime, EndTime) BETWEEN 1 AND 600
        `,
        {
          replacements: { variantID },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      avgDurationSeconds = Number(row?.avgDuration ?? 0) || 0;
      avgLevelReached    = Number(row?.avgLevel ?? 0)    || 0;
    } catch (e) {
      console.warn('Averages (raw) query failed:', e?.message);
    }

    // --- Plays per day (last 7 days) ---
    let playsPerDay = [];
    try {
      const dateExpr = literal('CONVERT(date, [PlayerScore].[createdAt])');
      const playsPerDayRaw = await PlayerScore.findAll({
        attributes: [
          [dateExpr, 'date'],
          [literal('COUNT(*)'), 'count'],
        ],
        where: { ...variantWhere, createdAt: { [Op.gte]: sevenDaysAgo } },
        group: [dateExpr],
        order: [[dateExpr, 'ASC']],
        raw: true,
      });

      const countsByDate = Object.fromEntries(
        playsPerDayRaw.map(r => [
          dayjs(r.date).format('YYYY-MM-DD'),
          parseInt(r.count, 10) || 0,
        ])
      );

      playsPerDay = Array.from({ length: 7 }, (_, i) => {
        const d = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
        return { date: d, count: countsByDate[d] ?? 0 };
      });
    } catch (e) {
      console.warn('playsPerDay query failed:', e?.message);
      playsPerDay = Array.from({ length: 7 }, (_, i) => ({
        date: dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'),
        count: 0,
      }));
    }

    // --- Recent 10 scores (with Player name) ---
    let topRecentScoresRaw;
    try {
      topRecentScoresRaw = await PlayerScore.findAll({
        where: variantWhere,
        include: [{ model: Player, as: 'player', attributes: ['FirstName', 'LastName'] }],
        order: [['createdAt', 'DESC']],
        limit: 10,
      });
    } catch (e) {
      console.warn('Include failed, fallback without include:', e?.message);
      topRecentScoresRaw = await PlayerScore.findAll({
        where: variantWhere,
        order: [['createdAt', 'DESC']],
        limit: 10,
        raw: true,
      });
      const ids = [...new Set(topRecentScoresRaw.map(s => s.PlayerID).filter(Boolean))];
      const players = await Player.findAll({
        where: { PlayerID: { [Op.in]: ids } },
        attributes: ['PlayerID', 'FirstName', 'LastName'],
        raw: true,
      });
      const byId = Object.fromEntries(players.map(p => [p.PlayerID, p]));
      topRecentScoresRaw = topRecentScoresRaw.map(s => ({ ...s, player: byId[s.PlayerID] || null }));
    }

    const topRecentScores = topRecentScoresRaw.map(score => {
      const p = score.player ?? score.Player ?? null;
      const durationSeconds =
        score.Duration ??
        (score.StartTime && score.EndTime
          ? Math.max(0, Math.round((new Date(score.EndTime) - new Date(score.StartTime)) / 1000))
          : null);
      return {
        playerName: `${p?.FirstName || '—'} ${p?.LastName || ''}`.trim(),
        points: score.Points ?? null,
        date: score.createdAt ?? score.StartTime ?? null,
        durationSeconds,
        level: score.Level ?? score.LevelPlayed ?? null,
      };
    });

    const avgPlaysPerDay = last7DaysPlays / 7;

    return res.json({
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
    console.error('Error in getGameVariantAnalytics:', err?.message, err?.stack);
    return res.status(500).json({ error: 'Failed to load analytics' });
  }
};
