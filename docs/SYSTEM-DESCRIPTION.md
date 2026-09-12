# BLACKSENTINEL GUARDIAN - Complete System Description

**Document Version:** 1.0  
**Classification:** Internal / Confidential  
**Last Updated:** June 2026  
**Status:** Definitive Reference

---

## 1. Executive Summary

BlackSentinel Guardian is an autonomous endpoint defense platform built for enterprise security operations. It provides unified visibility, detection, response, and prevention across all endpoints in an organization's infrastructure.

**Target Audience:**
- Enterprise Security Operations Center (SOC) teams
- Internal IT security departments
- Managed Security Service Providers (MSSPs)
- Security analysts at all operational tiers

**Core Value Propositions:**
- Single-pane-of-glass visibility across all managed endpoints (Windows, Linux, macOS)
- Autonomous threat detection with AI-assisted analysis and behavioral profiling
- Integrated incident response with one-click isolation, quarantine, and remediation
- Granular Role-Based Access Control with 13 distinct permission levels
- Real-time event streaming with chronological device timeline reconstruction
- Centralized USB device control, firewall management, and memory protection
- AI Security Copilot for natural language security queries and investigation guidance

**Differentiation from Traditional Security Tools:**
Unlike signature-based antivirus, traditional EDR, or aggregated XDR platforms, BlackSentinel Guardian operates as a unified autonomous defense system. It combines endpoint telemetry collection, behavioral analysis, threat hunting, incident response, and deception technology into a single coordinated platform. The system does not rely on third-party detection feeds alone; it performs local behavioral baseline profiling per user and endpoint, correlating anomalies across process trees, network connections, file system changes, and registry activity to identify threats that signature-based tools miss. Response actions are executed directly through the platform without requiring separate orchestration tools.

---

## 2. System Architecture

### 2.1 Frontend Stack

| Technology | Purpose |
|---|---|
| React 19 | UI component framework with concurrent rendering |
| TypeScript | Type-safe development across all modules |
| Vite | Build tooling with hot module replacement |
| Tailwind CSS v4 | Utility-first styling with custom design tokens |
| Zustand | Lightweight global state management |
| Framer Motion | Page transitions and micro-interactions |
| Recharts | Dashboard data visualization |
| Lucide React | Icon system |

The frontend is a single-page application structured around a sidebar-driven navigation model. Pages are rendered dynamically based on the current route state. All data flows through a centralized API service layer (`src/services/api.ts`) which handles authentication headers, token refresh, and error propagation automatically.

### 2.2 Backend Stack

| Technology | Purpose |
|---|---|
| Express.js | HTTP server framework |
| TypeScript | Type-safe backend development |
| Prisma ORM | Database access layer with schema-first approach |
| PostgreSQL | Primary relational data store |
| Redis | Session caching, rate limiting, real-time pub/sub |
| bcrypt | Password hashing (cost factor 12) |
| jsonwebtoken | JWT access and refresh token management |
| speakeasy / qrcode | TOTP-based multi-factor authentication |

The backend exposes a RESTful API organized into 15 route modules. Every route except authentication endpoints requires a valid JWT bearer token. Write and administrative operations are additionally gated by role-based middleware (`requireRole`).

### 2.3 Agent Architecture

The Guardian Agent runs on each managed endpoint. It is responsible for:

- **System telemetry collection:** Process listings, network connections, installed software, hardware specifications, disk usage
- **Event generation:** Creating timeline events for process creation, network activity, file changes, USB device connections, and authentication events
- **Heartbeat reporting:** Sending periodic status updates to the backend including agent health, CPU usage, RAM usage, and disk consumption
- **Command execution:** Receiving and executing response actions from the platform (process termination, file quarantine, network isolation)
- **Agent registration:** Registering with the backend using a one-time registration token generated during endpoint onboarding

### 2.4 Communication Protocol

**REST API:** All data mutations and queries flow through standard HTTP REST endpoints. The API follows predictable resource-oriented URL patterns (`/api/{resource}`, `/api/{resource}/{id}`).

**Event System:** The frontend implements a client-side event bus (`api.on` / `api.emit`) for propagating real-time alerts within the browser session. Critical and high-severity threat detections trigger toast notifications immediately.

**Agent Communication:** Agents communicate with the backend over HTTPS. Registration uses a one-time token. Once registered, agents send heartbeats at configurable intervals (default: 30 seconds) and transmit event data in batches.

### 2.5 Security Layers

| Layer | Implementation |
|---|---|
| Authentication | Email + password with bcrypt hashing |
| Multi-Factor Authentication | TOTP (RFC 6238) via authenticator apps |
| Authorization | 13-role RBAC system with 32 granular permissions |
| Token Management | Short-lived JWT access tokens + rotating refresh tokens (7-day expiry) |
| Rate Limiting | Per-endpoint rate limiting on authentication routes |
| Input Validation | Server-side request validation on all routes |
| SQL Injection Prevention | Prisma ORM parameterized queries |
| Audit Logging | Every state-changing operation is recorded with user attribution and IP address |
| CORS | Configurable origin restrictions |
| Password Policy | Minimum strength requirements enforced at registration and password change |

---

## 3. Core Capabilities

### 3.1 Security Dashboard

The dashboard is the default landing page and provides a real-time overview of the organization's security posture.

**Summary Statistics:**
- Total registered endpoints
- Online / offline / maintenance endpoint counts
- Overall risk score (average across all endpoints)
- Active threats (not resolved or false-positive)
- Critical severity threats
- Blocked attacks today
- Ransomware events stopped
- Protected assets and protected users counts
- Events processed in the last 24 hours
- Blocked network connections
- Total vulnerabilities identified
- Critical vulnerabilities count

**Dashboard Charts:**
- Threat activity timeline (24-hour window, hourly granularity)
- Threat distribution by severity (critical, high, medium, low, info)
- Endpoint distribution by operating system
- Alert trends over 7-day, 24-hour, or 30-day periods

