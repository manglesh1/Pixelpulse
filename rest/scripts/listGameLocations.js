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
    const [rows] = await sequelize.query(`
      SELECT gl.id, gl.GameID, g.gameCode, g.gameName, gl.LocationID, l.Name AS LocationName, gl.config
      FROM GameLocations gl
      LEFT JOIN Games g ON g.GameID = gl.GameID
      LEFT JOIN Locations l ON l.LocationID = gl.LocationID
      ORDER BY l.Name, g.gameCode;
    `);
    for (const r of rows) {
      console.log(`[${r.id}] ${r.LocationName} / ${r.gameCode} (${r.gameName})`);
      console.log(`  config: ${r.config === null ? "NULL" : r.config}`);
    }
    console.log(`\nTotal: ${rows.length} rows`);
  } finally {
    await sequelize.close();
  }
})();
