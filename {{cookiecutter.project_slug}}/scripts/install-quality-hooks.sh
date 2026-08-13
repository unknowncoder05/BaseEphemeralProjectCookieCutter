#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if ! command -v pre-commit >/dev/null 2>&1; then
  echo "CodeSwarm quality setup requires pre-commit 4.6.2." >&2
  echo "Install it with: python3 -m pip install --user 'pre-commit==4.6.2'" >&2
  exit 1
fi

pre-commit install --install-hooks --overwrite
echo "CodeSwarm quality hook installed."
