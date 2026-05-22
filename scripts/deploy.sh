#!/usr/bin/env bash
set -euo pipefail

SERVER="drmorocz1@152.53.66.114"
REMOTE_DIR="~/public_html"
LOCAL_ENV=".env.production.local"
EXPECTED_AUTH_URL="BETTER_AUTH_URL=https://drmoroczangela.hu"

if [ ! -f "$LOCAL_ENV" ]; then
  echo "ERROR: $LOCAL_ENV not found. Cannot deploy without prod env file." >&2
  exit 1
fi

if ! grep -qx "$EXPECTED_AUTH_URL" "$LOCAL_ENV"; then
  echo "ERROR: $LOCAL_ENV must contain exact line: $EXPECTED_AUTH_URL" >&2
  echo "Found: $(grep '^BETTER_AUTH_URL' "$LOCAL_ENV" || echo '(missing)')" >&2
  exit 1
fi

echo "==> Building..."
npm run build

echo "==> Syncing standalone..."
rsync -avz --delete .next/standalone/ "$SERVER:$REMOTE_DIR/"

echo "==> Syncing static..."
rsync -avz --delete .next/static "$SERVER:$REMOTE_DIR/.next/"

echo "==> Syncing public..."
rsync -avz --delete public/ "$SERVER:$REMOTE_DIR/public/"

echo "==> Copying prod env (rsync --delete wiped it)..."
scp "$LOCAL_ENV" "$SERVER:$REMOTE_DIR/.env.local"

echo "==> Verifying server env..."
REMOTE_AUTH_URL=$(ssh "$SERVER" "grep '^BETTER_AUTH_URL' $REMOTE_DIR/.env.local")
if [ "$REMOTE_AUTH_URL" != "$EXPECTED_AUTH_URL" ]; then
  echo "ERROR: Server env mismatch after copy. Got: $REMOTE_AUTH_URL" >&2
  exit 1
fi
echo "    OK: $REMOTE_AUTH_URL"

echo ""
echo "==> Deploy complete. Restart Node from the hosting panel to activate."