**Engine Status Indicators:**
- AI engine operational status
- Agent integrity percentage
- Anomaly score (composite behavioral deviation metric)

### 3.2 Endpoint Inventory

Provides complete device discovery and inventory management across the entire managed fleet.

**Per-Endpoint Details:**
- Hostname, IP address, MAC address
- Operating system and version
- Hardware manufacturer and model
- CPU identifier, RAM capacity (MB), disk total and used (bytes)
- Current user and domain
- Physical or logical location
- Department and tag assignments
- Agent version and agent health status (healthy, updating, error)
- Risk score (0-100 scale)
- Last seen timestamp

**Software Inventory:**
Each endpoint maintains a list of installed software with name, version, publisher, installation date, and size.

**Running Processes:**
Real-time process listing per endpoint including PID, name, executable path, command line arguments, CPU and memory utilization, running user, start time, parent PID, and process status (running, suspended, terminated).

**Network Connections:**
Active network connections per endpoint showing local address/port, remote address/port, protocol (TCP/UDP), connection state, and the owning process name and PID.

**Endpoint Status Monitoring:**
- Online: Agent is communicating normally
- Offline: No heartbeat received within threshold
- Maintenance: Endpoint is isolated from the network
- Compromised: Endpoint has been flagged due to active threat detection

**Filtering and Search:**
Endpoints can be filtered by status, operating system, and location. Full-text search is available across hostname, IP address, and assigned user fields.

### 3.3 Device Timeline

A chronological event log maintained per endpoint, providing a complete audit trail of all system activity.

**Event Categories:**
- Process: Process creation, termination, suspension
- Network: Connection establishment, data transfer, disconnection
- File: File creation, modification, deletion, access
- Registry: Registry key creation, modification, deletion (Windows)
- USB: Device connection, disconnection, policy enforcement
- Auth: User authentication events (login, logout, failed attempts)
- Policy: Policy application, enforcement, violation
- Threat: Threat detection and remediation events
- Software: Application installation, update, removal
- User: User account changes and permission modifications

**Filtering Capabilities:**
- Filter by endpoint
- Filter by event category
- Filter by date range (start and end date)
- Pagination support (configurable page size)
- Severity-coded events (critical, high, medium, low, info)

**Event Detail Structure:**
Each event includes a unique identifier, timestamp, category, title, free-text description, severity level, and an arbitrary JSON details object for event-specific metadata.

### 3.4 Threat Detection

Real-time identification and classification of security threats across the managed endpoint fleet.

**Threat Types:**
- Malware: Traditional malicious software detection
- Ransomware: Encryption-based extortionware detection
- Exploit: Vulnerability exploitation attempt detection
- Suspicious: Anomalous behavior requiring investigation
- Policy: Security policy violation detection

**Threat Classification:**
Each threat receives a severity rating (critical, high, medium, low, info) and is tracked through a defined lifecycle: Active, Investigating, Contained, Resolved, False Positive.

**MITRE ATT&CK Integration:**
Threats are mapped to MITRE ATT&CK tactics and techniques, stored as structured data on each threat record. This enables correlation with known attack patterns and supports threat hunting queries.

**Indicators of Compromise (IOCs):**
Each threat can have multiple associated IOCs with the following types:
- Hash (file hash values)
- IP address
- Domain name
- URL
- File path
- Registry key
- Process name or path

Each IOC includes a confidence score (0-100).

**Process Tree Visualization:**
Threats include a process tree structure showing the parent-child relationship of processes involved in the threat, enabling analysts to understand the execution chain.

**Auto-Remediation:**
Threats flagged for auto-remediation can be automatically contained. The remediation response includes process termination, malicious file quarantine, registry entry cleanup, and firewall rule application.

**Threat Status Lifecycle:**
- Active: Newly detected, not yet triaged
- Investigating: Assigned to an analyst, under review
- Contained: Response actions have been executed
- Resolved: Threat has been fully remediated
- False Positive: Determined to be benign

### 3.5 Behavioral Analysis Engine

User and Entity Behavior Analytics (UEBA) providing anomaly detection based on behavioral deviation from established baselines.

**Baseline Profiling:**
The engine maintains behavioral profiles per user and endpoint, establishing normal patterns for authentication times, process execution habits, network connection patterns, file access behavior, and resource utilization.

**Behavioral Categories:**
- Authentication: Login times, locations, frequency, MFA usage patterns
- Network: Connection destinations, protocols, data volumes, timing
- Process: Executed applications, command-line patterns, resource consumption
- File Access: Files accessed, modification frequency, directory patterns
- Time-Based: Activity patterns across hours, days, and weeks

**Anomaly Scoring:**
Each behavioral deviation produces a confidence-scored anomaly. The composite anomaly score on the dashboard represents the aggregate behavioral risk across all monitored entities.

### 3.6 Threat Hunting

Proactive threat search capabilities for SOC analysts to identify threats that automated detection may have missed.

**Hunting Capabilities:**
- Pre-built hunting query templates based on common attack patterns
- Custom query builder for ad-hoc investigation
- MITRE ATT&CK-based hunting rules mapped to specific tactics and techniques
- Saved hunting query library for reusable investigation templates
- Query result visualization with structured output

**Hunting Workflow:**
Analysts construct queries targeting specific behavioral patterns, IOCs, or temporal sequences. Results are returned with endpoint context, enabling rapid triage and escalation to incident response when threats are confirmed.

### 3.7 Incident Response Center

Centralized incident management providing structured response workflows and action execution.

