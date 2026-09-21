#!/bin/bash
# Entrypoint script with DB sync and graceful shutdown

set -e

snapshot_enabled="${SQLITE_SNAPSHOTS_ENABLED:-false}"
case "${snapshot_enabled,,}" in
  true|1|yes|on)
    echo "SQLite snapshots own database restore and export; skipping legacy DB sync."
    ;;
  *)
    /db-sync.sh startup
    trap 'echo "Received SIGTERM, syncing database..."; /db-sync.sh shutdown; exit 0' SIGTERM
    ;;
esac

# Start the requested command (from compose) or default to /start
"${@:-/start}" &

# Get the PID of the background process
APP_PID=$!

# Wait for the application process
wait $APP_PID
