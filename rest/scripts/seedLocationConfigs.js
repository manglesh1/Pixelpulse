/**
 * One-off seeder for per-location config.
 *
 * Sets Locations.config for each known venue with the list of comPorts
 * that actually exist there. At runtime the scorecard's ComPortScanner
 * probes the machine for connected devices, so Port values can stay
 * empty — the scanner fills them in.
 *
 * Usage:
 *   node scripts/seedLocationConfigs.js
 *
 * Safe to re-run — merges with any existing config (existing keys are
 * preserved, comPorts is replaced wholesale so this file is the source
 * of truth for the location-wide hardware list).
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
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
    logging: false,
  }
);

// --- Device templates ---
// Port is left empty; runtime scanner fills it in based on request/response probe.
const DOORLOCK = {
  GameCode: "",
  Port: "",
  Name: "DOORLOCK",
  request: "AT",
  Expectedresponse: "OK",
  isConnected: false,
  BeudRate: 9600,
};

// The cosmetic LED/feedback Arduino ring. Its firmware still identifies
// itself as "HANDSCANNER" on the serial handshake, so Expectedresponse stays
// as "HANDSCANNER" — but the logical Name is "EXTRALIGHTING" to make the
// role (LED feedback, not actual scanning) clear in configs and UI.
const EXTRALIGHTING = {
  GameCode: "",
  Port: "",
  Name: "EXTRALIGHTING",
  request: " CONN",
  Expectedresponse: "HANDSCANNER",
  isConnected: false,
  BeudRate: 115200,
};

const RESTART = {
  GameCode: "",
  Port: "",
  Name: "RESTART",
  request: "AT",
  Expectedresponse: "OK",
  isConnected: false,
  BeudRate: 9600,
};

// --- Per-venue lists ---
// Match by location Name (case-insensitive). Add rows here as new venues
// come online. `hasWristbandScanner` indicates whether this site has an
// ACS PC/SC USB reader attached — launcher uses it to decide whether to
// instantiate the wristband scanner subsystem.
const venues = [
  {
    // Matches: "St. Catharines", "St Catharines", "St-Catharines", "StCatharines"
    match: /st[.\s\-]*catharines/i,
    comPorts: [DOORLOCK, EXTRALIGHTING, RESTART],
    hasWristbandScanner: true,
  },
  {
    match: /vaughan/i,
    comPorts: [DOORLOCK],
    hasWristbandScanner: true,
  },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connection OK.");

    const [rows] = await sequelize.query(
      `SELECT LocationID, Name, config FROM Locations WHERE isActive = 1;`
    );

    for (const row of rows) {
      const venue = venues.find((v) => v.match.test(row.Name || ""));
      if (!venue) {
        console.log(`- skip [${row.LocationID}] ${row.Name} (no template)`);
        continue;
      }

      // Merge: keep any existing keys, replace comPorts from template.
      let existing = null;
      if (row.config) {
        try {
          existing = typeof row.config === "string" ? JSON.parse(row.config) : row.config;
        } catch {
          existing = null;
        }
      }

      const merged = {
        ...(existing || {}),
        comPorts: venue.comPorts,
        ...(typeof venue.hasWristbandScanner === "boolean"
          ? { hasWristbandScanner: venue.hasWristbandScanner }
          : {}),
      };

      await sequelize.query(
        `UPDATE Locations SET config = :cfg WHERE LocationID = :id;`,
        {
          replacements: {
            cfg: JSON.stringify(merged),
            id: row.LocationID,
          },
        }
      );

      console.log(
        `+ set  [${row.LocationID}] ${row.Name} -> ${venue.comPorts
          .map((c) => c.Name)
          .join(", ")}`
      );
    }

    console.log("Done.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
