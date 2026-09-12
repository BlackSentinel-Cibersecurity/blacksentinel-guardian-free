# BlackSentinel Guardian - Manual de Despliegue

**Version:** 1.0.0  
**Ultima actualizacion:** Junio 2026  
**Clasificacion:** Uso interno / Para socios  

---

## Tabla de Contenidos

1. [Introduccion](#1-introduccion)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Configuracion de la Base de Datos](#3-configuracion-de-la-base-de-datos)
4. [Despliegue del Backend](#4-despliegue-del-backend)
5. [Despliegue del Frontend](#5-despliegue-del-frontend)
6. [Despliegue con Docker](#6-despliegue-con-docker)
7. [Despliegue con Kubernetes](#7-despliegue-con-kubernetes)
8. [Instalacion del Agente en Puntos de Extremidad](#8-instalacion-del-agente-en-puntos-de-extremidad)
9. [Endurecimiento de Seguridad](#9-endurecimiento-de-seguridad)
10. [Configuracion Inicial](#10-configuracion-inicial)
11. [Copia de Seguridad y Recuperacion](#11-copia-de-seguridad-y-recuperacion)
12. [Monitoreo y Mantenimiento](#12-monitoreo-y-mantenimiento)
13. [Solucion de Problemas](#13-solucion-de-problemas)
14. [Tabla de Referencia de Roles](#14-tabla-de-referencia-de-roles)
15. [Referencia de la API](#15-referencia-de-la-api)
16. [Referencia de Variables de Entorno](#16-referencia-de-variables-de-entorno)

---

## 1. Introduccion

### 1.1 Que es BlackSentinel Guardian

BlackSentinel Guardian es una plataforma de defensa autonoma de puntos de extremidad de ultima generacion que integra EPP (Plataforma de Proteccion de Puntos de Extremidad), EDR (Deteccion y Respuesta en Puntos de Extremidad), XDR (Deteccion y Respuesta Extendida), Caza de Amenazas, Analitica de Comportamiento, aplicacion de Confianza Cero, Tecnologia de Engano, Proteccion contra Ransomware, Proteccion de Memoria, Deteccion basada en IA, Conciencia de Vulnerabilidades y Remediacion Automatica en una sola plataforma de seguridad unificada.

La plataforma brinda a los equipos de operaciones de seguridad visibilidad en tiempo real, inteligencia de amenazas y capacidades de respuesta automatizada en todos los puntos de extremidad de una organizacion.

### 1.2 Descripcion General de la Arquitectura del Sistema

BlackSentinel Guardian utiliza una arquitectura moderna de tres capas:

```
[Navegador / Interfaz Web] <--> [Frontend React] <--> [Backend API Express] <--> [PostgreSQL / Redis]
                                                             |
                                                      [Comunicacion con Agentes]
                                                             |
                                              [Agentes de Puntos de Extremidad (Windows/Linux/macOS)]
```

**Desglose de componentes:**

| Componente | Tecnologia | Proposito |
|------------|-----------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 | Consola de gestion basada en web |
| Backend | Express.js, TypeScript, Prisma ORM | API REST y servidor WebSocket |
| Base de datos | PostgreSQL 16 | Almacenamiento persistente de datos |
| Cache | Redis 7 | Gestion de sesiones, cache en tiempo real |
| Agentes | Binarios especificos por plataforma | Monitoreo y proteccion de puntos de extremidad |
| WebSocket | Biblioteca ws | Transmision de eventos en tiempo real |

### 1.3 Requisitos de Hardware

**Requisitos Minimos (Desarrollo/Laboratorio):**

| Recurso | Requisito |
|---------|-----------|
| CPU | 2 nucleos, 2.0 GHz |
| RAM | 4 GB |
| Disco | 20 GB SSD |
| Red | 100 Mbps |

**Recomendados en Produccion (hasta 500 puntos de extremidad):**

| Recurso | Requisito |
|---------|-----------|
| CPU | 8 nucleos, 3.0 GHz |
| RAM | 16 GB |
| Disco | 100 GB NVMe SSD |
| Red | 1 Gbps |

**Requisitos Empresariales en Produccion (500+ puntos de extremidad):**

| Recurso | Requisito |
|---------|-----------|
| CPU | 16+ nucleos, 3.5 GHz |
| RAM | 32+ GB |
| Disco | 500+ GB NVMe SSD (RAID 10) |
| Red | 10 Gbps |

### 1.4 Sistemas Operativos Soportados

**Para el Despliegue del Servidor:**

- Ubuntu 22.04 LTS / 24.04 LTS
- Debian 12 (Bookworm)
- Rocky Linux 9
- Amazon Linux 2023
- RHEL 9
- CentOS Stream 9

**Para la Instalacion del Agente:**

- Windows 10/11 (x64)
- Windows Server 2019/2022
- macOS 12 Monterey o posterior
- Ubuntu 20.04+ / Debian 11+
- CentOS/RHEL 8+
- Rocky Linux 8+
- Amazon Linux 2+

---

## 2. Prerrequisitos

### 2.1 Software Requerido

Instale el siguiente software antes de continuar:

| Software | Version | Proposito |
|----------|---------|-----------|
| Node.js | 20.x LTS o posterior | Tiempo de ejecucion del backend |
| PostgreSQL | 15.x o posterior (16 recomendado) | Base de datos |
| Redis | 7.x o posterior | Cache y sesiones |
| Docker | 24.x o posterior (opcional) | Despliegue en contenedores |
| Docker Compose | 2.x o posterior (opcional) | Orquestacion multi-contenedor |
| npm | 10.x o posterior | Gestion de paquetes |
| Git | 2.40+ | Gestion del codigo fuente |
| Nginx | 1.24+ (produccion) | Proxy inverso y servicio de archivos estaticos |

**Instalar Node.js en Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Deberia mostrar v20.x.x
npm --version   # Deberia mostrar 10.x.x
```

**Instalar PostgreSQL 16 en Ubuntu/Debian:**

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt-get update
sudo apt-get install -y postgresql-16
```

**Instalar Redis 7 en Ubuntu/Debian:**

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.2 Requisitos de Red

Asegurece de que los siguientes puertos esten accesibles:

| Puerto | Protocolo | Servicio | Direccion |
|--------|-----------|----------|-----------|
| 3001 | TCP | API Backend | Entrante |
| 5173 | TCP | Servidor de Desarrollo Vite | Entrante (solo desarrollo) |
| 443 | TCP | HTTPS (produccion) | Entrante |
| 80 | TCP | HTTP (redireccion a HTTPS) | Entrante |
| 5432 | TCP | PostgreSQL | Solo interno |
| 6379 | TCP | Redis | Solo interno |
| 8443 | TCP | Registro de Agentes | Entrante |

### 2.3 Requisitos de Certificados SSL/TLS

Los despliegues en produccion requieren certificados SSL/TLS. Las opciones incluyen:

- **Let's Encrypt:** Certificados gratuitos y automatizados via certbot
- **CA Comercial:** DigiCert, Comodo, GlobalSign, etc.
- **CA Interna:** Para entornos desconectados o empresariales

**Obtener certificados Let's Encrypt:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.sudominio.com -d api.sudominio.com
```

### 2.4 Configuracion de DNS

Configure los siguientes registros DNS:

| Registro | Tipo | Valor | TTL |
|----------|------|-------|-----|
| guardian.sudominio.com | A | IP del servidor | 300 |
| api.sudominio.com | A | IP del servidor | 300 |

---

## 3. Configuracion de la Base de Datos

### 3.1 Instalacion de PostgreSQL

Verifique que PostgreSQL este ejecutandose:

```bash
sudo systemctl status postgresql
sudo systemctl enable postgresql
```

### 3.2 Crear Base de Datos y Usuario

```bash
# Cambiar al usuario postgres
sudo -u postgres psql

# Crear la base de datos
CREATE DATABASE blacksentinel;

# Crear un usuario dedicado con una contrasena segura
CREATE USER blacksentinel_user WITH PASSWORD 'SU_CONTRASENA_SEGURA_AQUI';

# Conceder privilegios
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;

-- Para PostgreSQL 15+, tambien conceder acceso al esquema
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blacksentinel_user;

-- Salir
\q
```

### 3.3 Ejecutar Migraciones de Prisma

```bash
cd backend

# Instalar dependencias
npm install

# Establecer DATABASE_URL en su archivo .env
echo 'DATABASE_URL=postgresql://blacksentinel_user:SU_CONTRASENA_SEGURA_AQUI@localhost:5432/blacksentinel' > .env

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy
```

### 3.4 Poblacion de la Base de Datos (Seed)

El script de seed crea el usuario SUPER_ADMIN inicial necesario para el primer inicio de sesion.

```bash
# Establecer variables de entorno requeridas en .env
cat >> .env << 'EOF'
JWT_SECRET=Su_clave_secreta_aleatoria_de_al_menos_32_caracteres
JWT_REFRESH_SECRET=Su_clave_secreta_de_actualizacion_de_al_menos_32_caracteres
REDIS_URL=redis://localhost:6379
EOF

# Ejecutar el script de seed
npm run seed
```

**Credenciales predeterminadas de SUPER_ADMIN (cambiar inmediatamente despues del primer inicio de sesion):**

- Correo electronico: `admin@blacksentinel.io`
- Contrasena: `admin123`

### 3.5 Formato de la Cadena de Conexion

```
postgresql://USUARIO:CONTRASENA@HOST:PUERTO/BD?schema=public
```

**Ejemplos:**

```
# Desarrollo local
postgresql://postgres:password@localhost:5432/blacksentinel

# Servidor remoto
postgresql://blacksentinel_user:contrasena_segura@db.ejemplo.com:5432/blacksentinel

# Con SSL (requerido para la mayoria de proveedores en la nube)
postgresql://blacksentinel_user:contrasena_segura@db.ejemplo.com:5432/blacksentinel?sslmode=require
```

---

## 4. Despliegue del Backend

### 4.1 Instalacion de Dependencias

```bash
cd backend
npm ci
```

### 4.2 Configuracion de Variables de Entorno

Cree el archivo `.env` en el directorio `backend/`:

```bash
cat > .env << 'ENVEOF'
# ─── Servidor ─────────────────────────────────────
PORT=3001
NODE_ENV=production

# ─── Autenticacion ─────────────────────────────────
JWT_SECRET=REEMPLAZAR_CON_64_CARACTERES_ALEATORIOS
JWT_REFRESH_SECRET=REEMPLAZAR_CON_64_CARACTERES_ALEATORIOS
JWT_EXPIRES_IN=15m
MFA_ISSUER=BlackSentinel Guardian

# ─── Base de Datos ─────────────────────────────────
DATABASE_URL=postgresql://blacksentinel_user:SU_CONTRASENA@localhost:5432/blacksentinel

# ─── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── CORS ───────────────────────────────────────────
CORS_ORIGINS=https://guardian.sudominio.com

# ─── Registro ────────────────────────────────────────
LOG_LEVEL=info

# ─── Seguridad ───────────────────────────────────────
AGENT_SIGNING_KEY=REEMPLAZAR_CON_CLAVE_SEGURA
TLS_CERT_PATH=/etc/ssl/certs/guardian.pem
TLS_KEY_PATH=/etc/ssl/private/guardian.key
ENVEOF
```

### 4.3 Compilar el Proyecto TypeScript

```bash
cd backend
npm run build
```

### 4.4 Iniciar el Servidor

```bash
# Modo desarrollo (con recarga automatica)
npm run dev

# Modo produccion
npm run start
```

### 4.5 Gestion de Procesos con PM2

Instale PM2 globalmente y configure para produccion:

```bash
# Instalar PM2
npm install -g pm2

# Iniciar la API con PM2
cd backend
pm2 start dist/server.js --name blacksentinel-api

# Guardar lista de procesos e iniciar en arranque
pm2 save
pm2 startup

# Comandos utiles de PM2
pm2 status
pm2 logs blacksentinel-api
pm2 restart blacksentinel-api
pm2 stop blacksentinel-api
pm2 delete blacksentinel-api
```

### 4.6 Configuracion de Registros

**Configurar rotacion de registros con PM2:**

```bash
npm install -g pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

**Configurar registro de aplicacion via variables de entorno:**

```
LOG_LEVEL=info          # Opciones: debug, info, warn, error
```

---

## 5. Despliegue del Frontend

### 5.1 Instalacion de Dependencias

```bash
cd blacksentinel-guardian
npm ci
```

### 5.2 Variables de Entorno

Cree `.env.production` en la raiz del frontend:

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.sudominio.com
VITE_WS_URL=wss://api.sudominio.com/ws
EOF
```

### 5.3 Compilacion para Produccion

```bash
npm run build
```

Esto genera archivos estaticos optimizados en el directorio `dist/`.

### 5.4 Servir con Nginx

**Instalar Nginx:**

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

**Configuracion de Nginx:**

```nginx
server {
    listen 80;
    server_name guardian.sudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name guardian.sudominio.com;

    ssl_certificate /etc/letsencrypt/live/guardian.sudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/guardian.sudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /var/www/guardian/html;
    index index.html;

    # Encabezados de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss://api.sudominio.com https://api.sudominio.com" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Compresion gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml;

    # Cache de archivos estaticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Enrutamiento SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverso a la API
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

**Desplegar archivos del frontend:**

```bash
sudo mkdir -p /var/www/guardian/html
sudo cp -r dist/* /var/www/guardian/html/
sudo chown -R www-data:www-data /var/www/guardian
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Despliegue con Docker

### 6.1 docker-compose.yml (Pila Completa)

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
      - CORS_ORIGINS=https://guardian.sudominio.com
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

### 6.2 Compilar Imagenes Personalizadas

```bash
# Compilar imagen del frontend
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .

# Compilar imagen del backend
docker build -t blacksentinel/guardian-api:latest ./backend
```

### 6.3 Variables de Entorno en Docker

Cree un archivo `.env` en la raiz del proyecto:

```bash
POSTGRES_PASSWORD=SU_CONTRASENA_SEGURA_DE_BD
REDIS_PASSWORD=SU_CONTRASENA_SEGURA_DE_REDIS
JWT_SECRET=SU_SECRETO_ALEATORIO_DE_64_CARACTERES
JWT_REFRESH_SECRET=SU_SECRETO_DE_ACTUALIZACION_DE_64_CARACTERES
```

### 6.4 Montajes de Volumenes para Persistencia de Datos

El docker-compose.yml define dos volumenes con nombre:

- `postgres_data`: Persiste datos de PostgreSQL en `/var/lib/postgresql/data`
- `redis_data`: Persiste datos de Redis en `/data`

### 6.5 Verificaciones de Salud

Verifique la salud de los servicios despues del despliegue:

```bash
# Ver todos los servicios
docker compose ps

# Verificar salud de la API
curl http://localhost:3001/api/health

# Respuesta esperada:
# {"status":"ok","version":"1.0.0","uptime":123.456}

# Ver registros
docker compose logs -f api
docker compose logs -f db
docker compose logs -f redis
```

---

## 7. Despliegue con Kubernetes

### 7.1 Configuracion del Namespace

```bash
kubectl create namespace blacksentinel
```

### 7.2 Secretos y ConfigMaps

```bash
# Crear secretos
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:SU_CONTRASENA@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='SU_SECRETO_ALEATORIO_DE_64_CARACTERES' \
  --from-literal=jwt-refresh-secret='SU_SECRETO_DE_ACTUALIZACION_DE_64_CARACTERES' \
  --from-literal=postgres-password='SU_CONTRASENA'
```

### 7.3 Manifiestos de Despliegue

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

### 7.4 Configuracion de Servicio e Ingress

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
        - guardian.sudominio.com
      secretName: blacksentinel-tls
  rules:
    - host: guardian.sudominio.com
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

### 7.5 Voluciones Persistentes para PostgreSQL

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

### 7.6 Consideraciones de Escalabilidad

- El despliegue de la API esta configurado con 3 replicas por defecto. Ajuste `spec.replicas` segun la carga.
- Habilite Horizontal Pod Autoscaler (HPA) para escalabilidad automatica:

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

## 8. Instalacion del Agente en Puntos de Extremidad

### 8.1 Registrar un Nuevo Punto de Extremidad

1. Inicie sesion en la consola web de BlackSentinel Guardian
2. Navegue a **Puntos de Extremidad > Inventario**
3. Haga clic en **Agregar Punto de Extremidad**
4. Proporcione un nombre para el punto de extremidad
5. Copie el comando de registro generado

### 8.2 Comandos de Instalacion del Agente

**Windows (PowerShell):**

```powershell
# Ejecutar como Administrador
irm https://install.blacksentinel.io/agent.ps1 | iex
```

**Linux (bash):**

```bash
# Ejecutar como root
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

**macOS (bash):**

```bash
# Ejecutar como root
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 Configuracion del Agente

El archivo de configuracion del agente se encuentra en:

- **Windows:** `C:\ProgramData\BlackSentinel\agent.conf`
- **Linux:** `/etc/blacksentinel/agent.conf`
- **macOS:** `/Library/BlackSentinel/agent.conf`

**Opciones de configuracion:**

```ini
[server]
url = https://api.sudominio.com
registration_token = SU_TOKEN_DE_REGISTRO

[agent]
heartbeat_interval = 30
log_level = info
```

### 8.4 Verificar la Conectividad del Agente

```bash
# Verificar estado del agente
blacksentinel-agent status

# Salida esperada:
# Estado del Agente: Ejecutando
# Conectado: Si
# Servidor: https://api.sudominio.com
# Tiempo de actividad: 12345s
```

### 8.5 Solucion de Problemas de Conexion del Agente

| Problema | Solucion |
|----------|----------|
| El agente no puede alcanzar el servidor | Verifique que el puerto 8443 este abierto y que el firewall permita conexiones salientes |
| El registro falla | Verifique que el token de registro sea valido y no haya expirado |
| El agente muestra "Degradado" | Revise los registros del agente: `journalctl -u blacksentinel-agent -f` |
| Errores de certificado TLS | Asegurece de que el agente confie en el certificado del servidor o instale el certificado CA |

---

## 9. Endurecimiento de Seguridad

### 9.1 Cambiar Credenciales Predeterminadas

Inmediatamente despues de la instalacion:

1. Cambie la contrasena predeterminada de SUPER_ADMIN
2. Cambie todas las contrasenas de base de datos predeterminadas
3. Rote los secretos JWT
4. Actualice la contrasena de Redis

### 9.2 Habilitar MFA para Todas las Cuentas de Administrador

Todas las cuentas de administrador deben habilitar MFA:

1. Inicie sesion como administrador
2. Navegue a **Configuracion > Seguridad**
3. Habilite MFA
4. Escanee el codigo QR con una aplicacion de autenticacion (Google Authenticator, Authy, etc.)
5. Ingrese el codigo de verificacion

### 9.3 Reglas de Firewall

**UFW (Ubuntu/Debian):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 80/tcp    # HTTP (para Let's Encrypt)
sudo ufw deny 3001/tcp   # Bloquear acceso directo a la API
sudo ufw deny 5432/tcp   # Bloquear acceso directo a PostgreSQL
sudo ufw deny 6379/tcp   # Bloquear acceso directo a Redis
sudo ufw enable
```

### 9.4 Configuracion SSL/TLS

- Use TLS 1.2 o superior exclusivamente
- Deshabilite conjuntos de cifrados debiles
- Habilite encabezados HSTS
- Use fijacion de certificados para la comunicacion con agentes

### 9.5 Cifrado de Base de Datos en Reposo

Habilite el Cifrado Transparente de Datos (TDE) de PostgreSQL si es compatible con su distribucion de PostgreSQL, o use cifrado a nivel de disco (LUKS, BitLocker).

### 9.6 Revision del Registro de Auditoria

Revise regularmente el registro de auditoria en busca de actividad sospechosa:

```sql
-- Revisar acciones recientes de administrador
SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;

-- Revisar intentos de inicio de sesion fallidos
SELECT * FROM "AuditLog" WHERE action LIKE '%login%' AND details->>'success' = 'false';
```

### 9.7 Actualizaciones Regulares de Seguridad

```bash
# Actualizar paquetes del sistema
sudo apt-get update && sudo apt-get upgrade -y

# Actualizar dependencias de Node.js
cd backend && npm audit fix
cd .. && npm audit fix
```

---

## 10. Configuracion Inicial

### 10.1 Primer Inicio de Sesion como SUPER_ADMIN

1. Abra `https://guardian.sudominio.com` en un navegador
2. Inicie sesion con las credenciales predeterminadas de SUPER_ADMIN
3. Cambie la contrasena predeterminada inmediatamente
4. Configure MFA

### 10.2 Crear Departamentos y Etiquetas

1. Navegue a **Configuracion > Departamentos**
2. Haga clic en **Agregar Departamento**
3. Ingrese el nombre y descripcion del departamento
4. Navegue a **Configuracion > Etiquetas**
5. Cree etiquetas para categorizar puntos de extremidad (ej: "Critico", "Finanzas", "Ingenieria")

### 10.3 Configurar Integraciones

Navegue a **Configuracion > Integraciones** y configure:

| Integracion | Configuracion Requerida |
|-------------|------------------------|
| Correo (SMTP) | Host SMTP, puerto, usuario, contrasena, direccion del remitente |
| Slack | URL del webhook o token OAuth |
| Microsoft Teams | URL del webhook |
| SIEM | Endpoint de la API, token de autenticacion |
| Active Directory | Direccion del servidor LDAP/AD, DN base, credenciales de enlace |

### 10.4 Configurar Reglas de Notificacion

Navegue a **Configuracion > Notificaciones** y cree reglas:

1. Defina las condiciones de activacion (severidad, tipo de evento, punto de extremidad)
2. Defina los canales de notificacion (correo, Slack, Teams, webhook)
3. Establezca la frecuencia de notificacion y reglas de escalacion

### 10.5 Configurar Politicas de Retencion

Navegue a **Configuracion > Retencion** y configure:

- Periodo de retencion de alertas (predeterminado: 90 dias)
- Periodo de retencion de amenazas (predeterminado: 365 dias)
- Periodo de retencion de registros de auditoria (predeterminado: 365 dias)
- Periodo de retencion de eventos de linea de tiempo (predeterminado: 30 dias)

### 10.6 Control de Acceso Basado en Roles

Navegue a **Configuracion > Usuarios > Agregar Usuario** para crear usuarios con roles apropiados.

**Roles disponibles:** Consulte la [Seccion 14: Tabla de Referencia de Roles](#14-tabla-de-referencia-de-roles).

---

## 11. Copia de Seguridad y Recuperacion

### 11.1 Procedimientos de Copia de Seguridad de Base de Datos

**Copia de seguridad manual usando pg_dump:**

```bash
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### 11.2 Scripts de Copia de Seguridad Automaticos

Cree `/etc/cron.d/blacksentinel-backup`:

```bash
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel/blacksentinel_$(date +\%Y\%m\%d).dump.gz
```

### 11.3 Restaurar desde Copia de Seguridad

```bash
# Detener el servicio del backend
pm2 stop blacksentinel-api

# Restaurar la base de datos
gunzip -c backup_20260630_020000.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel --verbose

# Reiniciar el servicio del backend
pm2 start blacksentinel-api
```

### 11.4 Procedimientos de Recuperacion ante Desastres

1. Identifique el punto de fallo
2. Aprovisione nueva infraestructura si es necesario
3. Restaure la base de datos desde la copia de seguridad mas reciente
4. Despliegue el backend y frontend
5. Verifique la conectividad de los agentes
6. Pruebe la funcionalidad critica

### 11.5 Consideraciones de RPO y RTO

| Metrica | Objetivo | Descripcion |
|---------|----------|-------------|
| RPO | 1 hora | Maxima perdida de datos aceptable |
| RTO | 4 horas | Maximo tiempo de inactividad aceptable |

---

## 12. Monitoreo y Mantenimiento

### 12.1 Puntos de Verificacion de Salud

```bash
# Verificacion de salud de la API
curl http://localhost:3001/api/health

# Respuesta esperada:
# {"status":"ok","version":"1.0.0","uptime":123.456}
```

### 12.2 Monitoreo de Registros

```bash
# Ver registros de la API con PM2
pm2 logs blacksentinel-api

# Ver registros de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver registros de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 12.3 Monitoreo de Rendimiento

Monitoree las siguientes metricas:

- Tiempo de respuesta de la API (objetivo: < 200ms p95)
- Utilizacion del grupo de conexiones de la base de datos
- Uso de memoria de Redis
- Utilizacion de CPU y memoria
- E/S de disco y capacidad de almacenamiento

### 12.4 Mantenimiento de la Base de Datos

```bash
# Ejecutar VACUUM ANALYZE
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"

# Reconstruir indices
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

### 12.5 Procedimientos de Actualizacion

**Actualizacion del backend:**

```bash
cd backend
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart blacksentinel-api
```

**Actualizacion del frontend:**

```bash
cd blacksentinel-guardian
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/guardian/html/
sudo systemctl reload nginx
```

---

## 13. Solucion de Problemas

### 13.1 Problemas Comunes y Soluciones

| Problema | Solucion |
|----------|----------|
| La API no inicia | Verifique la configuracion de `.env` y asegurece de que todas las variables requeridas esten establecidas |
| Conexion rechazada a la base de datos | Verifique que PostgreSQL este ejecutandose y que la cadena de conexion sea correcta |
| Conexion rechazada a Redis | Verifique que Redis este ejecutandose: `redis-cli ping` |
| La compilacion falla | Ejecute `npm ci` para instalar dependencias limpiamente |
| El frontend muestra pagina en blanco | Verifique que `VITE_API_URL` este correctamente configurado en `.env.production` |

### 13.2 Errores de Conexion Rechazada

```bash
# Verificar que PostgreSQL este escuchando
sudo ss -tlnp | grep 5432

# Verificar que Redis este escuchando
sudo ss -tlnp | grep 6379

# Verificar que la API este escuchando
sudo ss -tlnp | grep 3001
```

### 13.3 Fallos de Autenticacion

- Verifique que JWT_SECRET este establecido y sea consistente
- Revise que los tokens no hayan expirado
- Asegurece de que CORS_ORIGINS incluya su dominio frontend
- Verifique que la cuenta de usuario este activa y no este bloqueada

### 13.4 Problemas de Conexion a la Base de Datos

```bash
# Probar conexion manualmente
psql -h localhost -U blacksentinel_user -d blacksentinel

# Verificar estado de PostgreSQL
sudo systemctl status postgresql

# Verificar limites de conexion
sudo -u postgres psql -c "SHOW max_connections;"
```

### 13.5 Agente No se Conecta

1. Verifique la conectividad de red del agente al servidor
2. Revise las reglas del firewall para permitir el puerto saliente 8443
3. Verifique que el token de registro sea valido
4. Revise los registros del agente en busca de mensajes de error
5. Asegurece de que el certificado SSL del servidor sea de confianza para el agente

### 13.6 Fallos de Compilacion

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm ci

# Limpiar cache de compilacion de TypeScript
rm -rf dist
npm run build
```

### 13.7 Habilitar Registro de Depuracion

Establezca la siguiente variable de entorno:

```
LOG_LEVEL=debug
```

Reinicie el servicio para aplicar los cambios.

---

## 14. Tabla de Referencia de Roles

| Rol | Descripcion | Ver Panel | Ver Endpoints | Ver Amenazas | Editar Amenazas | Eliminar Registros | Gestionar Usuarios | Gestionar Config. | Gestionar Integraciones | Ver Registro Auditoria | Usar Copiloto IA |
|-----|-------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | Acceso total al sistema | Si | Si | Si | Si | Si | Si | Si | Si | Si | Si |
| ADMIN | Administracion del sistema | Si | Si | Si | Si | No | Si | Si | Si | Si | Si |
| SOC_TIER_5 | Lider/Manager SOC | Si | Si | Si | Si | Si | No | No | No | Si | Si |
| SOC_TIER_4 | Analista SOC Senior | Si | Si | Si | Si | No | No | No | No | Si | Si |
| SOC_TIER_3 | Analista SOC Avanzado | Si | Si | Si | Si | No | No | No | No | Si | No |
| SOC_TIER_2 | Analista SOC Intermedio | Si | Si | Si | Parcial | No | No | No | No | Si | No |
| SOC_TIER_1 | Analista SOC Junior | Si | Si | Si | No | No | No | No | No | No | No |
| AUDITOR_3 | Auditor de Seguridad Senior | Si | Si | Si | No | No | No | No | No | Si | No |
| AUDITOR_2 | Auditor de Seguridad | Si | Si | Parcial | No | No | No | No | No | Si | No |
| AUDITOR_1 | Auditor Junior | Si | Parcial | Parcial | No | No | No | No | No | No | No |
| IT | Operaciones de TI | Si | Si | No | No | No | No | Parcial | No | No | No |
| ANALYST | Analista General | Si | Si | Si | No | No | No | No | No | No | No |
| VIEWER | Solo lectura | Si | Parcial | Parcial | No | No | No | No | No | No | No |

---

## 15. Referencia de la API

### 15.1 URL Base

```
https://api.sudominio.com/api
```

### 15.2 Formato del Encabezado de Autenticacion

```
Authorization: Bearer <JWT_TOKEN>
```

### 15.3 Endpoints de la API

| Metodo | Ruta | Descripcion | Rol Requerido |
|--------|------|-------------|---------------|
| POST | `/api/auth/login` | Inicio de sesion | Publico |
| POST | `/api/auth/register` | Registro de usuario | Publico |
| POST | `/api/auth/refresh` | Actualizar token de acceso | Publico |
| POST | `/api/auth/logout` | Cierre de sesion | Autenticado |
| POST | `/api/auth/mfa/setup` | Habilitar MFA | Autenticado |
| POST | `/api/auth/mfa/verify` | Verificar codigo MFA | Autenticado |
| GET | `/api/health` | Verificacion de salud | Publico |
| GET | `/api/users` | Listar todos los usuarios | ADMIN+ |
| POST | `/api/users` | Crear usuario | ADMIN+ |
| GET | `/api/users/:id` | Obtener usuario por ID | ADMIN+ |
| PUT | `/api/users/:id` | Actualizar usuario | ADMIN+ |
| DELETE | `/api/users/:id` | Eliminar usuario | SUPER_ADMIN |
| GET | `/api/endpoints` | Listar todos los endpoints | SOC_TIER_1+ |
| POST | `/api/endpoints` | Registrar endpoint | IT+ |
| GET | `/api/endpoints/:id` | Obtener detalles del endpoint | SOC_TIER_1+ |
| PUT | `/api/endpoints/:id` | Actualizar endpoint | SOC_TIER_2+ |
| DELETE | `/api/endpoints/:id` | Eliminar endpoint | ADMIN+ |
| GET | `/api/threats` | Listar todas las amenazas | SOC_TIER_1+ |
| POST | `/api/threats` | Crear entrada de amenaza | SOC_TIER_2+ |
| GET | `/api/threats/:id` | Obtener detalles de amenaza | SOC_TIER_1+ |
| PUT | `/api/threats/:id` | Actualizar amenaza | SOC_TIER_2+ |
| DELETE | `/api/threats/:id` | Eliminar amenaza | SOC_TIER_4+ |
| GET | `/api/alerts` | Listar todas las alertas | SOC_TIER_1+ |
| POST | `/api/alerts` | Crear alerta | SOC_TIER_1+ |
| GET | `/api/alerts/:id` | Obtener detalles de alerta | SOC_TIER_1+ |
| PUT | `/api/alerts/:id` | Actualizar alerta | SOC_TIER_2+ |
| DELETE | `/api/alerts/:id` | Eliminar alerta | SOC_TIER_3+ |
| GET | `/api/timeline` | Listar eventos de linea de tiempo | SOC_TIER_1+ |
| GET | `/api/vulnerabilities` | Listar vulnerabilidades | SOC_TIER_1+ |
| POST | `/api/vulnerabilities` | Crear vulnerabilidad | SOC_TIER_3+ |
| GET | `/api/firewall/rules` | Listar reglas de firewall | SOC_TIER_2+ |
| POST | `/api/firewall/rules` | Crear regla de firewall | SOC_TIER_3+ |
| GET | `/api/usb` | Listar dispositivos USB | SOC_TIER_1+ |
| POST | `/api/usb` | Registrar dispositivo USB | IT+ |
| POST | `/api/response` | Ejecutar accion de respuesta | SOC_TIER_3+ |
| GET | `/api/audit` | Listar registros de auditoria | AUDITOR_1+ |
| GET | `/api/dashboard` | Metricas del panel | SOC_TIER_1+ |
| POST | `/api/copilot` | Enviar consulta IA | SOC_TIER_3+ |
| GET | `/api/settings` | Obtener configuracion | ADMIN+ |
| PUT | `/api/settings` | Actualizar configuracion | SUPER_ADMIN |
| GET | `/api/integrations` | Listar integraciones | ADMIN+ |
| PUT | `/api/integrations/:id` | Actualizar integracion | ADMIN+ |

### 15.4 Formato de Respuesta de Error

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token invalido o expirado",
    "details": null
  }
}
```

**Codigos de error:** `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `RATE_LIMITED`

### 15.5 Formato de Paginacion

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

Parametros de consulta: `?page=1&limit=20&sort=createdAt&order=desc`

---

## 16. Referencia de Variables de Entorno

| Variable | Requerida | Predeterminada | Descripcion | Ejemplo |
|----------|:---------:|----------------|-------------|---------|
| PORT | No | `3001` | Puerto del servidor backend | `3001` |
| NODE_ENV | Si | `development` | Modo de entorno | `production` |
| DATABASE_URL | Si | `file:./dev.db` | Cadena de conexion PostgreSQL | `postgresql://user:pass@host:5432/db` |
| REDIS_URL | Si | `redis://localhost:6379` | Cadena de conexion Redis | `redis://redis:6379` |
| JWT_SECRET | Si | Ninguno | Secreto de firma JWT (min 32 caracteres) | `a1b2c3d4e5f6...` |
| JWT_REFRESH_SECRET | Si | Ninguno | Secreto de firma de token de actualizacion | `z9y8x7w6v5u4...` |
| JWT_EXPIRES_IN | No | `15m` | Caducidad del token de acceso | `15m` |
| MFA_ISSUER | No | `BlackSentinel Guardian` | Emisor MFA | `BlackSentinel Guardian` |
| CORS_ORIGINS | Si | `http://localhost:5173` | Origenes CORS permitidos | `https://guardian.ejemplo.com` |
| LOG_LEVEL | No | `info` | Nivel de registro | `debug` |
| AGENT_SIGNING_KEY | No | Ninguno | Clave de firma del binario del agente | `su-clave-de-firma` |
| TLS_CERT_PATH | No | Ninguno | Ruta del certificado TLS | `/etc/ssl/certs/guardian.pem` |
| TLS_KEY_PATH | No | Ninguno | Ruta de la clave privada TLS | `/etc/ssl/private/guardian.key` |
| VITE_API_URL | Si | `http://localhost:3001` | URL de la API backend (frontend) | `https://api.ejemplo.com` |
| VITE_WS_URL | No | `ws://localhost:3001/ws` | URL WebSocket (frontend) | `wss://api.ejemplo.com/ws` |
| POSTGRES_PASSWORD | Docker | `postgres` | Contrasena de PostgreSQL (Docker) | `contrasena_segura` |
| REDIS_PASSWORD | Docker | Ninguno | Contrasena de Redis (Docker) | `contrasena_segura` |

---

**Fin del Documento**

Para soporte adicional, contacte: support@blacksentinel.io
