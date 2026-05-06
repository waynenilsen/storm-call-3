#!/bin/bash

set -euo pipefail

echo "Stopping workspace..."
echo "Killing all containers..."
docker compose down --remove-orphans
echo "Killing all containers... done"

echo "Searching for orphaned dev server processes..."
if [ ! -f .env ]; then
  echo "No .env file; skipping dev server cleanup."
else
  PORT=$(grep -E "^PORT=" .env | cut -d '=' -f 2- | tr -d ' \r' || true)
  if [ -z "${PORT:-}" ]; then
    echo "PORT not set in .env; skipping dev server cleanup."
  else
    echo "PORT: $PORT"
    # lsof exits 1 when nothing listens; pipefail + set -e would abort without capturing it.
    listeners=$(lsof -ti :"$PORT" 2>/dev/null || true)
    if [ -z "$listeners" ]; then
      echo "No process listening on port $PORT (dev server not running)."
    else
      echo "$listeners" | xargs kill -9 2>/dev/null || true
      echo "Stopped listener(s) on port $PORT."
    fi
  fi
fi
echo "Searching for orphaned dev server processes... done"

echo "cleaning up node_modules..."
rm -rf node_modules
echo "cleaning up node_modules... done"


echo "Workspace stopped"