**Response Actions:**
- Isolate endpoint: Network isolation preventing all external communication except C2
- Restore endpoint: Remove isolation and restore normal network connectivity
- Block IP: Create firewall rule blocking traffic to/from a specific IP address
- Quarantine file: Move a suspicious file to a quarantine directory, preventing execution
- Kill process: Terminate a running process on the target endpoint
- Block hash: Prevent execution of files matching a specific hash
- Block domain: Create DNS-level block for a domain
- Collect evidence: Gather forensic evidence package from an endpoint
- Execute script: Run a response script on the target endpoint
- Full scan: Initiate a comprehensive security scan of the endpoint

**Incident Lifecycle:**
1. Detected: Initial threat identification
2. Triaged: Analyst has reviewed and prioritized
3. Contained: Immediate response actions executed
4. Eradicated: Root cause removed from the environment
5. Recovered: Systems restored to normal operation
6. Closed: Incident fully resolved and documented

**Assignment and Tracking:**
Incidents can be assigned to specific analysts. Each action taken is logged with timestamps, creating a complete response timeline for post-incident review and compliance reporting.

### 3.8 Vulnerability Management

CVE tracking, correlation, and remediation workflow management.

**Vulnerability Data:**
- CVE identifier (unique)
- Affected software name and version
- Severity classification
- CVSS score (0.0 - 10.0)
- Description
- Exploited in the wild indicator
- Patch availability status
- Publication date
- Reference URLs

**Endpoint Correlation:**
Vulnerabilities are linked to affected endpoints through a many-to-many relationship. The system tracks how many endpoints are affected by each vulnerability and maintains per-endpoint remediation status (open, patched, accepted, mitigated).

**Prioritization:**
Vulnerabilities are sorted by CVSS score, severity, and exploit-in-the-wild status to help teams focus on the most critical risks first.

### 3.9 USB Device Control

Centralized management and policy enforcement for USB peripheral devices.

**Device Tracking:**
- Vendor ID and Product ID
- Device name and serial number
- Device type classification (storage, HID, network, serial, printer, unknown)
- First seen and last seen timestamps
- Per-endpoint association

**Device Status:**
- Pending: Newly discovered, awaiting policy decision
- Approved: Allowed for use on the endpoint
- Blocked: Policy prevents use
- Quarantined: Device restricted pending investigation

**Policy Enforcement:**
Administrators can approve or block individual devices. Status changes are logged to the audit trail with user attribution.

**Bulk Management:**
Devices can be filtered by endpoint, status, and search terms. Bulk status changes enable efficient policy management across large device fleets.

### 3.10 Firewall Management

Centralized firewall rule management with per-endpoint granularity.

**Rule Properties:**
- Name: Human-readable rule identifier
- Action: Allow, Deny, or Log
- Direction: Inbound or Outbound
- Protocol: TCP, UDP, ICMP, or Any
- Local port filter
- Remote address filter
- Remote port filter
- Enabled/Disabled toggle
- Endpoint association

**Rule Operations:**
- Create new rules with full parameter specification
- Update existing rule parameters
- Delete rules no longer needed
- Toggle rule enabled state without deletion

**Audit:**
All rule modifications are recorded in the audit log with the modifying user, timestamp, and change details.

### 3.11 Device Isolation

Network isolation capabilities for containing compromised or suspicious endpoints.

**Isolation Modes:**
When an endpoint is isolated, its status changes to "Maintenance," severing normal network connectivity. Only essential management communication (heartbeat, command-and-control for response actions) is permitted.

**Operations:**
- Isolate: Immediately sever network connectivity
- Restore: Remove isolation and restore normal operations

**Authorization:**
Isolation and restoration require SOC_TIER_3 or higher privileges. All isolation events are audit-logged with the initiating user, timestamp, and reason.

**Automated Isolation:**
The platform supports automated isolation triggers when critical-severity threats are detected on an endpoint, enabling immediate containment without manual intervention.

### 3.12 Memory Protection

Real-time memory monitoring and analysis for detecting memory-based threats.

**Detection Capabilities:**
- Process injection detection (DLL injection, process hollowing)
- Memory scraping detection (credential harvesting from process memory)
- Fileless malware detection (payloads executed entirely in memory)
- Memory anomaly scoring based on deviation from baseline memory profiles

**Monitoring Scope:**
The memory protection engine monitors memory allocation patterns, executable memory regions, cross-process memory access, and suspicious API call sequences indicative of memory-resident threats.

### 3.13 Script Control

Monitoring and control of script execution across managed endpoints.

**Supported Script Engines:**
- PowerShell (Windows)
- Bash (Linux, macOS)
- Python
- JavaScript / Node.js
- VBScript (Windows)
- Batch files (Windows)

**Policy Enforcement Modes:**
- Monitor: Log all script executions without blocking
- Block: Prevent unauthorized script execution
- Alert: Allow execution but generate security alert

**Tracking:**
- Script hash for integrity verification
- Script source verification
- Execution context logging: user, endpoint, timestamp, command line

### 3.14 Deception Technology (Honeypots)

Proactive deception deployment to detect and analyze attacker behavior.

**Decoy Types:**
- Decoy endpoints: Fake machines that appear as legitimate targets
- Decoy files: Honeytokens placed in file shares and directories
- Decoy user accounts: Bait accounts that trigger alerts on usage
- Decoy network services: Fake services that lure attacker interaction

**Detection:**
Any interaction with deception assets generates immediate high-priority alerts. The system captures attacker behavior, tools, and techniques for intelligence gathering and threat attribution.

### 3.15 AI Security Copilot

Natural language interface for security investigation and guidance.

**Capabilities:**
- Natural language security queries ("What are the active threats?")
- Contextual threat analysis based on current system state
- Investigation recommendations and next-step guidance
- Remediation suggestions for identified threats
- Conversation history with source citations
- Source attribution (Threat Intelligence, Behavioral Engine, SIEM Integration, etc.)

**Access Control:**
The AI Copilot is available to SOC_TIER_1 and above. Full analysis capabilities including response recommendations are available to SOC_TIER_2 and above.

