# gamesJs

## Running

```
npm install
npm start        # production
npm run dev      # nodemon
```

## Database

Backed by PostgreSQL (formerly SQL Server). Schema is managed by Sequelize
models + Umzug migrations (`scripts/runMigrations.js`). Models in `models/*.js`
are auto-synced at startup via `sequelize.sync()` (see `models/index.js`).

### Required environment variables (`./.env`)

| Variable            | Description                               | Default |
| ------------------- | ----------------------------------------- | ------- |
| `DATABASE_USERNAME` | PostgreSQL user                           | —       |
| `DATABASE_PASSWORD` | PostgreSQL password                       | —       |
| `DATABASE_DATABASE` | PostgreSQL database name                  | —       |
| `DATABASE_HOST`     | PostgreSQL host                           | —       |
| `DATABASE_PORT`     | PostgreSQL port                           | `5432`  |

Example `.env` (do **not** commit real credentials):

```
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=replace-me
DATABASE_DATABASE=games
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

### Running migrations

```
node scripts/runMigrations.js
```

## SQL Server → PostgreSQL data migration

See [docs/postgres-migration.md](docs/postgres-migration.md) for the full
migration runbook.
