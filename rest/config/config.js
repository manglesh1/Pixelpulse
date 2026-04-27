require("dotenv").config({ path: "./.env" });

const base = {
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  dialect: "postgres",
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
