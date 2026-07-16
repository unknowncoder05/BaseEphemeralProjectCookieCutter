#!/bin/sh
set -e

if [ -f package-lock.json ]; then
  npm ci --prefer-offline --no-audit "$@"
else
  npm install --no-audit "$@"
fi
