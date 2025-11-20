# NAVY ATO DOCUMENTATION PACKAGE
## TeamSub-TV Digital Signage Content Management System

**Classification:** UNCLASSIFIED
**System Categorization:** MODERATE (FIPS 199)
**Version:** 1.0
**Package Date:** November 20, 2025

---

## PACKAGE CONTENTS

This ATO documentation package contains all required documents for Navy Risk Management Framework (RMF) authorization:

### Core RMF Documents

| Document | Filename | Status | Pages |
|----------|----------|--------|-------|
| **System Security Plan (SSP)** | `01_System_Security_Plan.md` | Complete | ~80 |
| **Security Controls Traceability Matrix (SCTM)** | `02_Security_Controls_Traceability_Matrix.md` | Complete | ~60 |
| **System Architecture & Design** | `03_System_Architecture_and_Design.md` | Complete | ~70 |
| **Security Assessment Report (SAR)** | `04_Security_Assessment_Report.md` | Template | ~40 |
| **Plan of Action & Milestones (POA&M)** | `05_Plan_of_Action_and_Milestones.md` | Complete | ~30 |
| **Configuration Management Plan** | `06_Configuration_Management_Plan.md` | Complete | ~25 |
| **Incident Response Plan** | `07_Incident_Response_Plan.md` | Complete | ~30 |
| **Contingency & Disaster Recovery Plan** | `08_Contingency_and_DR_Plan.md` | Complete | ~35 |
| **User Security Guide** | `09_User_Security_Guide.md` | Complete | ~25 |
| **Technical Security Appendices** | `10_Technical_Appendices.md` | Complete | ~40 |

**Total Package:** 10 documents, ~435 pages

---

## SYSTEM OVERVIEW

**System Name:** TeamSub-TV Digital Signage CMS
**Mission:** Centralized digital signage content management for Navy submarine team operations
**Deployment:** On-premises, HP ProLiant Server with Windows Server 2025 + Hyper-V + Ubuntu VM + Docker

**Technology Stack:**
- Backend: NestJS (Node.js 20) with PostgreSQL 16 and Redis 7
- Frontend: React 18 with TypeScript
- Deployment: Docker Compose multi-container architecture
- Authentication: JWT with bcrypt password hashing
- Encryption: AES-256-GCM for sensitive data

---

## SECURITY CATEGORIZATION

Per FIPS 199 and CNSSI 1253:

| Security Objective | Impact Level | Rationale |
|-------------------|--------------|-----------|
| **Confidentiality** | MODERATE | FOUO operational information (FPCON status, facility info) |
| **Integrity** | MODERATE | Incorrect FPCON/LAN displays could mislead personnel |
| **Availability** | LOW | Alternate communication channels exist for critical info |

**Overall Categorization:** MODERATE

---

## DOCUMENT STATUS SUMMARY

### ✅ Complete Documents (Ready for Review)
1. System Security Plan (SSP) - Comprehensive 15-section document
2. Security Controls Traceability Matrix (SCTM) - All 220 NIST 800-53 controls mapped
3. System Architecture & Design - Physical, logical, network, application architecture
4. Plan of Action & Milestones (POA&M) - 88 items identified and prioritized
5. Configuration Management Plan - Baseline, change control, versioning
6. Incident Response Plan - Detection, response, reporting procedures
7. Contingency & Disaster Recovery Plan - Backup, recovery, business continuity
8. User Security Guide - Admin and user security procedures
9. Technical Security Appendices - Ports, protocols, cryptography, APIs

### 🟡 Requires External Action
10. **Security Assessment Report (SAR)** - Template provided
    - Requires independent security assessment/penetration test
    - Must be performed by certified assessor
    - Recommend Navy-approved third party or internal security team

---

## CRITICAL FINDINGS & GAPS

### HIGH PRIORITY (Must Address Before ATO)

| Item | Finding | Recommendation | POA&M # |
|------|---------|----------------|---------|
| 1 | No MFA implemented | Implement TOTP or CAC/PIV MFA for admin users | #022 |
| 2 | HTTPS not enforced | Configure nginx with TLS 1.2+, force HTTPS redirects | #028 |
| 3 | Secrets in .env file | Migrate to Azure Key Vault or HashiCorp Vault | #031 |
| 4 | No antivirus scanning | Integrate ClamAV for uploaded file scanning | #040 |
| 5 | No automated backups | Implement daily PostgreSQL dumps with offsite storage | #061 |
| 6 | No penetration test | Conduct independent pentest before ATO | #080 |
| 7 | No security assessment | Conduct formal security assessment (required for SAR) | #085 |
| 8 | POA&M in SCTM only | Create standalone POA&M tracking document | #087 |

