# BlackSentinel Guardian - Deployment-Handbuch

**Version:** 1.0.0  
**Letzte Aktualisierung:** Juni 2026  
**Klassifizierung:** Nur fur internen / Partnergebrauch  

---

## Inhaltsverzeichnis

1. [Einfuhrung](#1-einfuhrung)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Datenbank-Einrichtung](#3-datenbank-einrichtung)
4. [Backend-Deployment](#4-backend-deployment)
5. [Frontend-Deployment](#5-frontend-deployment)
6. [Docker-Deployment](#6-docker-deployment)
7. [Kubernetes-Deployment](#7-kubernetes-deployment)
8. [Agent-Installation auf Endpunkten](#8-agent-installation-auf-endpunkten)
9. [Sicherheitsverfestigung](#9-sicherheitsverfestigung)
10. [Erstkonfiguration](#10-erstkonfiguration)
11. [Sicherung und Wiederherstellung](#11-sicherung-und-wiederherstellung)
12. [Uberwachung und Wartung](#12-uberwachung-und-wartung)
13. [Fehlerbehebung](#13-fehlerbehebung)
14. [Rollenreferenztabelle](#14-rollenreferenztabelle)
15. [API-Referenz](#15-api-referenz)
16. [Umgebungsvariablen-Referenz](#16-umgebungsvariablen-referenz)

---

## 1. Einfuhrung

### 1.1 Was ist BlackSentinel Guardian

BlackSentinel Guardian ist eine Plattform fur autonome Endpunktverteidigung neuester Generation, die EPP (Endpoint Protection Platform), EDR (Endpoint Detection and Response), XDR (Extended Detection and Response), Bedrohungsjagd, Verhaltensanalytik, Zero Trust, Tarnungstechnologie, Ransomware-Schutz, Speicherschutz, KI-basierte Erkennung, Schwachstellenbewusstsein und automatische Remediation in einer einheitlichen Sicherheitsplattform integriert.

Die Plattform bietet Sicherheitsoperationsteams Echtzeit-Transparenz, Bedrohungsinformationen und automatisierte Reaktionsfahigkeiten auf allen Endpunkten einer Organisation.

### 1.2 Systemarchitektur-Ubersicht

BlackSentinel Guardian verwendet eine moderne Drei-Schichten-Architektur:

```
[Browser / Web-Oberflache] <--> [React Frontend] <--> [Express API Backend] <--> [PostgreSQL / Redis]
                                                              |
                                                       [Agent-Kommunikation]
                                                              |
                                               [Endpunkt-Agenten (Windows/Linux/macOS)]
```

**Komponentenaufteilung:**

| Komponente | Technologie | Zweck |
|------------|------------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 | Web-basierte Verwaltungskonsole |
| Backend | Express.js, TypeScript, Prisma ORM | REST-API und WebSocket-Server |
| Datenbank | PostgreSQL 16 | Persistente Datenspeicherung |
| Cache | Redis 7 | Sitzungsverwaltung, Echtzeit-Cache |
| Agenten | Plattformspezifische Binaries | Endpunktuberwachung und -schutz |
| WebSocket | ws-Bibliothek | Echtzeit-Ereignisstrom |

### 1.3 Hardware-Anforderungen

**Mindestanforderungen (Entwicklung/Labor):**

| Ressource | Anforderung |
|-----------|-------------|
| CPU | 2 Kerne, 2.0 GHz |
| RAM | 4 GB |
| Festplatte | 20 GB SSD |
| Netzwerk | 100 Mbps |

**Empfohlen fur Produktion (bis 500 Endpunkte):**

| Ressource | Anforderung |
|-----------|-------------|
| CPU | 8 Kerne, 3.0 GHz |
| RAM | 16 GB |
| Festplatte | 100 GB NVMe SSD |
| Netzwerk | 1 Gbps |

**Enterprise-Anforderungen fur Produktion (500+ Endpunkte):**

| Ressource | Anforderung |
|-----------|-------------|
| CPU | 16+ Kerne, 3.5 GHz |
| RAM | 32+ GB |
| Festplatte | 500+ GB NVMe SSD (RAID 10) |
| Netzwerk | 10 Gbps |

### 1.4 Unterstützte Betriebssysteme

**Fur Server-Deployment:**

- Ubuntu 22.04 LTS / 24.04 LTS
- Debian 12 (Bookworm)
- Rocky Linux 9
- Amazon Linux 2023
- RHEL 9
- CentOS Stream 9

**Fur Agent-Installation:**

- Windows 10/11 (x64)
- Windows Server 2019/2022
- macOS 12 Monterey oder spater
- Ubuntu 20.04+ / Debian 11+
- CentOS/RHEL 8+
- Rocky Linux 8+
- Amazon Linux 2+

---

## 2. Voraussetzungen

### 2.1 Erforderliche Software

Installieren Sie die folgende Software vor dem Fortfahren:

| Software | Version | Zweck |
|----------|---------|-------|
| Node.js | 20.x LTS oder neuer | Backend-Laufzeitumgebung |
| PostgreSQL | 15.x oder neuer (16 empfohlen) | Datenbank |
| Redis | 7.x oder neuer | Cache und Sitzungen |
| Docker | 24.x oder neuer (optional) | Container-basiertes Deployment |
| Docker Compose | 2.x oder neuer (optional) | Multi-Container-Orchestrierung |
| npm | 10.x oder neuer | Paketverwaltung |
| Git | 2.40+ | Quellcodeverwaltung |
| Nginx | 1.24+ (Produktion) | Reverse Proxy und statische Dateibereitstellung |

**Node.js auf Ubuntu/Debian installieren:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Sollte v20.x.x ausgeben
npm --version   # Sollte 10.x.x ausgeben
```

**PostgreSQL 16 auf Ubuntu/Debian installieren:**

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt-get update
sudo apt-get install -y postgresql-16
```

**Redis 7 auf Ubuntu/Debian installieren:**

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.2 Netzwerkanforderungen

Stellen Sie sicher, dass die folgenden Ports erreichbar sind:

| Port | Protokoll | Dienst | Richtung |
|------|-----------|--------|----------|
| 3001 | TCP | Backend-API | Eingehend |
| 5173 | TCP | Vite-Entwicklungsserver | Eingehend (nur Entwicklung) |
| 443 | TCP | HTTPS (Produktion) | Eingehend |
| 80 | TCP | HTTP (Weiterleitung zu HTTPS) | Eingehend |
| 5432 | TCP | PostgreSQL | Nur intern |
| 6379 | TCP | Redis | Nur intern |
| 8443 | TCP | Agent-Registrierung | Eingehend |

### 2.3 SSL/TLS-Zertifikatanforderungen

Produktions-Deployment erfordert SSL/TLS-Zertifikate. Optionen umfassen:

- **Let's Encrypt:** Kostenlose, automatisierte Zertifikate uber certbot
- **Kommerzielle CA:** DigiCert, Comodo, GlobalSign usw.
- **Interne CA:** Fur luftabgeschnittene oder Enterprise-Umgebungen

**Let's Encrypt-Zertifikate abrufen:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.ihredomain.de -d api.ihredomain.de
```

### 2.4 DNS-Konfiguration

Konfigurieren Sie die folgenden DNS-Eintrage:

| Eintrag | Typ | Wert | TTL |
|---------|-----|------|-----|
| guardian.ihredomain.de | A | Server-IP | 300 |
| api.ihredomain.de | A | Server-IP | 300 |

---

## 3. Datenbank-Einrichtung

### 3.1 PostgreSQL-Installation

Uberprufen Sie, ob PostgreSQL lauft:

```bash
sudo systemctl status postgresql
sudo systemctl enable postgresql
```

### 3.2 Datenbank und Benutzer erstellen

```bash
# Zu postgres-Benutzer wechseln
sudo -u postgres psql

# Datenbank erstellen
CREATE DATABASE blacksentinel;

# Gewidmeten Benutzer mit sicheren Passwort erstellen
CREATE USER blacksentinel_user WITH PASSWORD 'IHR_SICHERES_PASSWORT_HIER';

# Berechtigungen erteilen
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;

-- Fur PostgreSQL 15+ auch Schema-Zugang erteilen
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blacksentinel_user;

-- Beenden
\q
```

### 3.3 Prisma-Migrationen ausfuhren

```bash
cd backend

# Abhangigkeiten installieren
npm install

# DATABASE_URL in Ihrer .env-Datei setzen
echo 'DATABASE_URL=postgresql://blacksentinel_user:IHR_SICHERES_PASSWORT_HIER@localhost:5432/blacksentinel' > .env

# Prisma-Client generieren
npx prisma generate

# Migrationen ausfuhren
npx prisma migrate deploy
```

### 3.4 Datenbank-Befuellung (Seed)

Das Seed-Skript erstellt den anfanglichen SUPER_ADMIN-Benutzer, der fur den ersten Login erforderlich ist.

```bash
# Erforderliche Umgebungsvariablen in .env setzen
cat >> .env << 'EOF'
JWT_SECRET=Ihr_zufaelliger_Schluessel_mind_32_Zeichen
JWT_REFRESH_SECRET=Ihr_Aktualisierungs-Schluessel_mind_32_Zeichen
REDIS_URL=redis://localhost:6379
EOF

# Seed-Skript ausfuhren
npm run seed
```

**Standard SUPER_ADMIN-Anmeldeinformationen (sofort nach dem ersten Login andern):**

- E-Mail: `admin@blacksentinel.io`
- Passwort: `admin123`

### 3.5 Verbindungszeichenfolgen-Format

```
postgresql://BENUTZER:PASSWORT@HOST:PORT/DB?schema=public
```

**Beispiele:**

```
# Lokale Entwicklung
postgresql://postgres:password@localhost:5432/blacksentinel

# Remote-Server
postgresql://blacksentinel_user:sicheres_passwort@db.example.de:5432/blacksentinel

# Mit SSL (erforderlich fur die meisten Cloud-Anbieter)
postgresql://blacksentinel_user:sicheres_passwort@db.example.de:5432/blacksentinel?sslmode=require
```

---

## 4. Backend-Deployment

### 4.1 Abhangigkeiten installieren

```bash
cd backend
npm ci
```

### 4.2 Umgebungsvariablen-Konfiguration

Erstellen Sie die Datei `.env` im Verzeichnis `backend/`:

```bash
cat > .env << 'ENVEOF'
# ─── Server ─────────────────────────────────────
PORT=3001
NODE_ENV=production

# ─── Authentifizierung ─────────────────────────────
JWT_SECRET=ERSETZEN_DURCH_64_ZUFALLSZEICHEN
JWT_REFRESH_SECRET=ERSETZEN_DURCH_64_ZUFALLSZEICHEN
JWT_EXPIRES_IN=15m
MFA_ISSUER=BlackSentinel Guardian

# ─── Datenbank ─────────────────────────────────────
DATABASE_URL=postgresql://blacksentinel_user:IHR_PASSWORT@localhost:5432/blacksentinel

# ─── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── CORS ───────────────────────────────────────────
CORS_ORIGINS=https://guardian.ihredomain.de

# ─── Protokollierung ─────────────────────────────────
LOG_LEVEL=info

# ─── Sicherheit ───────────────────────────────────────
AGENT_SIGNING_KEY=ERSETZEN_DURCH_SICHEREN_SCHLUSSEL
TLS_CERT_PATH=/etc/ssl/certs/guardian.pem
TLS_KEY_PATH=/etc/ssl/private/guardian.key
ENVEOF
```

### 4.3 TypeScript-Projekt kompilieren

```bash
cd backend
npm run build
```

### 4.4 Server starten

```bash
# Entwicklungsmodus (mit automatischem Neuladen)
npm run dev

# Produktionsmodus
npm run start
```

### 4.5 PM2-Prozessverwaltung

PM2 global installieren und fur Produktion konfigurieren:

```bash
# PM2 installieren
npm install -g pm2

# API mit PM2 starten
cd backend
pm2 start dist/server.js --name blacksentinel-api

# Prozessliste speichern und Autostart konfigurieren
pm2 save
pm2 startup

# Nutzliche PM2-Befehle
pm2 status
pm2 logs blacksentinel-api
pm2 restart blacksentinel-api
pm2 stop blacksentinel-api
pm2 delete blacksentinel-api
```

### 4.6 Protokollkonfiguration

**PM2-Protokollrotation konfigurieren:**

```bash
npm install -g pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

**Anwendungsprotokollierung uber Umgebungsvariablen konfigurieren:**

```
LOG_LEVEL=info          # Optionen: debug, info, warn, error
```

---

## 5. Frontend-Deployment

### 5.1 Abhangigkeiten installieren

```bash
cd blacksentinel-guardian
npm ci
```

### 5.2 Umgebungsvariablen

Erstellen Sie `.env.production` im Frontend-Root:

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.ihredomain.de
VITE_WS_URL=wss://api.ihredomain.de/ws
EOF
```

### 5.3 Kompilierung fur Produktion

```bash
npm run build
```

Dies generiert optimierte statische Dateien im Verzeichnis `dist/`.

### 5.4 Bereitstellung mit Nginx

**Nginx installieren:**

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

**Nginx-Konfiguration:**

```nginx
server {
    listen 80;
    server_name guardian.ihredomain.de;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name guardian.ihredomain.de;

    ssl_certificate /etc/letsencrypt/live/guardian.ihredomain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/guardian.ihredomain.de/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /var/www/guardian/html;
    index index.html;

    # Sicherheits-Header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss://api.ihredomain.de https://api.ihredomain.de" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Gzip-Komprimierung
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml;

    # Caching statischer Dateien
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA-Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse-Proxy zur API
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

    # WebSocket-Proxy
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

**Frontend-Dateien bereitstellen:**

```bash
sudo mkdir -p /var/www/guardian/html
sudo cp -r dist/* /var/www/guardian/html/
sudo chown -R www-data:www-data /var/www/guardian
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Docker-Deployment

### 6.1 docker-compose.yml (Voller Stack)

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
      - CORS_ORIGINS=https://guardian.ihredomain.de
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

### 6.2 Benutzerdefinierte Images erstellen

```bash
# Frontend-Image erstellen
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .

# Backend-Image erstellen
docker build -t blacksentinel/guardian-api:latest ./backend
```

### 6.3 Umgebungsvariablen in Docker

Erstellen Sie eine `.env`-Datei im Projektstamm:

```bash
POSTGRES_PASSWORD=IHR_SICHERES_DB_PASSWORT
REDIS_PASSWORD=IHR_SICHERES_REDIS_PASSWORT
JWT_SECRET=IHR_64_ZEICHEN_ZUFALLSGEHEIMNIS
JWT_REFRESH_SECRET=IHR_AKTUALISIERUNGSGEHEIMNIS_64_ZEICHEN
```

### 6.4 Volume-Mounts fur Datenspeicherung

Die docker-compose.yml definiert zwei benannte Volumes:

- `postgres_data`: Speichert PostgreSQL-Daten unter `/var/lib/postgresql/data`
- `redis_data`: Speichert Redis-Daten unter `/data`

### 6.5 Gesundheitsprufungen

Uberprufen Sie die Servicegesundheit nach dem Deployment:

```bash
# Alle Services prufen
docker compose ps

# API-Gesundheit prufen
curl http://localhost:3001/api/health

# Erwartete Antwort:
# {"status":"ok","version":"1.0.0","uptime":123.456}

# Protokolle anzeigen
docker compose logs -f api
docker compose logs -f db
docker compose logs -f redis
```

---

## 7. Kubernetes-Deployment

### 7.1 Namespace-Einrichtung

```bash
kubectl create namespace blacksentinel
```

### 7.2 Secrets und ConfigMaps

```bash
# Secrets erstellen
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:IHR_PASSWORT@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='IHR_64_ZEICHEN_ZUFALLSGEHEIMNIS' \
  --from-literal=jwt-refresh-secret='IHR_AKTUALISIERUNGSGEHEIMNIS_64_ZEICHEN' \
  --from-literal=postgres-password='IHR_PASSWORT'
```

### 7.3 Deployment-Manifeste

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

### 7.4 Service- und Ingress-Konfiguration

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
        - guardian.ihredomain.de
      secretName: blacksentinel-tls
  rules:
    - host: guardian.ihredomain.de
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

### 7.5 Persistent Volumes fur PostgreSQL

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

### 7.6 Skalierungsuberlegungen

- Das API-Deployment ist standardmassig mit 3 Repliken konfiguriert. Passen Sie `spec.replicas` je nach Last an.
- Aktivieren Sie Horizontal Pod Autoscaler (HPA) fur automatische Skalierung:

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

## 8. Agent-Installation auf Endpunkten

### 8.1 Einen neuen Endpoint registrieren

1. Melden Sie sich an der BlackSentinel Guardian Web-Konsole an
2. Navigieren Sie zu **Endpoints > Inventar**
3. Klicken Sie auf **Endpoint hinzufugen**
4. Geben Sie einen Namen fur den Endpoint an
5. Kopieren Sie den generierten Registrierungsbefehl

### 8.2 Agent-Installationsbefehle

**Windows (PowerShell):**

```powershell
# Als Administrator ausfuhren
irm https://install.blacksentinel.io/agent.ps1 | iex
```

**Linux (bash):**

```bash
# Als root ausfuhren
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

**macOS (bash):**

```bash
# Als root ausfuhren
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 Agent-Konfiguration

Die Agent-Konfigurationsdatei befindet sich unter:

- **Windows:** `C:\ProgramData\BlackSentinel\agent.conf`
- **Linux:** `/etc/blacksentinel/agent.conf`
- **macOS:** `/Library/BlackSentinel/agent.conf`

**Konfigurationsoptionen:**

```ini
[server]
url = https://api.ihredomain.de
registration_token = IHR_REGISTRIERUNGSTOKEN

[agent]
heartbeat_interval = 30
log_level = info
```

### 8.4 Agent-Konnektivitat uberprufen

```bash
# Agent-Status prufen
blacksentinel-agent status

# Erwartete Ausgabe:
# Agent-Status: Laufend
# Verbunden: Ja
# Server: https://api.ihredomain.de
# Betriebszeit: 12345s
```

### 8.5 Fehlerbehebung bei Agent-Verbindungsproblemen

| Problem | Losung |
|---------|--------|
| Agent kann Server nicht erreichen | Uberprufen Sie, ob Port 8443 geoffnet ist und die Firewall ausgehende Verbindungen erlaubt |
| Registrierung schlagt fehl | Uberprufen Sie, ob das Registrierungstoken gultig ist und nicht abgelaufen ist |
| Agent zeigt "Degradiert" an | Uberprufen Sie die Agent-Protokolle: `journalctl -u blacksentinel-agent -f` |
| TLS-Zertifikatfehler | Stellen Sie sicher, dass dem Agent das Server-Zertifikat vertraut oder installieren Sie das CA-Zertifikat |

---

## 9. Sicherheitsverfestigung

### 9.1 Standardanmeldeinformationen andern

Unmittelbar nach der Installation:

1. Andern Sie das Standard-Passwort von SUPER_ADMIN
2. Andern Sie alle Standard-Datenbank-Passworte
3. Erneuern Sie die JWT-Geheimnisse
4. Aktualisieren Sie das Redis-Passwort

### 9.2 MFA fur alle Administrator-Konten aktivieren

Alle Administrator-Konten mussen MFA aktivieren:

1. Melden Sie sich als Administrator an
2. Navigieren Sie zu **Einstellungen > Sicherheit**
3. Aktivieren Sie MFA
4. Scannen Sie den QR-Code mit einer Authentifizierungs-App (Google Authenticator, Authy usw.)
5. Geben Sie den Verifizierungscode ein

### 9.3 Firewall-Regeln

**UFW (Ubuntu/Debian):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 80/tcp    # HTTP (fur Let's Encrypt)
sudo ufw deny 3001/tcp   # Direkten API-Zugang blockieren
sudo ufw deny 5432/tcp   # Direkten PostgreSQL-Zugang blockieren
sudo ufw deny 6379/tcp   # Direkten Redis-Zugang blockieren
sudo ufw enable
```

### 9.4 SSL/TLS-Konfiguration

- Verwenden Sie ausschliesslich TLS 1.2 oder hoher
- Deaktivieren Sie schwache Cipher-Suiten
- Aktivieren Sie HSTS-Header
- Verwenden Sie Zertifikat-Pinning fur die Agent-Kommunikation

### 9.5 Datenbank-Verschlusselung im Ruhezustand

Aktivieren Sie Transparent Data Encryption (TDE) von PostgreSQL, falls von Ihrer PostgreSQL-Distribution unterstutzt, oder verwenden Sie Festplattenverschlusselung (LUKS, BitLocker).

### 9.6 Audit-Log-Überprüfung

Uberprufen Sie regelmassig das Audit-Log auf verdachtige Aktivitat:

```sql
-- Letzte Administratoraktionen uberprufen
SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;

-- Fehlgeschlagene Anmeldeversuche uberprufen
SELECT * FROM "AuditLog" WHERE action LIKE '%login%' AND details->>'success' = 'false';
```

### 9.7 Regelmassige Sicherheitsaktualisierungen

```bash
# Systempakete aktualisieren
sudo apt-get update && sudo apt-get upgrade -y

# Node.js-Abhangigkeiten aktualisieren
cd backend && npm audit fix
cd .. && npm audit fix
```

---

## 10. Erstkonfiguration

### 10.1 Erster Login als SUPER_ADMIN

1. Offnen Sie `https://guardian.ihredomain.de` in einem Browser
2. Melden Sie sich mit den Standard-SUPER_ADMIN-Anmeldeinformationen an
3. Andern Sie das Standard-Passwort sofort
4. Konfigurieren Sie MFA

### 10.2 Abteilungen und Tags erstellen

1. Navigieren Sie zu **Einstellungen > Abteilungen**
2. Klicken Sie auf **Abteilung hinzufugen**
3. Geben Sie Name und Beschreibung der Abteilung ein
4. Navigieren Sie zu **Einstellungen > Tags**
5. Erstellen Sie Tags zur Kategorisierung von Endpunkten (z.B. "Kritisch", "Finanzen", "Ingenieurwesen")

### 10.3 Integrationen konfigurieren

Navigieren Sie zu **Einstellungen > Integrationen** und konfigurieren Sie:

| Integration | Erforderliche Konfiguration |
|-------------|---------------------------|
| E-Mail (SMTP) | SMTP-Host, Port, Benutzer, Passwort, Absenderadresse |
| Slack | Webhook-URL oder OAuth-Token |
| Microsoft Teams | Webhook-URL |
| SIEM | API-Endpunkt, Authentifizierungstoken |
| Active Directory | LDAP/AD-Serveradresse, Basis-DN, Bindungsanmeldeinformationen |

### 10.4 Benachrichtigungsregeln einrichten

Navigieren Sie zu **Einstellungen > Benachrichtigungen** und erstellen Sie Regeln:

1. Definieren Sie Auslosungsbedingungen (Schweregrad, Ereignistyp, Endpoint)
2. Definieren Sie Benachrichtigungskanale (E-Mail, Slack, Teams, Webhook)
3. Legen Sie Benachrichtigungshaufigkeit und Eskalationsregeln fest

### 10.5 Aufbewahrungsrichtlinien konfigurieren

Navigieren Sie zu **Einstellungen > Aufbewahrung** und konfigurieren Sie:

- Aufbewahrungszeitraum fur Warnungen (Standard: 90 Tage)
- Aufbewahrungszeitraum fur Bedrohungen (Standard: 365 Tage)
- Aufbewahrungszeitraum fur Audit-Protokolle (Standard: 365 Tage)
- Aufbewahrungszeitraum fur Zeitleistenereignisse (Standard: 30 Tage)

### 10.6 Rollenbasierte Zugriffskontrolle

Navigieren Sie zu **Einstellungen > Benutzer > Benutzer hinzufugen**, um Benutzer mit angemessenen Rollen zu erstellen.

**Verfugbare Rollen:** Siehe [Abschnitt 14: Rollenreferenztabelle](#14-rollenreferenztabelle).

---

## 11. Sicherung und Wiederherstellung

### 11.1 Datenbank-Sicherungsverfahren

**Manuelle Sicherung mit pg_dump:**

```bash
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### 11.2 Automatisierte Sicherungsskripte

Erstellen Sie `/etc/cron.d/blacksentinel-backup`:

```bash
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel/blacksentinel_$(date +\%Y\%m\%d).dump.gz
```

### 11.3 Wiederherstellung aus Sicherung

```bash
# Backend-Dienst stoppen
pm2 stop blacksentinel-api

# Datenbank wiederherstellen
gunzip -c backup_20260630_020000.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel --verbose

# Backend-Dienst neu starten
pm2 start blacksentinel-api
```

### 11.4 Disaster-Recovery-Verfahren

1. Identifizieren Sie den Ausfallpunkt
2. Beschaffen Sie bei Bedarf neue Infrastruktur
3. Stellen Sie die Datenbank aus der neuesten Sicherung wieder her
4. Deployen Sie Backend und Frontend
5. Uberprufen Sie die Agent-Konnektivitat
6. Testen Sie die kritische Funktionalitat

### 11.5 RPO- und RTO-uberlegungen

| Metrik | Ziel | Beschreibung |
|--------|------|--------------|
| RPO | 1 Stunde | Maximaler akzeptabler Datenverlust |
| RTO | 4 Stunden | Maximaler akzeptabler Ausfallzeitraum |

---

## 12. Uberwachung und Wartung

### 12.1 Gesundheitsprufungs-Endpunkte

```bash
# API-Gesundheitsprufung
curl http://localhost:3001/api/health

# Erwartete Antwort:
# {"status":"ok","version":"1.0.0","uptime":123.456}
```

### 12.2 Protokolluberwachung

```bash
# API-Protokolle mit PM2 anzeigen
pm2 logs blacksentinel-api

# Nginx-Protokolle anzeigen
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL-Protokolle anzeigen
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 12.3 Leistungsuberwachung

Uberwachen Sie die folgenden Metriken:

- API-Antwortzeit (Ziel: < 200ms p95)
- Datenbankverbindungspool-Auslastung
- Redis-Speichernutzung
- CPU- und Speicherauslastung
- Festplatten-E/A und Speicherkapazitat

### 12.4 Datenbankwartung

```bash
# VACUUM ANALYZE ausfuhren
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"

# Indizes neu aufbauen
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

### 12.5 Aktualisierungsverfahren

**Backend-Aktualisierung:**

```bash
cd backend
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart blacksentinel-api
```

**Frontend-Aktualisierung:**

```bash
cd blacksentinel-guardian
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/guardian/html/
sudo systemctl reload nginx
```

---

## 13. Fehlerbehebung

### 13.1 Haufige Probleme und Losungen

| Problem | Losung |
|---------|--------|
| API startet nicht | Uberprufen Sie die `.env`-Konfiguration und stellen Sie sicher, dass alle erforderlichen Variablen gesetzt sind |
| Datenbankverbindung abgelehnt | Uberprufen Sie, ob PostgreSQL lauft und die Verbindungszeichenfolge korrekt ist |
| Redis-Verbindung abgelehnt | Uberprufen Sie, ob Redis lauft: `redis-cli ping` |
| Build schlagt fehl | Fuahren Sie `npm ci` aus, um Abhangigkeiten sauber zu installieren |
| Frontend zeigt leere Seite an | Uberprufen Sie, ob `VITE_API_URL` korrekt in `.env.production` gesetzt ist |

### 13.2 Verbindungsabgelehnt-Fehler

```bash
# Uberprufen, ob PostgreSQL lauscht
sudo ss -tlnp | grep 5432

# Uberprufen, ob Redis lauscht
sudo ss -tlnp | grep 6379

# Uberprufen, ob die API lauscht
sudo ss -tlnp | grep 3001
```

### 13.3 Authentifizierungsfehler

- Uberprufen Sie, dass JWT_SECRET gesetzt und konsistent ist
- Uberprufen Sie, dass Tokens nicht abgelaufen sind
- Stellen Sie sicher, dass CORS_ORIGINS Ihre Frontend-Domain enthalt
- Uberprufen Sie, dass das Benutzerkonto aktiv und nicht gesperrt ist

### 13.4 Datenbankverbindungsprobleme

```bash
# Verbindung manuell testen
psql -h localhost -U blacksentinel_user -d blacksentinel

# PostgreSQL-Status prufen
sudo systemctl status postgresql

# Verbindungslimits prufen
sudo -u postgres psql -c "SHOW max_connections;"
```

### 13.5 Agent verbindet sich nicht

1. Uberprufen Sie die Netzwerkkonnektivitat vom Agent zum Server
2. Uberprufen Sie die Firewall-Regeln fur den ausgehenden Port 8443
3. Uberprufen Sie, ob das Registrierungstoken gultig ist
4. Uberprufen Sie die Agent-Protokolle auf Fehlernachrichten
5. Stellen Sie sicher, dass das Server-SSL-Zertifikat vom Agent vertraut wird

### 13.6 Build-Fehler

```bash
# node_modules loschen und neu installieren
rm -rf node_modules package-lock.json
npm ci

# TypeScript-Build-Cache loschen
rm -rf dist
npm run build
```

### 13.7 Debug-Protokollierung aktivieren

Setzen Sie die folgende Umgebungsvariable:

```
LOG_LEVEL=debug
```

Starten Sie den Dienst neu, um die Anderungen zu ubernehmen.

---

## 14. Rollenreferenztabelle

| Rolle | Beschreibung | Dashboard | Endpunkte | Bedrohungen | Bedrohungen bearbeiten | Datensatze loschen | Benutzer verwalten | Einstellungen verwalten | Integrationen verwalten | Audit-Protokoll | KI-Copilot |
|-------|-------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | Vollsystemzugriff | Ja | Ja | Ja | Ja | Ja | Ja | Ja | Ja | Ja | Ja |
| ADMIN | Systemverwaltung | Ja | Ja | Ja | Ja | Nein | Ja | Ja | Ja | Ja | Ja |
| SOC_TIER_5 | SOC-Leiter/Manager | Ja | Ja | Ja | Ja | Ja | Nein | Nein | Nein | Ja | Ja |
| SOC_TIER_4 | Senior SOC-Analyst | Ja | Ja | Ja | Ja | Nein | Nein | Nein | Nein | Ja | Ja |
| SOC_TIER_3 | Fortgeschrittener SOC-Analyst | Ja | Ja | Ja | Ja | Nein | Nein | Nein | Nein | Ja | Nein |
| SOC_TIER_2 | Mittlerer SOC-Analyst | Ja | Ja | Ja | Teilweise | Nein | Nein | Nein | Nein | Ja | Nein |
| SOC_TIER_1 | Junior SOC-Analyst | Ja | Ja | Ja | Nein | Nein | Nein | Nein | Nein | Nein | Nein |
| AUDITOR_3 | Senior Sicherheitsauditor | Ja | Ja | Ja | Nein | Nein | Nein | Nein | Nein | Ja | Nein |
| AUDITOR_2 | Sicherheitsauditor | Ja | Ja | Teilweise | Nein | Nein | Nein | Nein | Nein | Ja | Nein |
| AUDITOR_1 | Junior Auditor | Ja | Teilweise | Teilweise | Nein | Nein | Nein | Nein | Nein | Nein | Nein |
| IT | IT-Betrieb | Ja | Ja | Nein | Nein | Nein | Nein | Teilweise | Nein | Nein | Nein |
| ANALYST | Allgemeiner Analyst | Ja | Ja | Ja | Nein | Nein | Nein | Nein | Nein | Nein | Nein |
| VIEWER | Nur-Lese-Zugriff | Ja | Teilweise | Teilweise | Nein | Nein | Nein | Nein | Nein | Nein | Nein |

---

## 15. API-Referenz

### 15.1 Basis-URL

```
https://api.ihredomain.de/api
```

### 15.2 Authentifizierungs-Header-Format

```
Authorization: Bearer <JWT_TOKEN>
```

### 15.3 API-Endpunkte

| Methode | Pfad | Beschreibung | Erforderliche Rolle |
|---------|------|-------------|---------------------|
| POST | `/api/auth/login` | Benutzeranmeldung | Offentlich |
| POST | `/api/auth/register` | Benutzerregistrierung | Offentlich |
| POST | `/api/auth/refresh` | Zugriffstoken aktualisieren | Offentlich |
| POST | `/api/auth/logout` | Benutzerabmeldung | Authentifiziert |
| POST | `/api/auth/mfa/setup` | MFA aktivieren | Authentifiziert |
| POST | `/api/auth/mfa/verify` | MFA-Code verifizieren | Authentifiziert |
| GET | `/api/health` | Gesundheitsprufung | Offentlich |
| GET | `/api/users` | Alle Benutzer auflisten | ADMIN+ |
| POST | `/api/users` | Benutzer erstellen | ADMIN+ |
| GET | `/api/users/:id` | Benutzer nach ID abrufen | ADMIN+ |
| PUT | `/api/users/:id` | Benutzer aktualisieren | ADMIN+ |
| DELETE | `/api/users/:id` | Benutzer loschen | SUPER_ADMIN |
| GET | `/api/endpoints` | Alle Endpunkte auflisten | SOC_TIER_1+ |
| POST | `/api/endpoints` | Endpoint registrieren | IT+ |
| GET | `/api/endpoints/:id` | Endpoint-Details abrufen | SOC_TIER_1+ |
| PUT | `/api/endpoints/:id` | Endpoint aktualisieren | SOC_TIER_2+ |
| DELETE | `/api/endpoints/:id` | Endpoint loschen | ADMIN+ |
| GET | `/api/threats` | Alle Bedrohungen auflisten | SOC_TIER_1+ |
| POST | `/api/threats` | Bedrohungseintrag erstellen | SOC_TIER_2+ |
| GET | `/api/threats/:id` | Bedrohungsdetails abrufen | SOC_TIER_1+ |
| PUT | `/api/threats/:id` | Bedrohung aktualisieren | SOC_TIER_2+ |
| DELETE | `/api/threats/:id` | Bedrohung loschen | SOC_TIER_4+ |
| GET | `/api/alerts` | Alle Warnungen auflisten | SOC_TIER_1+ |
| POST | `/api/alerts` | Warnung erstellen | SOC_TIER_1+ |
| GET | `/api/alerts/:id` | Warnungsdetails abrufen | SOC_TIER_1+ |
| PUT | `/api/alerts/:id` | Warnung aktualisieren | SOC_TIER_2+ |
| DELETE | `/api/alerts/:id` | Warnung loschen | SOC_TIER_3+ |
| GET | `/api/timeline` | Zeitleistenereignisse auflisten | SOC_TIER_1+ |
| GET | `/api/vulnerabilities` | Schwachstellen auflisten | SOC_TIER_1+ |
| POST | `/api/vulnerabilities` | Schwachstelle erstellen | SOC_TIER_3+ |
| GET | `/api/firewall/rules` | Firewall-Regeln auflisten | SOC_TIER_2+ |
| POST | `/api/firewall/rules` | Firewall-Regel erstellen | SOC_TIER_3+ |
| GET | `/api/usb` | USB-Gerate auflisten | SOC_TIER_1+ |
| POST | `/api/usb` | USB-Gerat registrieren | IT+ |
| POST | `/api/response` | Reaktionsaktion ausfuhren | SOC_TIER_3+ |
| GET | `/api/audit` | Audit-Protokolle auflisten | AUDITOR_1+ |
| GET | `/api/dashboard` | Dashboard-Metriken | SOC_TIER_1+ |
| POST | `/api/copilot` | KI-Anfrage senden | SOC_TIER_3+ |
| GET | `/api/settings` | Systemeinstellungen abrufen | ADMIN+ |
| PUT | `/api/settings` | Systemeinstellungen aktualisieren | SUPER_ADMIN |
| GET | `/api/integrations` | Integrationen auflisten | ADMIN+ |
| PUT | `/api/integrations/:id` | Integration aktualisieren | ADMIN+ |

### 15.4 Fehlerantwortformat

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Ungultiges oder abgelaufenes Token",
    "details": null
  }
}
```

**Fehlercodes:** `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `RATE_LIMITED`

### 15.5 Paginierungsformat

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

Abfrageparameter: `?page=1&limit=20&sort=createdAt&order=desc`

---

## 16. Umgebungsvariablen-Referenz

| Variable | Erforderlich | Standard | Beschreibung | Beispiel |
|----------|:------------:|----------|-------------|----------|
| PORT | Nein | `3001` | Backend-Server-Port | `3001` |
| NODE_ENV | Ja | `development` | Umgebungsmodus | `production` |
| DATABASE_URL | Ja | `file:./dev.db` | PostgreSQL-Verbindungszeichenfolge | `postgresql://user:pass@host:5432/db` |
| REDIS_URL | Ja | `redis://localhost:6379` | Redis-Verbindungszeichenfolge | `redis://redis:6379` |
| JWT_SECRET | Ja | Keine | JWT-Signaturgeheimnis (min. 32 Zeichen) | `a1b2c3d4e5f6...` |
| JWT_REFRESH_SECRET | Ja | Keine | Aktualisierungstoken-Signaturgeheimnis | `z9y8x7w6v5u4...` |
| JWT_EXPIRES_IN | Nein | `15m` | Zugriffstoken-Ablauf | `15m` |
| MFA_ISSUER | Nein | `BlackSentinel Guardian` | MFA-Aussteller | `BlackSentinel Guardian` |
| CORS_ORIGINS | Ja | `http://localhost:5173` | Erlaubte CORS-Origins | `https://guardian.example.de` |
| LOG_LEVEL | Nein | `info` | Protokollierungsstufe | `debug` |
| AGENT_SIGNING_KEY | Nein | Keine | Agent-Binaries-Signaturschlussel | `Ihr-Signaturschluessel` |
| TLS_CERT_PATH | Nein | Keine | TLS-Zertifikatspfad | `/etc/ssl/certs/guardian.pem` |
| TLS_KEY_PATH | Nein | Keine | TLS-Privatschluessel-Pfad | `/etc/ssl/private/guardian.key` |
| VITE_API_URL | Ja | `http://localhost:3001` | Backend-API-URL (Frontend) | `https://api.example.de` |
| VITE_WS_URL | Nein | `ws://localhost:3001/ws` | WebSocket-URL (Frontend) | `wss://api.example.de/ws` |
| POSTGRES_PASSWORD | Docker | `postgres` | PostgreSQL-Passwort (Docker) | `sicheres_passwort` |
| REDIS_PASSWORD | Docker | Keine | Redis-Passwort (Docker) | `sicheres_passwort` |

---

**Ende des Dokuments**

Fur weiteren Support kontaktieren Sie: support@blacksentinel.io
