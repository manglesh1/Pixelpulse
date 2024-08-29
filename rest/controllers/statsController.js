const { PlayerScore  } = require('../models');
const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');

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
