#!/bin/bash
set -e

echo "🔨 Building..."
npm run build

echo "📦 Deploying standalone build..."
rsync -avz --delete .next/standalone/ drmorocz1@152.53.66.114:~/public_html/

echo "📦 Deploying static assets..."
rsync -avz .next/static drmorocz1@152.53.66.114:~/public_html/.next/

echo "📦 Deploying public assets..."
rsync -avz public/ drmorocz1@152.53.66.114:~/public_html/public/

echo "📦 Deploying environment variables..."
rsync -avz .env.local drmorocz1@152.53.66.114:~/public_html/.env

echo "🔄 Restarting server..."
ssh drmorocz1@152.53.66.114 "pkill -f 'node server.js' || true; sleep 2"

echo "✅ Deploy complete! Server will auto-restart."
