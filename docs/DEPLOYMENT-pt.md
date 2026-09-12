# BlackSentinel Guardian - Manual de Implantacao

**Versao:** 1.0.0  
**Ultima atualizacao:** Junho de 2026  
**Classificacao:** Uso interno / Para socios  

---

## Sumario

1. [Introducao](#1-introducao)
2. [Prerequisitos](#2-prerequisitos)
3. [Configuracao do Banco de Dados](#3-configuracao-do-banco-de-dados)
4. [Implantacao do Backend](#4-implantacao-do-backend)
5. [Implantacao do Frontend](#5-implantacao-do-frontend)
6. [Implantacao com Docker](#6-implantacao-com-docker)
7. [Implantacao com Kubernetes](#7-implantacao-com-kubernetes)
8. [Instalacao do Agente nos Endpoints](#8-instalacao-do-agente-nos-endpoints)
9. [Endurecimento de Seguranca](#9-endurecimento-de-seguranca)
10. [Configuracao Inicial](#10-configuracao-inicial)
11. [Backup e Recuperacao](#11-backup-e-recuperacao)
12. [Monitoramento e Manutencao](#12-monitoramento-e-manutencao)
13. [Solucao de Problemas](#13-solucao-de-problemas)
14. [Tabela de Referencia de Roles](#14-tabela-de-referencia-de-roles)
15. [Referencia da API](#15-referencia-da-api)
16. [Referencia de Variaveis de Ambiente](#16-referencia-de-variaveis-de-ambiente)

---

## 1. Introducao

### 1.1 O que e o BlackSentinel Guardian

O BlackSentinel Guardian e uma plataforma de defesa autonoma de endpoints de proxima geracao que integra EPP (Plataforma de Protecao de Endpoints), EDR (Deteccao e Resposta em Endpoints), XDR (Deteccao e Resposta Estendida), Caaca de Ameacas, Analitica de Comportamento, Zerotrust, Tecnologia de Engano, Protecao contra Ransomware, Protecao de Memoria, Deteccao por IA, Consciencia de Vulnerabilidades e Remediacao Automatica em uma unica plataforma de seguranca unificada.

A plataforma fornece aos equipes de operacoes de seguranca visibilidade em tempo real, inteligencia de ameacas e capacidades de resposta automatizada em todos os endpoints de uma organizacao.

### 1.2 Visao Geral da Arquitetura do Sistema

O BlackSentinel Guardian utiliza uma arquitetura moderna de tres camadas:

```
[Navegador / Interface Web] <--> [Frontend React] <--> [Backend API Express] <--> [PostgreSQL / Redis]
                                                              |
                                                       [Comunicacao com Agentes]
                                                              |
                                               [Agentes de Endpoints (Windows/Linux/macOS)]
```

**Detalhamento dos componentes:**

| Componente | Tecnologia | Finalidade |
|------------|-----------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 | Console de gerenciamento baseado na web |
| Backend | Express.js, TypeScript, Prisma ORM | API REST e servidor WebSocket |
| Banco de dados | PostgreSQL 16 | Armazenamento persistente de dados |
| Cache | Redis 7 | Gerenciamento de sessoes, cache em tempo real |
| Agentes | Binarios especificos por plataforma | Monitoramento e protecao de endpoints |
| WebSocket | Biblioteca ws | Transmissao de eventos em tempo real |

### 1.3 Requisitos de Hardware

**Requisitos Minimos (Desenvolvimento/Laboratorio):**

| Recurso | Requisito |
|---------|-----------|
| CPU | 2 nucleos, 2.0 GHz |
| RAM | 4 GB |
| Disco | 20 GB SSD |
| Rede | 100 Mbps |

**Recomendados em Producao (ate 500 endpoints):**

| Recurso | Requisito |
|---------|-----------|
| CPU | 8 nucleos, 3.0 GHz |
| RAM | 16 GB |
| Disco | 100 GB NVMe SSD |
| Rede | 1 Gbps |

**Requisitos Empresariais em Producao (500+ endpoints):**

| Recurso | Requisito |
|---------|-----------|
| CPU | 16+ nucleos, 3.5 GHz |
| RAM | 32+ GB |
| Disco | 500+ GB NVMe SSD (RAID 10) |
| Rede | 10 Gbps |

### 1.4 Sistemas Operacionais Suportados

**Para Implantacao do Servidor:**

- Ubuntu 22.04 LTS / 24.04 LTS
- Debian 12 (Bookworm)
- Rocky Linux 9
- Amazon Linux 2023
- RHEL 9
- CentOS Stream 9

**Para Instalacao do Agente:**

- Windows 10/11 (x64)
- Windows Server 2019/2022
- macOS 12 Monterey ou posterior
- Ubuntu 20.04+ / Debian 11+
- CentOS/RHEL 8+
- Rocky Linux 8+
- Amazon Linux 2+

---

## 2. Prerequisitos

### 2.1 Software Necessario

Instale o seguinte software antes de prosseguir:

| Software | Versao | Finalidade |
|----------|--------|------------|
| Node.js | 20.x LTS ou posterior | Tempo de execucao do backend |
| PostgreSQL | 15.x ou posterior (16 recomendado) | Banco de dados |
| Redis | 7.x ou posterior | Cache e sessoes |
| Docker | 24.x ou posterior (opcional) | Implantacao em container |
| Docker Compose | 2.x ou posterior (opcional) | Orquestracao multi-container |
| npm | 10.x ou posterior | Gerenciamento de pacotes |
| Git | 2.40+ | Gerenciamento do codigo-fonte |
| Nginx | 1.24+ (producao) | Proxy reverso e servico de arquivos estaticos |

**Instalar Node.js no Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x
```

**Instalar PostgreSQL 16 no Ubuntu/Debian:**

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt-get update
sudo apt-get install -y postgresql-16
```

**Instalar Redis 7 no Ubuntu/Debian:**

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.2 Requisitos de Rede

Garanta que as seguintes portas estejam acessiveis:

| Porta | Protocolo | Servico | Direcao |
|-------|-----------|---------|---------|
| 3001 | TCP | API Backend | Entrada |
| 5173 | TCP | Servidor de Desenvolvimento Vite | Entrada (somente desenvolvimento) |
| 443 | TCP | HTTPS (producao) | Entrada |
| 80 | TCP | HTTP (redirecionar para HTTPS) | Entrada |
| 5432 | TCP | PostgreSQL | Somente interno |
| 6379 | TCP | Redis | Somente interno |
| 8443 | TCP | Registro de Agentes | Entrada |

### 2.3 Requisitos de Certificados SSL/TLS

Implantacoes em producao requerem certificados SSL/TLS. Opcoes incluem:

- **Let's Encrypt:** Certificados gratuitos e automatizados via certbot
- **CA Comercial:** DigiCert, Comodo, GlobalSign, etc.
- **CA Interna:** Para ambientes air-gapped ou empresariais

**Obter certificados Let's Encrypt:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.seudominio.com -d api.seudominio.com
```

### 2.4 Configuracao de DNS

Configure os seguintes registros DNS:

| Registro | Tipo | Valor | TTL |
|----------|------|-------|-----|
| guardian.seudominio.com | A | IP do servidor | 300 |
| api.seudominio.com | A | IP do servidor | 300 |

---

## 3. Configuracao do Banco de Dados

### 3.1 Instalacao do PostgreSQL

Verifique se o PostgreSQL esta em execucao:

```bash
sudo systemctl status postgresql
sudo systemctl enable postgresql
```

### 3.2 Criar Banco de Dados e Usuario

```bash
# Trocar para o usuario postgres
sudo -u postgres psql

# Criar o banco de dados
CREATE DATABASE blacksentinel;

# Criar um usuario dedicado com uma senha forte
CREATE USER blacksentinel_user WITH PASSWORD 'SUA_SENHA_SEGURA_AQUI';

# Conceder privilegios
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;

-- Para PostgreSQL 15+, tambem conceder acesso ao schema
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blacksentinel_user;

-- Sair
\q
```

### 3.3 Executar Migracoes do Prisma

```bash
cd backend

# Instalar dependencias
npm install

# Definir DATABASE_URL no seu arquivo .env
echo 'DATABASE_URL=postgresql://blacksentinel_user:SUA_SENHA_SEGURA_AQUI@localhost:5432/blacksentinel' > .env

# Gerar cliente Prisma
npx prisma generate

# Executar migracoes
npx prisma migrate deploy
```

### 3.4 Povoamento do Banco de Dados (Seed)

O script de seed cria o usuario SUPER_ADMIN inicial necessario para o primeiro login.

```bash
# Definir variaveis de ambiente necessarias no .env
cat >> .env << 'EOF'
JWT_SECRET=Sua_chave_secreta_aleatoria_de_pelo_menos_32_caracteres
JWT_REFRESH_SECRET=Sua_chave_secreta_de_atualizacao_de_pelo_menos_32_caracteres
REDIS_URL=redis://localhost:6379
EOF

# Executar o script de seed
npm run seed
```

**Credenciais padrao do SUPER_ADMIN (alterar imediatamente apos o primeiro login):**

- Email: `admin@blacksentinel.io`
- Senha: `admin123`

### 3.5 Formato da String de Conexao

```
postgresql://USUARIO:SENHA@HOST:PORTA/BD?schema=public
```

**Exemplos:**

```
# Desenvolvimento local
postgresql://postgres:password@localhost:5432/blacksentinel

# Servidor remoto
postgresql://blacksentinel_user:senha_segura@db.exemplo.com:5432/blacksentinel

# Com SSL (necessario para a maioria dos provedores de nuvem)
postgresql://blacksentinel_user:senha_segura@db.exemplo.com:5432/blacksentinel?sslmode=require
```

---

## 4. Implantacao do Backend

### 4.1 Instalacao de Dependencias

```bash
cd backend
npm ci
```

### 4.2 Configuracao de Variaveis de Ambiente

Crie o arquivo `.env` no diretorio `backend/`:

```bash
cat > .env << 'ENVEOF'
# ─── Servidor ─────────────────────────────────────
PORT=3001
NODE_ENV=production

# ─── Autenticacao ─────────────────────────────────
JWT_SECRET=SUBSTITUIR_COM_64_CARACTERES_ALEATORIOS
JWT_REFRESH_SECRET=SUBSTITUIR_COM_64_CARACTERES_ALEATORIOS
JWT_EXPIRES_IN=15m
MFA_ISSUER=BlackSentinel Guardian

# ─── Banco de Dados ───────────────────────────────
DATABASE_URL=postgresql://blacksentinel_user:SUA_SENHA@localhost:5432/blacksentinel

# ─── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── CORS ───────────────────────────────────────────
CORS_ORIGINS=https://guardian.seudominio.com

# ─── Registro ────────────────────────────────────────
LOG_LEVEL=info

# ─── Seguranca ───────────────────────────────────────
AGENT_SIGNING_KEY=SUBSTITUIR_COM_CHAVE_SEGURA
TLS_CERT_PATH=/etc/ssl/certs/guardian.pem
TLS_KEY_PATH=/etc/ssl/private/guardian.key
ENVEOF
```

### 4.3 Compilar o Projeto TypeScript

```bash
cd backend
npm run build
```

### 4.4 Iniciar o Servidor

```bash
# Modo desenvolvimento (com recarga automatica)
npm run dev

# Modo producao
npm run start
```

### 4.5 Gerenciamento de Processos com PM2

Instale o PM2 globalmente e configure para producao:

```bash
# Instalar PM2
npm install -g pm2

# Iniciar a API com PM2
cd backend
pm2 start dist/server.js --name blacksentinel-api

# Salvar lista de processos e configurar inicializacao
pm2 save
pm2 startup

# Comandos uteis do PM2
pm2 status
pm2 logs blacksentinel-api
pm2 restart blacksentinel-api
pm2 stop blacksentinel-api
pm2 delete blacksentinel-api
```

### 4.6 Configuracao de Logs

**Configurar rotacao de logs com PM2:**

```bash
npm install -g pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

**Configurar logs da aplicacao via variaveis de ambiente:**

```
LOG_LEVEL=info          # Opcoes: debug, info, warn, error
```

---

## 5. Implantacao do Frontend

### 5.1 Instalacao de Dependencias

```bash
cd blacksentinel-guardian
npm ci
```

### 5.2 Variaveis de Ambiente

Crie `.env.production` na raiz do frontend:

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.seudominio.com
VITE_WS_URL=wss://api.seudominio.com/ws
EOF
```

### 5.3 Compilacao para Producao

```bash
npm run build
```

Isto gera arquivos estaticos otimizados no diretorio `dist/`.

### 5.4 Servir com Nginx

**Instalar Nginx:**

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

**Configuracao do Nginx:**

```nginx
server {
    listen 80;
    server_name guardian.seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name guardian.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/guardian.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/guardian.seudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /var/www/guardian/html;
    index index.html;

    # Cabecalhos de seguranca
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss://api.seudominio.com https://api.seudominio.com" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Compressao gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml;

    # Cache de arquivos estaticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Roteamento SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy reverso para a API
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

**Implantar arquivos do frontend:**

```bash
sudo mkdir -p /var/www/guardian/html
sudo cp -r dist/* /var/www/guardian/html/
sudo chown -R www-data:www-data /var/www/guardian
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Implantacao com Docker

### 6.1 docker-compose.yml (Pilha Completa)

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
      - CORS_ORIGINS=https://guardian.seudominio.com
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

### 6.2 Compilar Imagens Personalizadas

```bash
# Compilar imagem do frontend
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .

# Compilar imagem do backend
docker build -t blacksentinel/guardian-api:latest ./backend
```

### 6.3 Variaveis de Ambiente no Docker

Crie um arquivo `.env` na raiz do projeto:

```bash
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_DB
REDIS_PASSWORD=SUA_SENHA_SEGURA_REDIS
JWT_SECRET=SEU_SECRETO_ALEATORIO_64_CARACTERES
JWT_REFRESH_SECRET=SEU_SECRETO_ATUALIZACAO_64_CARACTERES
```

### 6.4 Montagens de Volume para Persistencia de Dados

O docker-compose.yml define dois volumes nomeados:

- `postgres_data`: Persiste dados do PostgreSQL em `/var/lib/postgresql/data`
- `redis_data`: Persiste dados do Redis em `/data`

### 6.5 Verificacoes de Saude

Verifique a saude dos servicos apos a implantacao:

```bash
# Ver todos os servicos
docker compose ps

# Verificar saude da API
curl http://localhost:3001/api/health

# Resposta esperada:
# {"status":"ok","version":"1.0.0","uptime":123.456}

# Ver logs
docker compose logs -f api
docker compose logs -f db
docker compose logs -f redis
```

---

## 7. Implantacao com Kubernetes

### 7.1 Configuracao do Namespace

```bash
kubectl create namespace blacksentinel
```

### 7.2 Secretos e ConfigMaps

```bash
# Criar secretos
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:SUA_SENHA@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='SEU_SECRETO_ALEATORIO_64_CARACTERES' \
  --from-literal=jwt-refresh-secret='SEU_SECRETO_ATUALIZACAO_64_CARACTERES' \
  --from-literal=postgres-password='SUA_SENHA'
```

### 7.3 Manifestos de Implantacao

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

### 7.4 Configuracao de Servico e Ingress

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
        - guardian.seudominio.com
      secretName: blacksentinel-tls
  rules:
    - host: guardian.seudominio.com
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

### 7.5 Volumes Persistentes para PostgreSQL

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

### 7.6 Consideracoes de Escalabilidade

- O implantacao da API e configurado com 3 replicas por padrao. Ajuste `spec.replicas` conforme a carga.
- Habilite Horizontal Pod Autoscaler (HPA) para escalabilidade automatica:

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

## 8. Instalacao do Agente nos Endpoints

### 8.1 Registrar um Novo Endpoint

1. Faca login no console web do BlackSentinel Guardian
2. Navegue ate **Endpoints > Inventario**
3. Clique em **Adicionar Endpoint**
4. Forneca um nome para o endpoint
5. Copie o comando de registro gerado

### 8.2 Comandos de Instalacao do Agente

**Windows (PowerShell):**

```powershell
# Executar como Administrador
irm https://install.blacksentinel.io/agent.ps1 | iex
```

**Linux (bash):**

```bash
# Executar como root
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

**macOS (bash):**

```bash
# Executar como root
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 Configuracao do Agente

O arquivo de configuracao do agente esta localizado em:

- **Windows:** `C:\ProgramData\BlackSentinel\agent.conf`
- **Linux:** `/etc/blacksentinel/agent.conf`
- **macOS:** `/Library/BlackSentinel/agent.conf`

**Opcoes de configuracao:**

```ini
[server]
url = https://api.seudominio.com
registration_token = SEU_TOKEN_DE_REGISTRO

[agent]
heartbeat_interval = 30
log_level = info
```

### 8.4 Verificar Conectividade do Agente

```bash
# Verificar status do agente
blacksentinel-agent status

# Saida esperada:
# Status do Agente: Em Execucao
# Conectado: Sim
# Servidor: https://api.seudominio.com
# Tempo de Atividade: 12345s
```

### 8.5 Solucao de Problemas de Conexao do Agente

| Problema | Solucao |
|----------|---------|
| Agente nao consegue acessar o servidor | Verifique se a porta 8443 esta aberta e se o firewall permite conexoes de saida |
| Registro falha | Verifique se o token de registro e valido e nao expirou |
| Agente mostra "Degradado" | Verifique os logs do agente: `journalctl -u blacksentinel-agent -f` |
| Erros de certificado TLS | Garanta que o agente confia no certificado do servidor ou instale o certificado CA |

---

## 9. Endurecimento de Seguranca

### 9.1 Alterar Credenciais Padrao

Imediatamente apos a instalacao:

1. Altere a senha padrao do SUPER_ADMIN
2. Altere todas as senhas de banco de dados padrao
3. Rote os segredos JWT
4. Atualize a senha do Redis

### 9.2 Habilitar MFA para Todas as Contas de Administrador

Todas as contas de administrador devem habilitar MFA:

1. Faca login como administrador
2. Navegue ate **Configuracoes > Seguranca**
3. Habilite MFA
4. Escaneie o codigo QR com um aplicativo autenticador (Google Authenticator, Authy, etc.)
5. Insira o codigo de verificacao

### 9.3 Regras de Firewall

**UFW (Ubuntu/Debian):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 80/tcp    # HTTP (para Let's Encrypt)
sudo ufw deny 3001/tcp   # Bloquear acesso direto a API
sudo ufw deny 5432/tcp   # Bloquear acesso direto ao PostgreSQL
sudo ufw deny 6379/tcp   # Bloquear acesso direto ao Redis
sudo ufw enable
```

### 9.4 Configuracao SSL/TLS

- Use TLS 1.2 ou superior exclusivamente
- Desabilite conjuntos de cifras fracos
- Habilite cabecalhos HSTS
- Use fixacao de certificados para comunicacao com agentes

### 9.5 Cifrado de Banco de Dados em Repouso

Habilite o Cifrado Transparente de Dados (TDE) do PostgreSQL se suportado pela sua distribuicao PostgreSQL, ou use cifrado a nivel de disco (LUKS, BitLocker).

### 9.6 Revisao do Registro de Auditoria

Revise regularmente o registro de auditoria para atividade suspeita:

```sql
-- Revisar acoes recentes de administrador
SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;

-- Revisar tentativas de login falhas
SELECT * FROM "AuditLog" WHERE action LIKE '%login%' AND details->>'success' = 'false';
```

### 9.7 Atualizacoes Regulares de Seguranca

```bash
# Atualizar pacotes do sistema
sudo apt-get update && sudo apt-get upgrade -y

# Atualizar dependencias do Node.js
cd backend && npm audit fix
cd .. && npm audit fix
```

---

## 10. Configuracao Inicial

### 10.1 Primeiro Login como SUPER_ADMIN

1. Abra `https://guardian.seudominio.com` em um navegador
2. Faca login com as credenciais padrao do SUPER_ADMIN
3. Altere a senha padrao imediatamente
4. Configure MFA

### 10.2 Criar Departamentos e Tags

1. Navegue ate **Configuracoes > Departamentos**
2. Clique em **Adicionar Departamento**
3. Insira o nome e descricao do departamento
4. Navegue ate **Configuracoes > Tags**
5. Crie tags para categorizar endpoints (ex: "Critico", "Financeiro", "Engenharia")

### 10.3 Configurar Integracoes

Navegue ate **Configuracoes > Integracoes** e configure:

| Integracao | Configuracao Necessaria |
|------------|------------------------|
| Email (SMTP) | Host SMTP, porta, usuario, senha, endereco do remetente |
| Slack | URL do webhook ou token OAuth |
| Microsoft Teams | URL do webhook |
| SIEM | Endpoint da API, token de autenticacao |
| Active Directory | Endereco do servidor LDAP/AD, DN base, credenciais de ligacao |

### 10.4 Configurar Regras de Notificacao

Navegue ate **Configuracoes > Notificacoes** e crie regras:

1. Defina as condicoes de acionamento (gravidade, tipo de evento, endpoint)
2. Defina os canais de notificacao (email, Slack, Teams, webhook)
3. Defina a frequencia de notificacao e regras de escalacao

### 10.5 Configurar Politicas de Retencao

Navegue ate **Configuracoes > Retencao** e configure:

- Periodo de retencao de alertas (padrao: 90 dias)
- Periodo de retencao de ameacas (padrao: 365 dias)
- Periodo de retencao de registros de auditoria (padrao: 365 dias)
- Periodo de retencao de eventos da linha do tempo (padrao: 30 dias)

### 10.6 Controle de Acesso Baseado em Funcoes

Navegue ate **Configuracoes > Usuarios > Adicionar Usuario** para criar usuarios com funcoes apropriadas.

**Funcoes disponiveis:** Consulte a [Secao 14: Tabela de Referencia de Roles](#14-tabela-de-referencia-de-roles).

---

## 11. Backup e Recuperacao

### 11.1 Procedimentos de Backup do Banco de Dados

**Backup manual usando pg_dump:**

```bash
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### 11.2 Scripts de Backup Automatico

Crie `/etc/cron.d/blacksentinel-backup`:

```bash
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel/blacksentinel_$(date +\%Y\%m\%d).dump.gz
```

### 11.3 Restaurar a partir de Backup

```bash
# Parar o servico do backend
pm2 stop blacksentinel-api

# Restaurar o banco de dados
gunzip -c backup_20260630_020000.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel --verbose

# Reiniciar o servico do backend
pm2 start blacksentinel-api
```

### 11.4 Procedimentos de Recuperacao de Desastres

1. Identifique o ponto de falha
2. Provisione nova infraestrutura se necessario
3. Restaure o banco de dados a partir do backup mais recente
4. Implante o backend e frontend
5. Verifique a conectividade dos agentes
6. Teste a funcionalidade critica

### 11.5 Consideracoes de RPO e RTO

| Metrica | Objetivo | Descricao |
|---------|----------|-----------|
| RPO | 1 hora | Maxima perda de dados aceitavel |
| RTO | 4 horas | Maximo tempo de inatividade aceitavel |

---

## 12. Monitoramento e Manutencao

### 12.1 Endpoints de Verificacao de Saude

```bash
# Verificacao de saude da API
curl http://localhost:3001/api/health

# Resposta esperada:
# {"status":"ok","version":"1.0.0","uptime":123.456}
```

### 12.2 Monitoramento de Logs

```bash
# Ver logs da API com PM2
pm2 logs blacksentinel-api

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 12.3 Monitoramento de Desempenho

Monitore as seguintes metricas:

- Tempo de resposta da API (objetivo: < 200ms p95)
- Utilizacao do pool de conexoes do banco de dados
- Uso de memoria do Redis
- Utilizacao de CPU e memoria
- E/S de disco e capacidade de armazenamento

### 12.4 Manutencao do Banco de Dados

```bash
# Executar VACUUM ANALYZE
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"

# Reconstruir indices
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

### 12.5 Procedimentos de Atualizacao

**Atualizacao do backend:**

```bash
cd backend
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart blacksentinel-api
```

**Atualizacao do frontend:**

```bash
cd blacksentinel-guardian
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/guardian/html/
sudo systemctl reload nginx
```

---

## 13. Solucao de Problemas

### 13.1 Problemas Comuns e Solucoes

| Problema | Solucao |
|----------|---------|
| API nao inicia | Verifique a configuracao `.env` e garanta que todas as variaveis necessarias estejam definidas |
| Conexao recusada ao banco de dados | Verifique se o PostgreSQL esta em execucao e se a string de conexao esta correta |
| Conexao recusada ao Redis | Verifique se o Redis esta em execucao: `redis-cli ping` |
| Build falha | Execute `npm ci` para instalar dependencias limpas |
| Frontend mostra pagina em branco | Verifique se `VITE_API_URL` esta corretamente definido em `.env.production` |

### 13.2 Erros de Conexao Recusada

```bash
# Verificar se o PostgreSQL esta escutando
sudo ss -tlnp | grep 5432

# Verificar se o Redis esta escutando
sudo ss -tlnp | grep 6379

# Verificar se a API esta escutando
sudo ss -tlnp | grep 3001
```

### 13.3 Falhas de Autenticacao

- Verifique se JWT_SECRET esta definido e e consistente
- Verifique se os tokens nao expiraram
- Garanta que CORS_ORIGINS inclua seu dominio frontend
- Verifique se a conta do usuario esta ativa e nao esta bloqueada

### 13.4 Problemas de Conexao com o Banco de Dados

```bash
# Testar conexao manualmente
psql -h localhost -U blacksentinel_user -d blacksentinel

# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Verificar limites de conexao
sudo -u postgres psql -c "SHOW max_connections;"
```

### 13.5 Agente Nao Conecta

1. Verifique a conectividade de rede do agente ao servidor
2. Verifique as regras do firewall para permitir a porta de saida 8443
3. Verifique se o token de registro e valido
4. Verifique os logs do agente para mensagens de erro
5. Garanta que o certificado SSL do servidor e confiavel pelo agente

### 13.6 Falhas de Build

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm ci

# Limpar cache de build do TypeScript
rm -rf dist
npm run build
```

### 13.7 Habilitar Log de Depuracao

Defina a seguinte variavel de ambiente:

```
LOG_LEVEL=debug
```

Reinicie o servico para aplicar as alteracoes.

---

## 14. Tabela de Referencia de Roles

| Role | Descricao | Ver Painel | Ver Endpoints | Ver Ameacas | Editar Ameacas | Excluir Registros | Gerenciar Usuarios | Gerenciar Config. | Gerenciar Integracoes | Ver Registro Auditoria | Usar Copiloto IA |
|------|-----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | Acesso total ao sistema | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim |
| ADMIN | Gerenciamento do sistema | Sim | Sim | Sim | Sim | Nao | Sim | Sim | Sim | Sim | Sim |
| SOC_TIER_5 | Lider/Gerente SOC | Sim | Sim | Sim | Sim | Sim | Nao | Nao | Nao | Sim | Sim |
| SOC_TIER_4 | Analista SOC Senior | Sim | Sim | Sim | Sim | Nao | Nao | Nao | Nao | Sim | Sim |
| SOC_TIER_3 | Analista SOC Avancado | Sim | Sim | Sim | Sim | Nao | Nao | Nao | Nao | Sim | Nao |
| SOC_TIER_2 | Analista SOC Intermediario | Sim | Sim | Sim | Parcial | Nao | Nao | Nao | Nao | Sim | Nao |
| SOC_TIER_1 | Analista SOC Junior | Sim | Sim | Sim | Nao | Nao | Nao | Nao | Nao | Nao | Nao |
| AUDITOR_3 | Auditor de Seguranca Senior | Sim | Sim | Sim | Nao | Nao | Nao | Nao | Nao | Sim | Nao |
| AUDITOR_2 | Auditor de Seguranca | Sim | Sim | Parcial | Nao | Nao | Nao | Nao | Nao | Sim | Nao |
| AUDITOR_1 | Auditor Junior | Sim | Parcial | Parcial | Nao | Nao | Nao | Nao | Nao | Nao | Nao |
| IT | Operacoes de TI | Sim | Sim | Nao | Nao | Nao | Nao | Parcial | Nao | Nao | Nao |
| ANALYST | Analista Geral | Sim | Sim | Sim | Nao | Nao | Nao | Nao | Nao | Nao | Nao |
| VIEWER | Somente leitura | Sim | Parcial | Parcial | Nao | Nao | Nao | Nao | Nao | Nao | Nao |

---

## 15. Referencia da API

### 15.1 URL Base

```
https://api.seudominio.com/api
```

### 15.2 Formato do Cabecalho de Autenticacao

```
Authorization: Bearer <JWT_TOKEN>
```

### 15.3 Endpoints da API

| Metodo | Caminho | Descricao | Role Necessaria |
|--------|---------|-----------|-----------------|
| POST | `/api/auth/login` | Login do usuario | Publico |
| POST | `/api/auth/register` | Registro de usuario | Publico |
| POST | `/api/auth/refresh` | Atualizar token de acesso | Publico |
| POST | `/api/auth/logout` | Logout do usuario | Autenticado |
| POST | `/api/auth/mfa/setup` | Habilitar MFA | Autenticado |
| POST | `/api/auth/mfa/verify` | Verificar codigo MFA | Autenticado |
| GET | `/api/health` | Verificacao de saude | Publico |
| GET | `/api/users` | Listar todos os usuarios | ADMIN+ |
| POST | `/api/users` | Criar usuario | ADMIN+ |
| GET | `/api/users/:id` | Obter usuario por ID | ADMIN+ |
| PUT | `/api/users/:id` | Atualizar usuario | ADMIN+ |
| DELETE | `/api/users/:id` | Excluir usuario | SUPER_ADMIN |
| GET | `/api/endpoints` | Listar todos os endpoints | SOC_TIER_1+ |
| POST | `/api/endpoints` | Registrar endpoint | IT+ |
| GET | `/api/endpoints/:id` | Obter detalhes do endpoint | SOC_TIER_1+ |
| PUT | `/api/endpoints/:id` | Atualizar endpoint | SOC_TIER_2+ |
| DELETE | `/api/endpoints/:id` | Excluir endpoint | ADMIN+ |
| GET | `/api/threats` | Listar todas as ameacas | SOC_TIER_1+ |
| POST | `/api/threats` | Criar entrada de ameaca | SOC_TIER_2+ |
| GET | `/api/threats/:id` | Obter detalhes da ameaca | SOC_TIER_1+ |
| PUT | `/api/threats/:id` | Atualizar ameaca | SOC_TIER_2+ |
| DELETE | `/api/threats/:id` | Excluir ameaca | SOC_TIER_4+ |
| GET | `/api/alerts` | Listar todos os alertas | SOC_TIER_1+ |
| POST | `/api/alerts` | Criar alerta | SOC_TIER_1+ |
| GET | `/api/alerts/:id` | Obter detalhes do alerta | SOC_TIER_1+ |
| PUT | `/api/alerts/:id` | Atualizar alerta | SOC_TIER_2+ |
| DELETE | `/api/alerts/:id` | Excluir alerta | SOC_TIER_3+ |
| GET | `/api/timeline` | Listar eventos da linha do tempo | SOC_TIER_1+ |
| GET | `/api/vulnerabilities` | Listar vulnerabilidades | SOC_TIER_1+ |
| POST | `/api/vulnerabilities` | Criar vulnerabilidade | SOC_TIER_3+ |
| GET | `/api/firewall/rules` | Listar regras de firewall | SOC_TIER_2+ |
| POST | `/api/firewall/rules` | Criar regra de firewall | SOC_TIER_3+ |
| GET | `/api/usb` | Listar dispositivos USB | SOC_TIER_1+ |
| POST | `/api/usb` | Registrar dispositivo USB | IT+ |
| POST | `/api/response` | Executar acao de resposta | SOC_TIER_3+ |
| GET | `/api/audit` | Listar registros de auditoria | AUDITOR_1+ |
| GET | `/api/dashboard` | Metricas do painel | SOC_TIER_1+ |
| POST | `/api/copilot` | Enviar consulta IA | SOC_TIER_3+ |
| GET | `/api/settings` | Obter configuracoes | ADMIN+ |
| PUT | `/api/settings` | Atualizar configuracoes | SUPER_ADMIN |
| GET | `/api/integrations` | Listar integracoes | ADMIN+ |
| PUT | `/api/integrations/:id` | Atualizar integracao | ADMIN+ |

### 15.4 Formato de Resposta de Erro

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token invalido ou expirado",
    "details": null
  }
}
```

**Codigos de erro:** `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `RATE_LIMITED`

### 15.5 Formato de Paginacao

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

## 16. Referencia de Variaveis de Ambiente

| Variavel | Necessaria | Padrao | Descricao | Exemplo |
|----------|:----------:|--------|-----------|---------|
| PORT | Nao | `3001` | Porta do servidor backend | `3001` |
| NODE_ENV | Sim | `development` | Modo de ambiente | `production` |
| DATABASE_URL | Sim | `file:./dev.db` | String de conexao PostgreSQL | `postgresql://user:pass@host:5432/db` |
| REDIS_URL | Sim | `redis://localhost:6379` | String de conexao Redis | `redis://redis:6379` |
| JWT_SECRET | Sim | Nenhum | Segredo de assinatura JWT (min 32 caracteres) | `a1b2c3d4e5f6...` |
| JWT_REFRESH_SECRET | Sim | Nenhum | Segredo de assinatura de token de atualizacao | `z9y8x7w6v5u4...` |
| JWT_EXPIRES_IN | Nao | `15m` | Expiracao do token de acesso | `15m` |
| MFA_ISSUER | Nao | `BlackSentinel Guardian` | Emissor MFA | `BlackSentinel Guardian` |
| CORS_ORIGINS | Sim | `http://localhost:5173` | Origens CORS permitidas | `https://guardian.exemplo.com` |
| LOG_LEVEL | Nao | `info` | Nivel de log | `debug` |
| AGENT_SIGNING_KEY | Nao | Nenhum | Chave de assinatura do binario do agente | `sua-chave-de-assinatura` |
| TLS_CERT_PATH | Nao | Nenhum | Caminho do certificado TLS | `/etc/ssl/certs/guardian.pem` |
| TLS_KEY_PATH | Nao | Nenhum | Caminho da chave privada TLS | `/etc/ssl/private/guardian.key` |
| VITE_API_URL | Sim | `http://localhost:3001` | URL da API backend (frontend) | `https://api.exemplo.com` |
| VITE_WS_URL | Nao | `ws://localhost:3001/ws` | URL WebSocket (frontend) | `wss://api.exemplo.com/ws` |
| POSTGRES_PASSWORD | Docker | `postgres` | Senha do PostgreSQL (Docker) | `senha_segura` |
| REDIS_PASSWORD | Docker | Nenhum | Senha do Redis (Docker) | `senha_segura` |

---

**Fim do Documento**

Para suporte adicional, entre em contato: support@blacksentinel.io
