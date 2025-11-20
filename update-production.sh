#!/bin/bash

# Team Submarine Digital Signage - Production Update Script
# Run this on the production server to pull latest changes and rebuild

set -e  # Exit on error

echo "=========================================="
echo "TeamSub-TV Production Update"
echo "=========================================="
echo ""

# Step 1: Pull latest changes
echo "📥 Step 1/4: Pulling latest code from Git..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to pull from Git"
    echo "Tip: Make sure you have committed and pushed your changes"
    exit 1
fi

echo "✅ Code updated"
echo ""

# Step 2: Rebuild containers
echo "🔨 Step 2/4: Rebuilding Docker containers..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build containers"
    exit 1
fi

echo "✅ Containers rebuilt"
echo ""

# Step 3: Restart services
echo "🔄 Step 3/4: Restarting services..."
docker-compose down
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to start containers"
    exit 1
fi

echo "✅ Services restarted"
echo ""

# Step 4: Verify deployment
echo "✅ Step 4/4: Verifying deployment..."
sleep 5  # Give services a moment to start

echo ""
docker-compose ps
echo ""

echo "=========================================="
echo "🎉 Update Complete!"
echo "=========================================="
echo ""
echo "Check the services above to ensure they're all running."
echo ""
echo "Useful commands:"
echo "  View logs:          docker-compose logs -f"
echo "  Check backend:      docker-compose logs -f backend"
echo "  Check admin:        docker-compose logs -f frontend-admin"
echo "  Check display:      docker-compose logs -f frontend-display"
echo ""
