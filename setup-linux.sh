#!/bin/bash

# Team Submarine Digital Signage CMS - Linux Setup Script
# This script generates crypto keys, starts containers, and seeds the database

set -e  # Exit on error

echo "=========================================="
echo "Team Submarine Digital Signage CMS Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is not installed. Please install OpenSSL first."
    exit 1
fi

echo "✅ All prerequisites found"
echo ""

# Step 1: Generate crypto keys and create .env file
echo "🔐 Step 1/4: Generating crypto keys and creating .env file..."
ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  Warning: .env file already exists. Creating backup as .env.backup"
    cp .env .env.backup
fi

# Create .env file in root directory (for docker-compose)
cat > .env << EOF
# Application
NODE_ENV=development
PORT=3000

# Database (Docker uses these defaults)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=signage
DB_PASSWORD=signage_password
DB_DATABASE=signage_cms

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (Auto-generated)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# Encryption Key (Auto-generated)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# CORS
CORS_ORIGIN=http://localhost:3001

# Admin Portal
ADMIN_PORT=3001

# Display Port
DISPLAY_PORT=8081

# External API Keys (Optional - for weather features)
# OPENWEATHER_API_KEY=your_key_here
# WMATA_API_KEY=your_key_here
# TOMTOM_API_KEY=your_key_here
EOF

echo "✅ Environment file created with auto-generated secrets"
echo "   Location: .env (root directory)"
echo ""

# Step 2: Start Docker containers
echo "🐳 Step 2/4: Starting Docker containers..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to start Docker containers"
    exit 1
fi

echo "✅ Docker containers started"
echo ""

# Step 3: Wait for services to be ready
echo "⏳ Step 3/4: Waiting for services to be ready (15 seconds)..."
sleep 15
echo "✅ Services should be ready"
echo ""

# Step 4: Seed the database
echo "🌱 Step 4/4: Seeding database..."
docker-compose exec -T backend npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to seed database"
    echo "Note: You can manually seed later with: docker-compose exec backend npm run seed"
    exit 1
fi

echo "✅ Database seeded successfully"
echo ""

# Display access information
echo "=========================================="
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "Access the system at:"
echo "  📊 Admin Portal:    http://localhost:3001"
echo "     Login:          admin@teamsub.navy.mil / Admin123!"
echo ""
echo "  🖥️  Display Client:  http://localhost:8081"
echo "     (Configure with API key from Admin Portal)"
echo ""
echo "  🔧 Backend API:     http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  View logs:          docker-compose logs -f"
echo "  Stop containers:    docker-compose down"
echo "  Restart:            docker-compose restart"
echo ""
