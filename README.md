# BlackSentinel Guardian — Free / Open-Source Edition

> **This is the free, limited edition.** It's a real, functioning endpoint
> defense platform — not a demo — but it is genuinely limited, not just
> flag-disabled: the AI Copilot, Deception (honeypots), Memory Protection,
> and Threat Hunting modules are **not included in this repository's
> source at all**, and the endpoint fleet is capped at 10 hosts
> (`backend/src/config/edition.ts`). For the full platform with those
> modules and no cap, see [blacksentinel.io](https://blacksentinel.io).

## Autonomous Endpoint Defense Platform

BlackSentinel Guardian is a next-generation autonomous endpoint defense platform that combines EPP, EDR, XDR, Behavioral Analytics, Zero Trust, Ransomware Protection, AI Detection, Vulnerability Awareness, and Automatic Remediation into a single, unified platform.

---

## Architecture

```
blacksentinel-guardian/
├── blacksentinel-guardian/    # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/        # UI Components
│   │   │   ├── layout/        # Sidebar, Header
│   │   │   ├── dashboard/     # Security Dashboard
│   │   │   ├── endpoints/     # Endpoint Inventory
│   │   │   ├── timeline/      # Device Timeline
│   │   │   ├── detection/     # Threat Detection
│   │   │   ├── behavioral/    # Behavioral Engine
│   │   │   ├── hunting/       # Threat Hunting
│   │   │   ├── response/      # Response Center
│   │   │   ├── vulnerabilities/ # Vulnerability Awareness
│   │   │   ├── usb/           # USB Control
│   │   │   ├── firewall/      # Firewall Management
│   │   │   ├── isolation/     # Device Isolation
│   │   │   ├── memory/        # Memory Protection
│   │   │   ├── scripts/       # Script Control
│   │   │   ├── deception/     # Deception Technology
│   │   │   ├── copilot/       # AI Security Copilot
│   │   │   ├── integrations/  # Third-party Integrations
│   │   │   ├── settings/      # Settings & Audit Log
│   │   │   └── ui/            # Reusable UI Components
│   │   ├── hooks/             # Custom React Hooks
│   │   ├── services/          # API Service Layer
│   │   ├── store/             # Zustand State Management
│   │   ├── types/             # TypeScript Types
│   │   ├── data/              # Mock Data
│   │   └── utils/             # Utility Functions
│   └── public/                # Static Assets
├── backend/                   # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── routes/            # API Routes
│   │   ├── middleware/        # Auth, Rate Limiting, Error Handling
│   │   ├── config/            # Configuration
│   │   └── server.ts          # Main Server
│   └── prisma/                # Database Schema
├── k8s/                       # Kubernetes Manifests
├── .github/workflows/         # CI/CD Pipeline
├── scripts/                   # Deployment Scripts
├── Dockerfile.frontend        # Frontend Docker Image
└── nginx.conf                 # Nginx Configuration
```

## Features

### Security Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time security posture with charts and widgets |
| **Endpoint Inventory** | Device discovery, management, and risk scoring |
| **Device Timeline** | Chronological event history across endpoints |
| **Threat Detection** | Malware, ransomware, exploit detection with MITRE ATT&CK |
| **Behavioral Engine** | User behavior analytics and anomaly detection |
| **Threat Hunting** | KQL queries, MITRE mapping, IOC search |
| **Response Center** | 12+ remote response actions |
| **Vulnerability Awareness** | CVE tracking with CVSS scoring |
| **USB Control** | Device allow/block policies |
| **Firewall Management** | Rule management and traffic control |
| **Device Isolation** | Network quarantine capabilities |
| **Memory Protection** | Runtime exploitation detection |
| **Script Control** | PowerShell, Bash, Python execution control |
| **Deception** | Decoy artifacts for attacker detection |
| **AI Copilot** | Conversational AI security assistant |
| **Integrations** | 15+ third-party integrations |
| **Audit Log** | Immutable administrative action log |

### Design System

- **Colors**: BlackSentinel Orange (#FF6B00), Deep Black (#0B0B0B)
- **Typography**: Inter (UI) + JetBrains Mono (Code)
- **Animations**: Framer Motion with microinteractions
- **Charts**: Recharts with custom themes
- **Responsive**: Full mobile/tablet/desktop support

## Quick Start

```bash
# Install dependencies
cd blacksentinel-guardian
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Build

```bash
npm run build
```

## Deploy

```bash
# Docker Compose
./scripts/deploy.sh local

# Kubernetes
./scripts/deploy.sh k8s

# Build only
./scripts/deploy.sh build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment options.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Command Palette |
| `Ctrl/Cmd + J` | AI Copilot |
| `Ctrl/Cmd + Shift + A` | Audit Log |
| `Escape` | Close panels |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **State**: Zustand
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Express, Prisma, PostgreSQL, Redis
- **Infrastructure**: Docker, Kubernetes, Nginx

## License

Proprietary - BlackSentinel Corp.
