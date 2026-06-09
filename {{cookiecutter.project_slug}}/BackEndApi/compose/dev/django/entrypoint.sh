#!/bin/bash
# Dev entrypoint:
#   Reinstalls Python packages into /venv only when requirements hash changes,
#   then execs the requested command (start / start-celeryworker / etc.).
#
# Repo pulls are handled externally by the deployment service (SSM commands)
# before containers are started — never from inside the container.

set -e

# ── Python package install (hash-based, idempotent) ──────────────────────────
# /venv is a named Docker volume shared by all backend services so packages
# installed here are available to celery-worker and celery-beat too.
REQUIREMENTS_FILE="${REQUIREMENTS_FILE:-local.txt}"
REQ_PATH="/project/BackEndApi/requirements/${REQUIREMENTS_FILE}"
HASH_FILE="/venv/.req-hash"

if [ -f "${REQ_PATH}" ]; then
    CURRENT_HASH=$(sha256sum "${REQ_PATH}" | cut -d' ' -f1)
    CACHED_HASH=$(cat "${HASH_FILE}" 2>/dev/null || echo "")

    if [ "${CURRENT_HASH}" != "${CACHED_HASH}" ]; then
        echo "[dev] Requirements changed — installing packages..."
        pip install -r "${REQ_PATH}" 2>&1
        echo "${CURRENT_HASH}" > "${HASH_FILE}"
        echo "[dev] Packages installed."
    else
        echo "[dev] Requirements unchanged — skipping pip install."
        if ! python -c "import django" 2>/dev/null; then
            echo "[dev] venv corrupt despite matching hash — forcing reinstall..."
            pip install -r "${REQ_PATH}" 2>&1
            echo "${CURRENT_HASH}" > "${HASH_FILE}"
        fi
    fi
else
    echo "[dev] Requirements file not found at ${REQ_PATH} — skipping pip install."
fi

exec "$@"
