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
    # Host port reserved for this workspace (avoid collisions when many clones run Postgres locally).
    DATABASE_PORT=$((50000 + RANDOM % 10000))
    sed_inplace "s/DATABASE_PORT:5432/${DATABASE_PORT}:5432/g" docker-compose.yml
    sed_inplace "s/^DATABASE_PORT=.*/DATABASE_PORT=$DATABASE_PORT/" .env
    sed_inplace "s/@localhost:[0-9][0-9]*/@localhost:$DATABASE_PORT/g" .env
    docker compose down --remove-orphans
    docker compose up -d
    echo "docker-compose.yml generated and containers started. Waiting for postgres to be ready..."
    while ! docker exec storm-call-3-postgres-1 pg_isready -U postgres; do
      echo "Waiting for postgres to be ready..."
      sleep 1
    done
    echo "postgres is ready"
else
    echo "docker-compose.yml already exists"
fi
