#!/bin/bash

set -euo pipefail

# shellcheck source=./find-free-port.sh
source "$(dirname "$0")/find-free-port.sh"

echo "Installing dependencies..."
bun i
echo "Installing dependencies... done"

sed_inplace() {
  if [ "$(uname -s)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# wait_for <label> <service> <timeout_seconds> -- <command...>
# Polls <command> once per second until it succeeds or the timeout elapses.
# On timeout, dumps diagnostics for <service> and exits non-zero so init fails fast.
wait_for() {
  local label="$1" service="$2" timeout="$3"
  shift 3
  if [ "${1:-}" = "--" ]; then shift; fi
  local elapsed=0
  while ! "$@" >/dev/null 2>&1; do
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "ERROR: ${label} not ready after ${timeout}s — dumping diagnostics:" >&2
      echo "--- docker compose ps ---" >&2
      docker compose ps >&2 || true
      echo "--- docker compose logs ${service} (last 100 lines) ---" >&2
      docker compose logs --tail=100 "${service}" >&2 || true
      echo "--- last failing command stderr ---" >&2
      "$@" >&2 || true
      exit 1
    fi
    echo "Waiting for ${label} to be ready... (${elapsed}s)"
    sleep 1
    elapsed=$((elapsed + 1))
  done
}

if [ ! -f .env ]; then
  cp .env.example .env
fi

# Append `KEY=VALUE` to .env when KEY is not already present. Lets us add new
# vars to .env.example over time without forcing existing workspaces to wipe .env.
ensure_env_kv() {
  local key="$1" value="$2"
  grep -q "^${key}=" .env || echo "${key}=${value}" >> .env
}

# docker-compose.yml is gitignored and fully generated from the template — always
# overwrite it so newly-added services in the template land in existing workspaces.
echo "Generating docker-compose.yml from template"
cp docker-compose.template.yml docker-compose.yml


# Host port reserved for this workspace (avoid collisions when many clones run Postgres locally).
DATABASE_PORT=$(find_free_port 50000 60000 50)
# Compose may already have a numeric "HOST:5432"; keep it aligned with DATABASE_PORT whenever we init.
sed_inplace "s|\"DATABASE_PORT:5432\"|\"${DATABASE_PORT}:5432\"|g" docker-compose.yml
sed_inplace "s|\"[0-9][0-9]*:5432\"|\"${DATABASE_PORT}:5432\"|g" docker-compose.yml
sed_inplace "s/^DATABASE_PORT=.*/DATABASE_PORT=$DATABASE_PORT/" .env
sed_inplace "s/@localhost:[0-9][0-9]*/@localhost:$DATABASE_PORT/g" .env

# MinIO host ports — same convention: random per-workspace, two-pass sed for re-init.
# Re-rolls if either port collides with DATABASE_PORT or the other minio port.
MINIO_API_PORT=$(find_free_port 50000 60000 50)
while [ "$MINIO_API_PORT" = "$DATABASE_PORT" ]; do
  MINIO_API_PORT=$(find_free_port 50000 60000 50)
done
MINIO_CONSOLE_PORT=$(find_free_port 50000 60000 50)
while [ "$MINIO_CONSOLE_PORT" = "$DATABASE_PORT" ] || [ "$MINIO_CONSOLE_PORT" = "$MINIO_API_PORT" ]; do
  MINIO_CONSOLE_PORT=$(find_free_port 50000 60000 50)
done
sed_inplace "s|\"MINIO_API_PORT:9000\"|\"${MINIO_API_PORT}:9000\"|g" docker-compose.yml
sed_inplace "s|\"[0-9][0-9]*:9000\"|\"${MINIO_API_PORT}:9000\"|g" docker-compose.yml
sed_inplace "s|\"MINIO_CONSOLE_PORT:9001\"|\"${MINIO_CONSOLE_PORT}:9001\"|g" docker-compose.yml
sed_inplace "s|\"[0-9][0-9]*:9001\"|\"${MINIO_CONSOLE_PORT}:9001\"|g" docker-compose.yml
# Make sure the keys exist in .env (older workspaces predate them) before we sed-replace.
ensure_env_kv MINIO_API_PORT 9000
ensure_env_kv MINIO_CONSOLE_PORT 9001
ensure_env_kv MINIO_ROOT_USER minioadmin
ensure_env_kv MINIO_ROOT_PASSWORD minioadmin
ensure_env_kv MINIO_ENDPOINT "http://localhost:9000"
sed_inplace "s/^MINIO_API_PORT=.*/MINIO_API_PORT=$MINIO_API_PORT/" .env
sed_inplace "s/^MINIO_CONSOLE_PORT=.*/MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT/" .env
sed_inplace "s|^MINIO_ENDPOINT=.*|MINIO_ENDPOINT=http://localhost:$MINIO_API_PORT|" .env

# MailHog host ports — same convention as MinIO. SMTP sink for dev/test, no production use.
# No readiness probe: mailhog starts fast, no other init step depends on it, and the image
# ships no shell tools to probe with cleanly.
MAILHOG_SMTP_PORT=$(find_free_port 50000 60000 50)
while [ "$MAILHOG_SMTP_PORT" = "$DATABASE_PORT" ] || [ "$MAILHOG_SMTP_PORT" = "$MINIO_API_PORT" ] || [ "$MAILHOG_SMTP_PORT" = "$MINIO_CONSOLE_PORT" ]; do
  MAILHOG_SMTP_PORT=$(find_free_port 50000 60000 50)
done
MAILHOG_UI_PORT=$(find_free_port 50000 60000 50)
while [ "$MAILHOG_UI_PORT" = "$DATABASE_PORT" ] || [ "$MAILHOG_UI_PORT" = "$MINIO_API_PORT" ] || [ "$MAILHOG_UI_PORT" = "$MINIO_CONSOLE_PORT" ] || [ "$MAILHOG_UI_PORT" = "$MAILHOG_SMTP_PORT" ]; do
  MAILHOG_UI_PORT=$(find_free_port 50000 60000 50)
done
sed_inplace "s|\"MAILHOG_SMTP_PORT:1025\"|\"${MAILHOG_SMTP_PORT}:1025\"|g" docker-compose.yml
sed_inplace "s|\"[0-9][0-9]*:1025\"|\"${MAILHOG_SMTP_PORT}:1025\"|g" docker-compose.yml
sed_inplace "s|\"MAILHOG_UI_PORT:8025\"|\"${MAILHOG_UI_PORT}:8025\"|g" docker-compose.yml
sed_inplace "s|\"[0-9][0-9]*:8025\"|\"${MAILHOG_UI_PORT}:8025\"|g" docker-compose.yml
ensure_env_kv MAILHOG_SMTP_PORT 1025
ensure_env_kv MAILHOG_UI_PORT 8025
ensure_env_kv SMTP_HOST localhost
ensure_env_kv SMTP_PORT 1025
sed_inplace "s/^MAILHOG_SMTP_PORT=.*/MAILHOG_SMTP_PORT=$MAILHOG_SMTP_PORT/" .env
sed_inplace "s/^MAILHOG_UI_PORT=.*/MAILHOG_UI_PORT=$MAILHOG_UI_PORT/" .env
sed_inplace "s/^SMTP_PORT=.*/SMTP_PORT=$MAILHOG_SMTP_PORT/" .env

docker compose down --remove-orphans
docker compose up -d
echo "docker-compose.yml generated and containers started."
# Use service name `postgres`, not `${COMPOSE_PROJECT_NAME}-postgres-1` — project name comes from the
# parent directory (e.g. sarajevo-postgres-1), so a fixed repo slug breaks clones in other paths.
wait_for "postgres" "postgres" 30 -- docker compose exec -T postgres pg_isready -U postgres
echo "postgres is ready"

# mc ships inside the minio image. A successful alias-set proves the API is up
# and root creds are accepted. Idempotent on re-init.
wait_for "minio" "minio" 30 -- docker compose exec -T minio mc alias set local http://localhost:9000 minioadmin minioadmin
echo "minio is ready"

echo "Ensuring buckets exist..."
docker compose exec -T minio mc mb -p local/public
docker compose exec -T minio mc mb -p local/private
echo "Buckets ready: public, private"

# Port for web app, also picked from the 50000-60000 range. Re-rolls if it
# collides with any port we've already assigned for this workspace.
PORT=$(find_free_port 50000 60000 50)
while [ "$PORT" = "$DATABASE_PORT" ] || [ "$PORT" = "$MINIO_API_PORT" ] || [ "$PORT" = "$MINIO_CONSOLE_PORT" ] || [ "$PORT" = "$MAILHOG_SMTP_PORT" ] || [ "$PORT" = "$MAILHOG_UI_PORT" ]; do
  PORT=$(find_free_port 50000 60000 50)
done
sed_inplace "s/^PORT=.*/PORT=$PORT/" .env
echo "Web app port set to $PORT"

echo "Running database migrations..."
bun x dotenv -- bun x prisma migrate deploy
echo "Database migrations applied"


echo "--------------------------------"
echo "Workspace initialized"
echo "--------------------------------"
echo "Web app port: $PORT"
echo "Database port: $DATABASE_PORT"
echo "MinIO API port: $MINIO_API_PORT"
echo "MinIO Console port: $MINIO_CONSOLE_PORT"
echo "MailHog SMTP port: $MAILHOG_SMTP_PORT"
echo "MailHog UI port: $MAILHOG_UI_PORT"
echo "--------------------------------"