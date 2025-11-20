# PLAN OF ACTION AND MILESTONES (POA&M)
## TeamSub-TV Digital Signage Content Management System

**Classification:** UNCLASSIFIED
**Version:** 1.0
**Date:** November 20, 2025
**Review Frequency:** Monthly

---

## PURPOSE

This Plan of Action and Milestones (POA&M) documents security weaknesses identified during the security assessment of TeamSub-TV and provides a structured approach for remediation. Each weakness is tracked with assigned responsibility, resources required, milestones, and completion dates.

---

## POA&M SUMMARY

| Priority | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 8 | Must be addressed before ATO grant |
| **HIGH** | 15 | Address within 30 days of ATO |
| **MEDIUM** | 25 | Address within 90 days of ATO |
| **LOW** | 40 | Address within 180 days of ATO |
| **TOTAL** | **88** | Total identified weaknesses |

---

## CRITICAL PRIORITY (PRE-ATO REQUIRED)

### POA&M #022: Implement Multi-Factor Authentication for Admin Users
**NIST Control:** IA-2(1)
**Weakness:** Admin accounts protected by password only; no MFA implemented
**Risk:** HIGH - Compromised admin credentials provide full system access
**Impact:** Unauthorized administrative access, data breach, system compromise

**Remediation Plan:**
1. Research and select MFA solution (TOTP recommended: Google Authenticator, Authy)
2. Integrate MFA library (e.g., speakeasy, otplib) into backend authentication
3. Create MFA enrollment endpoint (POST /api/auth/mfa/enroll)
4. Create MFA verification endpoint (POST /api/auth/mfa/verify)
5. Update login flow to require MFA code after password validation
6. Add MFA recovery codes (10 one-time use codes per user)
7. Create MFA management UI in Admin Portal
8. Test MFA with multiple devices
9. Document MFA procedures in user guide
10. Force MFA enrollment for all admin users

**Milestones:**
- [ ] Week 1: Select MFA solution and acquire library
- [ ] Week 2-3: Implement backend MFA endpoints
- [ ] Week 4: Implement frontend MFA UI
- [ ] Week 5: Testing and documentation
- [ ] Week 6: Deploy and enforce MFA

**Resources Required:** 1 developer (6 weeks), MFA testing devices
**Responsible Party:** Development Team
**Point of Contact:** [TBD]
**Estimated Cost:** $0 (open source solution)
**Scheduled Completion Date:** [6 weeks from ATO decision]
**Status:** Not Started

---

### POA&M #028: Enforce HTTPS with TLS 1.2+ Minimum
**NIST Control:** SC-8
**Weakness:** HTTPS not enforced; HTTP connections allowed; no automatic redirect
**Risk:** HIGH - Credentials and sensitive data transmitted in cleartext
**Impact:** Man-in-the-middle attacks, credential theft, session hijacking

**Remediation Plan:**
1. Obtain SSL/TLS certificate (DoD PKI certificate recommended)
2. Install certificate on nginx reverse proxy
3. Configure nginx TLS settings (TLS 1.2+ only, strong cipher suites)
4. Configure HTTP to HTTPS redirect (301 permanent redirect)
5. Set HSTS header (Strict-Transport-Security: max-age=31536000)
6. Test TLS configuration with SSLLabs or testssl.sh
7. Update all internal URLs to use https://
8. Update CORS_ORIGIN to use https://
9. Test all application functionality over HTTPS
10. Document TLS configuration in security plan

**Nginx TLS Configuration:**
```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000" always;

    # ... rest of configuration
}
```

**Milestones:**
- [ ] Week 1: Obtain DoD PKI certificate
- [ ] Week 1: Configure nginx TLS
- [ ] Week 2: Test and validate TLS configuration
- [ ] Week 2: Deploy to production

**Resources Required:** SSL certificate, 1 system administrator (2 weeks)
**Responsible Party:** System Administrator
**Point of Contact:** [TBD]
**Estimated Cost:** $0 (DoD PKI) or $50-200/year (commercial certificate)
**Scheduled Completion Date:** [2 weeks from ATO decision]
**Status:** Not Started