**Implementation:**
The copilot analyzes incoming queries against current system telemetry (active threats, endpoint counts, alert status, vulnerability data) and generates contextual responses with cited sources.

### 3.16 Integration Hub

Centralized management of third-party platform and service integrations.

**Supported Integration Categories:**

| Category | Platforms |
|---|---|
| Security Platforms | BlackSentinel Nexus, Pulse, Shield |
| Productivity | Microsoft 365, Google Workspace |
| Cloud Providers | AWS, Azure, Google Cloud |
| ITSM | Jira, ServiceNow |
| Communication | Slack, Microsoft Teams |
| Security Vendors | CrowdStrike, SentinelOne |
| DevOps | GitHub |
| SIEM | Custom SIEM integration |
| Custom | Webhook-based custom integrations |

**Integration Operations:**
- Create new integrations with configuration parameters
- Update existing integration settings
- Connect / disconnect integrations
- Delete integrations
- Track last synchronization timestamp
- Monitor connection status (connected, disconnected, error, syncing)

**Access Control:**
Integration management requires ADMIN or SUPER_ADMIN privileges.

### 3.17 System Settings

Comprehensive system configuration organized into setting groups.

**General Settings:**
- Organization name
- Timezone configuration
- Language preference

**Security Settings:**
- Session timeout duration
- Maximum failed login attempts before lockout
- MFA enforcement policy
- Password policy configuration

**Notification Settings:**
- Email notification toggle
- Slack notification toggle
- Webhook URL for custom notification delivery

**Retention Settings:**
- Audit log retention period (days)
- Event retention period (days)
- Threat intelligence retention period (days)

**Storage:**
Settings are persisted as key-value pairs in the `Setting` database model, grouped by category. This enables dynamic configuration changes without application restarts.

### 3.18 Audit Log

Complete activity logging providing non-repudiable record of all system actions.

**Audit Entry Structure:**
- Unique identifier
- Action type (e.g., USER_LOGIN, ENDPOINT_REGISTERED, THREAT_REMEDIATED, FIREWALL_RULE_CREATED)
- Target resource identifier
- Action details (JSON object with contextual information)
- User ID and name of the actor
- Timestamp

**Query Capabilities:**
- Filter by action type
- Filter by user
- Filter by date range
- Pagination support (configurable page size)

**Compliance Value:**
The audit log satisfies requirements for SOC 2 Type II, ISO 27001, and GDPR access logging obligations.

### 3.19 Endpoint Onboarding

Simplified workflow for registering and deploying agents to new endpoints.

**Onboarding Workflow:**
1. Administrator creates a registration entry providing: hostname, IP address, OS type, location, and department
2. System generates a unique registration token and OS-specific install command
3. Administrator copies the install command and executes it on the target machine
4. Agent installer runs, contacts the backend, and completes registration using the token
5. Endpoint transitions to "Online" status and begins reporting telemetry

**Supported Install Commands:**
- Windows: PowerShell one-liner
- Linux: Bash script
- macOS: Bash script

**Registration Tracking:**
The onboarding page displays all pending and completed registrations with status indicators: pending_registration, agent_installed, online, offline.

**Agent Heartbeat:**
Once registered, the agent sends periodic heartbeats updating: last seen timestamp, agent health status, CPU utilization, RAM utilization, and disk usage.

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Role Hierarchy

The system implements a strict hierarchical RBAC model with 13 distinct roles. Higher-level roles inherit all permissions of lower-level roles.

| Level | Role | Description |
|---|---|---|
| 13 | SUPER_ADMIN | Full system control. Manages users, roles, settings, integrations. Can delete endpoints and manage all security operations. |
| 12 | ADMIN | Near-full access. Manages users, settings, integrations. Cannot manage other SUPER_ADMINs. Full security operations. |
| 11 | SOC_TIER_5 | Senior SOC lead. Full threat investigation, response, remediation, hunting, and isolation capabilities. Read-only user access. |
| 10 | SOC_TIER_4 | Senior SOC analyst. Same as SOC_TIER_5. Deception technology access. Full response and remediation capabilities. |
| 9 | SOC_TIER_3 | Mid-level SOC analyst. Threat investigation, response, remediation, hunting, isolation, behavioral analysis, script control. |
| 8 | SOC_TIER_2 | Junior SOC analyst. Threat investigation, remediation, hunting, memory protection, response execution. No isolation. |
| 7 | SOC_TIER_1 | Entry-level SOC analyst. Read-only access to most modules. Can acknowledge alerts. AI Copilot access. |
| 6 | AUDITOR_3 | Senior auditor. Read-only access to all data plus audit log. Can acknowledge alerts. |
| 5 | AUDITOR_2 | Mid-level auditor. Same as AUDITOR_3. Full read access across all modules. |
| 4 | AUDITOR_1 | Junior auditor. Read-only access to all modules plus audit log. No alert acknowledgment. |
| 3 | IT | IT operations. Endpoint management, firewall rules, USB device control, script execution. No threat response. |
| 2 | ANALYST | General analyst. Threat investigation, alert management, hunting, response execution. No administrative access. |
| 1 | VIEWER | Read-only access to dashboard, endpoints, threats, and alerts only. |

### 4.2 Permission Matrix

The following matrix shows which roles have access to which capabilities. Permissions are granted as granular flags (read, write, delete, execute) per resource domain.