### MEDIUM PRIORITY (Address Within 90 Days)
- Account lockout after failed logins (#006)
- Password complexity enforcement (#024)
- Automated vulnerability scanning (#038)
- SIEM integration for monitoring (#041)
- Comprehensive audit logging (#011)

### LOW PRIORITY (Address Within 180 Days)
- Formal policy documentation (multiple items)
- Continuous monitoring strategy (#088)
- Configuration management procedures (#050)

---

## IMPLEMENTATION HIGHLIGHTS

### Security Controls Implemented ✅

**Access Control:**
- Role-based access control (Admin/Standard)
- JWT authentication (15min access, 7day refresh)
- API key authentication for displays
- Least privilege by default

**Cryptography:**
- Passwords: bcrypt (12 rounds)
- API keys: AES-256-GCM encryption
- External credentials: AES-256-GCM encryption
- JWT tokens: HMAC-SHA256 signatures

**Infrastructure Security:**
- Docker container isolation
- Alpine Linux (minimal attack surface)
- PostgreSQL + Redis with health checks
- Docker network segmentation

**Input Validation:**
- class-validator with whitelist mode
- TypeORM parameterized queries (SQL injection prevention)
- File upload MIME type and size validation
- Rate limiting (100 requests/60 seconds)

**Audit Capabilities:**
- Audit log entity with userId, action, changes, IP, timestamp
- Application logging via Winston
- Display health monitoring and error logging
- Push notification events tracking

---

## DEPLOYMENT ARCHITECTURE

```
HP ProLiant Server (Windows Server 2025 + Hyper-V)
├── MagicInfo Server (Co-resident on host)
└── Ubuntu Server 20.04 VM (Hyper-V Guest)
    └── Docker Compose (signage-network)
        ├── backend (NestJS API) :3000
        ├── frontend-admin (React + nginx) :8080
        ├── frontend-display (React + nginx) :8081
        ├── postgres (PostgreSQL 16) :5432
        └── redis (Redis 7) :6379

Admin Users → https://<server>:8080
Display Terminals → https://<server>:8081
```

---

## PRE-ATO CHECKLIST

### Required Actions Before ATO Submission

- [ ] **Complete independent security assessment** (certified assessor)
- [ ] **Conduct penetration testing** (network + application layer)
- [ ] **Finalize Security Assessment Report (SAR)** with findings
- [ ] **Implement HIGH priority POA&M items** (#022, #028, #031, #040, #061)
- [ ] **Install and configure SSL/TLS certificates** (production HTTPS)
- [ ] **Change all default passwords** (admin user, database)
- [ ] **Generate production secrets** (JWT, encryption keys, VAPID keys)
- [ ] **Configure automated backups** (daily database, weekly media files)
- [ ] **Document actual hardware specifications** (TBD items in SSP)
- [ ] **Obtain signature approvals** (System Owner, ISSO, ISSM, AO)
- [ ] **Review and validate all [TBD] placeholders** in documents
- [ ] **Submit POA&M for HIGH items** with realistic timelines
- [ ] **Configure firewall rules** (block ports 5432, 6379 externally)
- [ ] **Enable audit logging** on all sensitive endpoints
- [ ] **Test backup restoration** procedures
- [ ] **Document incident response contacts** (ISSO, ISSM, Navy CSIRT)

### Recommended Actions (Not Blocking)

- [ ] Integrate SIEM for centralized logging
- [ ] Implement MFA for all users (not just admins)
- [ ] Enable PostgreSQL and Redis TLS connections
- [ ] Set up vulnerability scanning schedule
- [ ] Create formal configuration change control board
- [ ] Document detailed recovery runbooks
- [ ] Establish continuous monitoring procedures
- [ ] Create user security awareness training materials

---

## ROLES AND RESPONSIBILITIES

### Primary Contacts (To Be Assigned)

| Role | Responsibility | Name | Contact |
|------|---------------|------|---------|
| **System Owner** | Overall system accountability, risk decisions | [TBD] | [TBD] |
| **Authorizing Official (AO)** | Grant or deny ATO, accept residual risk | [TBD] | [TBD] |
| **ISSO** | Day-to-day security operations, monitoring | [TBD] | [TBD] |
| **ISSM** | Security program management | [TBD] | [TBD] |
| **System Administrator** | Technical operations, maintenance | [TBD] | [TBD] |
| **Security Assessor** | Independent security assessment | [TBD] | [TBD] |

### Organizational Units

| Unit | Responsibility |
|------|---------------|
| **Information Assurance** | Security policy, compliance, assessment |
| **Network Operations** | Firewall rules, network security |
| **System Administration** | Server management, backups, monitoring |
| **Facility Security** | Physical access control (inherited) |
| **Personnel Security** | User vetting, clearances (inherited) |

---

## ATO SUBMISSION PROCESS

### Recommended Workflow

1. **Pre-Assessment** (2-4 weeks)
   - Complete all HIGH priority POA&M items
   - Deploy to production hardware
   - Configure TLS/HTTPS
   - Change default credentials

2. **Security Assessment** (2-3 weeks)
   - Engage certified security assessor
   - Conduct vulnerability scans
   - Perform penetration testing
   - Document findings in SAR

3. **Remediation** (2-4 weeks)
   - Address critical and high findings from assessment
   - Update POA&M with accepted risks
   - Retest fixed vulnerabilities

4. **Documentation Review** (1-2 weeks)
   - ISSO reviews all documents
   - ISSM validates security controls
   - System Owner approves package
   - Fill in all [TBD] placeholders

5. **ATO Package Submission** (1 week)
   - Submit complete package to AO
   - Present risk posture briefing
   - Answer AO questions

6. **AO Decision** (1-2 weeks)
   - AO reviews package
   - AO accepts or rejects risks
   - AO grants ATO or requests remediation

7. **Continuous Monitoring** (Ongoing)
   - Monthly security scans
   - Quarterly control testing
   - Annual SSP review
   - Update POA&M monthly

**Total Estimated Timeline:** 8-15 weeks from start to ATO grant

---

## CONTINUOUS MONITORING REQUIREMENTS

### Post-ATO Activities

**Monthly:**
- Update POA&M status
- Review audit logs for anomalies
- Verify backup completion
- Check vulnerability scan results

**Quarterly:**
- Test disaster recovery procedures
- Review and update security controls
- Conduct configuration audits
- Security awareness training for users

**Annually:**
- Update System Security Plan
- Recertify security categorization
- Conduct full security assessment
- ATO renewal (if required)

**Ad Hoc:**
- After significant system changes
- After security incidents
- When new vulnerabilities discovered
- When control failures detected

---

## DOCUMENT CONVENTIONS

### Classification Markings
All documents marked **UNCLASSIFIED** - No CUI or higher present in system

### Version Control
- Document versions follow format: Major.Minor (e.g., 1.0, 1.1, 2.0)
- Major version increments for substantial changes
- Minor version increments for corrections/clarifications

### Placeholders
- **[TBD]**: To be determined by organization
- **[Specific model TBD]**: Hardware/software specifics to be documented
- **[Contact information]**: Organization-specific contacts to be added

### References to Source Code
- File references: `filename.ts`, `path/to/file.ts`
- Line numbers: `filename.ts:123`
- Code blocks: ```typescript or ```bash

---

## SUPPORT AND QUESTIONS

### Technical Questions
- System architecture: See document #03
- Security controls: See documents #01, #02
- Deployment procedures: See documents #06, #08

### Policy Questions
- RMF process: Consult Navy RMF PMO
- Security categorization: See SSP Section 2
- Control selection: See SCTM document #02

### Assessment Questions
- Assessment procedures: See SAR template #04
- Penetration testing: Coordinate with Navy-approved vendor
- Vulnerability scanning: Use ACAS or approved tool

---

## REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-20 | [System Development Team] | Initial ATO package creation |

---

## DOCUMENT APPROVAL

This ATO package has been prepared for review and approval:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Package Preparer | [TBD] | | |
| System Owner | [TBD] | | |
| ISSO | [TBD] | | |
| ISSM | [TBD] | | |

---

**For Official Use Only - ATO Package Submission**
**Distribution:** System Owner, ISSO, ISSM, AO, Security Assessment Team

---

*END OF ATO PACKAGE README*
