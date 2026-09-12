# BlackSentinel Guardian - Manuel de Deploiement

**Version :** 1.0.0  
**Derniere mise a jour :** Juin 2026  
**Classification :** Usage interne / Partenaires uniquement  

---

## Table des Matieres

1. [Introduction](#1-introduction)
2. [Prerequis](#2-prerequis)
3. [Configuration de la Base de Donnees](#3-configuration-de-la-base-de-donnees)
4. [Deploiement du Backend](#4-deploiement-du-backend)
5. [Deploiement du Frontend](#5-deploiement-du-frontend)
6. [Deploiement avec Docker](#6-deploiement-avec-docker)
7. [Deploiement avec Kubernetes](#7-deploiement-avec-kubernetes)
8. [Installation de l'Agent sur les Endpoints](#8-installation-de-lagent-sur-les-endpoints)
9. [Durcissement de la Securite](#9-durcissement-de-la-securite)
10. [Configuration Initiale](#10-configuration-initiale)
11. [Sauvegarde et Recuperation](#11-sauvegarde-et-recuperation)
12. [Surveillance et Maintenance](#12-surveillance-et-maintenance)
13. [Depannage](#13-depannage)
14. [Tableau de Reference des Roles](#14-tableau-de-reference-des-roles)
15. [Reference de l'API](#15-reference-de-lapi)
16. [Reference des Variables d'Environnement](#16-reference-des-variables-denvironnement)

---

## 1. Introduction

### 1.1 Qu'est-ce que BlackSentinel Guardian

BlackSentinel Guardian est une plateforme de defense autonome des endpoints de nouvelle generation qui integre EPP (Endpoint Protection Platform), EDR (Endpoint Detection and Response), XDR (Extended Detection and Response), Threat Hunting, Analytique Comportementale, Zero Trust, Technologie de Leurrage, Protection contre les Ransomwares, Protection de la Memoire, Detection par IA, Conscience des Vulnulnerables et Remediation Automatique dans une seule plateforme de securite unifiee.

La plateforme fournit aux equipes d'operations de securite une visibilite en temps reel, un renseignement sur les menaces et des capacites de reponse automatisee sur tous les endpoints d'une organisation.

### 1.2 Vue d'Ensemble de l'Architecture du Systeme

BlackSentinel Guardian utilise une architecture moderne a trois niveaux :

```
[Navigateur / Interface Web] <--> [Frontend React] <--> [Backend API Express] <--> [PostgreSQL / Redis]
                                                              |
                                                       [Communication avec les Agents]
                                                              |
                                               [Agents d'Endpoints (Windows/Linux/macOS)]
```

**Detail des composants :**

| Composant | Technologie | Objectif |
|-----------|------------|----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 | Console de gestion basee sur le web |
| Backend | Express.js, TypeScript, Prisma ORM | API REST et serveur WebSocket |
| Base de donnees | PostgreSQL 16 | Stockage persistant des donnees |
| Cache | Redis 7 | Gestion des sessions, cache en temps reel |
| Agents | Binaires specifiques a la plateforme | Surveillance et protection des endpoints |
| WebSocket | Bibliotheque ws | Diffusion d'evenements en temps reel |

### 1.3 Exigences Materielles

**Exigences Minimales (Developpement/Laboratoire) :**

| Ressource | Exigence |
|-----------|----------|
| CPU | 2 coeurs, 2.0 GHz |
| RAM | 4 Go |
| Disque | 20 Go SSD |
| Reseau | 100 Mbps |

**Recommandees en Production (jusqu'a 500 endpoints) :**

| Ressource | Exigence |
|-----------|----------|
| CPU | 8 coeurs, 3.0 GHz |
| RAM | 16 Go |
| Disque | 100 Go NVMe SSD |
| Reseau | 1 Gbps |

**Exigences Entreprise en Production (500+ endpoints) :**

| Ressource | Exigence |
|-----------|----------|
| CPU | 16+ coeurs, 3.5 GHz |
| RAM | 32+ Go |
| Disque | 500+ Go NVMe SSD (RAID 10) |
| Reseau | 10 Gbps |

### 1.4 Systemes d'Exploitation Supports

**Pour le Deploiement du Serveur :**

- Ubuntu 22.04 LTS / 24.04 LTS
- Debian 12 (Bookworm)
- Rocky Linux 9
- Amazon Linux 2023
- RHEL 9
- CentOS Stream 9

**Pour l'Installation de l'Agent :**

- Windows 10/11 (x64)
- Windows Server 2019/2022
- macOS 12 Monterey ou ulterieur
- Ubuntu 20.04+ / Debian 11+
- CentOS/RHEL 8+
- Rocky Linux 8+
- Amazon Linux 2+

---

## 2. Prerequis

### 2.1 Logiciels Necessaires

Installez les logiciels suivants avant de continuer :

| Logiciel | Version | Objectif |
|----------|---------|----------|
| Node.js | 20.x LTS ou ulterieur | Environnement d'execution du backend |
| PostgreSQL | 15.x ou ulterieur (16 recommande) | Base de donnees |
| Redis | 7.x ou ulterieur | Cache et sessions |
| Docker | 24.x ou ulterieur (optionnel) | Deploiement conteneurise |
| Docker Compose | 2.x ou ulterieur (optionnel) | Orchestration multi-conteneurs |
| npm | 10.x ou ulterieur | Gestion des paquets |
| Git | 2.40+ | Gestion du code source |
| Nginx | 1.24+ (production) | Proxy inverse et service de fichiers statiques |

**Installer Node.js sur Ubuntu/Debian :**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Devrait afficher v20.x.x
npm --version   # Devrait afficher 10.x.x
```

**Installer PostgreSQL 16 sur Ubuntu/Debian :**

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt-get update
sudo apt-get install -y postgresql-16
```

**Installer Redis 7 sur Ubuntu/Debian :**

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.2 Exigences Reseau

Assurez-vous que les ports suivants sont accessibles :

| Port | Protocole | Service | Direction |
|------|-----------|---------|-----------|
| 3001 | TCP | API Backend | Entree |
| 5173 | TCP | Serveur de Developpement Vite | Entree (developpement uniquement) |
| 443 | TCP | HTTPS (production) | Entree |
| 80 | TCP | HTTP (redirection vers HTTPS) | Entree |
| 5432 | TCP | PostgreSQL | Interne uniquement |
| 6379 | TCP | Redis | Interne uniquement |
| 8443 | TCP | Enregistrement des Agents | Entree |

### 2.3 Exigences de Certificats SSL/TLS

Les deploiements en production necessitent des certificats SSL/TLS. Les options incluent :

- **Let's Encrypt :** Certificats gratuits et automatises via certbot
- **CA Commercial :** DigiCert, Comodo, GlobalSign, etc.
- **CA Interne :** Pour les environnements degrades ou d'entreprise

**Obtenir des certificats Let's Encrypt :**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.votredomaine.com -d api.votredomaine.com
```

### 2.4 Configuration DNS

Configurez les enregistrements DNS suivants :

| Enregistrement | Type | Valeur | TTL |
|----------------|------|--------|-----|
| guardian.votredomaine.com | A | IP du serveur | 300 |
| api.votredomaine.com | A | IP du serveur | 300 |

---

## 3. Configuration de la Base de Donnees

### 3.1 Installation de PostgreSQL

Verifiez que PostgreSQL est en cours d'execution :

```bash
sudo systemctl status postgresql
sudo systemctl enable postgresql
```

### 3.2 Creer la Base de Donnees et l'Utilisateur

```bash
# Passer a l'utilisateur postgres
sudo -u postgres psql

# Creer la base de donnees
CREATE DATABASE blacksentinel;

# Creer un utilisateur dedie avec un mot de passe fort
CREATE USER blacksentinel_user WITH PASSWORD 'VOTRE_MOT_DE_PASSE_ICI';

# Accorder les privileges
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;

-- Pour PostgreSQL 15+, accorder egalement l'acces au schema
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blacksentinel_user;

-- Quitter
\q
```

### 3.3 Executer les Migrations Prisma

```bash
cd backend

# Installer les dependances
npm install

# Definir DATABASE_URL dans votre fichier .env
echo 'DATABASE_URL=postgresql://blacksentinel_user:VOTRE_MOT_DE_PASSE_ICI@localhost:5432/blacksentinel' > .env

# Generer le client Prisma
npx prisma generate

# Executer les migrations
npx prisma migrate deploy
```

### 3.4 Peuplement de la Base de Donnees (Seed)

Le script de seed cree l'utilisateur SUPER_ADMIN initial necessaire pour la premiere connexion.

```bash
# Definir les variables d'environnement necessaires dans .env
cat >> .env << 'EOF'
JWT_SECRET=votre_cle_secrete_aleatoire_d_au_moins_32_caracteres
JWT_REFRESH_SECRET=votre_cle_secrete_de_rafraichissement_d_au_moins_32_caracteres
REDIS_URL=redis://localhost:6379
EOF

# Executer le script de seed
npm run seed
```

**Identifiants par defaut de SUPER_ADMIN (a modifier immediatement apres la premiere connexion) :**

- Email : `admin@blacksentinel.io`
- Mot de passe : `admin123`

### 3.5 Format de la Chaine de Connexion

```
postgresql://UTILISATEUR:MOT_DE_PASSE@HOTE:PORT/BDD?schema=public
```

**Exemples :**

```
# Developpement local
postgresql://postgres:password@localhost:5432/blacksentinel

# Serveur distant
postgresql://blacksentinel_user:mot_de_passe_securise@db.exemple.com:5432/blacksentinel

# Avec SSL (requis pour la plupart des fournisseurs cloud)
postgresql://blacksentinel_user:mot_de_passe_securise@db.exemple.com:5432/blacksentinel?sslmode=require
```

---

## 4. Deploiement du Backend

### 4.1 Installation des Dependances

```bash
cd backend
npm ci
```

### 4.2 Configuration des Variables d'Environnement

Creez le fichier `.env` dans le repertoire `backend/` :

```bash
cat > .env << 'ENVEOF'
# ─── Serveur ─────────────────────────────────────
PORT=3001
NODE_ENV=production

# ─── Authentification ─────────────────────────────
JWT_SECRET=REMPLACER_PAR_64_CARACTERES_ALEATOIRES
JWT_REFRESH_SECRET=REMPLACER_PAR_64_CARACTERES_ALEATOIRES
JWT_EXPIRES_IN=15m
MFA_ISSUER=BlackSentinel Guardian

# ─── Base de donnees ──────────────────────────────
DATABASE_URL=postgresql://blacksentinel_user:VOTRE_MOT_DE_PASSE@localhost:5432/blacksentinel

# ─── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── CORS ───────────────────────────────────────────
CORS_ORIGINS=https://guardian.votredomaine.com

# ─── Journalisation ─────────────────────────────────
LOG_LEVEL=info

# ─── Securite ───────────────────────────────────────
AGENT_SIGNING_KEY=REMPLACER_PAR_CLE_SECURISEE
TLS_CERT_PATH=/etc/ssl/certs/guardian.pem
TLS_KEY_PATH=/etc/ssl/private/guardian.key
ENVEOF
```

### 4.3 Compiler le Projet TypeScript

```bash
cd backend
npm run build
```

### 4.4 Demarrer le Serveur

```bash
# Mode developpement (avec rechargement automatique)
npm run dev

# Mode production
npm run start
```

### 4.5 Gestion des Processus avec PM2

Installez PM2 globalement et configurez pour la production :

```bash
# Installer PM2
npm install -g pm2

# Demarrer l'API avec PM2
cd backend
pm2 start dist/server.js --name blacksentinel-api

# Enregistrer la liste des processus et configurer le demarrage
pm2 save
pm2 startup

# Commandes utiles de PM2
pm2 status
pm2 logs blacksentinel-api
pm2 restart blacksentinel-api
pm2 stop blacksentinel-api
pm2 delete blacksentinel-api
```

### 4.6 Configuration des Journaux

**Configurer la rotation des journaux avec PM2 :**

```bash
npm install -g pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

**Configurer les journaux de l'application via les variables d'environnement :**

```
LOG_LEVEL=info          # Options : debug, info, warn, error
```

---

## 5. Deploiement du Frontend

### 5.1 Installation des Dependances

```bash
cd blacksentinel-guardian
npm ci
```

### 5.2 Variables d'Environnement

Creez `.env.production` a la racine du frontend :

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.votredomaine.com
VITE_WS_URL=wss://api.votredomaine.com/ws
EOF
```

### 5.3 Compilation pour la Production

```bash
npm run build
```

Ceci genere des fichiers statiques optimises dans le repertoire `dist/`.

### 5.4 Servir avec Nginx

**Installer Nginx :**

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

**Configuration Nginx :**

```nginx
server {
    listen 80;
    server_name guardian.votredomaine.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name guardian.votredomaine.com;

    ssl_certificate /etc/letsencrypt/live/guardian.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/guardian.votredomaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /var/www/guardian/html;
    index index.html;

    # En-tetes de securite
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss://api.votredomaine.com https://api.votredomaine.com" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Compression gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml;

    # Cache des fichiers statiques
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Routage SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverse vers l'API
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

    # Proxy WebSocket
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

**Deployer les fichiers du frontend :**

```bash
sudo mkdir -p /var/www/guardian/html
sudo cp -r dist/* /var/www/guardian/html/
sudo chown -R www-data:www-data /var/www/guardian
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Deploiement avec Docker

### 6.1 docker-compose.yml (Pile Complete)

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
      - CORS_ORIGINS=https://guardian.votredomaine.com
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

### 6.2 Construction d'Images Personnalisees

```bash
# Construire l'image du frontend
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .

# Construire l'image du backend
docker build -t blacksentinel/guardian-api:latest ./backend
```

### 6.3 Variables d'Environnement dans Docker

Creez un fichier `.env` a la racine du projet :

```bash
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE_DB_SECURISE
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS_SECURISE
JWT_SECRET=VOTRE_SECRET_ALEATOIRE_64_CARACTERES
JWT_REFRESH_SECRET=VOTRE_SECRET_RAFRAICHISSEMENT_64_CARACTERES
```

### 6.4 Montages de Volumes pour la Persistance des Donnees

Le docker-compose.yml definit deux volumes nommes :

- `postgres_data` : Persiste les donnees PostgreSQL dans `/var/lib/postgresql/data`
- `redis_data` : Persiste les donnees Redis dans `/data`

### 6.5 Verifications de Sante

Verifiez la sante des services apres le deploiement :

```bash
# Verifier tous les services
docker compose ps

# Verifier la sante de l'API
curl http://localhost:3001/api/health

# Reponse attendue :
# {"status":"ok","version":"1.0.0","uptime":123.456}

# Voir les journaux
docker compose logs -f api
docker compose logs -f db
docker compose logs -f redis
```

---

## 7. Deploiement avec Kubernetes

### 7.1 Configuration de l'Espace de Noms

```bash
kubectl create namespace blacksentinel
```

### 7.2 Secrets et ConfigMaps

```bash
# Creer les secrets
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:VOTRE_MOT_DE_PASSE@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='VOTRE_SECRET_ALEATOIRE_64_CARACTERES' \
  --from-literal=jwt-refresh-secret='VOTRE_SECRET_RAFRAICHISSEMENT_64_CARACTERES' \
  --from-literal=postgres-password='VOTRE_MOT_DE_PASSE'
```

### 7.3 Manifestes de Deploiement

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

### 7.4 Configuration du Service et de l'Ingress

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
        - guardian.votredomaine.com
      secretName: blacksentinel-tls
  rules:
    - host: guardian.votredomaine.com
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

### 7.5 Volumes Persistants pour PostgreSQL

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

### 7.6 Considerations de Mise a l'Echelle

- Le deploiement de l'API est configure avec 3 replicas par defaut. Ajustez `spec.replicas` en fonction de la charge.
- Activez le Horizontal Pod Autoscaler (HPA) pour une mise a l'echelle automatique :

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

## 8. Installation de l'Agent sur les Endpoints

### 8.1 Enregistrer un Nouvel Endpoint

1. Connectez-vous a la console web de BlackSentinel Guardian
2. Naviguez vers **Endpoints > Inventaire**
3. Cliquez sur **Ajouter un Endpoint**
4. Fournissez un nom pour l'endpoint
5. Copiez la commande d'enregistrement generee

### 8.2 Commandes d'Installation de l'Agent

**Windows (PowerShell) :**

```powershell
# Executer en tant qu'Administrateur
irm https://install.blacksentinel.io/agent.ps1 | iex
```

**Linux (bash) :**

```bash
# Executer en tant que root
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

**macOS (bash) :**

```bash
# Executer en tant que root
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 Configuration de l'Agent

Le fichier de configuration de l'agent se trouve a :

- **Windows :** `C:\ProgramData\BlackSentinel\agent.conf`
- **Linux :** `/etc/blacksentinel/agent.conf`
- **macOS :** `/Library/BlackSentinel/agent.conf`

**Options de configuration :**

```ini
[server]
url = https://api.votredomaine.com
registration_token = VOTRE_TOKEN_D_ENREGISTREMENT

[agent]
heartbeat_interval = 30
log_level = info
```

### 8.4 Verification de la Connectivite de l'Agent

```bash
# Verifier le statut de l'agent
blacksentinel-agent status

# Sortie attendue :
# Statut de l'Agent : En cours d'execution
# Connecte : Oui
# Serveur : https://api.votredomaine.com
# Temps de fonctionnement : 12345s
```

### 8.5 Depannage des Problemes de Connexion de l'Agent

| Probleme | Solution |
|----------|----------|
| L'agent ne peut pas atteindre le serveur | Verifiez que le port 8443 est ouvert et que le pare-feu autorise les connexions sortantes |
| L'enregistrement echoue | Verifiez que le token d'enregistrement est valide et non expire |
| L'agent affiche "Dégrade" | Consultez les journaux de l'agent : `journalctl -u blacksentinel-agent -f` |
| Erreurs de certificat TLS | Assurez-vous que l'agent fait confiance au certificat du serveur ou installez le certificat CA |

---

## 9. Durcissement de la Securite

### 9.1 Modifier les Identifiants par Defaut

Immediatement apres l'installation :

1. Modifiez le mot de passe par defaut de SUPER_ADMIN
2. Modifiez tous les mots de passe de base de donnees par defaut
3. Renouvelez les secrets JWT
4. Mettez a jour le mot de passe Redis

### 9.2 Activer MFA pour Tous les Comptes Administrateur

Tous les comptes administrateur doivent activer MFA :

1. Connectez-vous en tant qu'administrateur
2. Naviguez vers **Parametres > Securite**
3. Activez MFA
4. Scannez le code QR avec une application d'authentification (Google Authenticator, Authy, etc.)
5. Entrez le code de verification

### 9.3 Regles de Pare-Feu

**UFW (Ubuntu/Debian) :**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 80/tcp    # HTTP (pour Let's Encrypt)
sudo ufw deny 3001/tcp   # Bloquer l'acces direct a l'API
sudo ufw deny 5432/tcp   # Bloquer l'acces direct a PostgreSQL
sudo ufw deny 6379/tcp   # Bloquer l'acces direct a Redis
sudo ufw enable
```

### 9.4 Configuration SSL/TLS

- Utilisez TLS 1.2 ou superieur uniquement
- Desactivez les suites de chiffrement faibles
- Activez les en-tetes HSTS
- Utilisez l'epingle de certificat pour la communication avec les agents

### 9.5 Chiffrement de la Base de Donnees au Repos

Activez le chiffrement transparent des donnees (TDE) de PostgreSQL si pris en charge par votre distribution PostgreSQL, ou utilisez le chiffrement au niveau du disque (LUKS, BitLocker).

### 9.6 Revue du Journal d'Audit

Revuez regulierement le journal d'audit pour detecter les activites suspectes :

```sql
-- Revue des actions recentes de l'administrateur
SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;

-- Revue des tentatives de connexion echouees
SELECT * FROM "AuditLog" WHERE action LIKE '%login%' AND details->>'success' = 'false';
```

### 9.7 Mises a Jour de Securite Regulieres

```bash
# Mettre a jour les paquets du systeme
sudo apt-get update && sudo apt-get upgrade -y

# Mettre a jour les dependances Node.js
cd backend && npm audit fix
cd .. && npm audit fix
```

---

## 10. Configuration Initiale

### 10.1 Premiere Connexion en tant que SUPER_ADMIN

1. Ouvrez `https://guardian.votredomaine.com` dans un navigateur
2. Connectez-vous avec les identifiants par defaut de SUPER_ADMIN
3. Modifiez le mot de passe par defaut immediatement
4. Configurez MFA

### 10.2 Creer des Departements et des Etiquettes

1. Naviguez vers **Parametres > Departements**
2. Cliquez sur **Ajouter un Departement**
3. Entrez le nom et la description du departement
4. Naviguez vers **Parametres > Etiquettes**
5. Creez des etiquettes pour categoriser les endpoints (ex : "Critique", "Finance", "Ingenierie")

### 10.3 Configurer les Integrations

Naviguez vers **Parametres > Integrations** et configurez :

| Integration | Configuration Requise |
|-------------|----------------------|
| Email (SMTP) | Host SMTP, port, utilisateur, mot de passe, adresse de l'expediteur |
| Slack | URL du webhook ou token OAuth |
| Microsoft Teams | URL du webhook |
| SIEM | Endpoint de l'API, token d'authentification |
| Active Directory | Adresse du serveur LDAP/AD, DN de base, identifiants de liaison |

### 10.4 Configurer les Regles de Notification

Naviguez vers **Parametres > Notifications** et creez des regles :

1. Definissez les conditions de declenchement (severite, type d'evenement, endpoint)
2. Definissez les canaux de notification (email, Slack, Teams, webhook)
3. Definissez la frequence de notification et les regles d'escalade

### 10.5 Configurer les Politiques de Retention

Naviguez vers **Parametres > Retention** et configurez :

- Periode de retention des alertes (defaut : 90 jours)
- Periode de retention des menaces (defaut : 365 jours)
- Periode de retention des journaux d'audit (defaut : 365 jours)
- Periode de retention des evenements de la chronologie (defaut : 30 jours)

### 10.6 Controle d'Acces Base sur les Roles

Naviguez vers **Parametres > Utilisateurs > Ajouter un Utilisateur** pour creer des utilisateurs avec des roles appropries.

**Roles disponibles :** Consultez la [Section 14 : Tableau de Reference des Roles](#14-tableau-de-reference-des-roles).

---

## 11. Sauvegarde et Recuperation

### 11.1 Procedures de Sauvegarde de la Base de Donnees

**Sauvegarde manuelle avec pg_dump :**

```bash
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### 11.2 Scripts de Sauvegarde Automatisee

Creez `/etc/cron.d/blacksentinel-backup` :

```bash
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel/blacksentinel_$(date +\%Y\%m\%d).dump.gz
```

### 11.3 Restauration depuis une Sauvegarde

```bash
# Arreter le service backend
pm2 stop blacksentinel-api

# Restaurer la base de donnees
gunzip -c backup_20260630_020000.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel --verbose

# Redemarrer le service backend
pm2 start blacksentinel-api
```

### 11.4 Procedures de Recuperation apres Desastre

1. Identifiez le point de panne
2. Provisionnez une nouvelle infrastructure si necessaire
3. Restaurez la base de donnees a partir de la sauvegarde la plus recente
4. Deployez le backend et le frontend
5. Verifiez la connectivite des agents
6. Testez les fonctionnalites critiques

### 11.5 Considerations RPO et RTO

| Metrique | Objectif | Description |
|----------|----------|-------------|
| RPO | 1 heure | Perte de donnees maximale acceptable |
| RTO | 4 heures | D'arret maximal acceptable |

---

## 12. Surveillance et Maintenance

### 12.1 Points de Verification de Sante

```bash
# Verification de sante de l'API
curl http://localhost:3001/api/health

# Reponse attendue :
# {"status":"ok","version":"1.0.0","uptime":123.456}
```

### 12.2 Surveillance des Journaux

```bash
# Voir les journaux de l'API avec PM2
pm2 logs blacksentinel-api

# Voir les journaux Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Voir les journaux PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 12.3 Surveillance des Performances

Surveillez les metriques suivantes :

- Temps de reponse de l'API (objectif : < 200ms p95)
- Utilisation du pool de connexions de la base de donnees
- Utilisation de la memoire Redis
- Utilisation du CPU et de la memoire
- Entrees/sorties disque et capacite de stockage

### 12.4 Maintenance de la Base de Donnees

```bash
# Executer VACUUM ANALYZE
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"

# Reconstruire les index
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

### 12.5 Procedures de Mise a Jour

**Mise a jour du backend :**

```bash
cd backend
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart blacksentinel-api
```

**Mise a jour du frontend :**

```bash
cd blacksentinel-guardian
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/guardian/html/
sudo systemctl reload nginx
```

---

## 13. Depannage

### 13.1 Problemes Courants et Solutions

| Probleme | Solution |
|----------|----------|
| L'API ne demarre pas | Verifiez la configuration `.env` et assurez-vous que toutes les variables requises sont definies |
| Connexion refusee a la base de donnees | Verifiez que PostgreSQL est en cours d'execution et que la chaine de connexion est correcte |
| Connexion refusee a Redis | Verifiez que Redis est en cours d'execution : `redis-cli ping` |
| La compilation echoue | Executez `npm ci` pour installer les dependances proprement |
| Le frontend affiche une page vide | Verifiez que `VITE_API_URL` est correctement defini dans `.env.production` |

### 13.2 Erreurs de Connexion Refusee

```bash
# Verifier que PostgreSQL ecoute
sudo ss -tlnp | grep 5432

# Verifier que Redis ecoute
sudo ss -tlnp | grep 6379

# Verifier que l'API ecoute
sudo ss -tlnp | grep 3001
```

### 13.3 Echecs d'Authentification

- Verifiez que JWT_SECRET est defini et coherent
- Verifiez que les tokens ne sont pas expires
- Assurez-vous que CORS_ORIGINS inclut votre domaine frontend
- Verifiez que le compte utilisateur est actif et non bloque

### 13.4 Problemes de Connexion a la Base de Donnees

```bash
# Tester la connexion manuellement
psql -h localhost -U blacksentinel_user -d blacksentinel

# Verifier le statut de PostgreSQL
sudo systemctl status postgresql

# Verifier les limites de connexion
sudo -u postgres psql -c "SHOW max_connections;"
```

### 13.5 L'Agent ne se Connecte Pas

1. Verifiez la connectivite reseau de l'agent au serveur
2. Verifiez les regles du pare-feu pour autoriser le port sortant 8443
3. Verifiez que le token d'enregistrement est valide
4. Consultez les journaux de l'agent pour les messages d'erreur
5. Assurez-vous que le certificat SSL du serveur est approuve par l'agent

### 13.6 Echecs de Compilation

```bash
# Nettoyer node_modules et reinstall
rm -rf node_modules package-lock.json
npm ci

# Nettoyer le cache de compilation TypeScript
rm -rf dist
npm run build
```

### 13.7 Activer la Journalisation de Debogage

Definissez la variable d'environnement suivante :

```
LOG_LEVEL=debug
```

Redemarrez le service pour appliquer les modifications.

---

## 14. Tableau de Reference des Roles

| Role | Description | Voir Tableau | Voir Endpoints | Voir Menaces | Modifier Menaces | Supprimer Enregistrements | Gerer Utilisateurs | Gerer Parametres | Gerer Integrations | Voir Journal Audit | Utiliser Copilote IA |
|------|-------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | Acces total au systeme | Oui | Oui | Oui | Oui | Oui | Oui | Oui | Oui | Oui | Oui |
| ADMIN | Administration du systeme | Oui | Oui | Oui | Oui | Non | Oui | Oui | Oui | Oui | Oui |
| SOC_TIER_5 | Responsable/Manager SOC | Oui | Oui | Oui | Oui | Oui | Non | Non | Non | Oui | Oui |
| SOC_TIER_4 | Analyste SOC Senior | Oui | Oui | Oui | Oui | Non | Non | Non | Non | Oui | Oui |
| SOC_TIER_3 | Analyste SOC Avance | Oui | Oui | Oui | Oui | Non | Non | Non | Non | Oui | Non |
| SOC_TIER_2 | Analyste SOC Intermediaire | Oui | Oui | Oui | Partiel | Non | Non | Non | Non | Oui | Non |
| SOC_TIER_1 | Analyste SOC Junior | Oui | Oui | Oui | Non | Non | Non | Non | Non | Non | Non |
| AUDITOR_3 | Auditeur Securite Senior | Oui | Oui | Oui | Non | Non | Non | Non | Non | Oui | Non |
| AUDITOR_2 | Auditeur Securite | Oui | Oui | Partiel | Non | Non | Non | Non | Non | Oui | Non |
| AUDITOR_1 | Auditeur Junior | Oui | Partiel | Partiel | Non | Non | Non | Non | Non | Non | Non |
| IT | Operations Informatiques | Oui | Oui | Non | Non | Non | Non | Partiel | Non | Non | Non |
| ANALYST | Analyste General | Oui | Oui | Oui | Non | Non | Non | Non | Non | Non | Non |
| VIEWER | Acces en lecture seule | Oui | Partiel | Partiel | Non | Non | Non | Non | Non | Non | Non |

---

## 15. Reference de l'API

### 15.1 URL de Base

```
https://api.votredomaine.com/api
```

### 15.2 Format de l'En-tete d'Authentification

```
Authorization: Bearer <JWT_TOKEN>
```

### 15.3 Points d'Entree de l'API

| Methode | Chemin | Description | Role Requis |
|---------|--------|-------------|-------------|
| POST | `/api/auth/login` | Connexion utilisateur | Public |
| POST | `/api/auth/register` | Inscription utilisateur | Public |
| POST | `/api/auth/refresh` | Rafraichir le token d'acces | Public |
| POST | `/api/auth/logout` | Deconnexion utilisateur | Authentifie |
| POST | `/api/auth/mfa/setup` | Activer MFA | Authentifie |
| POST | `/api/auth/mfa/verify` | Verifier le code MFA | Authentifie |
| GET | `/api/health` | Verification de sante | Public |
| GET | `/api/users` | Lister tous les utilisateurs | ADMIN+ |
| POST | `/api/users` | Creer un utilisateur | ADMIN+ |
| GET | `/api/users/:id` | Obtenir un utilisateur par ID | ADMIN+ |
| PUT | `/api/users/:id` | Modifier un utilisateur | ADMIN+ |
| DELETE | `/api/users/:id` | Supprimer un utilisateur | SUPER_ADMIN |
| GET | `/api/endpoints` | Lister tous les endpoints | SOC_TIER_1+ |
| POST | `/api/endpoints` | Enregistrer un endpoint | IT+ |
| GET | `/api/endpoints/:id` | Obtenir les details d'un endpoint | SOC_TIER_1+ |
| PUT | `/api/endpoints/:id` | Modifier un endpoint | SOC_TIER_2+ |
| DELETE | `/api/endpoints/:id` | Supprimer un endpoint | ADMIN+ |
| GET | `/api/threats` | Lister toutes les menaces | SOC_TIER_1+ |
| POST | `/api/threats` | Creer une entree de menace | SOC_TIER_2+ |
| GET | `/api/threats/:id` | Obtenir les details d'une menace | SOC_TIER_1+ |
| PUT | `/api/threats/:id` | Modifier une menace | SOC_TIER_2+ |
| DELETE | `/api/threats/:id` | Supprimer une menace | SOC_TIER_4+ |
| GET | `/api/alerts` | Lister toutes les alertes | SOC_TIER_1+ |
| POST | `/api/alerts` | Creer une alerte | SOC_TIER_1+ |
| GET | `/api/alerts/:id` | Obtenir les details d'une alerte | SOC_TIER_1+ |
| PUT | `/api/alerts/:id` | Modifier une alerte | SOC_TIER_2+ |
| DELETE | `/api/alerts/:id` | Supprimer une alerte | SOC_TIER_3+ |
| GET | `/api/timeline` | Lister les evenements de la chronologie | SOC_TIER_1+ |
| GET | `/api/vulnerabilities` | Lister les vulnerabilites | SOC_TIER_1+ |
| POST | `/api/vulnerabilities` | Creer une vulnerabilite | SOC_TIER_3+ |
| GET | `/api/firewall/rules` | Lister les regles de pare-feu | SOC_TIER_2+ |
| POST | `/api/firewall/rules` | Creer une regle de pare-feu | SOC_TIER_3+ |
| GET | `/api/usb` | Lister les peripheriques USB | SOC_TIER_1+ |
| POST | `/api/usb` | Enregistrer un peripherique USB | IT+ |
| POST | `/api/response` | Executer une action de reponse | SOC_TIER_3+ |
| GET | `/api/audit` | Lister les journaux d'audit | AUDITOR_1+ |
| GET | `/api/dashboard` | Metriques du tableau de bord | SOC_TIER_1+ |
| POST | `/api/copilot` | Envoyer une requete IA | SOC_TIER_3+ |
| GET | `/api/settings` | Obtenir les parametres | ADMIN+ |
| PUT | `/api/settings` | Modifier les parametres | SUPER_ADMIN |
| GET | `/api/integrations` | Lister les integrations | ADMIN+ |
| PUT | `/api/integrations/:id` | Modifier une integration | ADMIN+ |

### 15.4 Format de Reponse d'Erreur

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token invalide ou expire",
    "details": null
  }
}
```

**Codes d'erreur :** `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `RATE_LIMITED`

### 15.5 Format de Pagination

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

Parametres de requete : `?page=1&limit=20&sort=createdAt&order=desc`

---

## 16. Reference des Variables d'Environnement

| Variable | Requise | Defaut | Description | Exemple |
|----------|:-------:|--------|-------------|---------|
| PORT | Non | `3001` | Port du serveur backend | `3001` |
| NODE_ENV | Oui | `development` | Mode d'environnement | `production` |
| DATABASE_URL | Oui | `file:./dev.db` | Chaine de connexion PostgreSQL | `postgresql://user:pass@host:5432/db` |
| REDIS_URL | Oui | `redis://localhost:6379` | Chaine de connexion Redis | `redis://redis:6379` |
| JWT_SECRET | Oui | Aucun | Secret de signature JWT (min 32 caracteres) | `a1b2c3d4e5f6...` |
| JWT_REFRESH_SECRET | Oui | Aucun | Secret de signature du token de rafraichissement | `z9y8x7w6v5u4...` |
| JWT_EXPIRES_IN | Non | `15m` | Expiration du token d'acces | `15m` |
| MFA_ISSUER | Non | `BlackSentinel Guardian` | Emetteur MFA | `BlackSentinel Guardian` |
| CORS_ORIGINS | Oui | `http://localhost:5173` | Origines CORS autorisees | `https://guardian.exemple.com` |
| LOG_LEVEL | Non | `info` | Niveau de journalisation | `debug` |
| AGENT_SIGNING_KEY | Non | Aucun | Cle de signature du binaire agent | `votre-cle-de-signature` |
| TLS_CERT_PATH | Non | Aucun | Chemin du certificat TLS | `/etc/ssl/certs/guardian.pem` |
| TLS_KEY_PATH | Non | Aucun | Chemin de la cle privee TLS | `/etc/ssl/private/guardian.key` |
| VITE_API_URL | Oui | `http://localhost:3001` | URL de l'API backend (frontend) | `https://api.exemple.com` |
| VITE_WS_URL | Non | `ws://localhost:3001/ws` | URL WebSocket (frontend) | `wss://api.exemple.com/ws` |
| POSTGRES_PASSWORD | Docker | `postgres` | Mot de passe PostgreSQL (Docker) | `mot_de_passe_securise` |
| REDIS_PASSWORD | Docker | Aucun | Mot de passe Redis (Docker) | `mot_de_passe_securise` |

---

**Fin du Document**

Pour un support supplementaire, contactez : support@blacksentinel.io