| Capability | SUPER_ADMIN | ADMIN | SOC_TIER_5 | SOC_TIER_4 | SOC_TIER_3 | SOC_TIER_2 | SOC_TIER_1 | AUDITOR_3 | AUDITOR_2 | AUDITOR_1 | IT | ANALYST | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | R | R | R | R | R | R | R | R | R | R | R | R | R |
| Endpoints (Read) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Endpoints (Write) | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - | - |
| Endpoints (Delete) | Y | Y | - | - | - | - | - | - | - | - | - | - | - |
| Endpoint Isolate | Y | Y | Y | Y | Y | - | - | - | - | - | - | - | - |
| Endpoint Restore | Y | Y | Y | Y | Y | - | - | - | - | - | - | - | - |
| Endpoint Scan | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - | - |
| Threats (Read) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Threats (Write) | Y | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - |
| Threats (Delete) | Y | Y | - | - | - | - | - | - | - | - | - | - | - |
| Threat Remediate | Y | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - |
| Threat Hunt | Y | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - |
| Alerts (Read) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Alerts (Acknowledge) | Y | Y | Y | Y | Y | Y | Y | Y | Y | - | - | Y | - |
| Alerts (Resolve) | Y | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - |
| Alerts (Assign) | Y | Y | Y | Y | Y | Y | - | - | - | - | - | - | - |
| Timeline | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - |
| Vulnerabilities | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - |
| Firewall (Read) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - |
| Firewall (Write) | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - | - |
| USB (Read) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - |
| USB (Write) | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - | - |
| USB Allow/Block | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - | - |
| Users (Read) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - |
| Users (Write) | Y | Y | - | - | - | - | - | - | - | - | - | - | - |
| Users (Delete) | Y | Y | - | - | - | - | - | - | - | - | - | - | - |
| Manage Roles | Y | - | - | - | - | - | - | - | - | - | - | - | - |
| Settings | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - |
| Settings (Write) | Y | Y | - | - | - | - | - | - | - | - | - | - | - |
| Audit Log | Y | Y | Y | Y | Y | - | - | Y | Y | Y | - | - | - |
| Integrations | Y | Y | - | - | - | - | - | - | - | - | - | - | - |
| AI Copilot | Y | Y | Y | Y | Y | Y | Y | - | - | - | - | Y | - |
| Response Execute | Y | Y | Y | Y | Y | Y | - | - | - | - | - | Y | - |
| Collect Evidence | Y | Y | Y | Y | Y | - | - | - | - | - | - | - | - |
| Script Execute | Y | Y | Y | Y | Y | Y | - | - | - | - | Y | - | - |

### 4.3 Sidebar Navigation by Role

The sidebar dynamically filters menu items based on the logged-in user's role. Menu visibility is controlled by role override lists defined in the sidebar configuration:

- Dashboard: All authenticated users
- Endpoint Inventory: SOC_TIER_1, ADMIN, SUPER_ADMIN, IT, ANALYST
- Endpoint Onboarding: SOC_TIER_1, ADMIN, SUPER_ADMIN, IT, ANALYST
- Device Timeline: SOC_TIER_2, ADMIN, SUPER_ADMIN, AUDITOR_1-3
- Threat Detection: SOC_TIER_1, ADMIN, SUPER_ADMIN, ANALYST
- Behavioral Engine: SOC_TIER_3, ADMIN, SUPER_ADMIN
- Threat Hunting: SOC_TIER_2, ADMIN, SUPER_ADMIN, ANALYST
- Response Center: SOC_TIER_2, ADMIN, SUPER_ADMIN
- Vulnerabilities: SOC_TIER_1, ADMIN, SUPER_ADMIN, IT, ANALYST, AUDITOR_1-3
- USB Control: SOC_TIER_1, IT, ADMIN, SUPER_ADMIN
- Firewall: IT, ADMIN, SUPER_ADMIN
- Device Isolation: SOC_TIER_3, ADMIN, SUPER_ADMIN
- Memory Protection: SOC_TIER_2, ADMIN, SUPER_ADMIN
- Script Control: SOC_TIER_3, IT, ADMIN, SUPER_ADMIN
- Deception: SOC_TIER_4, ADMIN, SUPER_ADMIN
- AI Copilot: All authenticated users (panel-based, opens alongside current page)
- Integrations: ADMIN, SUPER_ADMIN
- Audit Log: AUDITOR_1-3, ADMIN, SUPER_ADMIN
- Settings: ADMIN, SUPER_ADMIN
- Users: ADMIN, SUPER_ADMIN

---

## 5. Authentication and Security

### 5.1 Authentication Flow

**Step 1: Login**
User submits email and password to `POST /api/auth/login`. Server validates credentials against bcrypt-hashed password stored in the database. If the user has MFA enabled, a temporary token is returned and the client proceeds to MFA validation. If MFA is not enabled, a JWT access token and refresh token are issued immediately.

**Step 2: MFA Validation (if applicable)**
User submits the temporary token and TOTP code to `POST /api/auth/mfa/validate`. Server verifies the TOTP code against the user's stored MFA secret. On success, JWT access and refresh tokens are issued.

**Step 3: Token Usage**
The JWT access token is included in the `Authorization: Bearer {token}` header on all subsequent API requests. Tokens are stored in browser localStorage under the keys `bs_token` and `bs_refresh_token`.

**Step 4: Token Refresh**
When an API request returns a 401 status, the client automatically attempts to refresh the access token using the stored refresh token via `POST /api/auth/refresh`. The old refresh token is invalidated (one-time use) and a new pair is issued. If refresh fails, the user is redirected to the login page.

**Step 5: Logout**
`POST /api/auth/logout` invalidates the refresh token server-side and clears local storage tokens.

### 5.2 MFA Setup

1. User calls `POST /api/auth/mfa/setup` to generate a TOTP secret and QR code
2. User scans the QR code with an authenticator app (Google Authenticator, Authy, etc.)
3. User calls `POST /api/auth/mfa/verify` with the current TOTP code to activate MFA
4. MFA is marked as enabled and verified in the user record

### 5.3 Password Requirements

Passwords are validated against strength requirements at registration and password change:
- Minimum length requirements
- Complexity requirements (uppercase, lowercase, numbers, special characters)
- Common password dictionary check
- Password must differ from current password on change

Password changes invalidate all existing refresh tokens for the user, requiring re-authentication.

### 5.4 Security Features

