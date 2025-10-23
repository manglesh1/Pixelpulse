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
await sequelize.sync();  logger.info("Database synchronized successfully!");

  // const {Location, Game, AdminUser} = db;

  // const locationCount = await Location.count();
  // if (locationCount === 0) {
  //   const defaultLocation = await Location.create({
  //     Name: "St. Cathariens",
  //     Address: "333 Ontario St",
  //     City: "St. Catharines",
  //     Province: "Ontario",
  //     Postal: "L2R5L3",
  //     Country: "Canada",
  //     Timezone: "America/Toronto",
  //   });

  //   logger.info(`Default location created with ID: ${defaultLocation.LocationID}`)

  //   await Game.update(
  //     { LocationID: defaultLocation.LocationID },
  //     { where: { LocationID: null } }
  //   );

  //   await AdminUser.update(
  //     { LocationID: defaultLocation.LocationID },
  //     { where: { LocationID: null } }
  //   );

  //   logger.info(`All existing games updated to reference the default location.`);
  // }

  // // Make columns back to not null
  // try{
  //   // Update Games Table
  //   await sequelize.query(`
  //     Alter Table [Games]
  //     Alter Column [LocationID] INT NOT NULL
  //   `);
  //   logger.info("Games.LocationID column altered to NOT NULL");
  //   // Update AdminUsers Table
  //   await sequelize.query(`
  //     Alter Table [AdminUsers]
  //     Alter Column [LocationID] INT NOT NULL
  //   `);
  //   logger.info("AdminUsers.LocationID column altered to NOT NULL");
  // } catch (err) {
  //   logger.error(`Error updating columns to not null: ${err.message}`);
  // }

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
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
