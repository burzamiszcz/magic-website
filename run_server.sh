#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${1:-8765}"
HOST="${HOST:-127.0.0.1}"

echo "Serving $(pwd) at http://${HOST}:${PORT}/"
echo "Press Ctrl+C to stop."

exec python3 -m http.server "$PORT" --bind "$HOST"