**Rate Limiting:**
Authentication endpoints (`/api/auth/login`, `/api/auth/mfa/validate`) are protected by rate limiting to prevent brute-force attacks.

**JWT Token Lifecycle:**
- Access tokens: Short-lived (configurable, typically 15-60 minutes)
- Refresh tokens: 7-day expiry, single-use with rotation
- Refresh tokens are stored in the database (Session model) and validated on every refresh
- Old refresh tokens are deleted on successful rotation

**Audit Trail:**
Every authentication event is recorded:
- USER_LOGIN
- USER_LOGOUT
- MFA_ENABLED
- MFA_VALIDATED
- PASSWORD_CHANGED
- USER_CREATED

**Session Management:**
Active sessions are tracked in the Session model with user agent and IP address metadata. Sessions can be invalidated individually (on logout) or in bulk (on password change).

---

## 6. Database Schema Overview

The system uses PostgreSQL with Prisma ORM. The schema defines 16 primary models with the following relationships:

### 6.1 Model Inventory

| Model | Purpose | Key Fields |
|---|---|---|
| User | System users and authentication | id, email, password, name, role, mfaSecret, mfaEnabled |
| Session | Refresh token tracking | id, userId, token, type, expiresAt, ipAddress, userAgent |
| Endpoint | Managed device registry | id, hostname, ipAddress, os, status, agentVersion, riskScore |
| EndpointDepartment | Endpoint-to-department mapping | endpointId, departmentId |
| EndpointTag | Endpoint-to-tag mapping | endpointId, tagId |
| Department | Organizational units | id, name, description |
| Tag | Custom labels | id, name, color |
| Threat | Detected security threats | id, name, type, severity, status, endpointId, mitreTactics, iocs |
| Alert | Security notifications | id, title, severity, source, status, endpointId, assignedToId |
| TimelineEvent | Chronological event log | id, endpointId, category, title, severity, timestamp |
| Vulnerability | CVE records | id, cveId, software, version, severity, cvssScore |
| VulnerabilityEndpoint | Vulnerability-to-endpoint mapping | vulnerabilityId, endpointId, status |
| FirewallRule | Network access rules | id, name, action, direction, protocol, endpointId |
| USBDevice | Peripheral device records | id, vendorId, productId, serialNumber, endpointId, status |
| AuditLog | Activity audit trail | id, action, target, userId, timestamp |
| Setting | System configuration | id, key, value, group |
| Integration | Third-party connections | id, name, category, status, config |
| CopilotMessage | AI conversation history | id, userId, role, content, metadata |
| Widget | Dashboard widget configuration | id, type, title, position, enabled |

### 6.2 Key Relationships

- **User** has many: AuditLogs, Sessions, CopilotMessages, assigned Alerts, created Alerts, assigned Threats, created Threats
- **Endpoint** has many: Threats, TimelineEvents, Alerts, FirewallRules, USBDevices, VulnerabilityEndpoints, EndpointDepartments, EndpointTags
- **Threat** belongs to: Endpoint, assigned User (optional), created User (optional)
- **Alert** belongs to: Endpoint (optional), assigned User (optional), created User (optional)
- **Vulnerability** has many: VulnerabilityEndpoints
- **VulnerabilityEndpoint** belongs to: Vulnerability, Endpoint
- **Session** belongs to: User (cascade delete)
- **AuditLog** belongs to: User (cascade delete)
- **CopilotMessage** belongs to: User (cascade delete)

### 6.3 Database Indexes

Performance-critical indexes are defined on:
- User: role, email
- Session: userId, token, expiresAt
- Endpoint: hostname, ipAddress, macAddress, status, agentStatus, riskScore, lastSeen, registrationToken
- Threat: severity, status, endpointId, assignedToId, detectedAt
- Alert: severity, status, endpointId, assignedToId, timestamp
- TimelineEvent: endpointId, category, severity, timestamp
- Vulnerability: cveId, severity, cvssScore, publishDate
- VulnerabilityEndpoint: vulnerabilityId, endpointId, status
- FirewallRule: endpointId, action, enabled
- USBDevice: endpointId, status, vendorId, serialNumber
- AuditLog: userId, action, target, timestamp
- Setting: group, key
- Integration: category, status
- CopilotMessage: userId, createdAt

---

## 7. API Overview

### 7.1 REST API Structure

All API endpoints are prefixed with `/api/` and organized by resource domain. The API follows RESTful conventions:

- `GET /api/{resource}` - List resources (supports pagination, filtering)
- `GET /api/{resource}/{id}` - Get single resource
- `POST /api/{resource}` - Create resource
- `PUT /api/{resource}/{id}` - Update resource
- `DELETE /api/{resource}/{id}` - Delete resource
- `POST /api/{resource}/{id}/{action}` - Execute action on resource

### 7.2 Authentication Header

All authenticated requests require the header:
```
Authorization: Bearer {jwt_access_token}
Content-Type: application/json
```

### 7.3 Pagination Format

List endpoints support query parameters:
- `skip`: Number of records to skip (default: 0)
- `take`: Number of records to return (default: 20, max: 100)

Response format:
```json
{
  "data": [],
  "total": 150,
  "skip": 0,
  "take": 20
}
```

### 7.4 Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

### 7.5 Endpoint Group Summary

| Route Module | Endpoints | Description |
|---|---|---|
| /api/auth | 8 | Authentication, MFA, password management |
| /api/users | 5 | User CRUD and role management |
| /api/endpoints | 9 | Endpoint CRUD, isolation, restore, agent registration, heartbeat |
| /api/threats | 4 | Threat listing, details, updates, remediation |
| /api/alerts | 5 | Alert listing, details, acknowledge, resolve, assign |
| /api/timeline | 1 | Paginated timeline event listing with filters |
| /api/vulnerabilities | 3 | Vulnerability listing, details, updates |
| /api/firewall | 5 | Firewall rule CRUD and toggle |
| /api/usb | 5 | USB device CRUD |
| /api/dashboard | 4 | Statistics, threats-by-severity, endpoints-by-os, alerts-timeline |
| /api/audit | 1 | Paginated audit log listing with filters |
| /api/integrations | 5 | Integration CRUD and connect/disconnect |
| /api/settings | 2 | Settings read and bulk update |
| /api/response | 6 | Isolate, restore, block-ip, quarantine-file, block-hash, block-domain |
| /api/copilot | 2 | Chat and conversation history |

