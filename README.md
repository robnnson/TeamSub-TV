# Team Submarine Digital Signage CMS

A production-ready, full-stack digital signage CMS built for Team Submarine operations.

## Quick Start with Docker

```bash
cd TeamSub-TV
docker-compose up -d
```

**Access:**
- **Admin Portal**: http://localhost:3001
  - Login: `admin@teamsub.navy.mil` / `Admin123!`
- **Display Client**: http://localhost:8081
  - Configure with API key from Admin Portal
- **Backend API**: http://localhost:3000

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
# Seed admin user, settings, and sample content
docker-compose exec backend npm run seed

# Alternative: seed from host machine
cd backend && npm run seed
```

This creates:
- Admin user: `admin@teamsub.navy.mil` / `Admin123!`
- Default FPCON and LAN settings
- Sample content and schedules

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
