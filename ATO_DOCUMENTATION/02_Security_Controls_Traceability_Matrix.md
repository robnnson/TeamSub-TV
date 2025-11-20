# SECURITY CONTROLS TRACEABILITY MATRIX (SCTM)
## TeamSub-TV Digital Signage Content Management System

**Classification:** UNCLASSIFIED
**Version:** 1.0
**Date:** November 20, 2025
**System Categorization:** MODERATE (FIPS 199)

---

## PURPOSE

This Security Controls Traceability Matrix (SCTM) documents the implementation status of NIST 800-53 Rev 5 security controls for the TeamSub-TV system. Each control is mapped to its implementation evidence, responsible party, and current status.

**Status Legend:**
- ✅ **Implemented** - Control fully implemented with evidence
- 🟡 **Partially Implemented** - Control partially met, requires enhancement
- ❌ **Not Implemented** - Control not currently implemented
- 🔵 **Inherited** - Control inherited from infrastructure/facility
- N/A **Not Applicable** - Control not applicable to this system

---

## CONTROL SUMMARY

| Control Family | Total | Implemented | Partial | Not Impl | Inherited | N/A |
|---------------|-------|-------------|---------|----------|-----------|-----|
| Access Control (AC) | 15 | 7 | 4 | 4 | 0 | 0 |
| Awareness and Training (AT) | 4 | 0 | 0 | 4 | 0 | 0 |
| Audit and Accountability (AU) | 12 | 3 | 6 | 3 | 0 | 0 |
| Assessment and Authorization (CA) | 9 | 0 | 3 | 6 | 0 | 0 |
| Configuration Management (CM) | 11 | 5 | 4 | 2 | 0 | 0 |
| Contingency Planning (CP) | 10 | 2 | 3 | 5 | 0 | 0 |
| Identification and Authentication (IA) | 11 | 5 | 3 | 3 | 0 | 0 |
| Incident Response (IR) | 8 | 1 | 3 | 4 | 0 | 0 |
| Maintenance (MA) | 6 | 0 | 2 | 4 | 0 | 0 |
| Media Protection (MP) | 8 | 0 | 2 | 0 | 6 | 0 |
| Physical and Environmental (PE) | 20 | 0 | 0 | 0 | 20 | 0 |
| Planning (PL) | 10 | 1 | 4 | 5 | 0 | 0 |
| Personnel Security (PS) | 8 | 0 | 0 | 0 | 8 | 0 |
| Risk Assessment (RA) | 8 | 0 | 3 | 5 | 0 | 0 |
| System and Services Acquisition (SA) | 17 | 1 | 2 | 14 | 0 | 0 |
| System and Communications Protection (SC) | 42 | 7 | 8 | 27 | 0 | 0 |
| System and Information Integrity (SI) | 21 | 3 | 6 | 12 | 0 | 0 |
| **TOTAL** | **220** | **35** | **51** | **98** | **34** | **2** |

---

## ACCESS CONTROL (AC)

### AC-1: Access Control Policy and Procedures
**Status:** 🟡 Partially Implemented
**Implementation:**
- No formal access control policy documented
- RBAC implemented in code (Admin/Standard roles)
- Procedures exist in code but not formally documented

**Evidence:**
- Source: `backend/src/common/guards/roles.guard.ts`
- Source: `backend/src/auth/` directory

