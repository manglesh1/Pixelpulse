/**
 * Propagates LocationVariants.customConfigJson between locations.
 *
 * Many game variants already have carefully tuned customConfigJson at one
 * location (usually the one that was set up first). Newer locations
 * often have NULL for the same variant. This script copies a known-good
 * config from a "source" location to every other location that is
 * missing a config for the SAME GamesVariantId.
 *
 * Defaults:
 *   - Source location = Vaughan (most populated in practice).
 *   - Only copies when the target's customConfigJson is NULL (non-destructive).
 *
 * Override via env vars:
 *   SOURCE_LOCATION_NAME=<name>   (default "Vaughan")
 *   DRY_RUN=1                     (log only, don't write)
 *
 * Usage:
 *   node scripts/seedLocationVariantConfigs.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");

const SOURCE = process.env.SOURCE_LOCATION_NAME || "Vaughan";
const DRY_RUN = process.env.DRY_RUN === "1";

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
    console.log(`DB connection OK. Source location: "${SOURCE}"  Dry-run: ${DRY_RUN}`);

    // All active LocationVariants with their variant + location names.
    const [rows] = await sequelize.query(`
      SELECT lv.id, lv.GamesVariantId, lv.LocationID, lv.isActive, lv.customConfigJson,
             gv.name AS variantName,
             l.Name  AS locName
      FROM LocationVariants lv
      LEFT JOIN GamesVariants gv ON gv.ID = lv.GamesVariantId
      LEFT JOIN Locations l     ON l.LocationID = lv.LocationID;
    `);

    // Build a map: GamesVariantId → config (pick the source location first,
    // otherwise the first non-null we find).
    const sourceByVariant = new Map();

    for (const r of rows) {
      if (!r.customConfigJson) continue;

      const existing = sourceByVariant.get(r.GamesVariantId);
      const isSource = r.locName?.toLowerCase() === SOURCE.toLowerCase();

      if (!existing || isSource) {
        sourceByVariant.set(r.GamesVariantId, {
          config: r.customConfigJson,
          fromLocation: r.locName,
        });
      }
    }

    console.log(`\nSource configs available for ${sourceByVariant.size} variants.\n`);

    let updated = 0;
    let alreadyOk = 0;
    let noSource = 0;

    for (const r of rows) {
      if (r.customConfigJson) {
        alreadyOk++;
        continue;
      }

      const source = sourceByVariant.get(r.GamesVariantId);
      if (!source) {
        console.log(`- skip [${r.id}] ${r.locName} / ${r.variantName}  (no source config anywhere)`);
        noSource++;
        continue;
      }

      console.log(`+ copy [${r.id}] ${r.locName} / ${r.variantName}  <- ${source.fromLocation}`);

      if (!DRY_RUN) {
        await sequelize.query(
          `UPDATE LocationVariants SET customConfigJson = :cfg WHERE id = :id;`,
          { replacements: { cfg: source.config, id: r.id } }
        );
      }
      updated++;
    }

    console.log(
      `\nDone. ${updated} ${DRY_RUN ? "would be updated" : "updated"},` +
      ` ${alreadyOk} already had a config, ${noSource} skipped (no source).`
    );
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
