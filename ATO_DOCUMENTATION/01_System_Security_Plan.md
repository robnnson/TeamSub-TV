# SYSTEM SECURITY PLAN (SSP)
## TeamSub-TV Digital Signage Content Management System

**Classification:** UNCLASSIFIED
**Version:** 1.0
**Date:** November 20, 2025
**POC:** [To Be Completed by Organization]

---

## TABLE OF CONTENTS

1. [System Identification](#1-system-identification)
2. [System Categorization](#2-system-categorization)
3. [System Owner and Authorizing Official](#3-system-owner-and-authorizing-official)
4. [System Description](#4-system-description)
5. [System Architecture](#5-system-architecture)
6. [System Boundary](#6-system-boundary)
7. [System Environment](#7-system-environment)
8. [System Interconnections](#8-system-interconnections)
9. [Network Architecture](#9-network-architecture)
10. [Security Controls Implementation](#10-security-controls-implementation)
11. [Hardware and Software Inventory](#11-hardware-and-software-inventory)
12. [Ports, Protocols, and Services](#12-ports-protocols-and-services)
13. [System Users and Privileges](#13-system-users-and-privileges)
14. [Security Control Inheritance](#14-security-control-inheritance)
15. [Applicable Laws and Regulations](#15-applicable-laws-and-regulations)

---

## 1. SYSTEM IDENTIFICATION

**System Name:** TeamSub-TV Digital Signage CMS
**System Abbreviation:** TS-TV
**System Type:** Web Application / Content Management System
**Operational Status:** Operational
**System Location:** [Location to be specified by organization]
**System Owner:** [Name, Title, Contact Information]
**ISSO:** [Information System Security Officer - TBD]
**System Custodian:** [Technical POC - TBD]

**Mission/Business Purpose:**
TeamSub-TV provides a centralized digital signage content management system for Navy submarine team operations. The system enables authorized personnel to create, schedule, and display mission-critical information, operational status updates (FPCON/LAN status), weather information, and general announcements across distributed display terminals.

**Information System Identifier:**
[To be assigned by authorizing activity]

---

## 2. SYSTEM CATEGORIZATION

Per FIPS 199 and CNSSI 1253, the system is categorized as follows:

### Security Categorization

| Security Objective | Categorization | Justification |
|-------------------|----------------|---------------|
| **Confidentiality** | MODERATE | System processes FOUO information including operational status (FPCON), facility information, and organizational announcements. Unauthorized disclosure could adversely affect operations. |
| **Integrity** | MODERATE | Incorrect or unauthorized modification of displayed information (especially FPCON/LAN status) could mislead personnel and adversely affect mission operations. |
| **Availability** | LOW | System unavailability would impair information dissemination but alternate communication channels exist. Brief disruption would not significantly impact mission. |

**Overall System Categorization:** MODERATE
(Determined by the highest impact value in any security objective)

**Categorization Rationale:**
The system's moderate confidentiality rating stems from the aggregation of FOUO operational information. The moderate integrity rating is based on the operational reliance on accurate FPCON and LAN status displays which directly inform personnel security posture. Availability is rated low as the system is informational and non-critical path for mission operations.

---

## 3. SYSTEM OWNER AND AUTHORIZING OFFICIAL

**System Owner:**
Name: [To be provided]
Title: [To be provided]
Organization: [Command/Activity]
Phone: [To be provided]
Email: [To be provided]

**Authorizing Official (AO):**
Name: [To be provided]
Title: [Typically Commanding Officer or designated representative]
Organization: [Command/Activity]
Phone: [To be provided]
Email: [To be provided]

**Information System Security Officer (ISSO):**
Name: [To be provided]
Title: ISSO
Organization: [Command/Activity]
Phone: [To be provided]
Email: [To be provided]

**Information System Security Manager (ISSM):**
Name: [To be provided]
Title: ISSM
Organization: [Command/Activity]
Phone: [To be provided]
Email: [To be provided]

---

## 4. SYSTEM DESCRIPTION

### 4.1 System Overview

TeamSub-TV is a modern, full-stack digital signage content management system purpose-built for Navy submarine team operations. The system provides centralized content creation, scheduling, and distribution capabilities to multiple display terminals throughout a facility.

**Key Capabilities:**
- Secure content management (images, videos, text, rich media)
- Display device management and monitoring
- Automated scheduling with recurrence rules (RRULE format)
- Real-time content updates via Server-Sent Events (SSE)
- FPCON and LAN status management and display
- Display health monitoring and alerting
- Role-based access control (Admin and Standard users)
- Push notification system for display status alerts
- Audit logging for security and compliance

### 4.2 System Components

The system consists of four primary components:

1. **Backend API Server**
   - NestJS framework with Fastify HTTP server
   - RESTful API with 58+ endpoints
   - JWT-based authentication and authorization
   - PostgreSQL database for persistent data storage
   - Redis for job queue and caching
   - BullMQ for scheduled task execution
   - Real-time SSE event distribution

2. **Admin Portal (Frontend)**
   - React 18 single-page application
   - TypeScript for type safety
   - Vite build system
   - TailwindCSS for responsive UI
   - Provides content, display, schedule, and settings management
   - Progressive Web App (PWA) capabilities
   - Push notification subscription management

3. **Display Client (Frontend)**
   - React 18 display application
   - API key-based authentication
   - Real-time content synchronization via SSE
   - Multi-content type rendering (images, videos, slideshows, text)
   - Automatic content rotation based on schedules
   - Heartbeat monitoring
   - Screenshot capability for remote monitoring

4. **Supporting Services**
   - PostgreSQL 16 (Alpine) - Relational database
   - Redis 7 (Alpine) - Cache and job queue
   - Nginx (Alpine) - Reverse proxy and static file serving

### 4.3 Data Managed by the System

**Content Data:**
- Uploaded media files (images, videos)
- Text-based announcements and messages
- Rich-text content with HTML formatting
- Content metadata (title, type, duration, expiration)
- Thumbnails for content preview

**Operational Data:**
- FPCON status levels (Normal, Alpha, Bravo, Charlie, Delta)
- LAN status (Green, Yellow, Red)
- Display locations and configurations
- Schedule definitions and recurrence rules

**System Data:**
- User accounts and authentication credentials (hashed)
- Display API keys (encrypted)
- Audit logs (user actions, IP addresses, timestamps)
- Display health metrics and error logs
- Push notification subscriptions

**External API Credentials (Encrypted):**
- OpenWeather API key
- WMATA (Metro) API key
- TomTom Maps API key

### 4.4 System Users

**Administrator Role:**
- Full system access
- User management capabilities
- Content creation and management
- Display registration and configuration
- Schedule creation and modification
- System settings management
- Audit log access

**Standard User Role:**
- View-only access to content
- Limited dashboard access
- No administrative capabilities

**Display Devices:**
- Authenticate via API key
- Receive real-time content updates
- Submit heartbeat status
- Upload screenshots for remote monitoring

---

## 5. SYSTEM ARCHITECTURE

### 5.1 Logical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HP ProLiant Server                           │
│                 Windows Server 2025 + Hyper-V                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              MagicInfo Server                        │     │
│  │         (Signage Hardware Management)                │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           Ubuntu Server 20.04 VM (Hyper-V Guest)         │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │         Docker Network: signage-network            │ │ │
│  │  │                                                    │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐             │ │ │
│  │  │  │  Frontend    │  │  Frontend    │             │ │ │
│  │  │  │   Admin      │  │  Display     │             │ │ │
│  │  │  │ (nginx:80)   │  │ (nginx:80)   │             │ │ │
│  │  │  │  Port 8080   │  │  Port 8081   │             │ │ │
│  │  │  └──────┬───────┘  └──────┬───────┘             │ │ │
│  │  │         │                  │                      │ │ │
│  │  │         └──────────┬───────┘                      │ │ │
│  │  │                    │                              │ │ │
│  │  │         ┌──────────▼──────────┐                  │ │ │
│  │  │         │    Backend API      │                  │ │ │
│  │  │         │   NestJS/Fastify    │                  │ │ │
│  │  │         │    Port 3000        │                  │ │ │
│  │  │         └──┬──────────────┬───┘                  │ │ │
│  │  │            │              │                       │ │ │
│  │  │   ┌────────▼────┐   ┌────▼──────┐               │ │ │
│  │  │   │ PostgreSQL  │   │   Redis   │               │ │ │
│  │  │   │  Port 5432  │   │ Port 6379 │               │ │ │
│  │  │   └─────────────┘   └───────────┘               │ │ │
│  │  │                                                  │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │         Docker Volumes (Persistent)            │ │ │
│  │  │  • postgres_data                               │ │ │
│  │  │  • redis_data                                  │ │ │
│  │  │  • ./media (bind mount)                        │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

External Connections:
├─ Admin Users → HTTPS → Admin Portal (Port 8080)
├─ Display Devices → HTTP → Display Client (Port 8081)
├─ Backend → HTTPS → External APIs (OpenWeather, WMATA, TomTom)
└─ Backend → HTTPS → Browser Push Service (Web Push Protocol)
```

### 5.2 Physical Architecture

**Hardware Platform:**
- **Server:** HP ProLiant (Specific model TBD)
- **Processor:** [To be specified]
- **Memory:** [To be specified]
- **Storage:** [To be specified]
- **Network:** [To be specified]
- **Operating System:** Windows Server 2025
- **Virtualization:** Hyper-V Role

**Virtual Machine:**
- **Guest OS:** Ubuntu Server 20.04 LTS
- **vCPU:** [To be specified]
- **Memory:** [To be specified]
- **Virtual Disk:** [To be specified]
- **Network Adapter:** [To be specified]

**Display Terminals:**
- Samsung MagicInfo-compatible displays
- Network-connected (wired/wireless)
- Web browser capability

### 5.3 Software Stack

**Containerization Platform:**
- Docker Engine (running on Ubuntu VM)
- Docker Compose v3 orchestration

**Backend Technologies:**
- Node.js 20 (Alpine Linux base)
- NestJS 10.3.0 framework
- Fastify HTTP server
- TypeScript 5.3
- TypeORM 0.3.19
- Passport.js (authentication)
- bcrypt 5.1.1 (password hashing)
- BullMQ 5.1.0 (job queuing)
- Winston 3.11.0 (logging)

**Frontend Technologies:**
- React 18.2.0
- TypeScript 5.3
- Vite 5.0 (build tool)
- Axios 1.6.5 (HTTP client)
- TailwindCSS 3.4.1

**Database & Cache:**
- PostgreSQL 16 (Alpine)
- Redis 7 (Alpine)

**Web Server:**
- Nginx (Alpine) for static content and reverse proxy

### 5.4 Data Flow Architecture

**User Authentication Flow:**
```
1. User submits credentials → Admin Portal
2. Admin Portal → POST /api/auth/login → Backend API
3. Backend validates credentials (bcrypt comparison)
4. Backend generates JWT tokens (access + refresh)
5. Backend returns tokens to Admin Portal
6. Admin Portal stores tokens in localStorage
7. Subsequent requests include Bearer token in Authorization header
8. Backend validates JWT signature and expiration
9. Backend checks user role for authorization
```

**Content Display Flow:**
```
1. Display Client requests content → Backend API (with API key)
2. Backend validates API key (decrypt and compare)
3. Backend queries active schedules for display
4. Backend retrieves scheduled content from database
5. Backend returns content metadata to Display Client
6. Display Client renders content (images/videos/text)
7. Display Client maintains SSE connection for real-time updates
8. Backend sends update events via SSE when content changes
9. Display Client automatically refreshes content
```

**Content Upload Flow:**
```
1. Admin uploads file → Admin Portal
2. Admin Portal → POST /api/content/upload (multipart/form-data)
3. Backend validates file type and size (50MB limit)
4. Backend saves file to /app/media directory
5. Backend generates thumbnail (for images)
6. Backend creates database record with metadata
7. Backend returns content ID and URL
8. Backend broadcasts SSE event to connected displays
```

---

## 6. SYSTEM BOUNDARY

### 6.1 Boundary Definition

The system boundary encompasses all components running within the Ubuntu Server 20.04 VM on the HP ProLiant server:

**Inside the Boundary:**
- Docker containers (backend, frontend-admin, frontend-display)
- PostgreSQL database container
- Redis cache container
- Docker volumes (postgres_data, redis_data, media files)
- Docker network (signage-network)
- Ubuntu Server 20.04 VM operating system

**Outside the Boundary (External Dependencies):**
- Windows Server 2025 host operating system
- Hyper-V hypervisor
- MagicInfo Server (separate application on host)
- Client web browsers (admin users)
- Display terminal browsers
- External API services (OpenWeather, WMATA, TomTom)
- Browser push notification services

### 6.2 Boundary Protection

**Network Isolation:**
- Docker containers communicate via internal bridge network (signage-network)
- Only designated ports exposed to host: 3000, 8080, 8081, 5432, 6379
- Ubuntu VM isolated from host via Hyper-V virtual switch

**Access Control:**
- Admin Portal requires JWT authentication
- Display Client requires API key authentication
- Database accessible only from backend container
- Redis accessible only from backend container

**Data Protection:**
- All authentication tokens transmitted via HTTPS (production requirement)
- Sensitive data encrypted at rest (API keys, external service credentials)
- Passwords hashed with bcrypt (12 rounds)
- Database volumes protected by host filesystem permissions

---

## 7. SYSTEM ENVIRONMENT

### 7.1 Production Environment

**Hosting:**
- On-premises HP ProLiant server
- Windows Server 2025 with Hyper-V
- Ubuntu Server 20.04 LTS virtual machine
- Docker containerized deployment

**Network Environment:**
- Navy internal network (NMCI or local network)
- No direct Internet connectivity required for core operations
- External API access (if enabled): HTTPS outbound only
- Internal network access only for admin users and display devices

**Deployment Model:**
- Single-server deployment
- All components co-located on single VM
- Docker Compose orchestration
- Stateful services with persistent volumes

**Scalability Considerations:**
- Current design supports single server deployment
- PostgreSQL and Redis can be scaled vertically (more vCPU/RAM)
- Multiple display clients supported (tested with 10+ concurrent)
- Future: Could migrate to Kubernetes for horizontal scaling

### 7.2 Development Environment

Development occurs on developer workstations with:
- Docker Desktop (Windows/Mac)
- Local development servers (npm run dev)
- Separate development database instances
- Version control via Git

Development environment is NOT in scope for this ATO.

---

## 8. SYSTEM INTERCONNECTIONS

### 8.1 External Connections

| System/Service | Connection Type | Data Exchanged | Security Mechanism | Frequency |
|---------------|-----------------|----------------|-------------------|-----------|
| OpenWeather API | HTTPS Outbound | Weather data requests | API key (encrypted storage) | On-demand |
| WMATA API | HTTPS Outbound | Metro transit data | API key (encrypted storage) | On-demand |
| TomTom Maps API | HTTPS Outbound | Map data requests | API key (encrypted storage) | On-demand |
| Browser Push Service | HTTPS Outbound | Push notifications | VAPID protocol (signed) | Event-driven |

**Note:** External API integrations are OPTIONAL features. System operates fully without external connectivity.

### 8.2 Internal Connections

| Source | Destination | Port | Protocol | Purpose |
|--------|------------|------|----------|---------|
| Admin Portal (nginx) | Backend API | 3000 | HTTP/HTTPS | REST API calls |
| Display Client (nginx) | Backend API | 3000 | HTTP/HTTPS | REST API + SSE |
| Backend API | PostgreSQL | 5432 | TCP | Database queries |
| Backend API | Redis | 6379 | TCP | Cache and job queue |
| User Browser | Admin Portal | 8080 | HTTP/HTTPS | Web interface |
| Display Browser | Display Client | 8081 | HTTP/HTTPS | Content display |

All internal connections occur within the Docker bridge network (signage-network).

### 8.3 Memorandums of Understanding (MOUs)

No formal MOUs required for external services as they are:
- Commercial APIs with terms of service
- Optional features not required for core operations
- Unidirectional outbound connections only

---

## 9. NETWORK ARCHITECTURE

### 9.1 Network Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      Navy Internal Network                       │
│                   (192.168.x.x or as configured)                 │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ Network Traffic
             │
┌────────────▼──────────────────────────────────────────────────┐
│           Windows Server 2025 Host (HP ProLiant)              │
│                    Hyper-V Virtual Switch                      │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ Virtual Network Adapter
             │
┌────────────▼──────────────────────────────────────────────────┐
│              Ubuntu Server 20.04 VM                           │
│              IP: [To be assigned by network]                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         Docker Network: signage-network                 │ │
│  │         Type: Bridge                                    │ │
│  │         Subnet: 172.x.x.x (Docker managed)              │ │
│  │                                                         │ │
│  │   Container Addresses (Docker internal DNS):           │ │
│  │   • backend (NestJS API)                               │ │
│  │   • postgres (Database)                                │ │
│  │   • redis (Cache)                                      │ │
│  │   • frontend-admin (Admin Portal nginx)                │ │
│  │   • frontend-display (Display Client nginx)            │ │
│  │                                                         │ │
│  │   Port Mapping to Host:                                │ │
│  │   • 3000 → backend:3000                                │ │
│  │   • 8080 → frontend-admin:80                           │ │
│  │   • 8081 → frontend-display:80                         │ │
│  │   • 5432 → postgres:5432 (optional, for admin)         │ │
│  │   • 6379 → redis:6379 (optional, for admin)            │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
             │
             ├─ Admin Users (Browsers) → Port 8080
             ├─ Display Devices (Browsers) → Port 8081
             └─ External APIs (Optional) ← Outbound HTTPS
```

### 9.2 Network Security

**Firewall Rules:**
- Host firewall (Windows Firewall) restricts access to VM
- Only required ports exposed to internal network
- No inbound connections from Internet
- Outbound HTTPS allowed for external APIs (if enabled)

**Network Segmentation:**
- Docker bridge network isolates containers from host
- Database and Redis not directly accessible from external network
- Backend API acts as security boundary

**Communication Security:**
- Production deployment requires HTTPS for all client connections
- Internal container-to-container: HTTP (within trusted network)
- External API calls: HTTPS only
- Certificates managed at nginx reverse proxy level

---

## 10. SECURITY CONTROLS IMPLEMENTATION

This section provides detailed implementation information for key NIST 800-53 security control families. Full control traceability is provided in the Security Controls Traceability Matrix (SCTM).

### 10.1 Access Control (AC)

**AC-2: Account Management**
- User accounts stored in PostgreSQL database
- Email-based unique identifiers
- Admin role can create, modify, and delete user accounts
- Account creation requires admin privileges via POST /api/users
- Accounts have `createdAt` and `updatedAt` timestamps for auditing
- Default role: Standard (least privilege)

**AC-3: Access Enforcement**
- Role-based access control (RBAC) implemented
- Two roles: Admin and Standard
- @Roles decorator on protected endpoints
- RolesGuard enforces role requirements before controller execution
- JWT token contains role claim for validation

**AC-6: Least Privilege**
- Standard users have read-only dashboard access
- Admin users required for:
  - Content creation/modification/deletion
  - Display registration and management
  - Schedule creation and modification
  - User management
  - System settings changes
- Display devices use separate API key authentication (no user privileges)

**AC-7: Unsuccessful Login Attempts**
- NOT CURRENTLY IMPLEMENTED
- Recommendation: Implement account lockout after 5 failed attempts (POA&M item)

**AC-11: Session Lock**
- JWT access tokens expire after 15 minutes (configurable)
- Refresh tokens expire after 7 days
- Expired tokens rejected by JwtAuthGuard
- Users must re-authenticate when tokens expire

**AC-12: Session Termination**
- Logout endpoint (/api/auth/logout) clears refresh token from database
- Frontend clears tokens from localStorage on logout
- Session ends when access token expires (15 minutes of inactivity)

### 10.2 Audit and Accountability (AU)

**AU-2: Audit Events**
- Audit logging infrastructure implemented via AuditLog entity
- Captured fields:
  - User ID (nullable for system actions)
  - Action type (create, update, delete, login, logout, etc.)
  - Entity type and ID
  - Changes (JSONB diff of before/after state)
  - IP address
  - Timestamp
- NOT FULLY DEPLOYED: Audit triggers not implemented on all endpoints (POA&M item)

**AU-3: Content of Audit Records**
- Date/time of event (createdAt field)
- Type of event (action field)
- Subject identity (userId field)
- Outcome (success/failure - TBD)
- Source IP address (ipAddress field)
- Object identity (entityType + entityId fields)

**AU-9: Protection of Audit Information**
- Audit logs stored in PostgreSQL database
- Database access restricted to backend application
- No user-facing interface for audit log modification
- Database backups include audit logs
- Recommendation: Implement read-only audit log view for ISSO (POA&M item)

**AU-12: Audit Generation**
- Application logging via Winston logger
- Log levels: error, warn, info, debug
- Container logs accessible via: docker-compose logs backend
- Recommendation: Centralized log aggregation (POA&M item)

### 10.3 Identification and Authentication (IA)

**IA-2: Identification and Authentication (Organizational Users)**
- All users must authenticate to access admin portal
- Email + password authentication (Local Strategy)
- JWT Bearer token required for all authenticated API calls
- No anonymous access to admin functions

**IA-2(1): Multi-Factor Authentication**
- NOT CURRENTLY IMPLEMENTED
- Recommendation: Implement MFA for admin users (POA&M item)

**IA-4: Identifier Management**
- User identifiers: Email addresses (unique constraint)
- Display identifiers: UUID (v4) primary keys
- API keys: 256-bit random hexadecimal strings (64 characters)

**IA-5: Authenticator Management**
- Passwords hashed using bcrypt (cost factor: 12)
- Password hash algorithm: bcrypt with Blowfish cipher
- Passwords never stored in plaintext
- Passwords never logged or transmitted unencrypted
- Password field excluded from default SELECT queries
- `mustChangePassword` flag forces password change on first login

**IA-5(1): Password-Based Authentication**
- Password complexity requirements: NOT ENFORCED IN CODE
- Recommendation: Implement password policy validation (POA&M item)
  - Minimum length: 12 characters
  - Require uppercase, lowercase, digit, special character
  - No dictionary words
  - No password reuse (track password history)

**IA-8: Identification and Authentication (Non-Organizational Users)**
- Display devices authenticate via API keys
- API keys cryptographically generated (crypto.randomBytes(32))
- API keys encrypted at rest using AES-256-GCM
- API key transmitted via query parameter or X-API-Key header
- Recommendation: Move to header-only transmission (POA&M item)

### 10.4 System and Communications Protection (SC)

**SC-8: Transmission Confidentiality**
- HTTPS required for all production deployments
- TLS 1.2 or higher required
- Nginx reverse proxy terminates TLS
- JWT tokens transmitted in Authorization header (over HTTPS)
- API keys transmitted in header or query string (over HTTPS)
- Recommendation: Enforce HTTPS redirects in nginx config (POA&M item)

**SC-12: Cryptographic Key Establishment and Management**

*Encryption Keys:*
- ENCRYPTION_KEY: 256-bit key for AES-256-GCM (stored in .env)
- JWT_SECRET: 256-bit key for access token signing
- JWT_REFRESH_SECRET: 256-bit key for refresh token signing
- VAPID keys: ECDSA P-256 key pair for push notifications

*Key Generation:*
```bash
# JWT and encryption keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# VAPID keys
npm run generate:vapid
```

*Key Storage:*
- All keys stored in .env file on host filesystem
- .env file should have restrictive permissions (600)
- NOT IN VERSION CONTROL (.gitignore)
- Recommendation: Migrate to secure key management system (POA&M item)

*Key Rotation:*
- NO AUTOMATED KEY ROTATION IMPLEMENTED
- Manual key rotation requires:
  1. Generate new key
  2. Update .env file
  3. Restart containers
- Recommendation: Implement key rotation procedure (POA&M item)

**SC-13: Cryptographic Protection**

*Data at Rest:*
- Display API keys: AES-256-GCM encryption
  - 256-bit key (ENCRYPTION_KEY)
  - 16-byte random IV per encryption
  - 16-byte authentication tag
  - Algorithm: aes-256-gcm (Node.js crypto module)
- External API credentials: AES-256-GCM encryption (same mechanism)
- User passwords: bcrypt hashing (one-way, not encryption)
  - Cost factor: 12 rounds
  - Salt automatically generated per password
- Media files: NOT ENCRYPTED (stored as plaintext)

*Data in Transit:*
- TLS 1.2+ for HTTPS connections
- JWT tokens signed with HMAC-SHA256
- Web Push protocol uses VAPID (ECDSA P-256 signatures)

**SC-28: Protection of Information at Rest**
- Database volumes: Rely on host filesystem encryption (BitLocker on Windows)
- Application-level encryption for sensitive credentials (API keys)
- Passwords hashed (bcrypt) before database storage
- Recommendation: Enable PostgreSQL transparent data encryption (POA&M item)

### 10.5 System and Information Integrity (SI)

**SI-2: Flaw Remediation**
- Container images based on Alpine Linux (minimal attack surface)
- Base images: node:20-alpine, postgres:16-alpine, redis:7-alpine, nginx:alpine
- Image updates: Manual rebuild and redeploy
- Recommendation: Implement automated vulnerability scanning (POA&M item)
- Recommendation: Subscribe to security mailing lists for dependencies (POA&M item)

**SI-3: Malicious Code Protection**
- File upload MIME type validation
- File extension whitelist enforcement
- File size limits (50MB general, 10MB screenshots)
- NO ANTIVIRUS SCANNING IMPLEMENTED
- Recommendation: Integrate antivirus scanning for uploaded files (POA&M item)

**SI-4: Information System Monitoring**
- Application logging via Winston
- SSE connection monitoring
- Display heartbeat monitoring
- Database health checks (pg_isready)
- Redis health checks (redis-cli ping)
- Container restart policies (unless-stopped)
- Recommendation: Integrate with SIEM (POA&M item)

**SI-10: Information Input Validation**
- Backend validation via class-validator decorators
- ValidationPipe with whitelist: true (strips unknown properties)
- forbidNonWhitelisted: false (accepts but ignores)
- DTO (Data Transfer Object) classes define expected input
- SQL injection prevented via TypeORM parameterized queries
- Recommendation: Enable forbidNonWhitelisted: true (POA&M item)

### 10.6 Configuration Management (CM)

**CM-2: Baseline Configuration**
- Infrastructure as Code: docker-compose.yml
- Application configuration: .env file
- Database schema: TypeORM entity definitions
- Container images: Dockerfile specifications
- Recommendation: Document approved baseline configuration (POA&M item)

**CM-6: Configuration Settings**
- Security-relevant settings:
  - JWT_SECRET (token signing)
  - ENCRYPTION_KEY (data encryption)
  - CORS_ORIGIN (cross-origin policy)
  - NODE_ENV (production vs development)
  - bcrypt cost factor: 12 (hardcoded)
  - Rate limit: 100 requests/60 seconds (hardcoded)
- Recommendation: Create configuration management plan (POA&M item)

**CM-7: Least Functionality**
- Alpine Linux base images (minimal packages)
- Only essential ports exposed
- No unnecessary services running in containers
- Development tools not included in production images
- Multi-stage Docker builds (build deps not in runtime)

**CM-8: Information System Component Inventory**
- See Section 11: Hardware and Software Inventory
- Docker images tracked via image tags
- Node.js dependencies in package.json and package-lock.json

---

## 11. HARDWARE AND SOFTWARE INVENTORY

### 11.1 Hardware Components

| Component | Make/Model | Serial Number | Location | Purpose |
|-----------|-----------|---------------|----------|---------|
| Server | HP ProLiant [Model TBD] | [TBD] | [TBD] | Application host |
| Display Terminals | Samsung MagicInfo [Model TBD] | [TBD per display] | [TBD] | Content display |
| Network Infrastructure | [TBD] | [TBD] | [TBD] | Network connectivity |

### 11.2 Software Components

| Component | Version | License | Purpose |
|-----------|---------|---------|---------|
| **Operating Systems** | | | |
| Windows Server 2025 | 2025 | Commercial | Host OS |
| Ubuntu Server | 20.04 LTS | Open Source (Free) | Guest VM OS |
| Alpine Linux | Latest | Open Source (Free) | Container base OS |
| **Virtualization** | | | |
| Hyper-V | Windows Server 2025 | Commercial | Hypervisor |
| Docker Engine | Latest | Open Source (Free) | Containerization |
| Docker Compose | 3 | Open Source (Free) | Orchestration |
| **Backend Framework** | | | |
| Node.js | 20 | Open Source (Free) | Runtime environment |
| NestJS | 10.3.0 | MIT License | Application framework |
| Fastify | Latest | MIT License | HTTP server |
| TypeScript | 5.3 | Apache 2.0 | Programming language |
| **Frontend Framework** | | | |
| React | 18.2.0 | MIT License | UI library |
| Vite | 5.0 | MIT License | Build tool |
| TailwindCSS | 3.4.1 | MIT License | CSS framework |
| **Database** | | | |
| PostgreSQL | 16 | PostgreSQL License | Relational database |
| Redis | 7 | BSD License | Cache and queue |
| **Web Server** | | | |
| Nginx | Latest (Alpine) | BSD-like License | Reverse proxy |
| **Authentication** | | | |
| Passport.js | Latest | MIT License | Auth framework |
| jsonwebtoken | Latest | MIT License | JWT implementation |
| bcrypt | 5.1.1 | MIT License | Password hashing |
| **ORM & Database** | | | |
| TypeORM | 0.3.19 | MIT License | Database ORM |
| pg (node-postgres) | Latest | MIT License | PostgreSQL driver |
| **Job Queue** | | | |
| BullMQ | 5.1.0 | MIT License | Job/task queue |
| ioredis | Latest | MIT License | Redis client |
| **Logging** | | | |
| Winston | 3.11.0 | MIT License | Application logging |
| **Other Backend** | | | |
| class-validator | Latest | MIT License | Input validation |
| class-transformer | Latest | MIT License | Object transformation |
| @fastify/helmet | Latest | MIT License | Security headers |
| web-push | 3.6.7 | MIT License | Push notifications |
| axios | 1.6.5 | MIT License | HTTP client |
| **Frontend Libraries** | | | |
| React Router | 6.21.1 | MIT License | Client routing |
| React Hook Form | 7.49.3 | MIT License | Form management |
| Zustand | 4.4.7 | MIT License | State management |
| @dnd-kit | Latest | MIT License | Drag and drop |
| Recharts | 3.4.1 | MIT License | Data visualization |
| React Quill | 2.0.0 | MIT License | Rich text editor |
| html2canvas | Latest | MIT License | Screenshot capture |

### 11.3 Network Devices

| Device Type | Quantity | Purpose | Security Features |
|-------------|----------|---------|-------------------|
| Network Switch | [TBD] | LAN connectivity | [TBD] |
| Firewall | [TBD] | Perimeter security | [TBD] |
| Wireless Access Points | [TBD] | Display connectivity | WPA2/WPA3 encryption |

---

## 12. PORTS, PROTOCOLS, AND SERVICES

### 12.1 Open Ports

| Port | Protocol | Service | Direction | Purpose | Encryption |
|------|----------|---------|-----------|---------|------------|
| 8080 | TCP | HTTP/HTTPS | Inbound | Admin Portal web interface | HTTPS (TLS) |
| 8081 | TCP | HTTP/HTTPS | Inbound | Display Client web interface | HTTPS (TLS) |
| 3000 | TCP | HTTP/HTTPS | Inbound | Backend API | HTTPS (TLS) |
| 5432 | TCP | PostgreSQL | Inbound (optional) | Database admin access | PostgreSQL TLS (optional) |
| 6379 | TCP | Redis | Inbound (optional) | Cache admin access | None (internal only) |
| 443 | TCP | HTTPS | Outbound | External API calls | TLS 1.2+ |

**Notes:**
- Ports 5432 and 6379 should NOT be exposed to external network in production
- All HTTP services should redirect to HTTPS in production
- Firewall rules should restrict port 8080 to admin users only

### 12.2 Network Protocols

| Protocol | Purpose | Security Mechanism |
|----------|---------|-------------------|
| HTTPS | Web traffic | TLS 1.2 or higher |
| HTTP/1.1 | Internal Docker network | None (trusted network) |
| HTTP/2 (SSE) | Real-time event stream | TLS 1.2+ (over HTTPS) |
| PostgreSQL Wire Protocol | Database communication | Optional TLS |
| Redis Protocol (RESP) | Cache communication | None (internal network) |
| DNS | Name resolution | Standard DNS |
| NTP | Time synchronization | Standard NTP |

### 12.3 Application Services

| Service Name | Container | Purpose | Restart Policy | Health Check |
|--------------|-----------|---------|----------------|--------------|
| signage-backend | backend | API server | unless-stopped | None (TBD) |
| signage-admin | frontend-admin | Admin web UI | unless-stopped | None (TBD) |
| signage-display | frontend-display | Display client | unless-stopped | None (TBD) |
| signage-postgres | postgres | Database | unless-stopped | pg_isready |
| signage-redis | redis | Cache/queue | unless-stopped | redis-cli ping |

---

## 13. SYSTEM USERS AND PRIVILEGES

### 13.1 User Roles and Privileges

| Role | Access Level | Privileges | Account Creation | MFA Required |
|------|--------------|------------|------------------|--------------|
| **System Administrator** | Full system access | - All admin privileges<br>- User management<br>- System settings<br>- Audit log access<br>- Database access | Admin only | Not implemented (should be YES) |
| **Admin User** | Administrative | - Content CRUD<br>- Display management<br>- Schedule management<br>- Settings modification<br>- User creation | Admin only | Not implemented (should be YES) |
| **Standard User** | Read-only | - Dashboard view<br>- Content view | Admin only | Not implemented |
| **Display Device** | API access | - Content retrieval<br>- Heartbeat submission<br>- Screenshot upload | Admin assigns API key | N/A (API key auth) |
| **Anonymous** | None | - No access | N/A | N/A |

### 13.2 Default Accounts

| Account | Username/ID | Purpose | Password Management | Status |
|---------|-------------|---------|---------------------|--------|
| Admin User | admin@teamsub.navy.mil | Initial admin account | Must change on first login (mustChangePassword flag) | Active |
| Database Admin | signage | PostgreSQL superuser | Defined in .env (DB_PASSWORD) | Active |

**Security Requirements:**
- Default admin password must be changed immediately after deployment
- Database password must be changed from .env.example default
- All default passwords must be unique and complex

### 13.3 Service Accounts

| Account | Purpose | Authentication Method | Privileges |
|---------|---------|----------------------|------------|
| Backend API | Database access | Password (from .env) | Full database CRUD |
| Backend API | Redis access | No authentication | Full cache/queue access |
| Display Clients | API access | API key (encrypted in DB) | Content retrieval only |

### 13.4 Privilege Escalation

- No privilege escalation mechanism exists
- Role changes require admin user action via PATCH /api/users/:id
- Display devices cannot access user functions
- Standard users cannot gain admin privileges without admin action

---

## 14. SECURITY CONTROL INHERITANCE

### 14.1 Inherited Controls

The following controls are inherited from the underlying infrastructure and are not the responsibility of the TeamSub-TV application:

| Control | Control Name | Inherited From | Inheriting Entity Contact |
|---------|--------------|----------------|--------------------------|
| **Physical Security** | | | |
| PE-2 | Physical Access Authorizations | Facility Security | [Facility Security Officer] |
| PE-3 | Physical Access Control | Facility Security | [Facility Security Officer] |
| PE-6 | Monitoring Physical Access | Facility Security | [Facility Security Officer] |
| **Environmental Controls** | | | |
| PE-10 | Emergency Shutoff | Facility Infrastructure | [Facility Manager] |
| PE-11 | Emergency Power | Facility Infrastructure | [Facility Manager] |
| PE-13 | Fire Protection | Facility Infrastructure | [Facility Manager] |
| PE-14 | Temperature and Humidity Controls | Facility Infrastructure | [Facility Manager] |
| **Network Security** | | | |
| SC-7 | Boundary Protection | Network Operations | [Network Security Officer] |
| SC-7(5) | Deny by Default / Allow by Exception | Network Firewall | [Network Security Officer] |
| **Personnel Security** | | | |
| PS-2 | Position Risk Designation | Command Personnel | [Personnel Security Manager] |
| PS-3 | Personnel Screening | Command Personnel | [Personnel Security Manager] |
| PS-4 | Personnel Termination | Command Personnel | [Personnel Security Manager] |
| PS-6 | Access Agreements | Command Personnel | [Personnel Security Manager] |
| PS-7 | Third-Party Personnel Security | Command Personnel | [Personnel Security Manager] |

### 14.2 Shared Controls

The following controls are partially provided by TeamSub-TV and partially by external systems:

| Control | Application Responsibility | Infrastructure Responsibility |
|---------|---------------------------|------------------------------|
| AU-4 | Application log storage | Log aggregation and archival |
| CP-9 | Application data backup | Volume snapshot and storage |
| IR-4 | Application security events | Incident response procedures |
| SI-4 | Application-level monitoring | Network monitoring and IDS |

---

## 15. APPLICABLE LAWS AND REGULATIONS

This system must comply with the following laws, regulations, and policies:

### 15.1 Federal Laws and Regulations

- **Federal Information Security Modernization Act (FISMA) of 2014**
- **Privacy Act of 1974** - If PII is stored
- **E-Government Act of 2002**
- **Clinger-Cohen Act of 1996**

### 15.2 DoD and Navy Policies

- **DoD Instruction 8500.01** - Cybersecurity
- **DoD Instruction 8510.01** - Risk Management Framework (RMF)
- **SECNAV M-5510.30** - Department of the Navy Personnel Security Program
- **SECNAV M-5239.2** - DoN Information Assurance Policy
- **NIST SP 800-53 Rev 5** - Security and Privacy Controls
- **NIST SP 800-171** - Protecting Controlled Unclassified Information (if CUI present)
- **CNSSI 1253** - Security Categorization and Control Selection

### 15.3 Data Protection

- **FOUO (For Official Use Only)** - Operational information marking requirements
- **PII Protection** - If personally identifiable information is stored
- **CUI Protection** - If controlled unclassified information is present

### 15.4 Standards

- **FIPS 140-2/3** - Cryptographic Module Validation (Node.js crypto module usage)
- **FIPS 199** - Standards for Security Categorization
- **FIPS 200** - Minimum Security Requirements

---

## APPENDIX A: ACRONYMS

| Acronym | Definition |
|---------|------------|
| AC | Access Control |
| AO | Authorizing Official |
| API | Application Programming Interface |
| ATO | Authority to Operate |
| AU | Audit and Accountability |
| CM | Configuration Management |
| CUI | Controlled Unclassified Information |
| DoD | Department of Defense |
| DTO | Data Transfer Object |
| FIPS | Federal Information Processing Standards |
| FISMA | Federal Information Security Modernization Act |
| FOUO | For Official Use Only |
| FPCON | Force Protection Condition |
| IA | Identification and Authentication |
| ISSO | Information System Security Officer |
| ISSM | Information System Security Manager |
| JWT | JSON Web Token |
| LAN | Local Area Network (in context: LAN status indicator) |
| MFA | Multi-Factor Authentication |
| MOU | Memorandum of Understanding |
| NIST | National Institute of Standards and Technology |
| ORM | Object-Relational Mapping |
| PE | Physical and Environmental Protection |
| PII | Personally Identifiable Information |
| POA&M | Plan of Action and Milestones |
| PS | Personnel Security |
| RBAC | Role-Based Access Control |
| RMF | Risk Management Framework |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| SAR | Security Assessment Report |
| SC | System and Communications Protection |
| SCTM | Security Controls Traceability Matrix |
| SI | System and Information Integrity |
| SSE | Server-Sent Events |
| SSP | System Security Plan |
| TLS | Transport Layer Security |
| VAPID | Voluntary Application Server Identification |
| VM | Virtual Machine |

---

## APPENDIX B: REFERENCES

1. NIST Special Publication 800-53 Revision 5, "Security and Privacy Controls for Information Systems and Organizations"
2. NIST Special Publication 800-171, "Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations"
3. DoD Instruction 8510.01, "Risk Management Framework (RMF) for DoD Information Technology (IT)"
4. DoD Instruction 8500.01, "Cybersecurity"
5. CNSSI 1253, "Security Categorization and Control Selection for National Security Systems"
6. FIPS Publication 199, "Standards for Security Categorization of Federal Information and Information Systems"
7. FIPS Publication 200, "Minimum Security Requirements for Federal Information and Information Systems"

---

## DOCUMENT APPROVAL

| Role | Name | Signature | Date |
|------|------|-----------|------|
| System Owner | [TBD] | | |
| ISSO | [TBD] | | |
| ISSM | [TBD] | | |
| Authorizing Official | [TBD] | | |

---

**Document Control:**
- **Version:** 1.0
- **Date:** November 20, 2025
- **Classification:** UNCLASSIFIED
- **Next Review Date:** [Six months from ATO date]
- **Distribution:** Official Use Only - For ATO Package Submission

---

*END OF SYSTEM SECURITY PLAN*
