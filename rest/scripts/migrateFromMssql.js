/* eslint-disable no-console */
/**
 * Schema-aware data migration: SQL Server → PostgreSQL.
 *
 * Prerequisites:
 *   1. Target Postgres has the schema (run `npm start` once so sync() creates
 *      tables, then optionally `node scripts/runMigrations.js` for Umzug).
 *   2. Install the MSSQL driver locally:
 *        npm install --no-save tedious
 *   3. Add MSSQL source vars to .env (PG vars stay as DATABASE_*):
 *        MSSQL_HOST=...
 *        MSSQL_PORT=1433        (omit for tedious default)
 *        MSSQL_USERNAME=...
 *        MSSQL_PASSWORD=...
 *        MSSQL_DATABASE=Games
 *
 * Usage:
 *   node scripts/migrateFromMssql.js                    # dry run, full analysis
 *   node scripts/migrateFromMssql.js --yes              # full migrate, truncate first
 *   node scripts/migrateFromMssql.js --yes --only Players,WristbandTrans
 *   node scripts/migrateFromMssql.js --yes --no-truncate --only PlayerScores
 *
 * What it does automatically:
 *   - Discovers PG columns, FKs, NOT NULL constraints, defaults via information_schema.
 *   - Case-insensitively maps MSSQL column names → PG column names. Catches
 *     bugs like MSSQL `GameId` vs PG `GameID` without manual config.
 *   - Sanitizes orphaned FK references. If parent row is missing:
 *       nullable col → set NULL
 *       NOT NULL col → skip the row (log count)
 *   - Skips rows that would violate NOT NULL constraints.
 *   - Applies per-table COLUMN_DEFAULTS for any PG column that isn't in the
 *     source row. Values may be constants or (row) => value.
 *   - Resets all SERIAL/identity sequences after load.
 */

const path = require("path");
// Always load the rest/.env regardless of where the script was launched from.
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { Sequelize } = require("sequelize");

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const valueFlag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && i < argv.length - 1 ? argv[i + 1] : null;
};

const APPLY = flag("--yes");
const NO_TRUNCATE = flag("--no-truncate");
const DRY_RUN = !APPLY;
const ONLY = (valueFlag("--only") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Tables in FK dependency order (parents → children). Tables not in both
// MSSQL and PG are silently skipped at runtime.
const TABLES = [
  "Locations",
  "Games",
  "GamesVariants",
  "GameLocations",
  "LocationVariants",
  "AdminUsers",
  "Configs",
  "Players",
  "WristbandTrans",
  "PlayerScores",
  "GameRoomDevices",
  "SmartDeviceAutomations",
  "SmartDeviceAutomationLogs",
  "ApiKeys",
  "CorsOrigins",
];

// Optional per-table values for PG columns missing from the MSSQL source.
// Constants or (row) => value. row keys are AFTER auto-rename.
//   Example:
//     PlayerScores: {
//       LocationID: (row) => playerLocations.get(row.PlayerID) ?? null,
//     }
const COLUMN_DEFAULTS = {
  // Add entries here as needed.
};

// Hard column-name overrides if the auto case-insensitive matcher gets it
// wrong (e.g. when MSSQL and PG genuinely have different names, not just
// different case). Keys are MSSQL column names, values are PG column names.
const COLUMN_RENAME_OVERRIDES = {
  // Example:
  // GamesVariants: { OldName: "NewName" },
};

// ---------------------------------------------------------------------------
// Sequelize handles
// ---------------------------------------------------------------------------
const srcOpts = {
  host: process.env.MSSQL_HOST,
  dialect: "mssql",
  dialectOptions: {
    options: { encrypt: false, enableArithAbort: true },
  },
  logging: false,
};
if (process.env.MSSQL_PORT) {
  srcOpts.port = parseInt(process.env.MSSQL_PORT, 10);
}

const src = new Sequelize(
  process.env.MSSQL_DATABASE,
  process.env.MSSQL_USERNAME,
  process.env.MSSQL_PASSWORD,
  srcOpts
);

const tgt = new Sequelize(
  process.env.DATABASE_DATABASE,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    dialect: "postgres",
    logging: false,
  }
);

// ---------------------------------------------------------------------------
// Schema introspection
// ---------------------------------------------------------------------------

async function tableExistsInMssql(name) {
  const [rows] = await src.query(
    `SELECT 1 AS x FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = :n`,
    { replacements: { n: name } }
  );
  return rows.length > 0;
}