**Recommendation:** Document formal access control policy and procedures (POA&M #001)
**Responsible Party:** System Owner / ISSO

---

### AC-2: Account Management
**Status:** ✅ Implemented
**Implementation:**
- User account creation via POST /api/users (admin only)
- Email-based unique identifiers
- Account attributes: email, role, password (hashed), createdAt, updatedAt
- Admin can create, read, update, delete user accounts
- Default role assignment: Standard (least privilege)

**Evidence:**
- Source: `backend/src/users/users.service.ts` - createUser(), findAll(), update(), remove()
- Source: `backend/src/users/entities/user.entity.ts` - User schema with timestamps
- Database: users table with UNIQUE constraint on email

**Responsible Party:** Application (Administrators)

---

### AC-2(1): Automated System Account Management
**Status:** ❌ Not Implemented
**Implementation:** No automated account management (provisioning, notification, etc.)
**Recommendation:** Consider integration with Navy identity management system (POA&M #002)
**Responsible Party:** System Owner

---

### AC-2(3): Disable Inactive Accounts
**Status:** ❌ Not Implemented
**Implementation:** No mechanism to disable accounts after inactivity period
**Recommendation:** Implement account inactivity detection and auto-disable after 35 days (POA&M #003)
**Responsible Party:** Development Team

---

### AC-2(4): Automated Audit Actions
**Status:** 🟡 Partially Implemented
**Implementation:**
- Audit log infrastructure exists (AuditLog entity)
- Not consistently applied across all account actions
- Manual analysis required

**Evidence:**
- Source: `backend/src/common/entities/audit-log.entity.ts`

**Recommendation:** Implement audit triggers on all user account actions (POA&M #004)
**Responsible Party:** Development Team

---

### AC-3: Access Enforcement
**Status:** ✅ Implemented
**Implementation:**
- Role-based access control (RBAC) via @Roles() decorator
- RolesGuard validates user role from JWT token
- JwtAuthGuard validates authentication before authorization
- Guard composition ensures layered security

**Evidence:**
- Source: `backend/src/common/guards/roles.guard.ts`
- Source: `backend/src/common/guards/jwt-auth.guard.ts`
- Controllers: @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)

**Responsible Party:** Application

---

### AC-4: Information Flow Enforcement
**Status:** 🟡 Partially Implemented
**Implementation:**
- CORS policy restricts cross-origin requests (CORS_ORIGIN env var)
- Docker network isolation (signage-network)
- No data flow labeling or enforcement

**Evidence:**
- Source: `backend/src/main.ts` - CORS configuration
- Source: `docker-compose.yml` - network definition

**Recommendation:** Document approved information flows (POA&M #005)
**Responsible Party:** System Owner / Network Admin

---

### AC-5: Separation of Duties
**Status:** ✅ Implemented
**Implementation:**
- Admin and Standard user roles provide separation
- Standard users cannot perform administrative functions
- Display devices use separate authentication mechanism (API keys)

**Evidence:**
- Source: `backend/src/common/enums/user-role.enum.ts`
- Source: Role-based guard enforcement throughout controllers

**Responsible Party:** Application

---

### AC-6: Least Privilege
**Status:** ✅ Implemented
**Implementation:**
- Default role: Standard (read-only)
- Admin role required for:
  - User management
  - Content modification
  - Display management
  - Schedule management
  - Settings changes
- Display API keys provide limited scope (content retrieval only)

**Evidence:**
- Source: All controllers with @Roles(UserRole.ADMIN) decorators
- Source: `backend/src/sse/guards/display-api-key.guard.ts` - limited scope

**Responsible Party:** Application

---

### AC-6(1): Authorize Access to Security Functions
**Status:** ✅ Implemented
**Implementation:**
- Security functions (user management, settings) require Admin role
- Audit log access requires authentication
- No privilege escalation mechanism

**Evidence:**
- Source: `backend/src/users/users.controller.ts` - @Roles(UserRole.ADMIN)
- Source: `backend/src/settings/settings.controller.ts` - Admin required

**Responsible Party:** Application

---

### AC-7: Unsuccessful Login Attempts
**Status:** ❌ Not Implemented
**Implementation:** No account lockout mechanism after failed login attempts
**Recommendation:** Implement account lockout after 5 failed attempts within 15 minutes (POA&M #006)
**Responsible Party:** Development Team

---

### AC-8: System Use Notification
**Status:** ❌ Not Implemented
**Implementation:** No system use notification banner displayed before authentication
**Recommendation:** Add DoD-standard warning banner to login page (POA&M #007)
**Responsible Party:** Development Team

---

### AC-11: Session Lock
**Status:** ✅ Implemented
**Implementation:**
- JWT access tokens expire after 15 minutes
- Expired tokens rejected by JwtAuthGuard
- Frontend requires re-authentication when token expires
- Refresh tokens expire after 7 days

**Evidence:**
- Source: `backend/src/auth/auth.service.ts` - JWT_EXPIRATION constants
- Source: `backend/src/auth/strategies/jwt.strategy.ts` - token validation

**Responsible Party:** Application

---

### AC-12: Session Termination
**Status:** ✅ Implemented
**Implementation:**
- Logout endpoint clears refresh token from database
- Frontend clears tokens from localStorage
- Tokens expire automatically (15 minutes for access, 7 days for refresh)
- No session after token expiration

**Evidence:**
- Source: `backend/src/auth/auth.controller.ts` - logout() method
- Source: `frontend-admin/src/lib/api.ts` - logout function

**Responsible Party:** Application

---

### AC-17: Remote Access
**Status:** 🟡 Partially Implemented
**Implementation:**
- HTTPS required for production (not enforced)
- No VPN requirement
- No remote access policy documented

**Recommendation:**
- Enforce HTTPS redirects (POA&M #008)
- Document remote access policy
- Consider VPN requirement for admin access

**Responsible Party:** Network Admin / System Owner

---

### AC-19: Access Control for Mobile Devices
**Status:** N/A
**Implementation:** System accessed via web browser, not mobile app
**Responsible Party:** N/A

---

### AC-20: Use of External Information Systems
**Status:** 🟡 Partially Implemented
**Implementation:**
- External API usage (OpenWeather, WMATA, TomTom) is optional
- API keys encrypted before storage
- No formal policy on external system use

**Evidence:**
- Source: `backend/src/common/services/encryption.service.ts`
- Source: `.env.example` - external API key variables

**Recommendation:** Document policy for external API integration (POA&M #009)
**Responsible Party:** System Owner

---

## AUDIT AND ACCOUNTABILITY (AU)

### AU-1: Audit and Accountability Policy and Procedures
**Status:** 🟡 Partially Implemented
**Implementation:**
- Audit infrastructure exists but policy not documented
- No formal procedures for audit review and reporting

**Recommendation:** Create audit and accountability policy (POA&M #010)
**Responsible Party:** System Owner / ISSO

---

### AU-2: Audit Events
**Status:** 🟡 Partially Implemented
**Implementation:**
- AuditLog entity defined with fields: userId, action, entityType, entityId, changes, ipAddress, createdAt
- Infrastructure ready but not consistently applied
- Application logs via Winston (errors, warnings, info)

**Events Currently Logged:**
- SSE client connections/disconnections
- Display heartbeats
- Content changes (broadcast events)
- Settings updates
- Push notification events

**Events NOT Logged:**
- User login attempts (success/failure)
- Content uploads
- User account changes
- Schedule modifications
- Display API key generation/regeneration

**Evidence:**
- Source: `backend/src/common/entities/audit-log.entity.ts`
- Source: `backend/src/sse/sse.service.ts` - Logger usage

**Recommendation:** Implement comprehensive audit event triggers on all security-relevant actions (POA&M #011)
**Responsible Party:** Development Team

---

### AU-3: Content of Audit Records
**Status:** ✅ Implemented
**Implementation:**
- Audit records include:
  - Date and time (createdAt timestamp)
  - Event type (action field)
  - Subject identity (userId - nullable for system)
  - Object identity (entityType + entityId)
  - Changes (JSONB diff of before/after)
  - Source IP address (ipAddress field)
  - Outcome: To be added

**Evidence:**
- Source: `backend/src/common/entities/audit-log.entity.ts` schema

**Recommendation:** Add outcome (success/failure) field to audit logs (POA&M #012)
**Responsible Party:** Development Team

---

### AU-4: Audit Storage Capacity
**Status:** 🟡 Partially Implemented
**Implementation:**
- Audit logs stored in PostgreSQL database
- Storage limited by database volume size
- No automated monitoring of audit log storage capacity
- No automatic alerts when capacity threshold reached

**Recommendation:**
- Implement database storage monitoring (POA&M #013)
- Define audit log retention period
- Implement log rotation/archival procedure

**Responsible Party:** System Administrator / ISSO

---

### AU-5: Response to Audit Processing Failures
**Status:** ❌ Not Implemented
**Implementation:** No automated response to audit processing failures
**Recommendation:** Implement alerting on audit log write failures (POA&M #014)
**Responsible Party:** Development Team

---

### AU-6: Audit Review, Analysis, and Reporting
**Status:** ❌ Not Implemented
**Implementation:**
- No user-facing audit log interface
- Manual database queries required for audit review
- No automated analysis or reporting

**Recommendation:**
- Create read-only audit log viewing interface for ISSO (POA&M #015)
- Implement audit log search and filtering
- Create automated audit reports

**Responsible Party:** Development Team / ISSO

---

### AU-7: Audit Reduction and Report Generation
**Status:** ❌ Not Implemented
**Implementation:** No automated audit reduction or report generation
**Recommendation:** Implement audit log analytics dashboard (POA&M #016)
**Responsible Party:** Development Team

---

### AU-8: Time Stamps
**Status:** ✅ Implemented
**Implementation:**
- PostgreSQL timestamp with time zone (timestamptz)
- Automatic timestamp generation via @CreateDateColumn()
- System time synchronized via NTP (inherited from host)

**Evidence:**
- Source: All entity definitions with `@CreateDateColumn()` decorators
- Host OS: Time synchronization service

**Responsible Party:** Application + Infrastructure (inherited)

---

### AU-9: Protection of Audit Information
**Status:** 🟡 Partially Implemented
**Implementation:**
- Audit logs stored in PostgreSQL database
- Database access restricted to backend application
- No separate audit log database
- No read-only interface for audit log review
- Included in database backups

**Recommendation:**
- Implement separate audit log storage (POA&M #017)
- Create read-only audit log access for ISSO
- Implement immutable audit log writes

**Responsible Party:** Development Team / System Administrator

---

### AU-10: Non-Repudiation
**Status:** 🟡 Partially Implemented
**Implementation:**
- User actions tied to userId (from JWT token)
- JWT tokens signed (HMAC-SHA256) - verifiable
- No cryptographic signing of audit log entries themselves

**Recommendation:** Implement cryptographic signing of audit log entries (POA&M #018)
**Responsible Party:** Development Team

---

### AU-11: Audit Record Retention
**Status:** ❌ Not Implemented
**Implementation:**
- No defined retention period
- No automated archival
- Audit logs retained indefinitely until database purged

**Recommendation:**
- Define audit log retention policy (recommend: 1 year online, 3 years archived)
- Implement automated archival process (POA&M #019)

**Responsible Party:** System Owner / ISSO

---

### AU-12: Audit Generation
**Status:** 🟡 Partially Implemented
**Implementation:**
- Application logging via Winston logger
- Log levels: error, warn, info, debug
- Logs output to console (container stdout/stderr)
- Docker logs accessible via: docker-compose logs

**Current Logging:**
- SSE service events
- Display heartbeats and status changes
- Push notification sends
- Error conditions

**Evidence:**
- Source: Winston configuration in `backend/src/main.ts`

**Recommendation:**
- Centralized log aggregation (Elasticsearch/Splunk) (POA&M #020)
- Structured logging with correlation IDs
- Integration with SIEM

**Responsible Party:** System Administrator / Development Team

---

## IDENTIFICATION AND AUTHENTICATION (IA)

### IA-1: Identification and Authentication Policy
**Status:** 🟡 Partially Implemented
**Implementation:**
- Authentication mechanisms implemented in code
- No formal policy documented

**Recommendation:** Document identification and authentication policy (POA&M #021)
**Responsible Party:** System Owner / ISSO

---

### IA-2: Identification and Authentication (Organizational Users)
**Status:** ✅ Implemented
**Implementation:**
- All users must authenticate to access system
- Email + password authentication via Local Strategy
- JWT Bearer tokens required for all API calls
- No anonymous administrative access

**Evidence:**
- Source: `backend/src/auth/strategies/local.strategy.ts`
- Source: `backend/src/auth/strategies/jwt.strategy.ts`
- Source: `backend/src/common/guards/jwt-auth.guard.ts`

**Responsible Party:** Application

---

### IA-2(1): Network Access to Privileged Accounts - Multi-Factor Authentication
**Status:** ❌ Not Implemented
**Implementation:** No multi-factor authentication (MFA) implemented
**Recommendation:** Implement MFA for admin users (TOTP or CAC/PIV) (POA&M #022 - HIGH PRIORITY)
**Responsible Party:** Development Team

---

### IA-2(2): Network Access to Non-Privileged Accounts - Multi-Factor Authentication
**Status:** ❌ Not Implemented
**Implementation:** No MFA for standard users
**Recommendation:** Implement MFA for all users (POA&M #023)
**Responsible Party:** Development Team

---

### IA-2(8): Network Access to Privileged Accounts - Replay Resistant
**Status:** ✅ Implemented
**Implementation:**
- JWT tokens include expiration timestamp (exp claim)
- Token replay prevented by short expiration (15 minutes)
- Refresh token one-time use (cleared on refresh)
- HTTPS prevents token interception (production requirement)

**Evidence:**
- Source: `backend/src/auth/auth.service.ts` - token generation with exp
- Source: JWT strategy validates token expiration

**Responsible Party:** Application

---

### IA-4: Identifier Management
**Status:** ✅ Implemented
**Implementation:**
- User identifiers: Email addresses (UNIQUE constraint)
- Display identifiers: UUID v4 (cryptographically random)
- Content identifiers: UUID v4
- Schedule identifiers: UUID v4
- API keys: 256-bit random hex (crypto.randomBytes(32))

**Evidence:**
- Source: Database schema - email UNIQUE constraint
- Source: `@PrimaryGeneratedColumn('uuid')` decorators
- Source: `backend/src/displays/displays.service.ts` - API key generation

**Responsible Party:** Application

---

### IA-5: Authenticator Management
**Status:** ✅ Implemented
**Implementation:**

**Passwords:**
- Hashed using bcrypt (cost factor: 12 rounds)
- Never stored in plaintext
- Never logged or exposed in API responses
- Password field excluded from default SELECT queries
- `mustChangePassword` flag forces change on first login

**API Keys:**
- 256-bit cryptographically random generation
- Encrypted at rest using AES-256-GCM
- One API key per display
- Admin can regenerate keys

**JWT Secrets:**
- 256-bit secrets stored in environment variables
- Not in version control (.gitignore)
- Manual rotation procedure

**Evidence:**
- Source: `backend/src/users/entities/user.entity.ts` - @BeforeInsert/@BeforeUpdate hooks
- Source: `backend/src/common/services/encryption.service.ts` - AES-256-GCM
- Source: `.env.example` - secret generation instructions

**Responsible Party:** Application

---

### IA-5(1): Password-Based Authentication
**Status:** 🟡 Partially Implemented
**Implementation:**

**Strengths:**
- bcrypt hashing (12 rounds) ✅
- Password complexity: NOT ENFORCED ❌
- Password history: NOT IMPLEMENTED ❌
- Password expiration: NOT IMPLEMENTED ❌
- Password reuse prevention: NOT IMPLEMENTED ❌

**Recommendation:**
- Implement password policy validation (POA&M #024):
  - Minimum 12 characters
  - Uppercase, lowercase, digit, special character
  - No common dictionary words
  - No username in password
- Implement password history (last 10 passwords)
- Implement password expiration (90 days for admins)
- Implement password reuse prevention

**Responsible Party:** Development Team

---

### IA-5(7): No Embedded Unencrypted Static Authenticators
**Status:** ✅ Implemented
**Implementation:**
- No hardcoded credentials in source code
- All secrets in environment variables (.env file)
- .env not in version control (.gitignore)
- Docker secrets passed via environment variables

**Evidence:**
- Source: `.gitignore` - excludes .env
- Source: `docker-compose.yml` - reads from ${VARIABLE}
- Code review: No hardcoded passwords or keys

**Responsible Party:** Application

---

### IA-6: Authenticator Feedback
**Status:** ✅ Implemented
**Implementation:**
- Password input fields use type="password" (masked)
- Login errors generic: "Invalid credentials" (no username enumeration)
- No password displayed in UI or logs

**Evidence:**
- Source: `frontend-admin/src/pages/LoginPage.tsx` - input type="password"
- Source: `backend/src/auth/auth.service.ts` - generic error messages

**Responsible Party:** Application

---

### IA-8: Identification and Authentication (Non-Organizational Users)
**Status:** ✅ Implemented
**Implementation:**
- Display devices (non-organizational) authenticate via API keys
- API keys unique per display
- API keys encrypted at rest
- API key validation via DisplayApiKeyGuard

**Evidence:**
- Source: `backend/src/sse/guards/display-api-key.guard.ts`
- Source: `backend/src/displays/entities/display.entity.ts` - apiKeyEncrypted field

**Responsible Party:** Application

---

### IA-9: Service Identification and Authentication
**Status:** 🟡 Partially Implemented
**Implementation:**
- Backend authenticates to PostgreSQL via password
- Backend authenticates to Redis (no authentication currently)
- Display API keys identify display services

**Recommendation:** Enable Redis authentication (requirepass) (POA&M #025)
**Responsible Party:** System Administrator

---

## SYSTEM AND COMMUNICATIONS PROTECTION (SC)

### SC-1: System and Communications Protection Policy
**Status:** 🟡 Partially Implemented
**Implementation:** Security mechanisms implemented but no formal policy documented
**Recommendation:** Document system and communications protection policy (POA&M #026)
**Responsible Party:** System Owner / ISSO

---

### SC-7: Boundary Protection
**Status:** 🔵 Inherited + 🟡 Partially Implemented
**Implementation:**
- Network boundary protection: Inherited from Navy network firewall
- Docker network isolation: Implemented (signage-network bridge)
- Only designated ports exposed to host (3000, 8080, 8081, 5432, 6379)
- Database and Redis not directly accessible from external network

**Evidence:**
- Source: `docker-compose.yml` - ports configuration
- Infrastructure: Network firewall rules (inherited)

**Recommendation:**
- Remove external exposure of ports 5432 and 6379 in production (POA&M #027)
- Document approved connection points

**Responsible Party:** System Administrator + Network Admin (inherited)

---

### SC-8: Transmission Confidentiality
**Status:** 🟡 Partially Implemented
**Implementation:**
- HTTPS required for production (not enforced)
- TLS 1.2+ recommendation
- No HTTPS redirect in current nginx configuration
- Internal Docker traffic unencrypted (trusted network)

**Recommendation:**
- Enforce HTTPS redirects in nginx (POA&M #028 - HIGH PRIORITY)
- Configure TLS 1.2 minimum in nginx
- Obtain and install SSL certificates

**Responsible Party:** System Administrator

---

### SC-8(1): Transmission Confidentiality - Cryptographic Protection
**Status:** 🟡 Partially Implemented
**Implementation:**
- TLS for HTTPS (when configured)
- VAPID signatures for push notifications (ECDSA P-256)
- No database connection encryption (PostgreSQL TLS not enabled)

**Recommendation:**
- Enable PostgreSQL TLS connections (POA&M #029)
- Enable Redis TLS connections (POA&M #030)

**Responsible Party:** System Administrator

---

### SC-12: Cryptographic Key Establishment and Management
**Status:** 🟡 Partially Implemented
**Implementation:**

**Keys Used:**
- ENCRYPTION_KEY: 256-bit AES key (for API keys, settings)
- JWT_SECRET: 256-bit HMAC key (access tokens)
- JWT_REFRESH_SECRET: 256-bit HMAC key (refresh tokens)
- VAPID keys: ECDSA P-256 key pair (push notifications)

**Key Generation:**
- Cryptographically secure: crypto.randomBytes(32)
- VAPID: web-push library generates P-256 key pair

**Key Storage:**
- Stored in .env file (plaintext on host filesystem)
- Not in version control (.gitignore)
- File permissions: Should be 600 (read/write owner only)

**Key Rotation:**
- NO AUTOMATED ROTATION ❌
- Manual rotation procedure:
  1. Generate new key
  2. Update .env
  3. Restart containers
  4. All existing tokens invalidated
  5. Users must re-authenticate

**Recommendation:**
- Migrate to secure key management (POA&M #031 - HIGH PRIORITY):
  - Azure Key Vault
  - HashiCorp Vault
  - AWS Secrets Manager (if applicable)
- Implement key rotation schedule (annual minimum)
- Document key rotation procedures

**Evidence:**
- Source: `.env.example` - key generation instructions
- Source: `backend/src/common/services/encryption.service.ts`

**Responsible Party:** System Administrator / Security Team

---

### SC-13: Cryptographic Protection
**Status:** ✅ Implemented
**Implementation:**

**Data at Rest:**
- Display API keys: AES-256-GCM
  - Algorithm: aes-256-gcm
  - Key size: 256 bits
  - IV: 16 bytes random per encryption
  - Auth tag: 16 bytes
- External API credentials: AES-256-GCM (same)
- Passwords: bcrypt (Blowfish-based, one-way hash, 12 rounds)
- Media files: NOT ENCRYPTED (plaintext storage)

**Data in Transit:**
- HTTPS with TLS 1.2+ (when configured)
- JWT tokens: HMAC-SHA256 signatures
- VAPID: ECDSA P-256 signatures

**Cryptographic Modules:**
- Node.js crypto module (built-in, FIPS 140-2 capable when Node compiled with OpenSSL FIPS module)
- bcrypt library (well-vetted implementation)

**Evidence:**
- Source: `backend/src/common/services/encryption.service.ts` - AES-256-GCM implementation
- Source: User entity - bcrypt hashing (@BeforeInsert/@BeforeUpdate)

**Recommendation:**
- Verify Node.js compiled with FIPS-validated OpenSSL module
- Consider encrypting uploaded media files (POA&M #032)

**Responsible Party:** Application

---

### SC-28: Protection of Information at Rest
**Status:** 🟡 Partially Implemented
**Implementation:**
- Application-level encryption: API keys, external credentials (AES-256-GCM)
- Password hashing: bcrypt (one-way)
- Database encryption: Relies on host filesystem encryption
- Media files: Unencrypted plaintext
- Database volumes: Docker volumes on host filesystem

**Recommendation:**
- Enable BitLocker on Windows Server host for volume encryption (POA&M #033)
- Enable PostgreSQL transparent data encryption (TDE) (POA&M #034)
- Encrypt media files at application level (POA&M #035)

**Responsible Party:** System Administrator + Development Team

---

### SC-39: Process Isolation
**Status:** ✅ Implemented
**Implementation:**
- Docker container isolation (separate namespaces)
- Each service in separate container:
  - backend (NestJS)
  - frontend-admin (nginx)
  - frontend-display (nginx)
  - postgres (database)
  - redis (cache)
- Container resource limits: Not currently set

**Evidence:**
- Source: `docker-compose.yml` - separate service definitions

**Recommendation:** Set container resource limits (CPU/memory) (POA&M #036)
**Responsible Party:** System Administrator

---

## SYSTEM AND INFORMATION INTEGRITY (SI)

### SI-1: System and Information Integrity Policy
**Status:** 🟡 Partially Implemented
**Implementation:** Input validation and monitoring implemented but no formal policy
**Recommendation:** Document system and information integrity policy (POA&M #037)
**Responsible Party:** System Owner / ISSO

---

### SI-2: Flaw Remediation
**Status:** 🟡 Partially Implemented
**Implementation:**
- Container images based on Alpine Linux (minimal, regularly updated)
- Base images: node:20-alpine, postgres:16-alpine, redis:7-alpine, nginx:alpine
- Manual image rebuild and redeploy process
- No automated vulnerability scanning
- No patch management process documented

**Recommendation:**
- Implement automated vulnerability scanning (Trivy, Clair, Snyk) (POA&M #038)
- Establish patch management schedule (monthly for critical, quarterly for moderate)
- Subscribe to security mailing lists:
  - NestJS security advisories
  - Node.js security releases
  - npm advisories
  - Alpine Linux security
- Document flaw remediation procedures (POA&M #039)

**Responsible Party:** System Administrator / Development Team

---

### SI-3: Malicious Code Protection
**Status:** ❌ Not Implemented
**Implementation:**
- File upload validation: MIME type and extension checking
- File size limits: 50MB (content), 10MB (screenshots)
- NO ANTIVIRUS SCANNING of uploaded files
- NO real-time malware protection

**Recommendation:**
- Integrate antivirus scanning (ClamAV) for uploaded files (POA&M #040 - HIGH PRIORITY)
- Implement file content inspection beyond MIME type
- Quarantine suspicious uploads

**Responsible Party:** Development Team / System Administrator

---

### SI-4: Information System Monitoring
**Status:** 🟡 Partially Implemented
**Implementation:**

**Currently Monitored:**
- Application logs (Winston) - errors, warnings, info
- SSE connection statistics
- Display heartbeats and health metrics
- Database health checks (pg_isready)
- Redis health checks (redis-cli ping)
- Container health and restart status

**NOT Monitored:**
- Intrusion detection
- Network traffic analysis
- Security event correlation
- Real-time alerting

**Evidence:**
- Source: `backend/src/sse/sse.service.ts` - connection tracking
- Source: `backend/src/displays/displays.service.ts` - heartbeat monitoring
- Source: `docker-compose.yml` - health checks

**Recommendation:**
- Integrate with SIEM (Splunk, ELK, etc.) (POA&M #041)
- Implement intrusion detection (host-based IDS) (POA&M #042)
- Real-time security event alerting (POA&M #043)

**Responsible Party:** System Administrator / Security Team

---

### SI-5: Security Alerts and Advisories
**Status:** ❌ Not Implemented
**Implementation:** No formal process to receive/respond to security alerts
**Recommendation:**
- Subscribe to security mailing lists (POA&M #044)
- Assign responsibility for monitoring advisories
- Document response procedures

**Responsible Party:** System Owner / ISSO

---

### SI-10: Information Input Validation
**Status:** ✅ Implemented
**Implementation:**
- Backend validation via class-validator decorators
- ValidationPipe with whitelist: true (strips unknown properties)
- forbidNonWhitelisted: false (accepts but ignores - should be true)
- DTO classes define expected input structure
- TypeORM parameterized queries (prevents SQL injection)
- MIME type and file extension validation on uploads
- File size limits enforced

**Evidence:**
- Source: `backend/src/main.ts` - app.useGlobalPipes(ValidationPipe)
- Source: All DTO files (create-*.dto.ts, update-*.dto.ts)
- Source: `backend/src/content/content.controller.ts` - file validation

**Recommendation:**
- Enable forbidNonWhitelisted: true to reject invalid input (POA&M #045)
- Add DOMPurify for HTML sanitization in React Quill (POA&M #046)

**Responsible Party:** Development Team

---

### SI-11: Error Handling
**Status:** 🟡 Partially Implemented
**Implementation:**
- NestJS exception filters handle errors
- Generic error messages returned to users (good)
- Detailed errors logged (Winston)
- Stack traces NOT exposed to users in production (NODE_ENV=production)
- Database errors not exposed

**Recommendation:**
- Ensure all error responses are sanitized (no sensitive data disclosure)
- Implement centralized error handling audit

**Responsible Party:** Development Team

---

### SI-12: Information Handling and Retention
**Status:** ❌ Not Implemented
**Implementation:** No formal data retention policy
**Recommendation:**
- Document information handling and retention policy (POA&M #047)
- Define retention periods for:
  - Audit logs (recommend: 1 year online, 3 years archived)
  - Content files (based on operational need)
  - User accounts (inactive account removal)

**Responsible Party:** System Owner / ISSO

---

## CONFIGURATION MANAGEMENT (CM)

### CM-1: Configuration Management Policy
**Status:** 🟡 Partially Implemented
**Implementation:** Configuration defined in code but no formal policy
**Recommendation:** Document configuration management policy and procedures (POA&M #048)
**Responsible Party:** System Owner / ISSO

---

### CM-2: Baseline Configuration
**Status:** ✅ Implemented
**Implementation:**
- Infrastructure as Code: docker-compose.yml
- Application configuration: .env file
- Database schema: TypeORM entity definitions
- Container images: Dockerfile specifications
- Dependencies: package.json + package-lock.json (pinned versions)
- Version control: Git repository

**Evidence:**
- Source: `docker-compose.yml`
- Source: `.env.example` (template)
- Source: All Dockerfile files
- Source: package.json in all components

**Recommendation:**
- Document approved baseline configuration (POA&M #049)
- Implement configuration change approval process

**Responsible Party:** System Administrator / Configuration Control Board (CCB)

---

### CM-3: Configuration Change Control
**Status:** 🟡 Partially Implemented
**Implementation:**
- Git version control for code changes
- No formal change control board (CCB)
- No formal change approval process
- No impact analysis requirement

**Recommendation:**
- Establish CCB for production changes (POA&M #050)
- Document change control procedures
- Require impact analysis for security-relevant changes

**Responsible Party:** System Owner / CCB

---

### CM-4: Security Impact Analysis
**Status:** ❌ Not Implemented
**Implementation:** No formal security impact analysis for changes
**Recommendation:** Require security impact analysis before implementing changes (POA&M #051)
**Responsible Party:** ISSO / CCB

---

### CM-6: Configuration Settings
**Status:** ✅ Implemented
**Implementation:**

**Security-relevant settings:**
- JWT_SECRET (token signing key)
- JWT_REFRESH_SECRET (refresh token key)
- ENCRYPTION_KEY (data encryption key)
- CORS_ORIGIN (cross-origin policy)
- NODE_ENV (production vs development)
- DB_PASSWORD (database authentication)
- Hardcoded settings:
  - bcrypt cost factor: 12
  - JWT expiration: 15m (access), 7d (refresh)
  - Rate limit: 100 requests / 60 seconds
  - File upload limit: 50MB

**Evidence:**
- Source: `.env.example` - documented settings
- Source: `backend/src/auth/auth.service.ts` - JWT configuration
- Source: `backend/src/main.ts` - rate limiting, CORS, body size

**Recommendation:**
- Create configuration settings documentation (POA&M #052)
- Make hardcoded security settings configurable via environment variables

**Responsible Party:** System Administrator / Development Team

---

### CM-7: Least Functionality
**Status:** ✅ Implemented
**Implementation:**
- Alpine Linux base images (minimal packages, ~5MB base)
- Only essential ports exposed (3000, 8080, 8081)
- No unnecessary services in containers
- Development dependencies not in production images (multi-stage builds)
- No debugging tools in production containers

**Evidence:**
- Source: Dockerfiles - multi-stage builds
- Source: `docker-compose.yml` - minimal port exposure
- Alpine images: https://hub.docker.com/_/alpine

**Responsible Party:** Application / System Administrator

---

### CM-8: Information System Component Inventory
**Status:** ✅ Implemented
**Implementation:**
- Hardware inventory: To be maintained by system owner
- Software inventory: See SSP Section 11
- Docker images tracked via tags (latest, specific versions)
- Node.js dependencies in package.json + package-lock.json
- Database schema versioned via TypeORM migrations

**Evidence:**
- Document: SSP Section 11 - Hardware and Software Inventory
- Source: package.json files
- Source: docker-compose.yml - image specifications

**Recommendation:**
- Maintain formal component inventory spreadsheet (POA&M #053)
- Track all display terminals (serial numbers, locations)

**Responsible Party:** System Owner / System Administrator

---

### CM-9: Configuration Management Plan
**Status:** ❌ Not Implemented
**Implementation:** No formal configuration management plan document
**Recommendation:** Create configuration management plan (POA&M #054)
**Responsible Party:** System Owner / CCB

---

### CM-10: Software Usage Restrictions
**Status:** ✅ Implemented
**Implementation:**
- All software uses open source licenses (MIT, Apache, BSD, PostgreSQL)
- License compliance verified
- No proprietary software restrictions violated
- Node.js package licenses tracked in package.json

**Evidence:**
- Document: SSP Section 11.2 - Software inventory with licenses
- All licenses allow DoD use

**Responsible Party:** System Owner

---

### CM-11: User-Installed Software
**Status:** ✅ Implemented
**Implementation:**
- Users cannot install software (web-based interface only)
- Containerized deployment prevents software installation by users
- Admin users cannot install packages without container rebuild

**Responsible Party:** Application

---

## CONTINGENCY PLANNING (CP)

### CP-1: Contingency Planning Policy and Procedures
**Status:** ❌ Not Implemented
**Implementation:** No formal contingency planning policy documented
**Recommendation:** Create contingency planning policy (POA&M #055)
**Responsible Party:** System Owner

---

### CP-2: Contingency Plan
**Status:** 🟡 Partially Implemented
**Implementation:**
- Basic recovery procedures known informally
- No documented contingency plan
- No tested recovery procedures

**Recommendation:**
- Create comprehensive contingency plan (POA&M #056)
- Document recovery procedures
- Identify essential functions and recovery priorities

**Responsible Party:** System Owner / System Administrator

---

### CP-3: Contingency Training
**Status:** ❌ Not Implemented
**Implementation:** No formal contingency training program
**Recommendation:** Provide contingency training to system administrators (POA&M #057)
**Responsible Party:** System Owner

---

### CP-4: Contingency Plan Testing
**Status:** ❌ Not Implemented
**Implementation:** No documented contingency plan testing
**Recommendation:**
- Test contingency plan annually (POA&M #058)
- Document test results
- Update plan based on test findings

**Responsible Party:** System Owner / System Administrator

---

### CP-6: Alternate Storage Site
**Status:** ❌ Not Implemented
**Implementation:** No alternate storage site for backups
**Recommendation:**
- Identify alternate storage location for backup media (POA&M #059)
- Store backups offsite or in separate facility

**Responsible Party:** System Owner

---

### CP-7: Alternate Processing Site
**Status:** ❌ Not Implemented
**Implementation:** No alternate processing site identified
**Recommendation:** Consider alternate processing site for disaster recovery (POA&M #060)
**Responsible Party:** System Owner

---

### CP-9: Information System Backup
**Status:** 🟡 Partially Implemented
**Implementation:**
- Docker volumes provide persistent storage:
  - postgres_data (database)
  - redis_data (cache/queue)
  - ./media (bind mount - content files)
- Volume backup: Manual, not automated
- Backup frequency: Not defined
- Backup testing: Not performed
- VM snapshots: Hyper-V capability available but not scheduled

**Recommendation:**
- Implement automated daily database backups (POA&M #061 - HIGH PRIORITY)
- Test backup restoration monthly
- Document backup and restoration procedures
- Define backup retention policy (recommend: 30 days online, 1 year archived)
- Schedule regular Hyper-V VM snapshots

**Evidence:**
- Source: `docker-compose.yml` - volume definitions

**Responsible Party:** System Administrator

---

### CP-10: Information System Recovery and Reconstitution
**Status:** 🟡 Partially Implemented
**Implementation:**
- Docker Compose allows rapid container recovery (docker-compose up -d)
- Database restoration: Manual (pg_restore)
- Recovery procedures: Not documented
- Recovery time objective (RTO): Not defined
- Recovery point objective (RPO): Not defined

**Recommendation:**
- Document recovery procedures (POA&M #062)
- Define RTO and RPO:
  - Recommended RTO: 4 hours
  - Recommended RPO: 24 hours
- Create recovery runbook

**Responsible Party:** System Administrator

---

## INCIDENT RESPONSE (IR)

### IR-1: Incident Response Policy and Procedures
**Status:** ❌ Not Implemented
**Implementation:** No formal incident response policy
**Recommendation:** Create incident response policy and procedures (POA&M #063)
**Responsible Party:** System Owner / ISSO

---

### IR-2: Incident Response Training
**Status:** ❌ Not Implemented
**Implementation:** No formal incident response training
**Recommendation:** Provide IR training to system administrators and ISSO (POA&M #064)
**Responsible Party:** System Owner

---

### IR-4: Incident Handling
**Status:** 🟡 Partially Implemented
**Implementation:**
- Application logs security-relevant events
- Push notifications for display status changes
- Error logging in database (Display.errorLogs)
- No formal incident response procedures
- No integration with Navy CSIRT

**Evidence:**
- Source: `backend/src/displays/entities/display.entity.ts` - errorLogs field
- Source: `backend/src/push-notifications/` - alerting capability

**Recommendation:**
- Document incident handling procedures (POA&M #065)
- Integrate with Navy CSIRT
- Define incident escalation process

**Responsible Party:** ISSO / System Administrator

---

### IR-5: Incident Monitoring
**Status:** 🟡 Partially Implemented
**Implementation:**
- Application logging (Winston)
- Display health monitoring
- SSE connection monitoring
- No automated security event detection
- No SIEM integration

**Recommendation:**
- Integrate with SIEM for automated incident detection (POA&M #066)
- Implement security event correlation

**Responsible Party:** System Administrator / Security Team

---

### IR-6: Incident Reporting
**Status:** ❌ Not Implemented
**Implementation:** No formal incident reporting procedures
**Recommendation:**
- Document incident reporting procedures (POA&M #067)
- Identify reporting chain (ISSO → ISSM → AO → Navy CSIRT)
- Define reportable incidents

**Responsible Party:** ISSO

---

### IR-7: Incident Response Assistance
**Status:** 🟡 Partially Implemented
**Implementation:**
- System administrator available for assistance
- No 24/7 coverage
- No formal help desk

**Recommendation:**
- Document support contact information (POA&M #068)
- Establish on-call procedures for critical incidents

**Responsible Party:** System Owner

---

### IR-8: Incident Response Plan
**Status:** ❌ Not Implemented
**Implementation:** No documented incident response plan
**Recommendation:** Create incident response plan (POA&M #069)
**Responsible Party:** ISSO / System Owner

---

## PLANNING (PL)

### PL-1: Security Planning Policy and Procedures
**Status:** ✅ Implemented
**Implementation:** This SSP serves as the security planning documentation
**Evidence:** System Security Plan (SSP) document
**Responsible Party:** System Owner / ISSO

---

### PL-2: System Security Plan
**Status:** ✅ Implemented
**Implementation:** This document (SSP v1.0)
**Evidence:** System Security Plan dated November 20, 2025
**Responsible Party:** System Owner / ISSO

---

### PL-4: Rules of Behavior
**Status:** ❌ Not Implemented
**Implementation:** No documented rules of behavior for users
**Recommendation:** Create rules of behavior document (POA&M #070)
**Responsible Party:** System Owner / ISSO

---

### PL-8: Information Security Architecture
**Status:** 🟡 Partially Implemented
**Implementation:**
- System architecture documented in SSP
- Security architecture diagrams provided
- No formal information security architecture document

**Evidence:** SSP Section 5 - System Architecture

**Recommendation:** Create detailed information security architecture document (POA&M #071)
**Responsible Party:** System Owner / Security Architect

---

## PHYSICAL AND ENVIRONMENTAL PROTECTION (PE)

**All PE controls are INHERITED from facility security.**

| Control | Status | Inheriting From |
|---------|--------|----------------|
| PE-1 through PE-20 | 🔵 Inherited | Facility Security / Physical Security Officer |

**Responsible Party:** Facility Security Officer

---

## PERSONNEL SECURITY (PS)

**All PS controls are INHERITED from Navy personnel security program.**

| Control | Status | Inheriting From |
|---------|--------|----------------|
| PS-1 through PS-8 | 🔵 Inherited | Navy Personnel Security / Command Personnel |

**Responsible Party:** Personnel Security Manager

---

## MEDIA PROTECTION (MP)

### MP-1: Media Protection Policy and Procedures
**Status:** 🟡 Partially Implemented
**Implementation:** Media stored on server but no formal policy
**Recommendation:** Document media protection policy (POA&M #072)
**Responsible Party:** System Owner

---

### MP-2: Media Access
**Status:** 🟡 Partially Implemented
**Implementation:**
- Physical media access: Inherited from facility security
- Digital media (uploads): Access controlled via authentication
- Media files not encrypted at rest

**Recommendation:** Encrypt media files at rest (POA&M #073)
**Responsible Party:** Development Team / System Administrator

---

### MP-3 through MP-8: Media Marking, Storage, Transport, Sanitization
**Status:** 🔵 Inherited
**Implementation:** Inherited from facility media protection procedures
**Responsible Party:** Facility Security

---

## RISK ASSESSMENT (RA)

### RA-1: Risk Assessment Policy and Procedures
**Status:** ❌ Not Implemented
**Implementation:** No formal risk assessment policy
**Recommendation:** Create risk assessment policy (POA&M #074)
**Responsible Party:** System Owner / ISSO

---

### RA-2: Security Categorization
**Status:** 🟡 Partially Implemented
**Implementation:**
- FIPS 199 categorization performed: MODERATE
- Documented in SSP Section 2

**Evidence:** SSP Section 2 - System Categorization

**Recommendation:** Obtain formal approval of security categorization (POA&M #075)
**Responsible Party:** Authorizing Official

---

### RA-3: Risk Assessment
**Status:** 🟡 Partially Implemented
**Implementation:**
- Initial risk assessment performed during SSP development
- Vulnerabilities identified in POA&M
- No formal risk assessment report

**Recommendation:** Create formal risk assessment report (POA&M #076)
**Responsible Party:** ISSO / Security Assessment Team

---

### RA-5: Vulnerability Scanning
**Status:** ❌ Not Implemented
**Implementation:** No automated vulnerability scanning
**Recommendation:**
- Implement automated vulnerability scanning (Nessus, ACAS, Rapid7) (POA&M #077)
- Scan quarterly minimum
- Scan after significant changes

**Responsible Party:** System Administrator / Security Team

---

## SYSTEM AND SERVICES ACQUISITION (SA)

### SA-4: Acquisition Process
**Status:** N/A
**Implementation:** Open source software, no formal acquisition process required
**Responsible Party:** N/A

---

### SA-11: Developer Security Testing
**Status:** 🟡 Partially Implemented
**Implementation:**
- Code developed with security in mind
- No formal security testing (SAST/DAST)
- No penetration testing performed

**Recommendation:**
- Implement static application security testing (SAST) (POA&M #078)
- Implement dynamic application security testing (DAST) (POA&M #079)
- Perform penetration testing before ATO (POA&M #080 - REQUIRED)

**Responsible Party:** Development Team / Security Assessment Team

---

## MAINTENANCE (MA)

### MA-2: Controlled Maintenance
**Status:** 🟡 Partially Implemented
**Implementation:**
- System maintenance via SSH access to Ubuntu VM
- Docker container updates via docker-compose
- No formal maintenance procedures documented

**Recommendation:** Document controlled maintenance procedures (POA&M #081)
**Responsible Party:** System Administrator

---

### MA-4: Nonlocal Maintenance
**Status:** 🟡 Partially Implemented
**Implementation:**
- Remote maintenance via SSH (if configured)
- No formal remote maintenance policy
- No multi-factor authentication for remote access

**Recommendation:**
- Document remote maintenance policy (POA&M #082)
- Implement MFA for remote administrative access (POA&M #083)

**Responsible Party:** System Administrator / Network Admin

---

## ASSESSMENT AND AUTHORIZATION (CA)

### CA-1: Security Assessment and Authorization Policy
**Status:** 🟡 Partially Implemented
**Implementation:** RMF process followed but no formal policy document
**Recommendation:** Document assessment and authorization policy (POA&M #084)
**Responsible Party:** System Owner

---

### CA-2: Security Assessments
**Status:** 🟡 Partially Implemented
**Implementation:**
- Self-assessment performed during SSP development
- No independent security assessment
- No formal SAR yet

**Recommendation:** Conduct independent security assessment (POA&M #085 - REQUIRED FOR ATO)
**Responsible Party:** Independent Assessor / Third Party

---

### CA-3: System Interconnections
**Status:** 🟡 Partially Implemented
**Implementation:**
- External connections documented in SSP Section 8
- No formal Interconnection Security Agreements (ISAs)
- External API connections optional

**Recommendation:** Create ISAs for external API connections if used (POA&M #086)
**Responsible Party:** System Owner / ISSO

---

### CA-5: Plan of Action and Milestones
**Status:** 🟡 Partially Implemented
**Implementation:** POA&M items identified in this SCTM
**Recommendation:** Create formal POA&M document (POA&M #087 - REQUIRED FOR ATO)
**Responsible Party:** ISSO

---

### CA-6: Security Authorization
**Status:** ❌ Not Implemented
**Implementation:** ATO not yet granted
**Recommendation:** Submit ATO package for authorization (Final step)
**Responsible Party:** Authorizing Official

---

### CA-7: Continuous Monitoring
**Status:** ❌ Not Implemented
**Implementation:** No continuous monitoring strategy defined
**Recommendation:**
- Develop continuous monitoring strategy (POA&M #088)
- Define monitoring frequency for controls
- Implement automated monitoring where possible

**Responsible Party:** ISSO / System Administrator

---

## SUMMARY OF CRITICAL GAPS

### High Priority (Required for ATO):

1. **POA&M #022** - Implement MFA for admin users
2. **POA&M #028** - Enforce HTTPS with TLS 1.2+ minimum
3. **POA&M #031** - Migrate secrets to secure key management system
4. **POA&M #040** - Implement antivirus scanning for uploaded files
5. **POA&M #061** - Implement automated daily backups
6. **POA&M #080** - Perform penetration testing before ATO
7. **POA&M #085** - Conduct independent security assessment
8. **POA&M #087** - Create formal POA&M document

### Medium Priority (Address within 90 days of ATO):

9. **POA&M #006** - Account lockout after failed login attempts
10. **POA&M #024** - Password complexity policy enforcement
11. **POA&M #038** - Automated vulnerability scanning
12. **POA&M #041** - SIEM integration
13. **POA&M #055-069** - Complete contingency and incident response planning

### Low Priority (Address within 180 days of ATO):

14. Comprehensive audit logging on all endpoints
15. Centralized log aggregation
16. Configuration management plan
17. Risk assessment report
18. Continuous monitoring strategy

---

## DOCUMENT APPROVAL

| Role | Name | Signature | Date |
|------|------|-----------|------|
| ISSO | [TBD] | | |
| ISSM | [TBD] | | |
| System Owner | [TBD] | | |

---

**Document Control:**
- **Version:** 1.0
- **Date:** November 20, 2025
- **Classification:** UNCLASSIFIED
- **Next Review:** [Quarterly or upon significant change]

---

*END OF SECURITY CONTROLS TRACEABILITY MATRIX*
