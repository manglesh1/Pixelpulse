require("dotenv").config();
const { Sequelize } = require("sequelize");
const { Umzug, SequelizeStorage } = require("umzug");

const sequelize = new Sequelize(
  process.env.DATABASE_DATABASE,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    dialect: "postgres",
    logging: console.log,
  }
);

const umzug = new Umzug({
  migrations: { glob: "migrations/*.js" },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    await umzug.up();
    console.log("All migrations executed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sequelize.close();
  }
})();
