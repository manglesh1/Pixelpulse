/**
 * Toggle / set a boolean flag inside Locations.config for one or all venues.
 *
 * Works on any SQL Server version (does the JSON merge in Node, not T-SQL).
 * Preserves existing keys in Location.config — only the one you name is
 * replaced.
 *
 * Examples:
 *   # Set hasWristbandScanner=false for Vaughan:
 *   node scripts/toggleLocationFlag.js --name Vaughan --key hasWristbandScanner --value false
 *
 *   # Set hasWristbandScanner=true for ALL active locations:
 *   node scripts/toggleLocationFlag.js --all --key hasWristbandScanner --value true
 *
 *   # Dry-run first:
 *   DRY_RUN=1 node scripts/toggleLocationFlag.js --name Vaughan --key hasWristbandScanner --value false
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");

// ─── CLI args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}
const NAME = arg("--name");
const ALL = args.includes("--all");
const KEY = arg("--key");
const VAL_RAW = arg("--value");
const DRY_RUN = process.env.DRY_RUN === "1";

if ((!NAME && !ALL) || !KEY || VAL_RAW === null) {
  console.error(
    "Usage: node scripts/toggleLocationFlag.js (--name <Name> | --all) --key <key> --value <value>"
  );
  process.exit(1);
}

// Parse value — support bools, numbers, and raw strings.
let value;
if (VAL_RAW === "true") value = true;
else if (VAL_RAW === "false") value = false;
else if (VAL_RAW === "null") value = null;
else if (!Number.isNaN(Number(VAL_RAW)) && VAL_RAW !== "") value = Number(VAL_RAW);
else value = VAL_RAW;

// ─── DB ────────────────────────────────────────────────────────────
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
    await sequelize.authenticate();

    const where = ALL ? "WHERE isActive = 1" : "WHERE Name = :name";
    const [rows] = await sequelize.query(
      `SELECT LocationID, Name, config FROM Locations ${where};`,
      ALL ? {} : { replacements: { name: NAME } }
    );

    if (rows.length === 0) {
      console.log(ALL ? "No active locations found." : `No location named "${NAME}".`);
      return;
    }

    for (const r of rows) {
      const existing =
        r.config
          ? typeof r.config === "string"
            ? (() => {
                try { return JSON.parse(r.config); } catch { return {}; }
              })()
            : r.config
          : {};

      const merged = { ...existing, [KEY]: value };
      const before = JSON.stringify(existing[KEY]);
      const after = JSON.stringify(value);

      if (before === after) {
        console.log(`= skip [${r.LocationID}] ${r.Name}  (${KEY} already ${after})`);
        continue;
      }

      console.log(
        `+ ${DRY_RUN ? "would set" : "set"} [${r.LocationID}] ${r.Name}  ${KEY}: ${before} → ${after}`
      );

      if (!DRY_RUN) {
        await sequelize.query(
          `UPDATE Locations SET config = :cfg WHERE LocationID = :id;`,
          { replacements: { cfg: JSON.stringify(merged), id: r.LocationID } }
        );
      }
    }

    console.log("Done.");
  } catch (err) {
    console.error("Failed:", err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
