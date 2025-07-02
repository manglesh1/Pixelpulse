const logger = require('../utils/logger');
const { sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { PlayerScore, GamesVariant } = require('../models');
const { QueryTypes } = require('sequelize');

const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
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

// Get highest scores
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