---

### POA&M #031: Migrate Secrets to Secure Key Management System
**NIST Control:** SC-12
**Weakness:** Cryptographic keys stored in plaintext .env file on filesystem
**Risk:** HIGH - Key compromise leads to complete system breach
**Impact:** Decryption of all sensitive data, token forgery, unauthorized access

**Remediation Plan:**
1. Evaluate key management solutions:
   - Azure Key Vault (if Azure environment available)
   - HashiCorp Vault (on-premises option)
   - AWS Secrets Manager (if AWS environment available)
2. Deploy selected key management system
3. Migrate secrets to key vault:
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - ENCRYPTION_KEY
   - Database credentials
   - VAPID keys
   - External API keys
4. Update application to retrieve secrets from vault at startup
5. Implement secret rotation procedure
6. Remove secrets from .env file (keep only vault connection info)
7. Encrypt .env file with vault reference credentials
8. Update deployment documentation
9. Test secret retrieval and rotation
10. Document key management procedures

**Recommended Solution:** HashiCorp Vault (on-premises, no cloud dependency)

**Milestones:**
- [ ] Week 1: Deploy HashiCorp Vault server
- [ ] Week 2: Configure Vault policies and authentication
- [ ] Week 3: Migrate secrets to Vault
- [ ] Week 4: Update application code to use Vault SDK
- [ ] Week 5: Testing and documentation
- [ ] Week 6: Deploy to production

**Resources Required:** 1 system administrator, 1 developer (6 weeks), Vault server (VM or container)
**Responsible Party:** System Administrator + Development Team
**Point of Contact:** [TBD]
**Estimated Cost:** $0 (HashiCorp Vault Community Edition)
**Scheduled Completion Date:** [6 weeks from ATO decision]
**Status:** Not Started

---

### POA&M #040: Implement Antivirus Scanning for Uploaded Files
**NIST Control:** SI-3
**Weakness:** No malware scanning of uploaded content files
**Risk:** HIGH - Malicious files could be uploaded and distributed to displays
**Impact:** Malware infection of display terminals, data breach, system compromise

**Remediation Plan:**
1. Deploy ClamAV antivirus server (clamd daemon)
2. Install ClamAV client library in backend (npm: clamscan)
3. Create virus scanning service (VirusScanService)
4. Integrate scanning into file upload workflow:
   - POST /api/content/upload → Save to temp directory
   - Scan file with ClamAV
   - If clean: Move to /app/media, create DB record
   - If infected: Delete file, return 400 error, log incident
5. Configure ClamAV daily signature updates
6. Add virus scan results to audit log
7. Create alert for detected malware (push notification to admins)
8. Test with EICAR test file
9. Monitor ClamAV performance impact
10. Document antivirus procedures

**ClamAV Integration:**
```typescript
@Injectable()
export class VirusScanService {
  private clamav: NodeClam;

  constructor() {
    this.clamav = new NodeClam().init({
      clamdscan: {
        host: 'clamav',  // Docker service name
        port: 3310,
      },
    });
  }

  async scanFile(filePath: string): Promise<{ isInfected: boolean; viruses: string[] }> {
    const { isInfected, viruses } = await this.clamav.scanFile(filePath);
    return { isInfected, viruses };
  }
}
```

**Milestones:**
- [ ] Week 1: Deploy ClamAV container
- [ ] Week 2: Integrate ClamAV into backend
- [ ] Week 3: Test and validate scanning
- [ ] Week 3: Deploy to production

**Resources Required:** 1 developer (3 weeks), ClamAV server (Docker container, 2GB RAM)
**Responsible Party:** Development Team + System Administrator
**Point of Contact:** [TBD]
**Estimated Cost:** $0 (ClamAV is free/open source)
**Scheduled Completion Date:** [3 weeks from ATO decision]
**Status:** Not Started

