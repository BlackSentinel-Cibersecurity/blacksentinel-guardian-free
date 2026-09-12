# BlackSentinel Guardian - Deployment Manual

**Version:** 1.0.0  
**Last Updated:** June 2026  
**Classification:** Internal / Partner Use Only  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Database Setup](#3-database-setup)
4. [Backend Deployment](#4-backend-deployment)
5. [Frontend Deployment](#5-frontend-deployment)
6. [Docker Deployment](#6-docker-deployment)
7. [Kubernetes Deployment](#7-kubernetes-deployment)
8. [Agent Installation on Endpoints](#8-agent-installation-on-endpoints)
9. [Security Hardening](#9-security-hardening)
10. [Initial Configuration](#10-initial-configuration)
11. [Backup and Recovery](#11-backup-and-recovery)
12. [Monitoring and Maintenance](#12-monitoring-and-maintenance)
13. [Troubleshooting](#13-troubleshooting)
14. [Role Reference Table](#14-role-reference-table)
15. [API Reference](#15-api-reference)
16. [Environment Variables Reference](#16-environment-variables-reference)

---

## 1. Introduction

### 1.1 What is BlackSentinel Guardian

BlackSentinel Guardian is a next-generation autonomous endpoint defense platform that integrates EPP (Endpoint Protection Platform), EDR (Endpoint Detection and Response), XDR (Extended Detection and Response), Threat Hunting, Behavioral Analytics, Zero Trust enforcement, Deception Technology, Ransomware Protection, Memory Protection, AI-powered Detection, Vulnerability Awareness, and Automatic Remediation into a single, unified security platform.

The platform provides security operations teams with real-time visibility, threat intelligence, and automated response capabilities across all endpoints in an organization.

### 1.2 System Architecture Overview

BlackSentinel Guardian uses a modern three-tier architecture:

```
[Browser / Web UI] <---> [React Frontend] <---> [Express API Backend] <---> [PostgreSQL / Redis]
                                                         |
                                                  [Agent Communication]
                                                         |
                                              [Endpoint Agents (Windows/Linux/macOS)]
```

**Component breakdown:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 | Web-based management console |
| Backend | Express.js, TypeScript, Prisma ORM | REST API and WebSocket server |
| Database | PostgreSQL 16 | Persistent data storage |
| Cache | Redis 7 | Session management, real-time caching |
| Agents | Platform-specific binaries | Endpoint monitoring and protection |
| WebSocket | ws library | Real-time event streaming |

### 1.3 Hardware Requirements

**Minimum Requirements (Development/Lab):**

| Resource | Requirement |
|----------|------------|
| CPU | 2 cores, 2.0 GHz |
| RAM | 4 GB |
| Disk | 20 GB SSD |
| Network | 100 Mbps |

**Recommended Requirements (Production - up to 500 endpoints):**

| Resource | Requirement |
|----------|------------|
| CPU | 8 cores, 3.0 GHz |
| RAM | 16 GB |
| Disk | 100 GB NVMe SSD |
| Network | 1 Gbps |

**Enterprise Requirements (Production - 500+ endpoints):**

| Resource | Requirement |
|----------|------------|
| CPU | 16+ cores, 3.5 GHz |
| RAM | 32+ GB |
| Disk | 500+ GB NVMe SSD (RAID 10) |
| Network | 10 Gbps |

### 1.4 Supported Operating Systems

**For Server Deployment:**

- Ubuntu 22.04 LTS / 24.04 LTS
- Debian 12 (Bookworm)
- Rocky Linux 9
- Amazon Linux 2023
- RHEL 9
- CentOS Stream 9

**For Agent Installation:**

- Windows 10/11 (x64)
- Windows Server 2019/2022
- macOS 12 Monterey or later
- Ubuntu 20.04+ / Debian 11+
- CentOS/RHEL 8+
- Rocky Linux 8+
- Amazon Linux 2+

---

## 2. Prerequisites

### 2.1 Required Software

Install the following software before proceeding:

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS or later | Backend runtime |
| PostgreSQL | 15.x or later (16 recommended) | Database |
| Redis | 7.x or later | Caching and sessions |
| Docker | 24.x or later (optional) | Containerized deployment |
| Docker Compose | 2.x or later (optional) | Multi-container orchestration |
| npm | 10.x or later | Package management |
| Git | 2.40+ | Source code management |
| Nginx | 1.24+ (production) | Reverse proxy and static file serving |

**Install Node.js on Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should output v20.x.x
npm --version   # Should output 10.x.x
```

**Install PostgreSQL 16 on Ubuntu/Debian:**

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt-get update
sudo apt-get install -y postgresql-16
```

**Install Redis 7 on Ubuntu/Debian:**

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.2 Network Requirements

Ensure the following ports are accessible:

| Port | Protocol | Service | Direction |
|------|----------|---------|-----------|
| 3001 | TCP | Backend API | Inbound |
| 5173 | TCP | Vite Dev Server | Inbound (dev only) |
| 443 | TCP | HTTPS (production) | Inbound |
| 80 | TCP | HTTP (redirect to HTTPS) | Inbound |
| 5432 | TCP | PostgreSQL | Internal only |
| 6379 | TCP | Redis | Internal only |
| 8443 | TCP | Agent Registration | Inbound |

### 2.3 SSL/TLS Certificate Requirements

Production deployments require SSL/TLS certificates. Options include:

- **Let's Encrypt:** Free, automated certificates via certbot
- **Commercial CA:** DigiCert, Comodo, GlobalSign, etc.
- **Internal CA:** For air-gapped or enterprise environments

**Obtain Let's Encrypt certificates:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.yourdomain.com -d api.yourdomain.com
```

### 2.4 DNS Configuration

Configure the following DNS records:

| Record | Type | Value | TTL |
|--------|------|-------|-----|
| guardian.yourdomain.com | A | Server IP | 300 |
| api.yourdomain.com | A | Server IP | 300 |

---

## 3. Database Setup

### 3.1 PostgreSQL Installation

Verify PostgreSQL is running:

```bash
sudo systemctl status postgresql
sudo systemctl enable postgresql
```

### 3.2 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create the database
CREATE DATABASE blacksentinel;

# Create a dedicated user with a strong password
CREATE USER blacksentinel_user WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;

-- For PostgreSQL 15+, also grant schema access
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blacksentinel_user;

-- Exit
\q
```

### 3.3 Running Prisma Migrations

```bash
cd backend

# Install dependencies
npm install

# Set DATABASE_URL in your .env file
echo 'DATABASE_URL=postgresql://blacksentinel_user:YOUR_SECURE_PASSWORD_HERE@localhost:5432/blacksentinel' > .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 3.4 Database Seeding

The seed script creates the initial SUPER_ADMIN user required for first login.

```bash
# Set required environment variables in .env
cat >> .env << 'EOF'
JWT_SECRET=your-random-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-chars
REDIS_URL=redis://localhost:6379
EOF

# Run the seed script
npm run seed
```

**Default SUPER_ADMIN credentials (change immediately after first login):**

- Email: `admin@blacksentinel.io`
- Password: `admin123`

### 3.5 Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Examples:**

```
# Local development
postgresql://postgres:password@localhost:5432/blacksentinel

# Remote server
postgresql://blacksentinel_user:secure_pass@db.example.com:5432/blacksentinel

# With SSL (required for most cloud providers)
postgresql://blacksentinel_user:secure_pass@db.example.com:5432/blacksentinel?sslmode=require
```

---

## 4. Backend Deployment

### 4.1 Installing Dependencies

```bash
cd backend
npm ci
```

### 4.2 Environment Variables Configuration

Create the `.env` file in the `backend/` directory:

```bash
cat > .env << 'ENVEOF'
# ─── Server ─────────────────────────────────────────
PORT=3001
NODE_ENV=production

# ─── Authentication ─────────────────────────────────
JWT_SECRET=REPLACE_WITH_64_RANDOM_CHARACTERS
JWT_REFRESH_SECRET=REPLACE_WITH_64_RANDOM_CHARACTERS
JWT_EXPIRES_IN=15m
MFA_ISSUER=BlackSentinel Guardian

# ─── Database ───────────────────────────────────────
DATABASE_URL=postgresql://blacksentinel_user:YOUR_PASSWORD@localhost:5432/blacksentinel

# ─── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── CORS ───────────────────────────────────────────
CORS_ORIGINS=https://guardian.yourdomain.com

# ─── Logging ────────────────────────────────────────
LOG_LEVEL=info

# ─── Security ───────────────────────────────────────
AGENT_SIGNING_KEY=REPLACE_WITH_SECURE_KEY
TLS_CERT_PATH=/etc/ssl/certs/guardian.pem
TLS_KEY_PATH=/etc/ssl/private/guardian.key
ENVEOF
```

### 4.3 Building the TypeScript Project

```bash
cd backend
npm run build
```

### 4.4 Starting the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run start
```

### 4.5 PM2 Process Management

Install PM2 globally and configure for production:

```bash
# Install PM2
npm install -g pm2

# Start the API with PM2
cd backend
pm2 start dist/server.js --name blacksentinel-api

# Save process list and configure startup
pm2 save
pm2 startup

# Useful PM2 commands
pm2 status
pm2 logs blacksentinel-api
pm2 restart blacksentinel-api
pm2 stop blacksentinel-api
pm2 delete blacksentinel-api
```

### 4.6 Log Configuration

**Configure PM2 log rotation:**

```bash
npm install -g pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

**Configure application logging via environment variables:**

```
LOG_LEVEL=info          # Options: debug, info, warn, error
```

---

## 5. Frontend Deployment

### 5.1 Installing Dependencies

```bash
cd blacksentinel-guardian
npm ci
```

### 5.2 Environment Variables

Create `.env.production` in the frontend root:

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws
EOF
```

### 5.3 Building for Production

```bash
npm run build
```

This generates optimized static files in the `dist/` directory.

### 5.4 Serving with Nginx

**Install Nginx:**

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name guardian.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name guardian.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/guardian.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/guardian.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /var/www/guardian/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss://api.yourdomain.com https://api.yourdomain.com" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml;

    # Static assets caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

**Deploy frontend files:**

```bash
sudo mkdir -p /var/www/guardian/html
sudo cp -r dist/* /var/www/guardian/html/
sudo chown -R www-data:www-data /var/www/guardian
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Docker Deployment

### 6.1 docker-compose.yml (Full Stack)

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - blacksentinel

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/blacksentinel
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CORS_ORIGINS=https://guardian.yourdomain.com
      - LOG_LEVEL=info
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - blacksentinel

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: blacksentinel
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - blacksentinel

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - blacksentinel

volumes:
  postgres_data:
  redis_data:

networks:
  blacksentinel:
    driver: bridge
```

### 6.2 Building Custom Images

```bash
# Build frontend image
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .

# Build backend image
docker build -t blacksentinel/guardian-api:latest ./backend
```

### 6.3 Environment Variables in Docker

Create a `.env` file in the project root:

```bash
POSTGRES_PASSWORD=YOUR_SECURE_DB_PASSWORD
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD
JWT_SECRET=YOUR_64_CHAR_RANDOM_SECRET
JWT_REFRESH_SECRET=YOUR_64_CHAR_REFRESH_SECRET
```

### 6.4 Volume Mounts for Data Persistence

The docker-compose.yml defines two named volumes:

- `postgres_data`: Persists PostgreSQL data at `/var/lib/postgresql/data`
- `redis_data`: Persists Redis data at `/data`

### 6.5 Health Checks

Verify service health after deployment:

```bash
# Check all services
docker compose ps

# Check API health
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","version":"1.0.0","uptime":123.456}

# View logs
docker compose logs -f api
docker compose logs -f db
docker compose logs -f redis
```

---

## 7. Kubernetes Deployment

### 7.1 Namespace Setup

```bash
kubectl create namespace blacksentinel
```

### 7.2 Secrets and ConfigMaps

```bash
# Create secrets
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:YOUR_PASSWORD@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='YOUR_64_CHAR_RANDOM_SECRET' \
  --from-literal=jwt-refresh-secret='YOUR_64_CHAR_REFRESH_SECRET' \
  --from-literal=postgres-password='YOUR_PASSWORD'
```

### 7.3 Deployment Manifests

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blacksentinel-api
  namespace: blacksentinel
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blacksentinel
      component: api
  template:
    metadata:
      labels:
        app: blacksentinel
        component: api
    spec:
      containers:
        - name: api
          image: blacksentinel/guardian-api:latest
          ports:
            - containerPort: 3001
          envFrom:
            - secretRef:
                name: blacksentinel-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blacksentinel-frontend
  namespace: blacksentinel
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blacksentinel
      component: frontend
  template:
    metadata:
      labels:
        app: blacksentinel
        component: frontend
    spec:
      containers:
        - name: frontend
          image: blacksentinel/guardian-frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
```

### 7.4 Service and Ingress Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: blacksentinel-api
  namespace: blacksentinel
spec:
  selector:
    app: blacksentinel
    component: api
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: blacksentinel-frontend
  namespace: blacksentinel
spec:
  selector:
    app: blacksentinel
    component: frontend
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: blacksentinel-ingress
  namespace: blacksentinel
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - guardian.yourdomain.com
      secretName: blacksentinel-tls
  rules:
    - host: guardian.yourdomain.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: blacksentinel-api
                port:
                  number: 3001
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: blacksentinel-api
                port:
                  number: 3001
          - path: /
            pathType: Prefix
            backend:
              service:
                name: blacksentinel-frontend
                port:
                  number: 80
```

### 7.5 Persistent Volumes for PostgreSQL

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: blacksentinel
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: "blacksentinel"
            - name: POSTGRES_USER
              value: "postgres"
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: blacksentinel-secrets
                  key: postgres-password
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: blacksentinel
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: blacksentinel
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          command: ["redis-server", "--appendonly", "yes"]
          volumeMounts:
            - name: redis-data
              mountPath: /data
      volumes:
        - name: redis-data
          persistentVolumeClaim:
            claimName: redis-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: blacksentinel
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 7.6 Scaling Considerations

- The API deployment is configured with 3 replicas by default. Adjust `spec.replicas` based on load.
- Enable Horizontal Pod Autoscaler (HPA) for automatic scaling:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: blacksentinel-api-hpa
  namespace: blacksentinel
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: blacksentinel-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## 8. Agent Installation on Endpoints

### 8.1 Registering a New Endpoint

1. Log in to the BlackSentinel Guardian web console
2. Navigate to **Endpoints > Inventory**
3. Click **Add Endpoint**
4. Provide a name for the endpoint
5. Copy the generated registration command

### 8.2 Agent Installation Commands

**Windows (PowerShell):**

```powershell
# Run as Administrator
irm https://install.blacksentinel.io/agent.ps1 | iex
```

**Linux (bash):**

```bash
# Run as root
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

**macOS (bash):**

```bash
# Run as root
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 Agent Configuration

The agent configuration file is located at:

- **Windows:** `C:\ProgramData\BlackSentinel\agent.conf`
- **Linux:** `/etc/blacksentinel/agent.conf`
- **macOS:** `/Library/BlackSentinel/agent.conf`

**Configuration options:**

```ini
[server]
url = https://api.yourdomain.com
registration_token = YOUR_REGISTRATION_TOKEN

[agent]
heartbeat_interval = 30
log_level = info
```

### 8.4 Verifying Agent Connectivity

```bash
# Check agent status
blacksentinel-agent status

# Expected output:
# Agent Status: Running
# Connected: Yes
# Server: https://api.yourdomain.com
# Uptime: 12345s
```

### 8.5 Troubleshooting Agent Connection Issues

| Issue | Solution |
|-------|----------|
| Agent cannot reach server | Verify port 8443 is open and firewall allows outbound connections |
| Registration fails | Verify registration token is valid and not expired |
| Agent shows "Degraded" | Check agent logs: `journalctl -u blacksentinel-agent -f` |
| TLS certificate errors | Ensure agent trusts the server certificate or install CA certificate |

---

## 9. Security Hardening

### 9.1 Change Default Credentials

Immediately after installation:

1. Change the default SUPER_ADMIN password
2. Change all default database passwords
3. Rotate the JWT secrets
4. Update the Redis password

### 9.2 Enable MFA for All Admin Accounts

All administrator accounts must enable MFA:

1. Log in as admin
2. Navigate to **Settings > Security**
3. Enable MFA
4. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
5. Enter the verification code

### 9.3 Firewall Rules

**UFW (Ubuntu/Debian):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 80/tcp    # HTTP (for Let's Encrypt)
sudo ufw deny 3001/tcp   # Block direct API access
sudo ufw deny 5432/tcp   # Block direct PostgreSQL access
sudo ufw deny 6379/tcp   # Block direct Redis access
sudo ufw enable
```

### 9.4 SSL/TLS Configuration

- Use TLS 1.2 or higher only
- Disable weak cipher suites
- Enable HSTS headers
- Use certificate pinning for agent communication

### 9.5 Database Encryption at Rest

Enable PostgreSQL Transparent Data Encryption (TDE) if supported by your PostgreSQL distribution, or use disk-level encryption (LUKS, BitLocker).

### 9.6 Audit Log Review

Regularly review the audit log for suspicious activity:

```sql
-- Review recent admin actions
SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;

-- Review failed login attempts
SELECT * FROM "AuditLog" WHERE action LIKE '%login%' AND details->>'success' = 'false';
```

### 9.7 Regular Security Updates

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Update Node.js dependencies
cd backend && npm audit fix
cd .. && npm audit fix
```

---

## 10. Initial Configuration

### 10.1 First Login as SUPER_ADMIN

1. Open `https://guardian.yourdomain.com` in a browser
2. Log in with the default SUPER_ADMIN credentials
3. Change the default password immediately
4. Configure MFA

### 10.2 Creating Departments and Tags

1. Navigate to **Settings > Departments**
2. Click **Add Department**
3. Enter department name and description
4. Navigate to **Settings > Tags**
5. Create tags for categorizing endpoints (e.g., "Critical", "Finance", "Engineering")

### 10.3 Configuring Integrations

Navigate to **Settings > Integrations** and configure:

| Integration | Configuration Required |
|-------------|----------------------|
| Email (SMTP) | SMTP host, port, username, password, sender address |
| Slack | Webhook URL or OAuth token |
| Microsoft Teams | Webhook URL |
| SIEM | API endpoint, authentication token |
| Active Directory | LDAP/AD server address, base DN, bind credentials |

### 10.4 Setting Up Notification Rules

Navigate to **Settings > Notifications** and create rules:

1. Define trigger conditions (severity, event type, endpoint)
2. Define notification channels (email, Slack, Teams, webhook)
3. Set notification frequency and escalation rules

### 10.5 Configuring Retention Policies

Navigate to **Settings > Retention** and configure:

- Alert retention period (default: 90 days)
- Threat retention period (default: 365 days)
- Audit log retention period (default: 365 days)
- Timeline event retention period (default: 30 days)

### 10.6 Role-Based Access Control

Navigate to **Settings > Users > Add User** to create users with appropriate roles.

**Available roles:** See [Section 14: Role Reference Table](#14-role-reference-table).

---

## 11. Backup and Recovery

### 11.1 Database Backup Procedures

**Manual backup using pg_dump:**

```bash
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### 11.2 Automated Backup Scripts

Create `/etc/cron.d/blacksentinel-backup`:

```bash
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel/blacksentinel_$(date +\%Y\%m\%d).dump.gz
```

### 11.3 Restoring from Backup

```bash
# Stop the backend service
pm2 stop blacksentinel-api

# Restore the database
gunzip -c backup_20260630_020000.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel --verbose

# Restart the backend service
pm2 start blacksentinel-api
```

### 11.4 Disaster Recovery Procedures

1. Identify the point of failure
2. Provision new infrastructure if needed
3. Restore database from most recent backup
4. Deploy backend and frontend
5. Verify agent connectivity
6. Test critical functionality

### 11.5 RPO and RTO Considerations

| Metric | Target | Description |
|--------|--------|-------------|
| RPO | 1 hour | Maximum acceptable data loss |
| RTO | 4 hours | Maximum acceptable downtime |

---

## 12. Monitoring and Maintenance

### 12.1 Health Check Endpoints

```bash
# API health check
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","version":"1.0.0","uptime":123.456}
```

### 12.2 Log Monitoring

```bash
# View API logs with PM2
pm2 logs blacksentinel-api

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 12.3 Performance Monitoring

Monitor the following metrics:

- API response time (target: < 200ms p95)
- Database connection pool utilization
- Redis memory usage
- CPU and memory utilization
- Disk I/O and storage capacity

### 12.4 Database Maintenance

```bash
# Run VACUUM ANALYZE
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"

# Rebuild indexes
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

### 12.5 Upgrade Procedures

**Backend upgrade:**

```bash
cd backend
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart blacksentinel-api
```

**Frontend upgrade:**

```bash
cd blacksentinel-guardian
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/guardian/html/
sudo systemctl reload nginx
```

---

## 13. Troubleshooting

### 13.1 Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| API won't start | Check `.env` configuration and ensure all required variables are set |
| Database connection refused | Verify PostgreSQL is running and connection string is correct |
| Redis connection refused | Verify Redis is running: `redis-cli ping` |
| Build fails | Run `npm ci` to clean install dependencies |
| Frontend shows blank page | Check `VITE_API_URL` is correctly set in `.env.production` |

### 13.2 Connection Refused Errors

```bash
# Verify PostgreSQL is listening
sudo ss -tlnp | grep 5432

# Verify Redis is listening
sudo ss -tlnp | grep 6379

# Verify API is listening
sudo ss -tlnp | grep 3001
```

### 13.3 Authentication Failures

- Verify JWT_SECRET is set and consistent
- Check that tokens have not expired
- Ensure CORS_ORIGINS includes your frontend domain
- Verify the user account is active and not locked

### 13.4 Database Connection Issues

```bash
# Test connection manually
psql -h localhost -U blacksentinel_user -d blacksentinel

# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection limits
sudo -u postgres psql -c "SHOW max_connections;"
```

### 13.5 Agent Not Connecting

1. Verify network connectivity from agent to server
2. Check firewall rules allow outbound port 8443
3. Verify registration token is valid
4. Check agent logs for error messages
5. Ensure server SSL certificate is trusted by agent

### 13.6 Build Failures

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm ci

# Clear TypeScript build cache
rm -rf dist
npm run build
```

### 13.7 Enable Debug Logging

Set the following environment variable:

```
LOG_LEVEL=debug
```

Restart the service to apply changes.

---

## 14. Role Reference Table

| Role | Description | View Dashboard | View Endpoints | View Threats | Edit Threats | Delete Records | Manage Users | Manage Settings | Manage Integrations | View Audit Log | Use AI Copilot |
|------|-------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | Full system access | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| ADMIN | System administration | Yes | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes |
| SOC_TIER_5 | SOC Lead / Manager | Yes | Yes | Yes | Yes | Yes | No | No | No | Yes | Yes |
| SOC_TIER_4 | Senior SOC Analyst | Yes | Yes | Yes | Yes | No | No | No | No | Yes | Yes |
| SOC_TIER_3 | Advanced SOC Analyst | Yes | Yes | Yes | Yes | No | No | No | No | Yes | Yes |
| SOC_TIER_2 | Intermediate SOC Analyst | Yes | Yes | Yes | Partial | No | No | No | No | Yes | No |
| SOC_TIER_1 | Junior SOC Analyst | Yes | Yes | Yes | No | No | No | No | No | No | No |
| AUDITOR_3 | Senior Security Auditor | Yes | Yes | Yes | No | No | No | No | No | Yes | No |
| AUDITOR_2 | Security Auditor | Yes | Yes | Partial | No | No | No | No | No | Yes | No |
| AUDITOR_1 | Junior Auditor | Yes | Partial | Partial | No | No | No | No | No | No | No |
| IT | IT Operations | Yes | Yes | No | No | No | No | Partial | No | No | No |
| ANALYST | General Analyst | Yes | Yes | Yes | No | No | No | No | No | No | No |
| VIEWER | Read-only access | Yes | Partial | Partial | No | No | No | No | No | No | No |

---

## 15. API Reference

### 15.1 Base URL

```
https://api.yourdomain.com/api
```

### 15.2 Authentication Header Format

```
Authorization: Bearer <JWT_TOKEN>
```

### 15.3 API Endpoints

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/register` | User registration | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/logout` | User logout | Authenticated |
| POST | `/api/auth/mfa/setup` | Enable MFA | Authenticated |
| POST | `/api/auth/mfa/verify` | Verify MFA code | Authenticated |
| GET | `/api/health` | Health check | Public |
| GET | `/api/users` | List all users | ADMIN+ |
| POST | `/api/users` | Create user | ADMIN+ |
| GET | `/api/users/:id` | Get user by ID | ADMIN+ |
| PUT | `/api/users/:id` | Update user | ADMIN+ |
| DELETE | `/api/users/:id` | Delete user | SUPER_ADMIN |
| GET | `/api/endpoints` | List all endpoints | SOC_TIER_1+ |
| POST | `/api/endpoints` | Register endpoint | IT+ |
| GET | `/api/endpoints/:id` | Get endpoint details | SOC_TIER_1+ |
| PUT | `/api/endpoints/:id` | Update endpoint | SOC_TIER_2+ |
| DELETE | `/api/endpoints/:id` | Delete endpoint | ADMIN+ |
| GET | `/api/threats` | List all threats | SOC_TIER_1+ |
| POST | `/api/threats` | Create threat entry | SOC_TIER_2+ |
| GET | `/api/threats/:id` | Get threat details | SOC_TIER_1+ |
| PUT | `/api/threats/:id` | Update threat | SOC_TIER_2+ |
| DELETE | `/api/threats/:id` | Delete threat | SOC_TIER_4+ |
| GET | `/api/alerts` | List all alerts | SOC_TIER_1+ |
| POST | `/api/alerts` | Create alert | SOC_TIER_1+ |
| GET | `/api/alerts/:id` | Get alert details | SOC_TIER_1+ |
| PUT | `/api/alerts/:id` | Update alert | SOC_TIER_2+ |
| DELETE | `/api/alerts/:id` | Delete alert | SOC_TIER_3+ |
| GET | `/api/timeline` | List timeline events | SOC_TIER_1+ |
| GET | `/api/vulnerabilities` | List vulnerabilities | SOC_TIER_1+ |
| POST | `/api/vulnerabilities` | Create vulnerability | SOC_TIER_3+ |
| GET | `/api/firewall/rules` | List firewall rules | SOC_TIER_2+ |
| POST | `/api/firewall/rules` | Create firewall rule | SOC_TIER_3+ |
| GET | `/api/usb` | List USB devices | SOC_TIER_1+ |
| POST | `/api/usb` | Register USB device | IT+ |
| POST | `/api/response` | Execute response action | SOC_TIER_3+ |
| GET | `/api/audit` | List audit logs | AUDITOR_1+ |
| GET | `/api/dashboard` | Dashboard metrics | SOC_TIER_1+ |
| POST | `/api/copilot` | Send AI query | SOC_TIER_3+ |
| GET | `/api/settings` | Get system settings | ADMIN+ |
| PUT | `/api/settings` | Update system settings | SUPER_ADMIN |
| GET | `/api/integrations` | List integrations | ADMIN+ |
| PUT | `/api/integrations/:id` | Update integration | ADMIN+ |

### 15.4 Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": null
  }
}
```

**Error codes:** `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `RATE_LIMITED`

### 15.5 Pagination Format

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

Query parameters: `?page=1&limit=20&sort=createdAt&order=desc`

---

## 16. Environment Variables Reference

| Variable | Required | Default | Description | Example |
|----------|:--------:|---------|-------------|---------|
| PORT | No | `3001` | Backend server port | `3001` |
| NODE_ENV | Yes | `development` | Environment mode | `production` |
| DATABASE_URL | Yes | `file:./dev.db` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| REDIS_URL | Yes | `redis://localhost:6379` | Redis connection string | `redis://redis:6379` |
| JWT_SECRET | Yes | None | JWT signing secret (min 32 chars) | `a1b2c3d4e5f6...` |
| JWT_REFRESH_SECRET | Yes | None | Refresh token signing secret | `z9y8x7w6v5u4...` |
| JWT_EXPIRES_IN | No | `15m` | Access token expiry | `15m` |
| MFA_ISSUER | No | `BlackSentinel Guardian` | MFA issuer name | `BlackSentinel Guardian` |
| CORS_ORIGINS | Yes | `http://localhost:5173` | Allowed CORS origins | `https://guardian.example.com` |
| LOG_LEVEL | No | `info` | Logging level | `debug` |
| AGENT_SIGNING_KEY | No | None | Agent binary signing key | `your-signing-key` |
| TLS_CERT_PATH | No | None | TLS certificate path | `/etc/ssl/certs/guardian.pem` |
| TLS_KEY_PATH | No | None | TLS private key path | `/etc/ssl/private/guardian.key` |
| VITE_API_URL | Yes | `http://localhost:3001` | Backend API URL (frontend) | `https://api.example.com` |
| VITE_WS_URL | No | `ws://localhost:3001/ws` | WebSocket URL (frontend) | `wss://api.example.com/ws` |
| POSTGRES_PASSWORD | Docker | `postgres` | PostgreSQL password (Docker) | `secure_password` |
| REDIS_PASSWORD | Docker | None | Redis password (Docker) | `secure_password` |

---

**Document End**

For additional support, contact: support@blacksentinel.io