async function getMssqlColumns(name) {
  const [rows] = await src.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = :n
       ORDER BY ORDINAL_POSITION`,
    { replacements: { n: name } }
  );
  return rows.map((r) => r.COLUMN_NAME);
}

async function tableExistsInPg(name) {
  const [rows] = await tgt.query(
    `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = :n`,
    { replacements: { n: name } }
  );
  return rows.length > 0;
}

async function getPgColumns(name) {
  const [rows] = await tgt.query(
    `SELECT column_name, is_nullable, column_default, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = :n
       ORDER BY ordinal_position`,
    { replacements: { n: name } }
  );
  return rows.map((r) => ({
    name: r.column_name,
    nullable: r.is_nullable === "YES",
    default: r.column_default,
    isSerial: !!(r.column_default && r.column_default.startsWith("nextval(")),
  }));
}

async function getPgForeignKeys(name) {
  const [rows] = await tgt.query(
    `SELECT
        kcu.column_name AS col,
        ccu.table_name  AS ref_table,
        ccu.column_name AS ref_col
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema    = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema    = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema    = 'public'
        AND tc.table_name      = :n`,
    { replacements: { n: name } }
  );
  return rows.map((r) => ({
    col: r.col,
    refTable: r.ref_table,
    refCol: r.ref_col,
  }));
}

// ---------------------------------------------------------------------------
// Parent PK cache (for FK validation)
// ---------------------------------------------------------------------------
const pkCache = new Map();
async function loadPkSet(table, key) {
  const cacheKey = `${table}.${key}`;
  if (pkCache.has(cacheKey)) return pkCache.get(cacheKey);
  const [rows] = await tgt.query(`SELECT "${key}" AS k FROM "${table}"`);
  const set = new Set(rows.map((r) => r.k));
  pkCache.set(cacheKey, set);
  return set;
}
function invalidatePkCache(table) {
  for (const k of Array.from(pkCache.keys())) {
    if (k.startsWith(`${table}.`)) pkCache.delete(k);
  }
}

// ---------------------------------------------------------------------------
// Per-table plan
// ---------------------------------------------------------------------------

function buildRenameMap(srcCols, pgCols, overrides = {}) {
  const pgByLower = new Map(pgCols.map((c) => [c.name.toLowerCase(), c.name]));
  const renames = {};
  for (const s of srcCols) {
    if (overrides[s]) {
      renames[s] = overrides[s];
      continue;
    }
    const exact = pgCols.find((c) => c.name === s);
    if (exact) continue; // identical, no rename needed
    const lower = pgByLower.get(s.toLowerCase());
    if (lower) renames[s] = lower; // case-insensitive auto-rename
  }
  return renames;
}

async function buildPlan(name) {
  const [srcCols, pgCols, fks] = await Promise.all([
    getMssqlColumns(name),
    getPgColumns(name),
    getPgForeignKeys(name),
  ]);

  const overrides = COLUMN_RENAME_OVERRIDES[name] || {};
  const renames = buildRenameMap(srcCols, pgCols, overrides);

  // Source columns AFTER applying renames.
  const renamedSrcCols = srcCols.map((s) => renames[s] || s);

  const pgColNames = new Set(pgCols.map((c) => c.name));
  const droppedSrcCols = srcCols.filter(
    (s) => !pgColNames.has(renames[s] || s)
  );
  const pgOnlyCols = pgCols
    .map((c) => c.name)
    .filter((c) => !renamedSrcCols.includes(c));

  // Required = NOT NULL, no default, not a serial PK, not provided by source,
  // not provided by COLUMN_DEFAULTS.
  const defaultsForTable = COLUMN_DEFAULTS[name] || {};
  const requiredMissing = pgCols
    .filter(
      (c) =>
        !c.nullable &&
        !c.default &&
        !c.isSerial &&
        !renamedSrcCols.includes(c.name) &&
        !(c.name in defaultsForTable)
    )
    .map((c) => c.name);

  return {
    srcCols,
    pgCols,
    fks,
    renames,
    renamedSrcCols,
    droppedSrcCols,
    pgOnlyCols,
    requiredMissing,
    defaults: defaultsForTable,
  };
}

function reportPlan(name, plan) {
  console.log(`\n=== ${name} ===`);
  console.log(`  src cols (${plan.srcCols.length}): ${plan.srcCols.join(", ")}`);
  if (Object.keys(plan.renames).length) {
    const r = Object.entries(plan.renames)
      .map(([a, b]) => `${a}→${b}`)
      .join(", ");
    console.log(`  renames: ${r}`);
  }
  if (plan.droppedSrcCols.length) {
    console.log(`  src cols not in PG (dropped): ${plan.droppedSrcCols.join(", ")}`);
  }
  if (plan.pgOnlyCols.length) {
    const labelled = plan.pgOnlyCols.map((c) =>
      c in plan.defaults
        ? `${c} (default)`
        : plan.pgCols.find((p) => p.name === c)?.default
        ? `${c} (col default)`
        : `${c} (NULL)`
    );
    console.log(`  pg-only cols: ${labelled.join(", ")}`);
  }
  if (plan.fks.length) {
    const fkSummary = plan.fks
      .map((f) => `${f.col}→${f.refTable}.${f.refCol}`)
      .join(", ");
    console.log(`  FKs: ${fkSummary}`);
  }
  if (plan.requiredMissing.length) {
    console.log(
      `  ⚠ required (NOT NULL, no default) but not provided: ${plan.requiredMissing.join(", ")}`
    );
  }
}

// ---------------------------------------------------------------------------
// Row sanitize
// ---------------------------------------------------------------------------

async function buildFkSets(plan) {
  // Map: pgColName -> { set, nullable }
  const out = {};
  for (const fk of plan.fks) {
    const colMeta = plan.pgCols.find((c) => c.name === fk.col);
    out[fk.col] = {
      set: await loadPkSet(fk.refTable, fk.refCol),
      nullable: colMeta?.nullable ?? true,
      refTable: fk.refTable,
      refCol: fk.refCol,
    };
  }
  return out;
}

function applyDefaults(row, plan) {
  for (const [col, val] of Object.entries(plan.defaults)) {
    if (!(col in row)) {
      row[col] = typeof val === "function" ? val(row) : val;
    }
  }
  return row;
}

function sanitizeRow(row, plan, fkSets) {
  // FK orphan check
  for (const [col, meta] of Object.entries(fkSets)) {
    const val = row[col];
    const isNull = val === null || val === undefined;
    if (isNull) continue; // null FK is fine if column allows it (NOT NULL handled below)
    if (!meta.set.has(val)) {
      if (meta.nullable) {
        row[col] = null;
      } else {
        return { row: null, reason: `orphan FK ${col}→${meta.refTable}.${meta.refCol}` };
      }
    }
  }
  // NOT NULL check (after FK nulling, defaults already applied)
  for (const c of plan.pgCols) {
    if (c.nullable || c.default || c.isSerial) continue;
    const v = row[c.name];
    if (v === null || v === undefined) {
      return { row: null, reason: `NOT NULL violation ${c.name}` };
    }
  }
  return { row };
}

function renameRowKeys(srcRow, renames) {
  if (!Object.keys(renames).length) return { ...srcRow };
  const out = {};
  for (const [k, v] of Object.entries(srcRow)) {
    out[renames[k] || k] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

async function copyTable(name, plan) {
  const fkSets = await buildFkSets(plan);

  const rawRows = await src.query(`SELECT * FROM [${name}]`, {
    type: Sequelize.QueryTypes.SELECT,
  });

  const stats = {
    read: rawRows.length,
    inserted: 0,
    skipped: 0,
    nulledFk: 0,
    skipReasons: {},
  };

  if (!rawRows.length) {
    console.log(`  ${name}: 0 rows in source`);
    return stats;
  }

  // Build output rows
  const outRows = [];
  for (const raw of rawRows) {
    let row = renameRowKeys(raw, plan.renames);

    // Drop columns not in PG
    for (const dropped of plan.droppedSrcCols) {
      delete row[dropped];
    }

    row = applyDefaults(row, plan);

    // Track if any FK gets nulled in this row
    const beforeNullCount = Object.entries(fkSets).filter(
      ([c]) => row[c] === null || row[c] === undefined
    ).length;

    const sanitized = sanitizeRow(row, plan, fkSets);

    const afterNullCount = Object.entries(fkSets).filter(
      ([c]) => (sanitized.row || row)[c] === null || (sanitized.row || row)[c] === undefined
    ).length;
    stats.nulledFk += Math.max(0, afterNullCount - beforeNullCount);

    if (!sanitized.row) {
      stats.skipped++;
      stats.skipReasons[sanitized.reason] =
        (stats.skipReasons[sanitized.reason] || 0) + 1;
      continue;
    }
    outRows.push(sanitized.row);
  }

  if (DRY_RUN) {
    console.log(
      `  ${name}: would insert ${outRows.length} of ${stats.read} (${stats.skipped} skipped, ${stats.nulledFk} FK values nulled)`
    );
    if (Object.keys(stats.skipReasons).length) {
      for (const [r, n] of Object.entries(stats.skipReasons)) {
        console.log(`     - ${n} × ${r}`);
      }
    }
    return stats;
  }

  // Insert in batches
  if (!outRows.length) {
    console.log(`  ${name}: nothing to insert`);
    return stats;
  }

  const insertCols = Object.keys(outRows[0]).filter((c) =>
    plan.pgCols.find((p) => p.name === c)
  );
  const colsSql = insertCols.map((c) => `"${c}"`).join(", ");
  const BATCH = 500;

  for (let i = 0; i < outRows.length; i += BATCH) {
    const batch = outRows.slice(i, i + BATCH);
    const placeholders = batch
      .map(
        (_, r) =>
          "(" +
          insertCols
            .map((_, c) => `$${r * insertCols.length + c + 1}`)
            .join(", ") +
          ")"
      )
      .join(", ");
    const bind = batch.flatMap((row) =>
      insertCols.map((c) => (row[c] === undefined ? null : row[c]))
    );
    await tgt.query(
      `INSERT INTO "${name}" (${colsSql}) VALUES ${placeholders}`,
      { bind }
    );
    stats.inserted += batch.length;
  }

  // Newly inserted rows mean cached PK sets are stale for child tables.
  invalidatePkCache(name);

  const summary =
    `inserted=${stats.inserted}` +
    (stats.skipped ? `, skipped=${stats.skipped}` : "") +
    (stats.nulledFk ? `, nulledFk=${stats.nulledFk}` : "");
  console.log(`  ${name}: ${summary}`);
  if (Object.keys(stats.skipReasons).length) {
    for (const [r, n] of Object.entries(stats.skipReasons)) {
      console.log(`     - ${n} × ${r}`);
    }
  }
  return stats;
}

async function resetSequences(name) {
  const [cols] = await tgt.query(
    `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = :n
         AND column_default LIKE 'nextval(%'`,
    { replacements: { n: name } }
  );
  for (const { column_name: col } of cols) {
    try {
      await tgt.query(
        `SELECT setval(
           pg_get_serial_sequence('"${name}"', '${col}'),
           COALESCE((SELECT MAX("${col}") FROM "${name}"), 1),
           true
         )`
      );
    } catch (err) {
      console.warn(`  ${name}."${col}" sequence reset failed: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  const startedAt = Date.now();
  try {
    console.log("Connecting to MSSQL source…");
    await src.authenticate();
    console.log("Connecting to PostgreSQL target…");
    await tgt.authenticate();

    let tables = ONLY.length ? ONLY : [...TABLES];

    // Filter to tables that exist on both sides
    const present = [];
    for (const t of tables) {
      const [inMssql, inPg] = await Promise.all([
        tableExistsInMssql(t),
        tableExistsInPg(t),
      ]);
      if (!inMssql) {
        console.log(`- skip ${t}: not in MSSQL`);
        continue;
      }
      if (!inPg) {
        console.log(`- skip ${t}: not in PG`);
        continue;
      }
      present.push(t);
    }
    if (!present.length) {
      console.log("Nothing to migrate.");
      return;
    }
    console.log(`\nTables: ${present.join(", ")}`);

    // Build & report plans
    const plans = {};
    for (const t of present) {
      plans[t] = await buildPlan(t);
      reportPlan(t, plans[t]);
    }

    // Halt on hard problems
    const blockers = present.filter((t) => plans[t].requiredMissing.length);
    if (blockers.length) {
      console.log(
        `\n⚠ Required PG columns are missing in source for: ${blockers.join(
          ", "
        )}. Add them to COLUMN_DEFAULTS in this script, then re-run.`
      );
      if (APPLY) {
        console.log("Aborting because --yes was passed.");
        process.exitCode = 1;
        return;
      }
    }

    if (DRY_RUN) {
      console.log("\nDry run. Re-run with --yes to apply.\n");
    }

    if (APPLY && !NO_TRUNCATE) {
      const list = present.map((t) => `"${t}"`).join(", ");
      console.log(`\nTruncating: ${present.join(", ")}`);
      await tgt.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
      pkCache.clear();
    }

    console.log(DRY_RUN ? "\nAnalyzing rows:" : "\nCopying data:");
    const stats = {};
    for (const t of present) {
      try {
        stats[t] = await copyTable(t, plans[t]);
      } catch (err) {
        console.error(`  ${t}: ✗ ${err.message}`);
        stats[t] = { error: err.message };
      }
    }

    if (APPLY) {
      console.log("\nResetting sequences:");
      for (const t of present) {
        await resetSequences(t);
      }
    }

    // Final summary
    console.log("\n=== Summary ===");
    const cell = (v, n = 9) => String(v).padStart(n);
    console.log(
      `  ${"table".padEnd(28)} ${cell("read")} ${cell("inserted")} ${cell("skipped")} ${cell("nulledFk")}`
    );
    for (const t of present) {
      const s = stats[t] || {};
      if (s.error) {
        console.log(`  ${t.padEnd(28)} ERROR: ${s.error}`);
        continue;
      }
      console.log(
        `  ${t.padEnd(28)} ${cell(s.read ?? 0)} ${cell(s.inserted ?? 0)} ${cell(s.skipped ?? 0)} ${cell(s.nulledFk ?? 0)}`
      );
    }
    const totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`\nDone in ${totalSec}s${DRY_RUN ? " (dry run)" : ""}.`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await src.close();
    await tgt.close();
  }
})();