---

### POA&M #061: Implement Automated Daily Database Backups
**NIST Control:** CP-9
**Weakness:** No automated backup procedure; manual backups inconsistent
**Risk:** HIGH - Data loss in case of hardware failure, corruption, or attack
**Impact:** Loss of user accounts, content metadata, schedules, audit logs

**Remediation Plan:**
1. Create backup script (backup-database.sh):
   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR=/backups/database
   docker-compose exec -T postgres pg_dump -U signage signage_cms > \
     $BACKUP_DIR/signage_$DATE.sql
   gzip $BACKUP_DIR/signage_$DATE.sql
   # Delete backups older than 30 days
   find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
   ```
2. Schedule daily backup via cron (2:00 AM daily)
3. Create media files backup script (rsync to backup location)
4. Schedule weekly media backup via cron (Sunday 3:00 AM)
5. Configure backup retention policy (30 days online, 1 year archived)
6. Set up offsite backup location (separate server or NAS)
7. Test backup restoration procedure monthly
8. Document backup and restoration procedures
9. Create backup monitoring and alerting
10. Encrypt backup files before offsite transfer

**Crontab Entry:**
```
0 2 * * * /opt/teamsub-tv/scripts/backup-database.sh
0 3 * * 0 /opt/teamsub-tv/scripts/backup-media.sh
```

**Milestones:**
- [ ] Week 1: Create backup scripts
- [ ] Week 1: Set up backup storage location
- [ ] Week 1: Schedule cron jobs
- [ ] Week 2: Test restoration procedures
- [ ] Week 2: Document procedures

**Resources Required:** 1 system administrator (2 weeks), backup storage (500GB minimum)
**Responsible Party:** System Administrator
**Point of Contact:** [TBD]
**Estimated Cost:** Backup storage hardware cost (varies)
**Scheduled Completion Date:** [2 weeks from ATO decision]
**Status:** Not Started

---

### POA&M #080: Conduct Penetration Testing Before ATO
**NIST Control:** SA-11, CA-8
**Weakness:** No penetration testing performed; unknown vulnerabilities may exist
**Risk:** CRITICAL - Unknown security vulnerabilities could be exploited
**Impact:** Unauthorized access, data breach, system compromise

**Remediation Plan:**
1. Identify Navy-approved penetration testing vendor
2. Define scope of penetration test:
   - External network scan
   - Web application testing (OWASP Top 10)
   - API endpoint security testing
   - Authentication and authorization bypass attempts
   - SQL injection testing
   - Cross-site scripting (XSS) testing
   - File upload vulnerability testing
   - Session management testing
3. Schedule penetration test (2-3 days)
4. Provide test accounts and documentation to assessor
5. Review findings report
6. Prioritize vulnerabilities (Critical, High, Medium, Low)
7. Remediate Critical and High findings
8. Retest fixed vulnerabilities
9. Document accepted risks for Medium/Low findings in POA&M
10. Include penetration test report in ATO package

**Recommended Vendors:**
- Navy-approved ISSM list
- DISA-approved vendors
- Internal Navy Red Team

**Milestones:**
- [ ] Week 1: Engage penetration testing vendor
- [ ] Week 2-3: Conduct penetration test
- [ ] Week 4: Receive findings report
- [ ] Week 5-8: Remediate critical/high findings
- [ ] Week 9: Retest and validate fixes

**Resources Required:** Penetration testing vendor, 1 developer for remediation (4 weeks)
**Responsible Party:** ISSO + Development Team
**Point of Contact:** [TBD]
**Estimated Cost:** $10,000-25,000 (professional pentest)
**Scheduled Completion Date:** [9 weeks - BEFORE ATO submission]
**Status:** Not Started

---

### POA&M #085: Conduct Independent Security Assessment (Required for SAR)
**NIST Control:** CA-2
**Weakness:** No independent security assessment performed
**Risk:** CRITICAL - Required for ATO; cannot submit without SAR
**Impact:** ATO cannot be granted without completed security assessment

**Remediation Plan:**
1. Identify certified security assessor:
   - Navy IA personnel
   - DISA-certified assessor
   - Third-party with DoD 8570 certification
2. Provide assessor with ATO documentation package
3. Schedule assessment activities:
   - Document review (1 week)
   - Control testing (2 weeks)
   - Vulnerability scanning (included in POA&M #080)
   - Interviews with system personnel
4. Assessor produces Security Assessment Report (SAR)
5. Review SAR findings
6. Update POA&M with identified weaknesses
7. Remediate Critical and High findings
8. Obtain assessor sign-off on SAR
9. Include SAR in final ATO package submission

**Assessment Scope:**
- Validate NIST 800-53 control implementation
- Test authentication and authorization mechanisms
- Review configuration management
- Verify cryptographic implementations
- Assess audit and accountability
- Evaluate incident response capabilities

**Milestones:**
- [ ] Week 1: Engage security assessor
- [ ] Week 2-3: Document review and preparation
- [ ] Week 4-5: Security assessment activities
- [ ] Week 6: Receive draft SAR
- [ ] Week 7-10: Remediation of findings
- [ ] Week 11: Final SAR approved

**Resources Required:** Security assessor, ISSO support, system access for testing
**Responsible Party:** ISSO + Security Assessor
**Point of Contact:** [TBD]
**Estimated Cost:** $15,000-30,000 (independent assessment) or $0 (internal Navy assessor)
**Scheduled Completion Date:** [11 weeks - BEFORE ATO submission]
**Status:** Not Started

---

### POA&M #087: Create Formal POA&M Tracking Document
**NIST Control:** CA-5
**Weakness:** POA&M items only in SCTM; no standalone tracking mechanism
**Risk:** MEDIUM - Difficulty tracking remediation progress
**Impact:** Inability to demonstrate progress to AO

**Remediation Plan:**
1. This document serves as the formal POA&M
2. Create POA&M tracking spreadsheet (Excel or equivalent)
3. Monthly POA&M review meetings
4. Update POA&M status monthly
5. Report POA&M progress to ISSO/ISSM/AO
6. Close completed items with evidence

**Milestones:**
- [x] Week 1: Create POA&M document (this document)
- [ ] Week 1: Create POA&M tracking spreadsheet
- [ ] Ongoing: Monthly POA&M reviews

**Resources Required:** ISSO time for tracking and reporting
**Responsible Party:** ISSO
**Point of Contact:** [TBD]
**Estimated Cost:** $0
**Scheduled Completion Date:** Completed (this document)
**Status:** In Progress

---

## HIGH PRIORITY (30 DAYS POST-ATO)

### POA&M #006: Implement Account Lockout After Failed Login Attempts
**NIST Control:** AC-7
**Weakness:** No account lockout; unlimited login attempts allowed
**Risk:** MEDIUM - Brute force password attacks possible
**Remediation:** Implement account lockout after 5 failed attempts within 15 minutes; 30-minute lockout period
**Resources:** 1 developer (1 week)
**Completion:** [30 days post-ATO]
**Status:** Not Started

---

### POA&M #024: Implement Password Complexity Policy
**NIST Control:** IA-5(1)
**Weakness:** No password complexity enforcement
**Risk:** MEDIUM - Weak passwords vulnerable to guessing/cracking
**Remediation:**
- Minimum 12 characters
- Uppercase, lowercase, digit, special character required
- No common dictionary words
- No username in password
- Password history (prevent reuse of last 10)
- Password expiration (90 days for admins)
**Resources:** 1 developer (1 week)
**Completion:** [30 days post-ATO]
**Status:** Not Started

---

### POA&M #027: Remove External Exposure of Database and Redis Ports
**NIST Control:** SC-7
**Weakness:** Ports 5432 (PostgreSQL) and 6379 (Redis) exposed to host network
**Risk:** MEDIUM - Direct database/cache access from network
**Remediation:**
- Remove port mappings from docker-compose.yml (keep ports internal only)
- Access database/Redis via `docker-compose exec` for administration
- Document internal-only access procedures
**Resources:** 1 system administrator (1 day)
**Completion:** [7 days post-ATO]
**Status:** Not Started

---

### POA&M #011: Implement Comprehensive Audit Event Triggers
**NIST Control:** AU-2
**Weakness:** Audit logging infrastructure exists but not deployed on all endpoints
**Risk:** MEDIUM - Security events not captured for investigation
**Remediation:**
- Create AuditInterceptor (NestJS interceptor)
- Apply to all controllers
- Log: user login/logout, content CRUD, display actions, user management, settings changes
- Include: userId, action, entityType, entityId, before/after values, IP address, timestamp
**Resources:** 1 developer (2 weeks)
**Completion:** [30 days post-ATO]
**Status:** Not Started

---

### POA&M #038: Implement Automated Vulnerability Scanning
**NIST Control:** SI-2, RA-5
**Weakness:** No automated vulnerability scanning
**Risk:** MEDIUM - Unknown vulnerabilities not detected
**Remediation:**
- Deploy vulnerability scanner (recommend: Nessus, ACAS, or Trivy for containers)
- Schedule monthly scans (minimum)
- Generate vulnerability reports
- Create POA&M items for identified vulnerabilities
- Integrate scan results into continuous monitoring
**Resources:** Vulnerability scanning tool, 1 system administrator (setup time: 1 week)
**Completion:** [30 days post-ATO]
**Status:** Not Started

---

### POA&M #041: Integrate with SIEM for Security Monitoring
**NIST Control:** SI-4, AU-6
**Weakness:** No centralized log aggregation or security event correlation
**Risk:** MEDIUM - Security incidents not detected in real-time
**Remediation:**
- Identify Navy-approved SIEM (Splunk, ELK, etc.)
- Configure application to send logs to SIEM
- Configure Docker to forward container logs
- Create SIEM dashboards for TeamSub-TV
- Define security event correlation rules:
  - Multiple failed logins from same IP
  - Admin account changes
  - Unusual API access patterns
  - Large file uploads
  - Display offline events
- Set up alerts for security events
**Resources:** SIEM system access, 1 system administrator (2 weeks)
**Completion:** [30 days post-ATO]
**Status:** Not Started

---

### POA&M #046: Add DOMPurify to React Quill for HTML Sanitization
**NIST Control:** SI-10
**Weakness:** React Quill rich text editor allows HTML injection
**Risk:** MEDIUM - Stored XSS vulnerability via text content
**Remediation:**
- Install DOMPurify library
- Sanitize HTML before saving to database
- Sanitize HTML when rendering text content
- Configure DOMPurify to allow safe HTML tags only
- Test with XSS payloads
**Resources:** 1 developer (3 days)
**Completion:** [14 days post-ATO]
**Status:** Not Started

---

## MEDIUM PRIORITY (90 DAYS POST-ATO)

Below is a summary table. Full details available in SCTM document #02.

| POA&M # | Control | Weakness | Estimated Effort |
|---------|---------|----------|------------------|
| #007 | AC-8 | No DoD warning banner | 1 day |
| #012 | AU-3 | No outcome (success/failure) in audit logs | 3 days |
| #025 | IA-9 | Redis authentication not enabled | 1 day |
| #029 | SC-8(1) | PostgreSQL TLS not enabled | 3 days |
| #030 | SC-8(1) | Redis TLS not enabled | 3 days |
| #032 | SC-13 | Media files not encrypted at rest | 2 weeks |
| #033 | SC-28 | BitLocker not enabled on host | 1 day (sysadmin) |
| #034 | SC-28 | PostgreSQL TDE not enabled | 1 week |
| #036 | SC-39 | Container resource limits not set | 1 day |
| #042 | SI-4 | No host-based IDS | 1 week |
| #043 | SI-4 | No real-time security event alerting | 1 week (requires SIEM) |
| #045 | SI-10 | forbidNonWhitelisted not enabled | 1 hour |
| #050 | CM-3 | No configuration change control board | Policy doc |
| #056 | CP-2 | No documented contingency plan | 1 week (doc) |
| #058 | CP-4 | No contingency plan testing | Quarterly activity |
| #065 | IR-4 | No documented incident handling procedures | 1 week (doc) |
| #066 | IR-5 | No automated incident detection (need SIEM) | 2 weeks |

---

## LOW PRIORITY (180 DAYS POST-ATO)

Below is a summary of LOW priority items (primarily policy documentation):

| Category | POA&M Items | Description |
|----------|-------------|-------------|
| **Policy Documentation** | #001, #010, #021, #026, #037, #055, #063 | Formal policies for AC, AU, IA, SC, SI, CP, IR |
| **Procedures Documentation** | #039, #052, #054, #070, #071, #072, #074, #081, #082, #084 | Operational procedures, rules of behavior, maintenance |
| **Monitoring & Reporting** | #015, #016, #017, #088 | Audit log interface, reports, continuous monitoring strategy |
| **Risk Management** | #076, #077 | Formal risk assessment report, vulnerability scanning schedule |
| **Training** | #057, #064 | Contingency and incident response training |
| **Configuration Management** | #049, #053 | Baseline documentation, component inventory tracking |

**Estimated Total Effort for LOW Priority:** 10-12 weeks (documentation-heavy)

---

## POA&M MANAGEMENT PROCESS

### Monthly Review Process
1. **ISSO** schedules monthly POA&M review meeting
2. Responsible parties provide status updates
3. Update completion percentages and dates
4. Identify blockers and resource needs
5. Escalate overdue items to System Owner
6. Document progress in meeting minutes
7. Submit updated POA&M to ISSM/AO

### Status Tracking
- **Not Started**: No work begun
- **In Progress**: Active remediation underway (provide % complete)
- **Completed**: Remediation finished, evidence provided
- **Closed**: Approved by ISSO/AO, no further action required
- **Risk Accepted**: AO accepts risk, no remediation planned
- **Deferred**: Moved to later date due to resources/priority

### Completion Criteria
Each POA&M item must have:
- Evidence of remediation (screenshots, configuration files, test results)
- Verification by ISSO
- Approval by System Owner
- Documentation updated (SSP, configuration guides, etc.)

### Escalation Process
- **30 days overdue**: ISSO notifies System Owner
- **60 days overdue**: ISSM review and risk re-assessment
- **90 days overdue**: Escalate to AO for risk acceptance decision

---

## POA&M METRICS

### Completion Metrics (To be updated monthly)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| CRITICAL items completed | 100% before ATO | 0% | ⚠️ Required |
| HIGH items completed | 100% within 30 days | 0% | Not started |
| MEDIUM items completed | 80% within 90 days | 0% | Not started |
| LOW items completed | 60% within 180 days | 0% | Not started |
| Overall completion rate | 75% within 6 months | 0% | Not started |

### Risk Reduction Metrics

| Timeframe | Target Risk Reduction |
|-----------|----------------------|
| Pre-ATO | 100% of CRITICAL risks mitigated |
| 30 days post-ATO | 75% of HIGH risks mitigated |
| 90 days post-ATO | 60% of MEDIUM risks mitigated |
| 180 days post-ATO | 50% of LOW risks mitigated |

---

## DOCUMENT APPROVAL

| Role | Name | Signature | Date |
|------|------|-----------|------|
| ISSO | [TBD] | | |
| ISSM | [TBD] | | |
| System Owner | [TBD] | | |
| Authorizing Official | [TBD] | | |

---

**Document Control:**
- **Version:** 1.0
- **Date:** November 20, 2025
- **Classification:** UNCLASSIFIED
- **Next Review:** [Monthly]
- **Distribution:** ISSO, ISSM, System Owner, AO

---

*END OF PLAN OF ACTION AND MILESTONES*
