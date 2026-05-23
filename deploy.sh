#!/usr/bin/env bash
# NOTE: The canonical deploy lives in scripts/deploy.sh (run via `npm run deploy`).
# This file used to be a second, divergent copy that deployed .env.local (local SANDBOX
# Stripe keys) over the server's LIVE keys — it caused a production incident on 2026-05-23.
# It now just delegates, so `bash deploy.sh` can never deploy the wrong env file again.
exec bash "$(dirname "$0")/scripts/deploy.sh" "$@"
