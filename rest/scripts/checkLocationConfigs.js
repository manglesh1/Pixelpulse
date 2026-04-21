require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE_DATABASE,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: "mssql",
    dialectOptions: { options: { encrypt: false, trustServerCertificate: true } },
    logging: false,
  }
);

(async () => {
  try {
    const [rows] = await sequelize.query(
      `SELECT LocationID, Name, config FROM Locations ORDER BY LocationID;`
    );
    for (const r of rows) {
      console.log(`[${r.LocationID}] ${r.Name}`);
      console.log(`  config: ${r.config === null ? "NULL" : r.config}`);
    }
  } finally {
    await sequelize.close();
  }
})();
