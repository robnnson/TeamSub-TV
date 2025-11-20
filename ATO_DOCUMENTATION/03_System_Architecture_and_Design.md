# SYSTEM ARCHITECTURE AND DESIGN DOCUMENT
## TeamSub-TV Digital Signage Content Management System

**Classification:** UNCLASSIFIED
**Version:** 1.0
**Date:** November 20, 2025

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Physical Architecture](#3-physical-architecture)
4. [Logical Architecture](#4-logical-architecture)
5. [Network Architecture](#5-network-architecture)
6. [Application Architecture](#6-application-architecture)
7. [Data Architecture](#7-data-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Integration Architecture](#9-integration-architecture)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. EXECUTIVE SUMMARY

TeamSub-TV is a containerized digital signage content management system deployed on a Windows Server 2025 host with Hyper-V virtualization. The system runs within an Ubuntu Server 20.04 virtual machine using Docker containers for application isolation and portability.

**Key Architectural Features:**
- Multi-tier containerized architecture (presentation, application, data layers)
- Role-based access control with JWT authentication
- Real-time content distribution via Server-Sent Events (SSE)
- Encrypted storage of sensitive credentials (AES-256-GCM)
- Microservices pattern with independent scaling capability
- PostgreSQL for persistent data, Redis for job queuing and caching

**Deployment Model:** On-premises, single-server, virtualized, containerized

---

## 2. SYSTEM OVERVIEW

### 2.1 Purpose

TeamSub-TV provides centralized digital signage management for Navy submarine team facilities. The system enables authorized administrators to create content, manage display terminals, configure schedules, and monitor operational status displays (FPCON/LAN indicators).

### 2.2 Scope

The system consists of:
- **Backend API**: NestJS-based REST API with real-time event streaming
- **Admin Portal**: React-based web application for administrative functions
- **Display Client**: React-based web application for content playback
- **Database**: PostgreSQL relational database for persistent storage
- **Cache/Queue**: Redis for caching and asynchronous job processing

### 2.3 Design Principles

1. **Security by Design**: Authentication, authorization, and encryption integrated from the start
2. **Separation of Concerns**: Microservices architecture with clear boundaries
3. **Least Privilege**: Role-based access with minimal permissions
4. **Defense in Depth**: Multiple security layers (network, application, data)
5. **Fail Secure**: System fails to secure state (deny by default)
6. **Auditability**: Comprehensive logging of security-relevant events
7. **Maintainability**: Clean code architecture with modular design
8. **Scalability**: Containerized services can be scaled independently

---

## 3. PHYSICAL ARCHITECTURE

### 3.1 Hardware Platform

```
┌──────────────────────────────────────────────────────────────┐
│                   HP ProLiant Server                         │
│                                                              │
│  Hardware Specifications:                                    │
│  • Processor: [TBD - Multi-core Intel Xeon recommended]     │
│  • RAM: [TBD - Minimum 16GB recommended]                    │
│  • Storage: [TBD - Minimum 500GB SSD recommended]           │
│  • Network: [TBD - Gigabit Ethernet]                        │
│  • Redundancy: [TBD - RAID configuration if applicable]     │
│                                                              │
│  Operating System: Windows Server 2025                       │
│  Hypervisor: Hyper-V Role                                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Co-resident Applications                    │ │
│  │                                                        │ │
│  │  • MagicInfo Server (Signage Hardware Management)     │ │
│  │    - Manages Samsung MagicInfo-compatible displays    │ │
│  │    - Separate application, shared host               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        Hyper-V Virtual Machine (Guest)                 │ │
│  │                                                        │ │
│  │  Virtual Hardware:                                    │ │
│  │  • vCPU: [TBD - Recommend 4 vCPU minimum]            │ │
│  │  • vRAM: [TBD - Recommend 8GB minimum]               │ │
│  │  • vDisk: [TBD - Recommend 200GB minimum]            │ │
│  │  • vNIC: [TBD - Virtual network adapter]             │ │
│  │                                                        │ │
│  │  Guest OS: Ubuntu Server 20.04 LTS (64-bit)          │ │
│  │  Docker: Engine 24.x+ with Compose v3                │ │
│  │                                                        │ │
│  │  [See Section 4 for containerized components]        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

External Connections:
├─ Admin Users (PC/Laptops) → Network → Port 8080
├─ Display Terminals (Samsung MagicInfo) → Network → Port 8081
└─ External APIs (Optional) ← Network → HTTPS Outbound
```

### 3.2 Display Terminals

**Display Hardware:**
- Samsung MagicInfo-compatible displays
- Network connectivity (wired Ethernet preferred, wireless capable)
- Built-in web browser (Chrome-based or compatible)
- Minimum 1920x1080 resolution recommended

**Display Configuration:**
- Display browser navigates to: `http://<server-ip>:8081`
- API key authentication configured in display settings
- Auto-refresh enabled for content updates
- Kiosk mode recommended (full-screen, no UI chrome)

### 3.3 Admin Workstations

**Minimum Requirements:**
- Windows 10/11, macOS 10.15+, or Linux
- Modern web browser (Chrome 90+, Edge 90+, Firefox 88+)
- Network connectivity to server
- Display resolution: 1280x720 minimum, 1920x1080 recommended

---

## 4. LOGICAL ARCHITECTURE

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   Admin Portal       │      │   Display Client     │   │
│  │   (React SPA)        │      │   (React SPA)        │   │
│  │                      │      │                      │   │
│  │  • Content Mgmt      │      │  • Content Display   │   │
│  │  • Display Mgmt      │      │  • Auto Rotation     │   │
│  │  • Schedule Mgmt     │      │  • Heartbeat        │   │
│  │  • User Mgmt         │      │  • Real-time Updates│   │
│  │  • Dashboard         │      │                      │   │
│  └──────────┬───────────┘      └──────────┬───────────┘   │
│             │                              │               │
└─────────────┼──────────────────────────────┼───────────────┘
              │                              │
              │  JWT Auth                    │  API Key Auth
              │  REST API                    │  REST API + SSE
              │                              │
┌─────────────▼──────────────────────────────▼───────────────┐
│                   APPLICATION LAYER                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Backend API (NestJS)                   │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         Authentication Module              │  │   │
│  │  │  • Local Strategy (email/password)         │  │   │
│  │  │  • JWT Strategy (access + refresh tokens)  │  │   │
│  │  │  • Display API Key Strategy                │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         Authorization Module               │  │   │
│  │  │  • Role-Based Access Control (RBAC)        │  │   │
│  │  │  • Roles: Admin, Standard                  │  │   │
│  │  │  • Guards: JWT, Roles, DisplayApiKey       │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┐    │   │
│  │  │ Users    │ Content  │ Displays │ Schedules│    │   │
│  │  │ Module   │ Module   │ Module   │ Module   │    │   │
│  │  └──────────┴──────────┴──────────┴──────────┘    │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┐    │   │
│  │  │ Settings │   SSE    │  Push    │  Audit   │    │   │
│  │  │ Module   │ Module   │  Notif   │  Module  │    │   │
│  │  └──────────┴──────────┴──────────┴──────────┘    │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         Common Services                     │  │   │
│  │  │  • Encryption Service (AES-256-GCM)        │  │   │
│  │  │  • Validation Pipe (input validation)      │  │   │
│  │  │  • Exception Filters (error handling)      │  │   │
│  │  │  • Logging Service (Winston)               │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      DATA LAYER                             │
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   PostgreSQL 16      │      │      Redis 7         │   │
│  │   (Persistent Data)  │      │   (Cache & Queue)    │   │
│  │                      │      │                      │   │
│  │  • Users             │      │  • BullMQ Jobs       │   │
│  │  • Displays          │      │  • Session Cache     │   │
│  │  • Content Metadata  │      │  • Rate Limiting     │   │
│  │  • Schedules         │      │                      │   │
│  │  • Settings          │      │                      │   │
│  │  • Audit Logs        │      │                      │   │
│  │  • Push Subscriptions│      │                      │   │
│  └──────────────────────┘      └──────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │         File System Storage (Docker Volume)       │     │
│  │  • /app/media/images/                             │     │
│  │  • /app/media/videos/                             │     │
│  │  • /app/media/thumbnails/                         │     │
│  │  • /app/media/screenshots/                        │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Component Interactions

**User Authentication Flow:**
```
Admin User → Login → Auth Module → Validate Credentials → Generate JWT
          ← JWT Tokens ← Auth Module ← bcrypt.compare() ← User Entity

Subsequent Requests:
Admin User → API Request + JWT → JWT Guard → Validate Token → Controller
          ← Response ← Controller ← Roles Guard ← Extract Role from JWT
```

**Content Upload Flow:**
```
Admin → Upload File → Content Controller → Validate File → Save to /media
     ← Content ID ←  Content Service ← Generate Thumbnail ← Create DB Record
                                     ↓
                                SSE Service → Broadcast "content.created"
                                     ↓
                              Display Clients ← SSE Event → Refresh Content
```

**Display Heartbeat Flow:**
```
Display Client → POST /api/displays/:id/heartbeat + API Key
              → Display API Key Guard → Decrypt & Validate Key
              → Displays Service → Update lastHeartbeat, status="online"
              → Save to DB → Check for offline→online transition
              → If transition: SSE Service → Broadcast "display.online"
              → If transition: Push Notification Service → Send notification
```

### 4.3 Module Decomposition

**Auth Module:**
- Controllers: `auth.controller.ts` (login, register, refresh, logout, me)
- Services: `auth.service.ts` (token generation, validation, refresh)
- Strategies: `local.strategy.ts`, `jwt.strategy.ts`
- Guards: `local-auth.guard.ts`, `jwt-auth.guard.ts`

**Users Module:**
- Controllers: `users.controller.ts` (CRUD operations, password change)
- Services: `users.service.ts` (user management, role assignment)
- Entities: `user.entity.ts` (User schema with bcrypt hashing)

**Content Module:**
- Controllers: `content.controller.ts` (upload, retrieve, delete, stats)
- Services: `content.service.ts`, `thumbnail.service.ts`, `content-tasks.service.ts`
- Entities: `content.entity.ts` (Content metadata)
- File handling: Multipart uploads, MIME validation, size limits

**Displays Module:**
- Controllers: `displays.controller.ts` (register, pairing, heartbeat, screenshot)
- Services: `displays.service.ts` (API key generation, health monitoring)
- Entities: `display.entity.ts` (Display config, metrics, error logs)
- Guards: `display-api-key.guard.ts` (API key validation)

**Schedules Module:**
- Controllers: `schedules.controller.ts` (CRUD operations)
- Services: `schedules.service.ts` (RRULE parsing, BullMQ job scheduling)
- Entities: `schedule.entity.ts` (Schedule definitions)

**Settings Module:**
- Controllers: `settings.controller.ts` (get, update settings)
- Services: `settings.service.ts` (encrypted storage for sensitive settings)
- Entities: `setting.entity.ts` (Key-value pairs with encryption flag)

**SSE Module:**
- Controllers: `sse.controller.ts` (SSE stream endpoints)
- Services: `sse.service.ts` (event broadcasting, connection management)
- Events: content changes, display status, settings updates, FPCON/LAN changes

**Push Notifications Module:**
- Controllers: `push-notifications.controller.ts` (subscribe, test, broadcast)
- Services: `push-notifications.service.ts` (VAPID, web-push protocol)
- Entities: `push-subscription.entity.ts` (Subscription storage with preferences)

---

## 5. NETWORK ARCHITECTURE

### 5.1 Network Topology

```
┌──────────────────────────────────────────────────────────────┐
│               Navy Internal Network (NMCI)                   │
│                  192.168.x.x/24 (example)                    │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Admin     │  │   Display   │  │   Display   │        │
│  │Workstation 1│  │Terminal 1   │  │Terminal 2   │  ...   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Network   │
                    │   Switch    │
                    └──────┬──────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│             Windows Server 2025 Host                        │
│              HP ProLiant Server                             │
│              IP: [Assigned by network]                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Hyper-V Virtual Switch                     │  │
│  │           (Bridged to physical adapter)              │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │       Ubuntu Server 20.04 VM                        │  │
│  │       IP: [Assigned by network via DHCP or static]  │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │    Docker Bridge Network: signage-network    │  │  │
│  │  │    Subnet: 172.18.0.0/16 (example)           │  │  │
│  │  │                                              │  │  │
│  │  │  Container IPs (Docker internal DNS):       │  │  │
│  │  │  • backend:     172.18.0.2                  │  │  │
│  │  │  • postgres:    172.18.0.3                  │  │  │
│  │  │  • redis:       172.18.0.4                  │  │  │
│  │  │  • frontend-admin:   172.18.0.5             │  │  │
│  │  │  • frontend-display: 172.18.0.6             │  │  │
│  │  │                                              │  │  │
│  │  │  Port Mappings (VM → Container):            │  │  │
│  │  │  • VM:8080  → frontend-admin:80             │  │  │
│  │  │  • VM:8081  → frontend-display:80           │  │  │
│  │  │  • VM:3000  → backend:3000                  │  │  │
│  │  │  • VM:5432  → postgres:5432 (optional)      │  │  │
│  │  │  • VM:6379  → redis:6379 (optional)         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              │
              │ (Optional: External APIs)
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                         │
│  • openweathermap.org (Weather API)                         │
│  • api.wmata.com (Metro API)                                │
│  • api.tomtom.com (Maps API)                                │
│  • Push notification services (Browser vendors)             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Port and Protocol Matrix

| Source | Destination | Port | Protocol | Direction | Purpose | Encryption |
|--------|------------|------|----------|-----------|---------|------------|
| Admin Workstation | Ubuntu VM | 8080 | HTTP/HTTPS | Inbound | Admin Portal access | TLS (prod) |
| Display Terminal | Ubuntu VM | 8081 | HTTP/HTTPS | Inbound | Display Client access | TLS (prod) |
| Admin Portal (browser) | Ubuntu VM | 3000 | HTTP/HTTPS | Inbound | API requests (via nginx proxy) | TLS (prod) |
| Display Client (browser) | Ubuntu VM | 3000 | HTTP/HTTPS | Inbound | API + SSE (via nginx proxy) | TLS (prod) |
| Backend Container | Postgres Container | 5432 | PostgreSQL | Internal | Database queries | None (trusted) |
| Backend Container | Redis Container | 6379 | Redis | Internal | Cache/queue | None (trusted) |
| Admin/DBA (optional) | Ubuntu VM | 5432 | PostgreSQL | Inbound | Database admin (NOT recommended in prod) | Optional TLS |
| Admin (optional) | Ubuntu VM | 6379 | Redis | Inbound | Cache admin (NOT recommended in prod) | None |
| Backend Container | External APIs | 443 | HTTPS | Outbound | Weather, transit, maps data | TLS 1.2+ |
| Backend Container | Push Services | 443 | HTTPS | Outbound | Push notifications (VAPID) | TLS 1.2+ |
| Sysadmin | Ubuntu VM | 22 | SSH | Inbound | Remote administration | SSH v2 |

### 5.3 Network Security Controls

**Firewall Rules (Windows Firewall on Host):**
```
ALLOW TCP 8080 from Internal Network to Host IP (Admin Portal)
ALLOW TCP 8081 from Internal Network to Host IP (Display Client)
ALLOW TCP 3000 from Internal Network to Host IP (Backend API - optional if proxied)
ALLOW TCP 22 from Admin Network to VM IP (SSH admin access)
DENY  TCP 5432 from External (Database - internal only)
DENY  TCP 6379 from External (Redis - internal only)
ALLOW TCP 443 from VM IP to Internet (HTTPS outbound for APIs - optional)
DENY  ALL from Internet to Host (no inbound from Internet)
```

**Docker Network Isolation:**
- Containers communicate via internal bridge network (signage-network)
- No container has direct host network access
- Inter-container communication: DNS-based (postgres, redis, backend)
- Only backend container connects to postgres and redis
- Frontend containers proxy API requests to backend

**CORS Policy:**
- Configured origin: CORS_ORIGIN environment variable
- Recommended: `https://<server-fqdn>` or `https://<server-ip>`
- Development: `http://localhost:3001`
- Blocks cross-origin requests from unauthorized origins

---

## 6. APPLICATION ARCHITECTURE

### 6.1 Backend Architecture (NestJS)

**Framework:** NestJS 10.3.0 with Fastify adapter
**Language:** TypeScript 5.3
**Architecture Pattern:** Modular Monolith with Domain-Driven Design

**Module Structure:**
```
backend/src/
├── main.ts                       # Application entry point
├── app.module.ts                 # Root module
│
├── auth/                         # Authentication & Authorization
│   ├── auth.module.ts
│   ├── auth.controller.ts        # Login, register, refresh, logout
│   ├── auth.service.ts           # Token management
│   ├── strategies/
│   │   ├── local.strategy.ts     # Email/password validation
│   │   └── jwt.strategy.ts       # JWT token validation
│   └── decorators/
│       ├── public.decorator.ts   # Mark endpoints as public
│       └── roles.decorator.ts    # Mark required roles
│
├── users/                        # User Management
│   ├── users.module.ts
│   ├── users.controller.ts       # CRUD operations
│   ├── users.service.ts          # Business logic
│   └── entities/
│       └── user.entity.ts        # User database model
│
├── content/                      # Content Management
│   ├── content.module.ts
│   ├── content.controller.ts     # Upload, retrieve, delete
│   ├── content.service.ts        # Content CRUD
│   ├── thumbnail.service.ts      # Thumbnail generation
│   ├── content-tasks.service.ts  # Scheduled tasks (expiration)
│   ├── entities/
│   │   └── content.entity.ts     # Content metadata
│   └── dto/
│       ├── create-content.dto.ts
│       └── update-content.dto.ts
│
├── displays/                     # Display Management
│   ├── displays.module.ts
│   ├── displays.controller.ts    # Registration, heartbeat, screenshot
│   ├── displays.service.ts       # Display management, API keys
│   └── entities/
│       └── display.entity.ts     # Display config & health
│
├── schedules/                    # Schedule Management
│   ├── schedules.module.ts
│   ├── schedules.controller.ts   # Schedule CRUD
│   ├── schedules.service.ts      # BullMQ job scheduling
│   └── entities/
│       └── schedule.entity.ts    # Schedule definitions
│
├── settings/                     # System Settings
│   ├── settings.module.ts
│   ├── settings.controller.ts    # Get/update settings
│   ├── settings.service.ts       # Settings with encryption
│   └── entities/
│       └── setting.entity.ts     # Key-value pairs
│
├── sse/                          # Server-Sent Events
│   ├── sse.module.ts
│   ├── sse.controller.ts         # SSE stream endpoints
│   ├── sse.service.ts            # Event broadcasting
│   └── guards/
│       └── display-api-key.guard.ts  # API key validation
│
├── push-notifications/           # Push Notifications
│   ├── push-notifications.module.ts
│   ├── push-notifications.controller.ts  # Subscribe, test, broadcast
│   ├── push-notifications.service.ts     # VAPID, web-push
│   └── entities/
│       └── push-subscription.entity.ts
│
├── common/                       # Shared Code
│   ├── guards/
│   │   ├── jwt-auth.guard.ts     # JWT validation guard
│   │   ├── roles.guard.ts        # Role-based authorization
│   │   ├── local-auth.guard.ts   # Local auth guard
│   │   └── flexible-auth.guard.ts # Public or JWT auth
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # Extract user from request
│   │   └── public.decorator.ts        # Skip auth guard
│   ├── services/
│   │   └── encryption.service.ts      # AES-256-GCM encryption
│   ├── entities/
│   │   └── audit-log.entity.ts        # Audit log schema
│   └── enums/
│       └── user-role.enum.ts          # Admin, Standard roles
│
└── config/                       # Configuration
    ├── database.config.ts        # TypeORM config
    └── redis.config.ts           # Redis config
```

**Key Design Patterns:**
- **Dependency Injection**: NestJS IoC container manages service lifecycle
- **Repository Pattern**: TypeORM repositories for data access
- **Guard Pattern**: Authentication and authorization guards
- **Decorator Pattern**: Route metadata (@Roles, @Public, @CurrentUser)
- **Observer Pattern**: Event-driven architecture (SSE, push notifications)
- **Strategy Pattern**: Multiple authentication strategies (Local, JWT, API Key)

### 6.2 Frontend Architecture (React)

**Admin Portal:**
```
frontend-admin/src/
├── main.tsx                      # Application entry point
├── App.tsx                       # Root component with routing
│
├── pages/                        # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx         # Main dashboard with stats
│   ├── ContentPage.tsx           # Content management
│   ├── DisplaysPage.tsx          # Display management
│   ├── DisplayMonitoringPage.tsx # Display health monitoring
│   ├── PlaylistsPage.tsx         # Playlist management
│   ├── ReleaseNotesPage.tsx      # Release notes
│   ├── PushNotificationUtility.tsx # Push notification config
│   └── HelpPage.tsx              # Help documentation
│
├── components/                   # Reusable components
│   ├── layouts/
│   │   └── DashboardLayout.tsx   # Main layout with sidebar
│   ├── PlaylistPreview.tsx       # Playlist preview component
│   └── ThemeToggle.tsx           # Dark mode toggle
│
├── contexts/                     # React contexts
│   └── [Context files TBD]
│
├── lib/                          # Utility libraries
│   └── api.ts                    # Axios API client with interceptors
│
├── utils/                        # Helper functions
│   └── [Utility files TBD]
│
├── types/                        # TypeScript types
│   └── index.ts                  # Shared type definitions
│
└── public/                       # Static assets
    ├── manifest.json             # PWA manifest
    ├── service-worker.js         # Service worker for PWA
    └── icons/                    # PWA icons (various sizes)
```

**Display Client:**
```
frontend-display/src/
├── main.tsx                      # Application entry point
├── App.tsx                       # Display controller
│
├── components/                   # Display components
│   ├── ImageDisplay.tsx          # Image content display
│   ├── VideoDisplay.tsx          # Video content display
│   ├── SlideshowDisplay.tsx      # Slideshow rotation
│   └── TextDisplay.tsx           # Text/HTML content display
│
├── api.ts                        # API client
│
└── hooks/                        # Custom React hooks
    ├── useSSE.ts                 # SSE connection hook
    ├── useHeartbeat.ts           # Heartbeat submission hook
    └── useContentRotation.ts     # Content rotation logic
```

**State Management:**
- **Admin Portal**: Zustand for global state (auth, theme)
- **Display Client**: React state + hooks (no global state library)
- **Server State**: React Query or SWR (not currently implemented, manual fetch)

**API Communication:**
```typescript
// API Client (Axios) with interceptors
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// Request interceptor: Add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', response.data.accessToken);
      error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 7. DATA ARCHITECTURE

### 7.1 Database Schema (PostgreSQL)

**Entity Relationship Diagram:**
```
┌──────────────┐         ┌──────────────┐
│     User     │         │   Display    │
├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ email        │         │ name         │
│ password     │         │ location     │
│ role         │         │ apiKey (enc) │
│ refreshToken │         │ apiKeyIv     │
│ mustChange   │         │ pairingCode  │
│ createdAt    │         │ status       │
│ updatedAt    │         │ lastHeartbeat│
└──────┬───────┘         │ performMetrics│
       │                 │ errorLogs    │
       │                 └──────┬───────┘
       │                        │
       │                        │
       │                        │
       │                        │
┌──────▼────────┐        ┌──────▼───────┐
│   Content     │        │  Schedule    │
├───────────────┤        ├──────────────┤
│ id (PK)       │◄───────┤ id (PK)      │
│ title         │        │ startTime    │
│ type          │        │ endTime      │
│ filePath      │        │ recurrenceRule│
│ textContent   │        │ priority     │
│ duration      │        │ isActive     │
│ expiresAt     │        │ displayId(FK)│
│ thumbnailPath │        │ contentId(FK)│
│ createdBy(FK) │        │ playlistId   │
│ createdAt     │        └──────────────┘
└───────────────┘
       │
       │
┌──────▼────────┐        ┌──────────────┐
│   Setting     │        │  AuditLog    │
├───────────────┤        ├──────────────┤
│ key (PK)      │        │ id (PK)      │
│ value         │        │ userId (FK)  │
│ description   │        │ action       │
│ encrypted     │        │ entityType   │
└───────────────┘        │ entityId     │
                         │ changes(JSONB)│
┌──────────────┐         │ ipAddress    │
│PushSubscript │         │ createdAt    │
├──────────────┤         └──────────────┘
│ id (PK)      │
│ userId (FK)  │
│ endpoint     │
│ p256dhKey    │
│ authKey      │
│ preferences  │
│ isActive     │
└──────────────┘
```

### 7.2 Table Schemas

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  role VARCHAR(20) NOT NULL DEFAULT 'standard',  -- admin, standard
  refresh_token VARCHAR(500),
  must_change_password BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**displays**
```sql
CREATE TABLE displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  layout_type VARCHAR(50) DEFAULT 'fullscreen',
  api_key_encrypted TEXT,  -- AES-256-GCM encrypted
  api_key_iv VARCHAR(32),  -- Initialization vector
  pairing_code UUID,
  pairing_code_expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'offline',  -- online, offline
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  uptime_percentage NUMERIC(5,2) DEFAULT 0,
  total_heartbeats INTEGER DEFAULT 0,
  missed_heartbeats INTEGER DEFAULT 0,
  last_screenshot_path VARCHAR(500),
  last_screenshot_at TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB,  -- {cpuUsage, memoryUsage, diskUsage, networkLatency}
  error_logs JSONB,  -- [{timestamp, message, severity}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_displays_status ON displays(status);
CREATE INDEX idx_displays_pairing_code ON displays(pairing_code);
```

**content**
```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- image, video, text
  file_path VARCHAR(500),
  text_content TEXT,
  metadata JSONB,  -- {width, height, size, mimeType, etc.}
  duration INTEGER,  -- Display duration in seconds
  expires_at TIMESTAMP WITH TIME ZONE,
  thumbnail_path VARCHAR(500),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_created_by ON content(created_by);
CREATE INDEX idx_content_expires_at ON content(expires_at);
```

**schedules**
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  recurrence_rule VARCHAR(500),  -- RRULE format (iCalendar)
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_id UUID REFERENCES displays(id),
  display_group_id UUID,  -- For future display groups feature
  content_id UUID REFERENCES content(id),
  playlist_id UUID,  -- For future playlist feature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedules_display_id ON schedules(display_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_schedules_is_active ON schedules(is_active);
CREATE INDEX idx_schedules_priority ON schedules(priority DESC);
```

**settings**
```sql
CREATE TABLE settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predefined settings: FPCON, LAN_STATUS, etc.
```

**audit_log**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),  -- Nullable for system actions
  action VARCHAR(50) NOT NULL,  -- create, update, delete, login, logout
  entity_type VARCHAR(50) NOT NULL,  -- user, content, display, schedule
  entity_id UUID,
  changes JSONB,  -- {before: {...}, after: {...}}
  ip_address VARCHAR(45),  -- IPv4 or IPv6
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

**push_subscriptions**
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key VARCHAR(255) NOT NULL,  -- Public key for encryption
  auth_key VARCHAR(255) NOT NULL,  -- Authentication secret
  preferences JSONB DEFAULT '{}',  -- {displayOffline, displayOnline, highErrors, etc.}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_push_sub_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_sub_active ON push_subscriptions(is_active);
```

### 7.3 Data Access Patterns

**TypeORM Repository Pattern:**
```typescript
// Example: User repository usage
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
      // Exclude password field
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'refreshToken', 'mustChangePassword'],
    });
  }

  // Parameterized queries prevent SQL injection
  async updateRole(id: string, role: UserRole): Promise<User> {
    await this.usersRepository.update(id, { role });
    return this.usersRepository.findOneBy({ id });
  }
}
```

**Query Optimization:**
- Indexes on frequently queried columns (email, status, created_at)
- SELECT only required fields (exclude password by default)
- Use of JSONB for flexible schema (metadata, preferences, performance_metrics)
- Timestamp indexes for audit log and time-based queries

### 7.4 Data Protection

**Encryption at Rest:**
- API keys: AES-256-GCM encrypted before INSERT/UPDATE
- External API credentials: AES-256-GCM encrypted in settings table
- Passwords: bcrypt hashed (one-way, not decryptable)
- Media files: NOT encrypted (stored as plaintext)

**Data Integrity:**
- Foreign key constraints enforce referential integrity
- Unique constraints prevent duplicates (email, display API endpoint)
- NOT NULL constraints on critical fields
- Check constraints for valid values (status ENUM, role ENUM)

**Data Retention:**
- Content with expiration: expiresAt field triggers automatic archival/deletion (via scheduled job)
- Audit logs: Indefinite retention (recommend: 1 year online, archive thereafter)
- Display error logs: JSONB array (recommend: limit to last 100 entries)

---

## 8. SECURITY ARCHITECTURE

### 8.1 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LAYER                               │
│  • User authentication (login credentials)                  │
│  • MFA (NOT IMPLEMENTED - POA&M item)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               TRANSPORT LAYER                               │
│  • HTTPS with TLS 1.2+ (production requirement)             │
│  • Certificate validation                                   │
│  • Secure headers (Helmet middleware)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│             APPLICATION LAYER                               │
│  • JWT authentication (access + refresh tokens)             │
│  • Role-based authorization (Admin, Standard)               │
│  • API key authentication (displays)                        │
│  • Input validation (class-validator)                       │
│  • Rate limiting (100 req/60s)                              │
│  • CORS policy enforcement                                  │
│  • Session management (token expiration)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 DATA LAYER                                  │
│  • Password hashing (bcrypt, 12 rounds)                     │
│  • API key encryption (AES-256-GCM)                         │
│  • SQL injection prevention (parameterized queries)         │
│  • Database access control (single service account)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                           │
│  • Docker container isolation                               │
│  • Network segmentation (Docker bridge network)             │
│  • Minimal port exposure                                    │
│  • Alpine Linux (minimal attack surface)                    │
│  • Host firewall (Windows Firewall)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               PHYSICAL LAYER                                │
│  • Physical access control (facility security - inherited)  │
│  • Hardware security (HP ProLiant - inherited)              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Authentication Architecture

**Multi-Strategy Authentication:**

1. **Local Strategy** (Email/Password):
   ```
   User → POST /api/auth/login {email, password}
        → LocalAuthGuard
        → LocalStrategy.validate(email, password)
        → UsersService.findByEmail(email)
        → bcrypt.compare(password, user.password)
        → If valid: return user
        → AuthService.login(user)
        → Generate JWT tokens (access + refresh)
        → Return {accessToken, refreshToken}
   ```

2. **JWT Strategy** (Bearer Token):
   ```
   User → Request with Authorization: Bearer <token>
        → JwtAuthGuard
        → JwtStrategy.validate(payload)
        → Extract {sub: userId, email, role} from payload
        → Verify token signature (JWT_SECRET)
        → Check expiration (exp claim)
        → If valid: attach user to request.user
        → Controller executes
   ```

3. **Display API Key Strategy**:
   ```
   Display → Request with X-API-Key or ?apiKey=<key>
          → DisplayApiKeyGuard.canActivate()
          → Extract API key from header or query
          → DisplaysService.findAll()
          → For each display:
               → EncryptionService.decrypt(display.apiKeyEncrypted, display.apiKeyIv)
               → Compare decrypted key with provided key
               → If match: attach display to request.display
          → Controller executes
   ```

**Token Lifecycle:**
```
1. Login: Generate access token (15min) + refresh token (7d)
2. Store refresh token in database (users.refreshToken)
3. Client stores both tokens (localStorage)
4. Client includes access token in Authorization header
5. When access token expires (15 min):
   a. Client detects 401 Unauthorized
   b. Client calls POST /api/auth/refresh {refreshToken}
   c. Backend validates refresh token against database
   d. Backend generates new access token (15min)
   e. Backend returns new access token
   f. Client updates stored access token
