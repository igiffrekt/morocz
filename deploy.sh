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

echo "🔄 Restarting server..."
ssh drmorocz1@152.53.66.114 "pm2 restart morocz || node public_html/server.js &"

echo "✅ Deploy complete!"
