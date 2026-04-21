/**
 * Seeder for per-game-per-location config (GameLocations.config).
 *
 * Sets the free-form JSON bag for each (game, location) pair so the
 * scorecard engine gets the right devices and settings without any
 * hardcoding on the client.
 *
 * Strategy:
 *   - Device templates live at the top of this file (shared).
 *   - `gameTemplates` maps GameCode → base config shared across locations.
 *   - `overrides` lets a specific (location, gameCode) pair replace or
 *     merge on top of the template (e.g. St. Catharines LaserEscape
 *     uses serial transport, Vaughan uses UDP).
 *
 * Safe to re-run — replaces only the keys set by this script. Keys you've
 * added manually through another path are preserved (shallow merge).
 *
 * Usage:
 *   node scripts/seedGameLocationConfigs.js
 */

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

// ─── Device templates ───────────────────────────────────────────────
// `Port` is empty — runtime probe fills it in. `GameCode` lists the
// games this device serves (comma-separated when shared).
const LaserSensor1 = { GameCode: "LaserEscape", Port: "", Name: "sensor1", request: "AT", Expectedresponse: "OK", isConnected: false, BeudRate: 115200 };
const LaserSensor2 = { GameCode: "LaserEscape", Port: "", Name: "sensor2", request: "AT", Expectedresponse: "OK", isConnected: false, BeudRate: 115200 };
const Laser1       = { GameCode: "LaserEscape", Port: "", Name: "laser1",  request: "AT", Expectedresponse: "OK", isConnected: false, BeudRate: 115200 };
const Laser2       = { GameCode: "LaserEscape", Port: "", Name: "laser2",  request: "AT", Expectedresponse: "OK", isConnected: false, BeudRate: 115200 };

const ESP32SERVER = {
  GameCode: "BallToss,MazeGates,PizzaDelivery,Seashells,SoccerShootout,TRexHeist",
  Port: "",
  Name: "ESP32SERVER",
  request: " !PMS PING",
  Expectedresponse: "!PMS PONG",
  isConnected: false,
  BeudRate: 115200,
};

const RECIPESERVER = {
  GameCode: "Recipe,RecipeGuided",
  Port: "",
  Name: "RECIPESERVER",
  request: " CONN",
  Expectedresponse: "RECIPESERVER",
  isConnected: false,
  BeudRate: 115200,
};

// ─── Game → default config ─────────────────────────────────────────
// Applied to every location that has this GameCode, unless an override
// below replaces it.
const gameTemplates = {
  LaserEscape: {
    laserTransport: "udp", // default; St. Catharines overrides to serial below
    comPorts: [LaserSensor1, LaserSensor2, Laser1, Laser2],
  },
  BallToss:       { comPorts: [ESP32SERVER] },
  MazeGates:      { comPorts: [ESP32SERVER] },
  PizzaDelivery:  { comPorts: [ESP32SERVER] },
  Seashells:      { comPorts: [ESP32SERVER] },
  SoccerShootout: { comPorts: [ESP32SERVER] },
  TRexHeist:      { comPorts: [ESP32SERVER] },
  Recipe:         { comPorts: [RECIPESERVER] },
  RecipeGuided:   { comPorts: [RECIPESERVER] },
};

// ─── Per-location overrides ────────────────────────────────────────
// Keyed by location name regex → { gameCode → partial config }.
// Merged on top of the gameTemplate entry for that gameCode.
const overrides = [
  {
    match: /st[.\s\-]*catharines/i,
    games: {
      LaserEscape: { laserTransport: "serial" }, // St. C uses the older serial lasers
    },
  },
  // Vaughan: no overrides — uses defaults (udp laser)
];

// ─── Runner ────────────────────────────────────────────────────────
function mergeShallow(base, patch) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(patch || {})) {
    out[k] = v;
  }
  return out;
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connection OK.");

    const [rows] = await sequelize.query(`
      SELECT gl.id, gl.GameID, g.gameCode, gl.LocationID, l.Name AS LocationName, gl.config
      FROM GameLocations gl
      LEFT JOIN Games g ON g.GameID = gl.GameID
      LEFT JOIN Locations l ON l.LocationID = gl.LocationID;
    `);

    let updated = 0;
    let skipped = 0;

    for (const r of rows) {
      const template = gameTemplates[r.gameCode];
      if (!template) {
        console.log(`- skip [${r.id}] ${r.LocationName} / ${r.gameCode} (no game template)`);
        skipped++;
        continue;
      }

      // Start with the game-wide template, then apply any location override.
      let toApply = { ...template };
      for (const ov of overrides) {
        if (ov.match.test(r.LocationName || "") && ov.games?.[r.gameCode]) {
          toApply = mergeShallow(toApply, ov.games[r.gameCode]);
        }
      }

      // Shallow-merge with any existing config so unrelated keys are preserved.
      let existing = null;
      if (r.config) {
        try {
          existing = typeof r.config === "string" ? JSON.parse(r.config) : r.config;
        } catch {
          existing = null;
        }
      }

      const merged = mergeShallow(existing || {}, toApply);

      await sequelize.query(
        `UPDATE GameLocations SET config = :cfg WHERE id = :id;`,
        { replacements: { cfg: JSON.stringify(merged), id: r.id } }
      );

      const summary = [];
      if (merged.laserTransport) summary.push(`transport=${merged.laserTransport}`);
      if (Array.isArray(merged.comPorts)) summary.push(`ports=${merged.comPorts.map(c => c.Name).join(",")}`);
      console.log(`+ set  [${r.id}] ${r.LocationName} / ${r.gameCode} -> ${summary.join(" | ")}`);
      updated++;
    }

    console.log(`\nDone. ${updated} updated, ${skipped} skipped.`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
