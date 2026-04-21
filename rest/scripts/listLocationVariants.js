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
    console.log("=== All GamesVariants ===");
    const [variants] = await sequelize.query(`
      SELECT gv.ID, gv.name, gv.GameID, g.gameCode, g.gameName
      FROM GamesVariants gv
      LEFT JOIN Games g ON g.GameID = gv.GameID
      ORDER BY g.gameCode, gv.name;
    `);
    for (const v of variants) {
      console.log(`  [${v.ID}] ${v.gameCode} / ${v.name}`);
    }

    console.log("\n=== Existing LocationVariants ===");
    const [lvs] = await sequelize.query(`
      SELECT lv.id, lv.GamesVariantId, gv.name AS variantName, g.gameCode,
             lv.LocationID, l.Name AS locName, lv.isActive,
             CASE WHEN lv.customConfigJson IS NULL THEN 'NULL'
                  WHEN LEN(lv.customConfigJson) > 60 THEN LEFT(lv.customConfigJson, 57) + '...'
                  ELSE lv.customConfigJson END AS cfg
      FROM LocationVariants lv
      LEFT JOIN GamesVariants gv ON gv.ID = lv.GamesVariantId
      LEFT JOIN Games g ON g.GameID = gv.GameID
      LEFT JOIN Locations l ON l.LocationID = lv.LocationID
      ORDER BY l.Name, g.gameCode, gv.name;
    `);
    if (lvs.length === 0) {
      console.log("  (none)");
    } else {
      for (const r of lvs) {
        console.log(`  [${r.id}] ${r.locName} / ${r.gameCode} / ${r.variantName} — active=${r.isActive}, config=${r.cfg}`);
      }
    }
    console.log(`\nTotal variants: ${variants.length}, LocationVariants: ${lvs.length}`);
  } finally {
    await sequelize.close();
  }
})();
