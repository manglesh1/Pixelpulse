# SQL Server → PostgreSQL migration runbook

This runbook describes how to migrate an existing MSSQL `Games` database to a
PostgreSQL target used by this backend. Work through the steps in order on a
staging environment first, then reproduce on production during a maintenance
window.

## 0. Pre-flight

- Confirm backend runs locally against a fresh empty Postgres DB (see §3).
- Identify the MSSQL tables in scope. Typical set:
  `Locations`, `Games`, `GamesVariants`, `GameLocations`, `LocationVariants`,
  `Players`, `WristbandTrans`, `PlayerScores`, `Config`, `GameRoomDevices`,
  `AdminUsers`, `SmartDeviceAutomations`, `SmartDeviceAutomationLogs`,
  `ApiKeys`, `CorsOrigins`, and the Umzug tracker `SequelizeMeta`.
- Decide on a migration window: schema sync + data load + validation.

## 1. Back up SQL Server

On the SQL Server host:

```powershell
# Full backup (recommended)
sqlcmd -S <host> -U <user> -P <pw> -Q "BACKUP DATABASE [Games]
  TO DISK = 'C:\backups\Games_pre_migration.bak' WITH INIT, COMPRESSION"

# Optional per-table CSV export (handy fallback if pgloader is unavailable)
bcp "SELECT * FROM dbo.Players" queryout "C:\backups\Players.csv" ^
  -S <host> -U <user> -P <pw> -c -t"," -r"\n"
```

Record row counts for later validation:

```sql
SELECT
  (SELECT COUNT(*) FROM Players)        AS players,
  (SELECT COUNT(*) FROM PlayerScores)   AS player_scores,
  (SELECT COUNT(*) FROM WristbandTrans) AS wristband_trans,
  (SELECT COUNT(*) FROM GameLocations)  AS game_locations;
```

## 2. Create the PostgreSQL database

```sql
-- as a superuser
CREATE ROLE games_app LOGIN PASSWORD '<strong-password>';
CREATE DATABASE games OWNER games_app ENCODING 'UTF8';
\c games
GRANT ALL ON SCHEMA public TO games_app;
```

Put the connection info into `.env` on the backend host (see README).

## 3. Create the schema

Two options — pick **one**.

### 3a. Sequelize auto-sync (fastest for a dev / staging reset)

`models/index.js` runs `sequelize.sync({})` on startup. Start the API once
against an empty PG database to materialize every table with correct
case-sensitive identifiers (e.g. `"PlayerScores"`, `"StartTime"`):

```
npm start
```

Then stop the API and apply the Umzug migrations:

```
node scripts/runMigrations.js
```

### 3b. Umzug only (if you already have SQL DDL)

```
node scripts/runMigrations.js
```

Umzug will create `"SequelizeMeta"` and apply anything in `migrations/*.js`.
Model-only tables still need a sync — run the API once after migrations.

## 4. Load the data

Pick the option that fits your environment.

### 4a. pgloader (recommended)

pgloader streams directly from MSSQL to PG and auto-maps most types:

```
pgloader mssql://user:pw@mssql-host/Games postgresql://games_app:pw@pg-host/games
```

Or drive it with a config file that keeps identifiers case-sensitive:

```
LOAD DATABASE
  FROM     mssql://user:pw@mssql-host/Games
  INTO     postgresql://games_app:pw@pg-host/games

WITH      include no drop, truncate, create no tables, create no indexes,
          preserve index names, reset sequences, data only, disable triggers

SET       work_mem to '256MB', maintenance_work_mem to '512MB'

CAST      type bit       to boolean using tinyint-to-boolean,
          type datetime  to timestamptz drop default,
          type datetime2 to timestamptz drop default;
```

`create no tables` + `data only` are important so pgloader uses the schema
Sequelize already created in step 3.

### 4b. CSV import (fallback)

1. Export each table from MSSQL with `bcp` to CSV (see §1).
2. On the PG host, `\copy` each file into the matching table (mind quoted
   identifiers):

```sql
\copy "Locations" FROM 'Locations.csv' WITH (FORMAT csv, HEADER false, NULL '');
\copy "Players"   FROM 'Players.csv'   WITH (FORMAT csv, HEADER false, NULL '');
-- ... etc
```

Order matters — load parent tables (Locations, Games, GamesVariants) before
child tables (Players → WristbandTrans/PlayerScores).

## 5. Reset identity sequences

Auto-increment columns get their own sequence in PG. After a bulk load the
sequence still starts at 1, so the next INSERT collides with the imported max
id. Re-align every `SERIAL`/`IDENTITY`:

```sql
-- Generic helper — run for each table/pk pair
SELECT setval(
  pg_get_serial_sequence('"Players"', 'PlayerID'),
  COALESCE((SELECT MAX("PlayerID") FROM "Players"), 1),
  true
);

-- Tables / pks to reset:
--   "Locations"              "LocationID"
--   "Games"                  "GameID"
--   "GamesVariants"          "ID"
--   "GameLocations"          "GameLocationID"   (or id, verify schema)
--   "LocationVariants"       "id"               (verify schema)
--   "Players"                "PlayerID"
--   "WristbandTrans"         "WristbandTranID"
--   "PlayerScores"           "ScoreID"
--   "GameRoomDevices"        "id"
--   "SmartDeviceAutomations" "id"
--   "SmartDeviceAutomationLogs" "id"
--   "ApiKeys"                (model-specific)
--   "CorsOrigins"            (model-specific)
--   "AdminUsers"             (model-specific)
```

Skip tables whose PKs are not auto-increment.

## 6. Validation

### Row counts

```sql
-- PG side
SELECT 'Players'        AS t, COUNT(*) FROM "Players"
UNION ALL SELECT 'PlayerScores',   COUNT(*) FROM "PlayerScores"
UNION ALL SELECT 'WristbandTrans', COUNT(*) FROM "WristbandTrans"
UNION ALL SELECT 'GameLocations',  COUNT(*) FROM "GameLocations";
```

Compare to the MSSQL counts captured in §1.

### Foreign keys

```sql
-- Any orphaned PlayerScores?
SELECT COUNT(*) FROM "PlayerScores" ps
LEFT JOIN "Players" p ON p."PlayerID" = ps."PlayerID"
WHERE p."PlayerID" IS NULL;

-- Any wristbands pointing at a missing location?
SELECT COUNT(*) FROM "WristbandTrans" wt
LEFT JOIN "Locations" l ON l."LocationID" = wt."LocationID"
WHERE wt."LocationID" IS NOT NULL AND l."LocationID" IS NULL;

-- List enforced constraints
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  contype = 'f'
ORDER  BY conrelid::regclass::text;
```

### Spot checks

- `GET /api/stats/...` endpoints return sane numbers against the new DB.
- A known player row round-trips via `GET /api/players/:id`.
- Creating a new wristband + score works end-to-end.

## 7. Cutover

1. Stop writes to SQL Server (scale API down or enable maintenance mode).
2. Re-run the delta load from MSSQL if the migration spanned multiple hours.
3. Flip `.env` `DATABASE_*` to the PG host and restart the API.
4. Watch `logs/` for the first 15 minutes; keep the MSSQL snapshot for rollback.

## Rollback

`.env` is the only cutover switch — point it back at MSSQL, revert the backend
to the pre-migration branch, and restart. The MSSQL backup taken in §1 is the
authoritative rollback artifact.