6. Logout: Clear refresh token from database and client storage
7. Refresh token expires (7 days): User must login again
```

### 8.3 Authorization Architecture

**Role-Based Access Control (RBAC):**

```typescript
// User roles
enum UserRole {
  ADMIN = 'admin',
  STANDARD = 'standard',
}

// Guard composition
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)  // Both guards must pass
export class UsersController {

  @Get()
  @Roles(UserRole.ADMIN)  // Only admin can list users
  async findAll() { ... }

  @Get('me')
  // No @Roles decorator = any authenticated user
  async getProfile(@CurrentUser() user: User) { ... }
}

// RolesGuard implementation
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;  // No role requirement

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);  // Check user role
  }
}
```

**Authorization Matrix:**

| Resource | GET | POST | PATCH | DELETE | Special |
|----------|-----|------|-------|--------|---------|
| /api/users | Admin | Admin | Admin | Admin | /me: Any auth user |
| /api/content | Any auth | Admin | Admin | Admin | /stats: Any auth |
| /api/displays | Any auth | Admin | Admin | Admin | /me: Display API key |
| /api/schedules | Any auth | Admin | Admin | Admin | - |
| /api/settings | Any auth | Admin | - | - | Read-only for standard users |
| /api/auth | Public | Public | - | - | /logout, /me: Auth required |
| /api/sse | Any auth | - | - | - | /display: Display API key |

### 8.4 Data Security Architecture

**Encryption Service (AES-256-GCM):**
```typescript
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY;  // 64-char hex string
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64-character hex string');
    }
    this.key = Buffer.from(keyHex, 'hex');  // 32 bytes
  }

  encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);  // Random IV per encryption
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();  // 16-byte auth tag
    encrypted += authTag.toString('hex');

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encrypted: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const authTagLength = 32;  // 16 bytes = 32 hex chars
    const authTag = Buffer.from(encrypted.slice(-authTagLength), 'hex');
    const ciphertext = encrypted.slice(0, -authTagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

**Usage:**
- Display API keys encrypted before database INSERT
- External API credentials encrypted in settings table
- Decryption only when needed (API key validation, external API calls)
- IV stored alongside encrypted data (unique per encryption)

---

## 9. INTEGRATION ARCHITECTURE

### 9.1 External API Integrations (Optional)

**Weather API (OpenWeather):**
```
Backend → HTTPS GET → api.openweathermap.org/data/2.5/weather
       ← JSON Response ← {temp, humidity, conditions, ...}
```
- API key stored encrypted in settings table
- Used for weather widget content (if implemented)
- Rate limit: 60 calls/minute (free tier)

**Transit API (WMATA):**
```
Backend → HTTPS GET → api.wmata.com/rail/realtime/...
       ← JSON Response ← {train arrivals, delays, ...}
```
- API key stored encrypted
- Used for transit information displays
- Rate limit: 10 calls/second

**Maps API (TomTom):**
```
Backend → HTTPS GET → api.tomtom.com/map/1/staticimage
       ← Image Response ← PNG map tile
```
- API key stored encrypted
- Used for map-based content
- Rate limit: Varies by plan

**Security Considerations:**
- All external calls over HTTPS only
- API keys never exposed to frontend
- API keys encrypted at rest
- Optional features: System works without external connectivity
- Recommendation: Whitelist external domains in firewall

### 9.2 Push Notification Integration

**Web Push Protocol (VAPID):**
```
Backend → Generate notification payload
       → Sign with VAPID private key (ECDSA P-256)
       → HTTPS POST → Browser push service endpoint
          (e.g., fcm.googleapis.com for Chrome)
       ← 201 Created ← Success

Browser ← Push message ← Browser push service
       → Service worker activates
       → Display notification to user
```

**VAPID Key Generation:**
```bash
npm run generate:vapid
# Outputs:
# VAPID_PUBLIC_KEY=BKjUcgQrGNZSQuYdMmTRXNgZNP1HiuyQSyZXY-3JsYRBCDx...
# VAPID_PRIVATE_KEY=mHPxJ_kBqPwgP7vY1ZqLON8D6xA_2vN...
```

**Push Subscription Flow:**
```
1. User grants notification permission in browser
2. Service worker requests push subscription from browser
3. Browser contacts push service (Google, Mozilla, Apple, Microsoft)
4. Push service returns subscription object:
   {
     endpoint: "https://fcm.googleapis.com/fcm/send/...",
     keys: {
       p256dh: "Public key for encryption",
       auth: "Authentication secret"
     }
   }
5. Frontend sends subscription to backend: POST /api/push-notifications/subscribe
6. Backend stores subscription in database
7. Backend sends notifications via web-push library
8. Push service delivers to browser
9. Service worker displays notification
```

### 9.3 MagicInfo Server Integration

**Co-existence Architecture:**
- MagicInfo Server runs on Windows Server 2025 host
- TeamSub-TV runs in Ubuntu VM on same host
- Shared display hardware: Samsung MagicInfo-compatible displays
- Potential integration: Displays can show either MagicInfo or TeamSub-TV content

**Integration Options (Future):**
1. **Time-based switching**: Display shows MagicInfo during certain hours, TeamSub-TV during others
2. **Input switching**: Display has multiple inputs (HDMI1: MagicInfo, HDMI2: TeamSub-TV client PC)
3. **Unified management**: MagicInfo controls hardware, TeamSub-TV provides content via web browser

**Current State:**
- No formal integration implemented
- Displays must be configured for either MagicInfo OR TeamSub-TV (not both simultaneously)

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 Docker Compose Orchestration

**docker-compose.yml Structure:**
```yaml
version: '3'

services:
  # Database
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 10s
      retries: 5
    networks:
      - signage-network

  # Cache/Queue
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5
    networks:
      - signage-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV}
      DB_HOST: postgres
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    volumes:
      - ./media:/app/media
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - signage-network

  # Admin Portal
  frontend-admin:
    build:
      context: ./frontend-admin
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - signage-network

  # Display Client
  frontend-display:
    build:
      context: ./frontend-display
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "8081:80"
    depends_on:
      - backend
    networks:
      - signage-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  signage-network:
    name: signage-network
    driver: bridge
```

### 10.2 Container Build Process

**Backend Dockerfile (Multi-stage):**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++  # For bcrypt compilation
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Frontend Dockerfile (Multi-stage):**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 10.3 Deployment Procedure

**Initial Deployment:**
```bash
# 1. Clone repository
git clone <repo-url> /opt/teamsub-tv
cd /opt/teamsub-tv

# 2. Create environment file
cp .env.example .env

# 3. Generate secrets
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # JWT_REFRESH_SECRET
openssl rand -hex 32  # ENCRYPTION_KEY

# 4. Edit .env with generated secrets
nano .env

# 5. Build and start containers
docker-compose up -d --build

# 6. Wait for health checks
sleep 15

# 7. Seed database
docker-compose exec backend npm run seed

# 8. Verify all containers running
docker-compose ps

# 9. Access admin portal
# http://<server-ip>:8080
# Login: admin@teamsub.navy.mil / Admin123!

# 10. Change default admin password immediately
```

**Update Procedure:**
```bash
# 1. Pull latest code
cd /opt/teamsub-tv
git pull origin main

# 2. Backup database
docker-compose exec postgres pg_dump -U signage signage_cms > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Stop containers
docker-compose down

# 4. Rebuild and start
docker-compose up -d --build

# 5. Run any database migrations (if applicable)
docker-compose exec backend npm run migration:run

# 6. Verify operation
docker-compose ps
docker-compose logs backend
```

### 10.4 Monitoring and Maintenance

**Health Checks:**
```bash
# Container status
docker-compose ps

# Container logs
docker-compose logs -f backend
docker-compose logs -f frontend-admin
docker-compose logs -f postgres

# Database health
docker-compose exec postgres pg_isready -U signage

# Redis health
docker-compose exec redis redis-cli ping

# Disk usage
docker system df
df -h
```

**Backup Procedures:**
```bash
# PostgreSQL backup (automated script recommended)
docker-compose exec postgres pg_dump -U signage signage_cms > \
  /backups/signage_$(date +%Y%m%d).sql

# Media files backup
rsync -av /opt/teamsub-tv/media/ /backups/media/

# Redis backup (persistence enabled)
docker-compose exec redis redis-cli SAVE

# VM snapshot (Hyper-V)
# Use Hyper-V Manager or PowerShell:
Checkpoint-VM -Name "TeamSub-TV" -SnapshotName "Backup_$(Get-Date -Format yyyyMMdd)"
```

---

## DOCUMENT APPROVAL

| Role | Name | Signature | Date |
|------|------|-----------|------|
| System Architect | [TBD] | | |
| System Owner | [TBD] | | |
| ISSO | [TBD] | | |

---

**Document Control:**
- **Version:** 1.0
- **Date:** November 20, 2025
- **Classification:** UNCLASSIFIED
- **Next Review:** [Upon significant architectural changes]

---

*END OF SYSTEM ARCHITECTURE AND DESIGN DOCUMENT*
