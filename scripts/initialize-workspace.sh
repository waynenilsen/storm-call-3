#!/bin/bash

set -euo pipefail

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

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -f docker-compose.yml ]; then
    echo "Generating docker-compose.yml"
    cp docker-compose.template.yml docker-compose.yml
    
else
    echo "docker-compose.yml already exists"
fi


# Host port reserved for this workspace (avoid collisions when many clones run Postgres locally).
DATABASE_PORT=$((50000 + RANDOM % 10000))
# Compose may already have a numeric "HOST:5432"; keep it aligned with DATABASE_PORT whenever we init.
sed_inplace "s|\"DATABASE_PORT:5432\"|\"${DATABASE_PORT}:5432\"|g" docker-compose.yml
sed_inplace "s|\"[0-9][0-9]*:5432\"|\"${DATABASE_PORT}:5432\"|g" docker-compose.yml
sed_inplace "s/^DATABASE_PORT=.*/DATABASE_PORT=$DATABASE_PORT/" .env
sed_inplace "s/@localhost:[0-9][0-9]*/@localhost:$DATABASE_PORT/g" .env
docker compose down --remove-orphans
docker compose up -d
echo "docker-compose.yml generated and containers started. Waiting for postgres to be ready..."
# Use service name `postgres`, not `${COMPOSE_PROJECT_NAME}-postgres-1` — project name comes from the
# parent directory (e.g. sarajevo-postgres-1), so a fixed repo slug breaks clones in other paths.
while ! docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
    echo "Waiting for postgres to be ready..."
    sleep 1
done
echo "postgres is ready"

# Port for web app random from 50000 to 60000
PORT=$((50000 + RANDOM % 10000))
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
echo "--------------------------------"