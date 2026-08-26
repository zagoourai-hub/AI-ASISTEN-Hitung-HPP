# Backend Runbook

Scope: FastAPI backend, PostgreSQL, and Alembic migrations for M0neyku.

Last verified: 2026-08-22. Project task status: FE 20/20 and BE 31/31 completed.
Security evidence: [`SECURITY-AUDIT.md`](../SECURITY-AUDIT.md).

## Required environment

Set `HPP_DATABASE_URL` and `HPP_SECRET_KEY` through the deployment secret
store. The application validates the PostgreSQL `asyncpg` URL, requires a
minimum 32-character secret, and applies
`HPP_DATABASE_COMMAND_TIMEOUT_SECONDS` (default `10`). Never put credentials
in this document, the repository, logs, or an OpenAPI response.

## Local Docker Compose

The project Compose setup runs PostgreSQL and the FastAPI backend. The backend
waits for a healthy database, applies `alembic upgrade head`, then starts
Uvicorn on `http://localhost:8000`.

```bash
cp docker.env.example .env
# Replace POSTGRES_PASSWORD and HPP_SECRET_KEY with local-only values.
docker compose up -d --build --wait
curl --fail http://localhost:8000/api/v1/health
```

Stop the services without deleting the database volume:

```bash
docker compose down
```

Do not add `-v` unless deleting the local PostgreSQL data is intentional.

## Migration

Run from `backend/` after taking a backup and confirming the target release:

```bash
HPP_DATABASE_URL="$PRODUCTION_DATABASE_URL" \
HPP_SECRET_KEY="$PRODUCTION_SECRET_KEY" \
./.venv/bin/alembic upgrade head
```

Verify migration SQL without connecting to PostgreSQL:

```bash
HPP_DATABASE_URL='postgresql+asyncpg://ci:ci@localhost:5432/hpp' \
HPP_SECRET_KEY="$CI_ONLY_SECRET" \
./.venv/bin/alembic upgrade head --sql > /tmp/hpp-upgrade.sql
```

Do not downgrade production as a routine deploy step. If rollback is required,
stop writes, preserve the backup, confirm the target revision, and run the
specific downgrade only after the restore drill owner approves it.

## Backup and restore

Use PostgreSQL-native custom-format backups with a deployment-only PostgreSQL
URL (`postgresql://`, not the application `postgresql+asyncpg://` URL):

```bash
backup_file="/secure/backups/hpp-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --file="$backup_file" --dbname="$PGDATABASE_URL"
```

Minimum pilot policy:

- Run one encrypted backup every day; retain at least the agreed recovery
  window and keep backups outside the application host.
- Record backup size, duration, PostgreSQL version, migration revision, and
  checksum in the backup inventory.
- Before go-live and at least monthly during the pilot, restore into an
  isolated database and run the backend verification command plus a read-only
  smoke test. Never run restore against the production database by accident.
- Treat a restore as successful only when the expected Alembic revision,
  tenant data boundaries, cost history, and audit records are present.

Restore drill command (isolated target only):

```bash
pg_restore --clean --if-exists --dbname="$RESTORE_DATABASE_URL" "$backup_file"
```

## Structured logs and request IDs

The backend emits JSON logs to stdout. Every request log and sanitized error
log contains `request_id`; the HTTP response carries the same value in
`X-Request-ID` and, for errors, `error.requestId`. Keep request IDs when
forwarding incidents. Do not log passwords, session tokens, database URLs, or
provider credentials.

## OpenAPI export

Export the current contract without a database connection:

```bash
cd backend
HPP_DATABASE_URL='postgresql+asyncpg://ci:ci@localhost:5432/hpp' \
HPP_SECRET_KEY="$CI_ONLY_SECRET" \
./.venv/bin/python scripts/export_openapi.py
```

The default artifact is `backend/docs/openapi.json`. Override it with
`HPP_OPENAPI_OUTPUT=/path/to/openapi.json` in CI or when comparing contracts.

## CI verification

The command requires only the Python environment and placeholder CI settings;
it does not connect to an external provider:

```bash
cd backend
HPP_DATABASE_URL='postgresql+asyncpg://ci:ci@localhost:5432/hpp' \
HPP_SECRET_KEY="$CI_ONLY_SECRET" \
bash scripts/verify_backend.sh
```

The command runs pytest, Ruff, Pyright, OpenAPI export/JSON validation, and
Alembic offline upgrade/downgrade generation.
