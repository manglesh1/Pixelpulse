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
  // await ensureColumnsBeforeSync(sequelize);
  await sequelize.sync({});
  // await backfillToDefaultLocation();
  logger.info("Database synchronized successfully!");

  // try {
  //   const [results, metadata] = await sequelize.query(`
  //   UPDATE Players
  //   SET LocationID = 1
  //   WHERE LocationID IS NULL;
  // `);
  //   logger.info(
  //     "All players without a location have been set to LocationID = 1"
  //   );
  // } catch (err) {
  //   logger.error(`Error setting default location for players: ${err.message}`);
  // }

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
db.Location = require("./Locations.js")(sequelize, Sequelize);
db.Game = require("./Game.js")(sequelize, Sequelize);
db.GamesVariant = require("./GamesVariant.js")(sequelize, Sequelize);

db.GameLocation = require("./GameLocation.js")(sequelize, Sequelize);
db.LocationVariant = require("./LocationVariant.js")(sequelize, Sequelize);

db.Config = require("./Config.js")(sequelize, Sequelize);
db.Player = require("./Player.js")(sequelize, Sequelize);
db.WristbandTran = require("./WristbandTran.js")(sequelize, Sequelize);
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
db.ApiKey = require("./ApiKey")(sequelize, Sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

module.exports = db;

async function ensureColumnsBeforeSync(sequelize) {
  // Utility to check for column existence
  const hasColumn = async (table, column) => {
    const [rows] = await sequelize.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = N'${table}' AND COLUMN_NAME = N'${column}'
    `);
    return rows.length > 0;
  };

  // 1) PlayerScores: add LocationID, GameLocationID
  if (!(await hasColumn("PlayerScores", "LocationID"))) {
    await sequelize.query(
      `ALTER TABLE [PlayerScores] ADD [LocationID] INT NULL;`
    );
  }
  if (!(await hasColumn("PlayerScores", "GameLocationID"))) {
    await sequelize.query(
      `ALTER TABLE [PlayerScores] ADD [GameLocationID] INT NULL;`
    );
  }

  // 2) WristbandTrans (Sequelize pluralizes your model)
  if (!(await hasColumn("WristbandTrans", "LocationID"))) {
    await sequelize.query(
      `ALTER TABLE [WristbandTrans] ADD [LocationID] INT NULL;`
    );
  }

  // 3) GameRoomDevices: add GameLocationID if not there
  if (!(await hasColumn("GameRoomDevices", "GameLocationID"))) {
    await sequelize.query(
      `ALTER TABLE [GameRoomDevices] ADD [GameLocationID] INT NULL;`
    );
  }

  // 4) SmartDeviceAutomations: add GameLocationID / LocationVariantID if not there
  if (!(await hasColumn("SmartDeviceAutomations", "GameLocationID"))) {
    await sequelize.query(
      `ALTER TABLE [SmartDeviceAutomations] ADD [GameLocationID] INT NULL;`
    );
  }
  if (!(await hasColumn("SmartDeviceAutomations", "LocationVariantID"))) {
    await sequelize.query(
      `ALTER TABLE [SmartDeviceAutomations] ADD [LocationVariantID] INT NULL;`
    );
  }

  // (Optional) Add FKs after columns exist (NO ACTION to avoid multi-cascade)
  // You can skip if Sequelize will add them via model sync,
  // but doing it here gives you explicit control.

  // FK: PlayerScores.LocationID -> Locations.LocationID (NO ACTION)
  try {
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_PlayerScores_Locations'
      )
      ALTER TABLE [PlayerScores] WITH CHECK
      ADD CONSTRAINT [FK_PlayerScores_Locations]
      FOREIGN KEY ([LocationID]) REFERENCES [Locations]([LocationID])
      ON DELETE NO ACTION ON UPDATE CASCADE;
    `);
  } catch {}

  // FK: PlayerScores.GameLocationID -> GameLocations.id (NO ACTION)
  try {
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_PlayerScores_GameLocations'
      )
      ALTER TABLE [PlayerScores] WITH CHECK
      ADD CONSTRAINT [FK_PlayerScores_GameLocations]
      FOREIGN KEY ([GameLocationID]) REFERENCES [GameLocations]([id])
      ON DELETE NO ACTION ON UPDATE CASCADE;
    `);
  } catch {}

  // FK: WristbandTrans.LocationID -> Locations.LocationID (NO ACTION)
  try {
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_WristbandTrans_Locations'
      )
      ALTER TABLE [WristbandTrans] WITH CHECK
      ADD CONSTRAINT [FK_WristbandTrans_Locations]
      FOREIGN KEY ([LocationID]) REFERENCES [Locations]([LocationID])
      ON DELETE NO ACTION ON UPDATE CASCADE;
    `);
  } catch {}
}
async function backfillToDefaultLocation() {
  const {
    Location,
    Game,
    GamesVariant,
    GameLocation,
    GameRoomDevice,
    SmartDeviceAutomation,
    LocationVariant,
    Player,
    PlayerScore,
    WristbandTran,
    AdminUser,
    ApiKey,
    Sequelize,
  } = db;

  const t = await db.sequelize.transaction();
  try {
    const [loc] = await Location.findOrCreate({
      where: { Name: "St. Catharines" },
      defaults: {
        Name: "St. Catharines",
        Address: "333 Ontario St",
        City: "St. Catharines",
        Province: "Ontario",
        Postal: "L2R5L3",
        Country: "Canada",
        Timezone: "America/Toronto",
      },
      transaction: t,
    });
    const LID = loc.LocationID;

    const games = await Game.findAll({ transaction: t });
    const gameIdToGlId = new Map();

    for (const g of games) {
      const [gl] = await GameLocation.findOrCreate({
        where: { GameID: g.GameID, LocationID: LID },
        defaults: {
          GameID: g.GameID,
          LocationID: LID,
          alias: g.gameName,
          isEnabled: true,
          IpAddress: g.IpAddress,
          LocalPort: g.LocalPort,
          RemotePort: g.RemotePort,
          SocketBReceiverPort: g.SocketBReceiverPort,
          NoOfControllers: g.NoOfControllers,
          NoOfLedPerDevice: g.NoofLedPerdevice,
          MaxPlayers: g.MaxPlayers,
          SmartPlugIP: g.SmartPlugip,
          columns: g.columns,
        },
        transaction: t,
      });
      gameIdToGlId.set(g.GameID, gl.id);
    }

    // Devices → set GameLocationID from GameID
    await GameRoomDevice.update(
      {
        GameLocationID: db.sequelize.literal(`
          (SELECT TOP 1 GL.id FROM GameLocations GL
           WHERE GL.GameID = GameRoomDevices.GameID AND GL.LocationID = ${LID})
        `),
      },
      { where: { GameLocationID: null }, transaction: t }
    );

    // Automations → set GameLocationID from legacy GameId
    await SmartDeviceAutomation.update(
      {
        GameLocationID: db.sequelize.literal(`
          (SELECT TOP 1 GL.id FROM GameLocations GL
           WHERE GL.GameID = SmartDeviceAutomations.GameId AND GL.LocationID = ${LID})
        `),
      },
      {
        where: { GameLocationID: null, GameId: { [Sequelize.Op.ne]: null } },
        transaction: t,
      }
    );

    // LocationVariants for each variant
    const variants = await GamesVariant.findAll({
      attributes: ["ID", "GameID"],
      transaction: t,
    });
    for (const v of variants) {
      const glId = v.GameID ? gameIdToGlId.get(v.GameID) : null;
      await LocationVariant.findOrCreate({
        where: {
          GamesVariantId: v.ID,
          LocationID: LID,
          GameLocationID: glId || null,
        },
        defaults: { isActive: true },
        transaction: t,
        hooks: false,
      });
    }

    // PlayerScores → set LocationID + GameLocationID
    await PlayerScore.update(
      {
        LocationID: LID,
        GameLocationID: db.sequelize.literal(`
          (SELECT TOP 1 GL.id FROM GameLocations GL
           WHERE GL.GameID = PlayerScores.GameID AND GL.LocationID = ${LID})
        `),
      },
      { where: { LocationID: null }, transaction: t }
    );

    // WristbandTrans → set LocationID
    await WristbandTran.update(
      { LocationID: LID },
      { where: { LocationID: null }, transaction: t }
    );

    // Players/AdminUsers/ApiKeys → set location when null
    await Player.update(
      { LocationID: LID },
      { where: { LocationID: null }, transaction: t }
    );
    await AdminUser.update(
      { LocationID: LID },
      { where: { LocationID: null }, transaction: t }
    );
    await ApiKey.update(
      { locationId: LID },
      { where: { locationId: null }, transaction: t }
    );

    await t.commit();
    console.log("Backfill to default location completed.");
  } catch (err) {
    await t.rollback();
    console.error("Backfill failed:", err);
    throw err;
  }
}
