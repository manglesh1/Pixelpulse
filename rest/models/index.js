const Sequelize = require("sequelize");
const config = require("../config/config.js");
const logger = require("../utils/logger.js");
const env = "development";

const sequelize = new Sequelize(
  config[env].database,
  config[env].username,
  config[env].password,
  {
    host: config[env].host,
    dialect: config[env].dialect,
    dialectOptions: {
      options: {
        encrypt: false,
        enableArithAbort: true,
      },
    },
    logging: (msg) => logger.info(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Define retry function for the database connection
const connectWithRetry = async (retries = 3, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info("Database connection established successfully.");
      return; // Exit the function if connection is successful
    } catch (error) {
      logger.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error("Max retries reached. Exiting the application.");
        process.exit(1); // Exit the process after exhausting retries
      }
    }
  }
};

// Call the retry function on startup
(async () => {
  await connectWithRetry();
  await sequelize.sync({ alter: true });
  logger.info("Database synchronized successfully!");
})();

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.Location = require("./Locations")(sequelize, Sequelize);
db.GameroomType = require("./GameRoomType")(sequelize, Sequelize);
db.Game = require("./Game")(sequelize, Sequelize);
db.GamesVariant = require("./GamesVariant.js")(sequelize, Sequelize);
db.Config = require("./Config")(sequelize, Sequelize);
db.Player = require("./Player.js")(sequelize, Sequelize);
db.WristbandTran = require("./WristbandTran")(sequelize, Sequelize);
db.Notification = require("./Notification.js")(sequelize, Sequelize);
db.PlayerScore = require("./PlayerScore")(sequelize, Sequelize);
db.GameRoomDevice = require("./GameRoomDevice")(sequelize, Sequelize);
db.AdminUser = require("./AdminUser")(sequelize, Sequelize);
db.SmartDeviceAutomation = require("./SmartDeviceAutomation")(
  sequelize,
  Sequelize
);
db.SmartDeviceAutomationLog = require("./SmartDeviceAutomationLog")(
  sequelize,
  Sequelize
);

// Define associations
db.Game.hasMany(db.GamesVariant, { foreignKey: "GameId", as: "variants" });
db.GamesVariant.belongsTo(db.Game, { foreignKey: "GameId", as: "game" });

db.Player.hasMany(db.WristbandTran, {
  foreignKey: "PlayerID",
  as: "wristbands",
});
db.WristbandTran.belongsTo(db.Player, { foreignKey: "PlayerID", as: "player" });

db.Player.hasMany(db.PlayerScore, {
  foreignKey: "PlayerID",
  as: "playerScores",
});
db.PlayerScore.belongsTo(db.Player, { foreignKey: "PlayerID", as: "player" });
db.PlayerScore.belongsTo(db.GamesVariant, {
  foreignKey: "GamesVariantId",
  as: "GamesVariant",
});
db.PlayerScore.belongsTo(db.Game, { foreignKey: "GameID", as: "game" });
db.Game.hasMany(db.PlayerScore, { foreignKey: "GameID", as: "playerScores" });

db.Game.hasMany(db.GameRoomDevice, { foreignKey: "GameID", as: "devices" });
db.GameRoomDevice.belongsTo(db.Game, { foreignKey: "GameID", as: "game" });

db.SmartDeviceAutomation.hasMany(db.SmartDeviceAutomationLog, {
  foreignKey: "automationId",
  as: "logs",
});
db.SmartDeviceAutomationLog.belongsTo(db.SmartDeviceAutomation, {
  foreignKey: "automationId",
  as: "automation",
});

module.exports = db;