**Total: 65 API endpoints**

---

## 8. Deployment Options

### 8.1 Docker Compose (Recommended for Development)

The platform includes a `Dockerfile.frontend` for building the frontend as a containerized Nginx-served application. Docker Compose orchestrates the full stack: PostgreSQL, Redis, backend API server, and frontend.

### 8.2 Kubernetes (Production)

Production deployment manifests are provided in the `k8s/` directory, including:
- Deployment specifications for frontend and backend
- Service definitions
- ConfigMaps and Secrets
- Ingress configuration
- Persistent volume claims for database storage

### 8.3 Manual Deployment

- Build frontend with `npm run build` (Vite output to `dist/`)
- Build backend with TypeScript compilation
- Run Prisma migrations against PostgreSQL
- Start backend with Node.js
- Serve frontend static files with Nginx or similar

### 8.4 Cloud Marketplace

Planned availability on:
- AWS Marketplace
- Azure Marketplace
- Google Cloud Marketplace

### 8.5 On-Premise Installation

Air-gapped deployment support for organizations requiring complete data sovereignty. All dependencies are bundled and no external network access is required after initial setup.

### 8.6 White-Label / OEM

The platform architecture supports rebranding and customization for managed security service providers who wish to offer the platform under their own brand.

### 8.7 SaaS Hosted

A fully managed cloud-hosted version is available for organizations that prefer not to manage infrastructure.

---

## 9. Agent Architecture

### 9.1 Agent Lifecycle

1. **Registration:** Administrator creates endpoint entry, generating a registration token
2. **Installation:** Agent installer is executed on the target endpoint with the registration token
3. **Activation:** Agent contacts backend, validates token, registers successfully
4. **Operation:** Agent sends heartbeats and telemetry data at configured intervals
5. **Monitoring:** Backend tracks agent health, updates endpoint status based on heartbeat recency
6. **Update:** Agent version is tracked; administrators can trigger agent updates remotely

### 9.2 Data Collection

The agent collects comprehensive endpoint telemetry:

- **Process information:** Full process listing with PID, name, path, command line, CPU/memory usage, parent PID, status
- **Network connections:** All active TCP/UDP connections with local/remote addresses, ports, protocols, states
- **Software inventory:** All installed applications with name, version, publisher, install date
- **Hardware details:** CPU model, RAM capacity, disk total/used, manufacturer, model
- **System status:** Operating system version, current user, domain, hostname

### 9.3 Communication Protocol

**Heartbeat (POST /api/endpoints/agent/heartbeat):**
- Sent every 30 seconds (configurable)
- Includes: endpointId, agentStatus, CPU usage, RAM usage, disk usage
- Backend updates: lastHeartbeat, lastSeen, status=ONLINE

**Event Reporting:**
Events are generated locally on the endpoint and transmitted to the backend for storage in the TimelineEvent table. Events are categorized by type (process, network, file, registry, usb, auth, policy, threat, software, user) and severity.

**Command Reception:**
The agent listens for response commands from the backend, including:
- Process termination requests
- File quarantine commands
- Network isolation commands
- Script execution requests
- Full scan initiation

### 9.4 Agent Integrity

The agent status is tracked as: healthy, updating, error. The dashboard displays an agent integrity percentage representing the proportion of endpoints with healthy agents. The system supports agent integrity verification to detect tampered or compromised agents.

### 9.5 Resource Optimization

The agent is designed to minimize endpoint impact through:
- Batched telemetry transmission
- Configurable collection intervals
- Efficient data serialization
- Adaptive polling based on endpoint activity

---

## 10. Data Flow Diagrams

### 10.1 Endpoint Registration Flow

```
Administrator                    Backend                       Agent
     |                              |                            |
     |-- Create Registration ------>|                            |
     |                              |-- Generate Token           |
     |<-- Return Install Command ---|                            |
     |                              |                            |
     |   [Execute install command on target endpoint]           |
     |                              |                            |
     |                              |<-- POST /agent/register ---|
     |                              |    (registrationToken)     |
     |                              |-- Validate Token           |
     |                              |-- Clear Token              |
     |                              |-- Set Status: ONLINE       |
     |                              |-- Set Agent: HEALTHY       |
     |                              |-- Return Config            |
     |                              |                            |
     |                              |<-- POST /agent/heartbeat --|
     |                              |    (endpointId, metrics)   |
     |                              |-- Update lastSeen          |
```

### 10.2 Threat Detection Pipeline

```
Agent                          Backend                       SOC Analyst
  |                              |                              |
  |-- Report Event ------------>|                              |
  |   (process, network, etc.)  |                              |
  |                              |-- Store TimelineEvent       |
  |                              |-- Evaluate Detection Rules  |
  |                              |-- Check Behavioral Baseline |
  |                              |                              |
  |                              |-- [If threat detected]      |
  |                              |-- Create Threat Record      |
  |                              |-- Create Alert               |
  |                              |-- Emit threat:detected event |
  |                              |                              |
  |                              |        Toast notification -->|
  |                              |                              |
  |                              |<-- Acknowledge Alert --------|
  |                              |<-- Assign to Analyst -------|
  |                              |                              |
  |<-- Execute Response Action --|<-- Trigger Remediation ------|
  |   (kill process, quarantine) |                              |
  |                              |-- Update Threat Status      |
  |                              |-- Record Audit Log          |
```

