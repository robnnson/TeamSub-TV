# Team Submarine Digital Signage CMS

A production-ready, full-stack digital signage CMS built for Team Submarine operations.

## Getting Started (Linux/Ubuntu)

### Automated Setup

Run the setup script to automatically configure everything:

```bash
chmod +x setup-linux.sh
./setup-linux.sh
```

This script will:
- ✅ Check for Docker, Docker Compose, and OpenSSL
- 🔐 Generate secure `ENCRYPTION_KEY` and `JWT_SECRET`
- 🐳 Start all Docker containers
- 🌱 Seed the database with admin user and sample data
- 📊 Display access URLs and login credentials

**Alternative one-liner** (if you prefer not to use the script):
```bash
cp .env.example .env && sed -i "s/your-jwt-secret-here-replace-with-random-string/$(openssl rand -hex 32)/" .env && sed -i "s/your-jwt-refresh-secret-here-replace-with-random-string/$(openssl rand -hex 32)/" .env && sed -i "s/your-encryption-key-here-replace-with-random-string/$(openssl rand -hex 32)/" .env && docker-compose up -d && sleep 15 && docker-compose exec -T backend npm run seed
```

### Manual Setup (Step-by-Step)

1. **Create Environment File**
   ```bash
   # Copy the example file
   cp .env.example .env

   # Generate secure keys and update .env
   sed -i "s/your-jwt-secret-here-replace-with-random-string/$(openssl rand -hex 32)/" .env
   sed -i "s/your-jwt-refresh-secret-here-replace-with-random-string/$(openssl rand -hex 32)/" .env
   sed -i "s/your-encryption-key-here-replace-with-random-string/$(openssl rand -hex 32)/" .env
   ```

2. **Start Docker Containers**
   ```bash
   docker-compose up -d
   ```

3. **Seed Database**
   ```bash
   # Wait for containers to be ready (about 15 seconds)
   sleep 15

   # Seed the database
   docker-compose exec backend npm run seed
   ```

**Note**: The `.env` file should be in the **root directory**, not in the `backend/` folder. Docker Compose reads environment variables from the root `.env` file.

### Access the System

- **Admin Portal**: http://localhost:3001
  - Login: `admin@teamsub.navy.mil` / `Admin123!`
- **Display Client**: http://localhost:8081
  - Configure with API key from Admin Portal
- **Backend API**: http://localhost:3000

## Quick Start with Docker (Windows/Mac)

```bash
# 1. Copy and configure environment file
cp .env.example .env
# Edit .env and replace the placeholder secrets with actual values

# 2. Start containers
docker-compose up -d

# 3. Seed database
docker-compose exec backend npm run seed
```

**Important**: The `.env` file must be in the **root directory** and must contain valid `ENCRYPTION_KEY`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` values. Use `openssl rand -hex 32` to generate secure 64-character hex strings for these values.

## System Status

✅ **Backend API** - 58+ REST endpoints with JWT auth
✅ **Admin Portal** - Full content, display, schedule, and settings management
✅ **Display Frontend** - Real-time content playback with SSE updates
✅ **Docker Deployment** - Complete multi-container setup

## Features

### Admin Portal (Port 8080)
- **Content Management**: Upload images, videos, create text content
- **Display Management**: Register and monitor displays with API keys
- **Schedule Management**: Create recurring schedules with priority support
- **Settings**: FPCON status and LAN status management
- **Dashboard**: Real-time statistics and quick actions

### Display Client (Port 8081)
- **API Key Authentication**: Secure display registration
- **Multi-Content Support**: Images, videos, slideshows, and text
- **Real-time Updates**: SSE-based content synchronization
- **Auto-scheduling**: Priority-based content switching
- **Heartbeat Monitoring**: Auto-updates display online status

### Backend API (Port 3000)
- **Authentication**: JWT with refresh tokens
- **Content Storage**: File uploads with metadata
- **Scheduling**: BullMQ-based job queue with recurrence rules
- **Real-time Events**: SSE for display updates
- **Settings**: Encrypted storage for sensitive data

## Architecture

```
TeamSub-TV/
├── backend/                 # NestJS API
├── frontend-admin/          # React admin dashboard
├── frontend-display/        # React display client
├── media/                   # Uploaded content storage
└── docker-compose.yml       # Full stack deployment
```

## Development

### Install Dependencies

```bash
# Backend
cd backend && npm install

# Admin Portal
cd frontend-admin && npm install

# Display Client
cd frontend-display && npm install
```

### Database Setup

After starting the containers, seed the database with initial data:

```bash
# Seed everything (recommended for first-time setup)
docker-compose exec backend npm run seed

# Or seed individually:
docker-compose exec backend npm run seed:settings   # FPCON and LAN settings
docker-compose exec backend npm run seed:admin      # Admin user
docker-compose exec backend npm run seed:content    # Sample content
docker-compose exec backend npm run seed:schedules  # Sample schedules

# Alternative: seed from host machine (if running locally)
cd backend && npm run seed
```

**What gets created:**
- **Admin user**: `admin@teamsub.navy.mil` / `Admin123!`
- **Settings**: Default FPCON (Normal) and LAN (Green) status
- **Sample content**: Welcome message, announcements, test images
- **Sample schedules**: Default content rotation schedule

### Run Locally

```bash
# Backend (requires PostgreSQL and Redis)
cd backend && npm run start:dev

# Admin Portal
cd frontend-admin && npm run dev

# Display Client
cd frontend-display && npm run dev
```

## Documentation

- [API Documentation](backend/API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Implementation Status](IMPLEMENTATION_STATUS.md) - Feature checklist

## Tech Stack

- **Backend**: NestJS, TypeScript, PostgreSQL, Redis, BullMQ
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Deployment**: Docker, Nginx
- **Auth**: JWT, bcrypt
- **Real-time**: Server-Sent Events (SSE)

---

**Team Submarine Digital Signage CMS v1.0** - Built for operational excellence