### 10.3 Alert Lifecycle

```
NEW  -----> IN_PROGRESS -----> RESOLVED
 |              |                  |
 |              +-----> ESCALATED  |
 |              |                  |
 |              +-----> FALSE_POSITIVE
 |
 +--- (auto-assign on acknowledge)
```

1. Alert created with status NEW
2. Analyst acknowledges (transitions to IN_PROGRESS)
3. Analyst may escalate if severity increases
4. Analyst resolves (transitions to RESOLVED) or marks as FALSE_POSITIVE
5. All transitions are audit-logged

### 10.4 Incident Response Workflow

```
Detection -> Triage -> Containment -> Eradication -> Recovery -> Closure
    |           |          |              |             |           |
    v           v          v              v             v           v
  Alert      Assign     Isolate        Quarantine    Restore    Close
  Created    Analyst    Endpoint       Files/IPs     Endpoint   Incident
             Review     Block IP/Hash                              Document
```

### 10.5 Authentication Flow

```
Client                          Backend
  |                               |
  |-- POST /auth/login --------->|
  |   (email, password)          |
  |                              |-- Validate credentials
  |                              |-- Check MFA status
  |                              |
  |   [If MFA enabled]           |
  |<-- { mfaRequired: true } ----|
  |-- POST /auth/mfa/validate -->|
  |   (tempToken, code)          |
  |                              |-- Verify TOTP code
  |                              |-- Issue JWT pair
  |<-- { accessToken, refreshToken } --|
  |                               |
  |   [Subsequent requests]       |
  |-- Authorization: Bearer ---->|
  |                              |-- Verify JWT
  |                              |-- Check role permissions
  |<-- Response ------------------|
  |                               |
  |   [If 401 received]          |
  |-- POST /auth/refresh ------->|
  |   (refreshToken)             |
  |                              |-- Validate refresh token
  |                              |-- Issue new JWT pair
  |<-- { accessToken, refreshToken } --|
```

---

## 11. Scalability and Performance

### 11.1 Horizontal Scaling

The backend is designed as a stateless REST API, enabling horizontal scaling behind a load balancer. Session state is stored in PostgreSQL (Session model) and can be externalized to Redis for high-throughput scenarios.

### 11.2 Database Optimization

- Strategic indexing on all frequently queried columns (see Section 6.3)
- Connection pooling through Prisma's built-in connection pool
- Pagination on all list endpoints (skip/take pattern) to prevent large result sets
- Efficient queries using Prisma's selective field inclusion

### 11.3 Caching Strategy

Redis provides:
- Rate limiting counters for authentication endpoints
- Session caching for frequently accessed user data
- Real-time pub/sub for event propagation between backend instances
- Temporary storage for MFA setup state

### 11.4 Event Batching

The agent batches telemetry data before transmission to reduce network overhead and backend processing load. Events are accumulated locally and transmitted in configurable batch sizes.

### 11.5 WebSocket and Real-Time

The frontend implements a client-side event bus for real-time alert propagation within a single browser session. Critical and high-severity threat detections are displayed as toast notifications immediately, enabling rapid analyst response without page refresh.

---

## 12. Compliance and Standards

### 12.1 SOC 2 Type II

BlackSentinel Guardian supports SOC 2 Type II compliance through:
- Complete audit logging of all user actions with attribution
- Role-based access control with least-privilege enforcement
- Multi-factor authentication support
- Session management with automatic expiration
- Password policy enforcement
- Data encryption at rest and in transit

### 12.2 GDPR

The platform supports GDPR data handling requirements through:
- Configurable data retention policies (audit logs, events, threat intelligence)
- User data management capabilities (create, update, delete)
- Audit trail for all data access and modifications
- Configurable data residency through deployment location selection

### 12.3 ISO 27001

The system architecture aligns with ISO 27001 controls including:
- Access control management (RBAC, MFA)
- Operations security (audit logging, monitoring)
- Communications security (TLS, JWT authentication)
- System acquisition and development (secure coding practices)
- Supplier relationships (integration security)

### 12.4 NIST Cybersecurity Framework

The platform maps to NIST CSF functions:
- **Identify:** Endpoint inventory, vulnerability management, asset tracking
- **Protect:** Firewall management, USB control, memory protection, script control, device isolation
- **Detect:** Threat detection, behavioral analysis, anomaly scoring, deception technology
- **Respond:** Incident response center, automated remediation, response actions
- **Recover:** Endpoint restore, incident documentation, evidence collection

### 12.5 HIPAA

For healthcare deployments, the platform supports HIPAA requirements through:
- Access controls limiting PHI access to authorized personnel
- Audit logging of all system access and modifications
- Data encryption in transit (TLS) and at rest (database encryption)
- Automatic session timeout enforcement
- Unique user identification and authentication

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl/Cmd + K | Open command palette |
| Ctrl/Cmd + J | Toggle AI Copilot panel |
| Ctrl/Cmd + Shift + A | Navigate to audit log |

## Appendix B: Design System

The frontend uses a custom dark theme design system with the following token families:
- **bs-black / bs-black-sec:** Background colors
- **bs-gray-dark / bs-gray-mid / bs-gray-light:** Gray scale for text and borders
- **bs-orange:** Primary accent color (active states, highlights)
- **bs-red:** Critical/error states
- **bs-green:** Success/healthy states
- **bs-blue:** Informational states
- **bs-yellow:** Warning states
- **bs-border:** Border color across all components

## Appendix C: Environment Configuration

| Variable | Description | Default |
|---|---|---|
| VITE_API_URL | Backend API base URL | http://localhost:3001 |
| DATABASE_URL | PostgreSQL connection string | Required |
| JWT_SECRET | Secret key for JWT signing | Required |
| REFRESH_SECRET | Secret key for refresh token signing | Required |

---

*End of Document*
