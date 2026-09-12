# BlackSentinel Guardian - 部署手册

**版本:** 1.0.0  
**最后更新:** 2026年6月  
**分类:** 内部/合作伙伴使用  

---

## 目录

1. [简介](#1-简介)
2. [前提条件](#2-前提条件)
3. [数据库设置](#3-数据库设置)
4. [后端部署](#4-后端部署)
5. [前端部署](#5-前端部署)
6. [Docker部署](#6-docker部署)
7. [Kubernetes部署](#7-kubernetes部署)
8. [终端代理安装](#8-终端代理安装)
9. [安全加固](#9-安全加固)
10. [初始配置](#10-初始配置)
11. [备份与恢复](#11-备份与恢复)
12. [监控与维护](#12-监控与维护)
13. [故障排除](#13-故障排除)
14. [角色参考表](#14-角色参考表)
15. [API参考](#15-api参考)
16. [环境变量参考](#16-环境变量参考)

---

## 1. 简介

### 1.1 什么是BlackSentinel Guardian

BlackSentinel Guardian是一个下一代自主终端防御平台,集成了EPP(终端保护平台)、EDR(终端检测与响应)、XDR(扩展检测与响应)、威胁狩猎、行为分析、零信任、诱骗技术、勒索软件防护、内存保护、AI检测、漏洞感知和自动修复到一个统一的安全平台中。

该平台为安全运营团队提供实时可见性、威胁情报和跨组织所有终端的自动化响应能力。

### 1.2 系统架构概述

BlackSentinel Guardian采用现代三层架构:

```
[浏览器 / Web界面] <--> [React前端] <--> [Express API后端] <--> [PostgreSQL / Redis]
                                                              |
                                                       [代理通信]
                                                              |
                                               [终端代理 (Windows/Linux/macOS)]
```

**组件细分:**

| 组件 | 技术 | 用途 |
|------|------|------|
| 前端 | React 19, TypeScript, Vite, Tailwind CSS v4 | 基于Web的管理控制台 |
| 后端 | Express.js, TypeScript, Prisma ORM | REST API和WebSocket服务器 |
| 数据库 | PostgreSQL 16 | 持久数据存储 |
| 缓存 | Redis 7 | 会话管理、实时缓存 |
| 代理 | 平台特定二进制文件 | 终端监控和保护 |
| WebSocket | ws库 | 实时事件流 |

### 1.3 硬件要求

**最低要求(开发/实验室):**

| 资源 | 要求 |
|------|------|
| CPU | 2核, 2.0 GHz |
| RAM | 4 GB |
| 磁盘 | 20 GB SSD |
| 网络 | 100 Mbps |

**生产环境推荐(最多500个终端):**

| 资源 | 要求 |
|------|------|
| CPU | 8核, 3.0 GHz |
| RAM | 16 GB |
| 磁盘 | 100 GB NVMe SSD |
| 网络 | 1 Gbps |

**企业级生产环境(500+终端):**

| 资源 | 要求 |
|------|------|
| CPU | 16+核, 3.5 GHz |
| RAM | 32+ GB |
| 磁盘 | 500+ GB NVMe SSD (RAID 10) |
| 网络 | 10 Gbps |

### 1.4 支持的操作系统

**服务器部署:**

- Ubuntu 22.04 LTS / 24.04 LTS
- Debian 12 (Bookworm)
- Rocky Linux 9
- Amazon Linux 2023
- RHEL 9
- CentOS Stream 9

**代理安装:**

- Windows 10/11 (x64)
- Windows Server 2019/2022
- macOS 12 Monterey或更高版本
- Ubuntu 20.04+ / Debian 11+
- CentOS/RHEL 8+
- Rocky Linux 8+
- Amazon Linux 2+

---

## 2. 前提条件

### 2.1 必需软件

在继续之前安装以下软件:

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x LTS或更高 | 后端运行时 |
| PostgreSQL | 15.x或更高(推荐16) | 数据库 |
| Redis | 7.x或更高 | 缓存和会话 |
| Docker | 24.x或更高(可选) | 容器化部署 |
| Docker Compose | 2.x或更高(可选) | 多容器编排 |
| npm | 10.x或更高 | 包管理 |
| Git | 2.40+ | 源代码管理 |
| Nginx | 1.24+(生产) | 反向代理和静态文件服务 |

**在Ubuntu/Debian上安装Node.js:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # 应输出v20.x.x
npm --version   # 应输出10.x.x
```

**在Ubuntu/Debian上安装PostgreSQL 16:**

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt-get update
sudo apt-get install -y postgresql-16
```

**在Ubuntu/Debian上安装Redis 7:**

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.2 网络要求

确保以下端口可访问:

| 端口 | 协议 | 服务 | 方向 |
|------|------|------|------|
| 3001 | TCP | 后端API | 入站 |
| 5173 | TCP | Vite开发服务器 | 入站(仅开发) |
| 443 | TCP | HTTPS(生产) | 入站 |
| 80 | TCP | HTTP(重定向到HTTPS) | 入站 |
| 5432 | TCP | PostgreSQL | 仅内部 |
| 6379 | TCP | Redis | 仅内部 |
| 8443 | TCP | 代理注册 | 入站 |

### 2.3 SSL/TLS证书要求

生产部署需要SSL/TLS证书。选项包括:

- **Let's Encrypt:** 通过certbot获取免费自动证书
- **商业CA:** DigiCert, Comodo, GlobalSign等
- **内部CA:** 用于气隙或企业环境

**获取Let's Encrypt证书:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.yourdomain.com -d api.yourdomain.com
```

### 2.4 DNS配置

配置以下DNS记录:

| 记录 | 类型 | 值 | TTL |
|------|------|-----|-----|
| guardian.yourdomain.com | A | 服务器IP | 300 |
| api.yourdomain.com | A | 服务器IP | 300 |

---

## 3. 数据库设置

### 3.1 PostgreSQL安装

验证PostgreSQL正在运行:

```bash
sudo systemctl status postgresql
sudo systemctl enable postgresql
```

### 3.2 创建数据库和用户

```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建数据库
CREATE DATABASE blacksentinel;

# 创建专用用户并设置强密码
CREATE USER blacksentinel_user WITH PASSWORD '您的安全密码';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;

-- 对于PostgreSQL 15+, 还需授予schema访问权限
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blacksentinel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blacksentinel_user;

-- 退出
\q
```

### 3.3 运行Prisma迁移

```bash
cd backend

# 安装依赖
npm install

# 在.env文件中设置DATABASE_URL
echo 'DATABASE_URL=postgresql://blacksentinel_user:您的安全密码@localhost:5432/blacksentinel' > .env

# 生成Prisma客户端
npx prisma generate

# 运行迁移
npx prisma migrate deploy
```

### 3.4 数据库初始化(Seed)

Seed脚本创建首次登录所需的初始SUPER_ADMIN用户。

```bash
# 在.env中设置所需的环境变量
cat >> .env << 'EOF'
JWT_SECRET=您的随机密钥至少32个字符
JWT_REFRESH_SECRET=您的刷新密钥至少32个字符
REDIS_URL=redis://localhost:6379
EOF

# 运行seed脚本
npm run seed
```

**默认SUPER_ADMIN凭据(首次登录后立即更改):**

- 邮箱: `admin@blacksentinel.io`
- 密码: `admin123`

### 3.5 连接字符串格式

```
postgresql://用户名:密码@主机:端口/数据库?schema=public
```

**示例:**

```
# 本地开发
postgresql://postgres:password@localhost:5432/blacksentinel

# 远程服务器
postgresql://blacksentinel_user:安全密码@db.example.com:5432/blacksentinel

# 使用SSL(大多数云提供商要求)
postgresql://blacksentinel_user:安全密码@db.example.com:5432/blacksentinel?sslmode=require
```

---

## 4. 后端部署

### 4.1 安装依赖

```bash
cd backend
npm ci
```

### 4.2 环境变量配置

在`backend/`目录中创建`.env`文件:

```bash
cat > .env << 'ENVEOF'
# ─── 服务器 ─────────────────────────────────────
PORT=3001
NODE_ENV=production

# ─── 认证 ─────────────────────────────────────────
JWT_SECRET=替换为64个随机字符
JWT_REFRESH_SECRET=替换为64个随机字符
JWT_EXPIRES_IN=15m
MFA_ISSUER=BlackSentinel Guardian

# ─── 数据库 ───────────────────────────────────────
DATABASE_URL=postgresql://blacksentinel_user:您的密码@localhost:5432/blacksentinel

# ─── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── CORS ───────────────────────────────────────────
CORS_ORIGINS=https://guardian.yourdomain.com

# ─── 日志 ────────────────────────────────────────────
LOG_LEVEL=info

# ─── 安全 ───────────────────────────────────────────
AGENT_SIGNING_KEY=替换为安全密钥
TLS_CERT_PATH=/etc/ssl/certs/guardian.pem
TLS_KEY_PATH=/etc/ssl/private/guardian.key
ENVEOF
```

### 4.3 编译TypeScript项目

```bash
cd backend
npm run build
```

### 4.4 启动服务器

```bash
# 开发模式(带自动重载)
npm run dev

# 生产模式
npm run start
```

### 4.5 PM2进程管理

全局安装PM2并配置生产环境:

```bash
# 安装PM2
npm install -g pm2

# 使用PM2启动API
cd backend
pm2 start dist/server.js --name blacksentinel-api

# 保存进程列表并配置启动
pm2 save
pm2 startup

# 常用PM2命令
pm2 status
pm2 logs blacksentinel-api
pm2 restart blacksentinel-api
pm2 stop blacksentinel-api
pm2 delete blacksentinel-api
```

### 4.6 日志配置

**配置PM2日志轮转:**

```bash
npm install -g pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

**通过环境变量配置应用日志:**

```
LOG_LEVEL=info          # 选项: debug, info, warn, error
```

---

## 5. 前端部署

### 5.1 安装依赖

```bash
cd blacksentinel-guardian
npm ci
```

### 5.2 环境变量

在前端根目录创建`.env.production`:

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws
EOF
```

### 5.3 生产环境编译

```bash
npm run build
```

这将在`dist/`目录中生成优化的静态文件。

### 5.4 使用Nginx提供服务

**安装Nginx:**

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

**Nginx配置:**

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

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss://api.yourdomain.com https://api.yourdomain.com" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml;

    # 静态文件缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API反向代理
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

    # WebSocket代理
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

**部署前端文件:**

```bash
sudo mkdir -p /var/www/guardian/html
sudo cp -r dist/* /var/www/guardian/html/
sudo chown -R www-data:www-data /var/www/guardian
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Docker部署

### 6.1 docker-compose.yml(完整栈)

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

### 6.2 构建自定义镜像

```bash
# 构建前端镜像
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .

# 构建后端镜像
docker build -t blacksentinel/guardian-api:latest ./backend
```

### 6.3 Docker中的环境变量

在项目根目录创建`.env`文件:

```bash
POSTGRES_PASSWORD=您的安全数据库密码
REDIS_PASSWORD=您的安全Redis密码
JWT_SECRET=您的64字符随机密钥
JWT_REFRESH_SECRET=您的64字符刷新密钥
```

### 6.4 数据持久化的卷挂载

docker-compose.yml定义了两个命名卷:

- `postgres_data`: 在`/var/lib/postgresql/data`持久化PostgreSQL数据
- `redis_data`: 在`/data`持久化Redis数据

### 6.5 健康检查

部署后验证服务健康状态:

```bash
# 检查所有服务
docker compose ps

# 检查API健康状态
curl http://localhost:3001/api/health

# 预期响应:
# {"status":"ok","version":"1.0.0","uptime":123.456}

# 查看日志
docker compose logs -f api
docker compose logs -f db
docker compose logs -f redis
```

---

## 7. Kubernetes部署

### 7.1 命名空间设置

```bash
kubectl create namespace blacksentinel
```

### 7.2 Secret和ConfigMap

```bash
# 创建secret
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:您的密码@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='您的64字符随机密钥' \
  --from-literal=jwt-refresh-secret='您的64字符刷新密钥' \
  --from-literal=postgres-password='您的密码'
```

### 7.3 部署清单

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

### 7.4 Service和Ingress配置

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

### 7.5 PostgreSQL的持久卷

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

### 7.6 扩展考虑

- API部署默认配置为3个副本。根据负载调整`spec.replicas`。
- 启用Horizontal Pod Autoscaler (HPA)实现自动扩展:

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

## 8. 终端代理安装

### 8.1 注册新终端

1. 登录BlackSentinel Guardian Web控制台
2. 导航到**终端 > 清单**
3. 点击**添加终端**
4. 提供终端名称
5. 复制生成的注册命令

### 8.2 代理安装命令

**Windows (PowerShell):**

```powershell
# 以管理员身份运行
irm https://install.blacksentinel.io/agent.ps1 | iex
```

**Linux (bash):**

```bash
# 以root身份运行
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

**macOS (bash):**

```bash
# 以root身份运行
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 代理配置

代理配置文件位于:

- **Windows:** `C:\ProgramData\BlackSentinel\agent.conf`
- **Linux:** `/etc/blacksentinel/agent.conf`
- **macOS:** `/Library/BlackSentinel/agent.conf`

**配置选项:**

```ini
[server]
url = https://api.yourdomain.com
registration_token = 您的注册令牌

[agent]
heartbeat_interval = 30
log_level = info
```

### 8.4 验证代理连接

```bash
# 检查代理状态
blacksentinel-agent status

# 预期输出:
# 代理状态: 运行中
# 已连接: 是
# 服务器: https://api.yourdomain.com
# 运行时间: 12345秒
```

### 8.5 代理连接问题故障排除

| 问题 | 解决方案 |
|------|----------|
| 代理无法到达服务器 | 验证端口8443是否开放,防火墙是否允许出站连接 |
| 注册失败 | 验证注册令牌是否有效且未过期 |
| 代理显示"降级" | 检查代理日志: `journalctl -u blacksentinel-agent -f` |
| TLS证书错误 | 确保代理信任服务器证书或安装CA证书 |

---

## 9. 安全加固

### 9.1 立即更改默认凭据

安装后立即:

1. 更改SUPER_ADMIN的默认密码
2. 更改所有默认数据库密码
3. 轮换JWT密钥
4. 更新Redis密码

### 9.2 为所有管理员账户启用MFA

所有管理员账户必须启用MFA:

1. 以管理员身份登录
2. 导航到**设置 > 安全**
3. 启用MFA
4. 使用身份验证器应用(Google Authenticator, Authy等)扫描二维码
5. 输入验证码

### 9.3 防火墙规则

**UFW (Ubuntu/Debian):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 80/tcp    # HTTP (用于Let's Encrypt)
sudo ufw deny 3001/tcp   # 阻止直接API访问
sudo ufw deny 5432/tcp   # 阻止直接PostgreSQL访问
sudo ufw deny 6379/tcp   # 阻止直接Redis访问
sudo ufw enable
```

### 9.4 SSL/TLS配置

- 仅使用TLS 1.2或更高版本
- 禁用弱密码套件
- 启用HSTS头
- 对代理通信使用证书固定

### 9.5 静态数据加密

如果PostgreSQL发行版支持,启用PostgreSQL透明数据加密(TDE),或使用磁盘级加密(LUKS, BitLocker)。

### 9.6 审计日志审查

定期审查审计日志以发现可疑活动:

```sql
-- 查看最近的管理员操作
SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;

-- 查看失败的登录尝试
SELECT * FROM "AuditLog" WHERE action LIKE '%login%' AND details->>'success' = 'false';
```

### 9.7 定期安全更新

```bash
# 更新系统包
sudo apt-get update && sudo apt-get upgrade -y

# 更新Node.js依赖
cd backend && npm audit fix
cd .. && npm audit fix
```

---

## 10. 初始配置

### 10.1 首次以SUPER_ADMIN登录

1. 在浏览器中打开`https://guardian.yourdomain.com`
2. 使用默认SUPER_ADMIN凭据登录
3. 立即更改默认密码
4. 配置MFA

### 10.2 创建部门和标签

1. 导航到**设置 > 部门**
2. 点击**添加部门**
3. 输入部门名称和描述
4. 导航到**设置 > 标签**
5. 创建标签以分类终端(例如"关键"、"财务"、"工程")

### 10.3 配置集成

导航到**设置 > 集成**并配置:

| 集成 | 所需配置 |
|------|----------|
| 邮件(SMTP) | SMTP主机、端口、用户名、密码、发件人地址 |
| Slack | Webhook URL或OAuth令牌 |
| Microsoft Teams | Webhook URL |
| SIEM | API端点、认证令牌 |
| Active Directory | LDAP/AD服务器地址、基础DN、绑定凭据 |

### 10.4 设置通知规则

导航到**设置 > 通知**并创建规则:

1. 定义触发条件(严重性、事件类型、终端)
2. 定义通知渠道(邮件、Slack、Teams、webhook)
3. 设置通知频率和升级规则

### 10.5 配置保留策略

导航到**设置 > 保留**并配置:

- 告警保留期(默认: 90天)
- 威胁保留期(默认: 365天)
- 审计日志保留期(默认: 365天)
- 时间线事件保留期(默认: 30天)

### 10.6 基于角色的访问控制

导航到**设置 > 用户 > 添加用户**,创建具有适当角色的用户。

**可用角色:** 参见[第14节: 角色参考表](#14-角色参考表)。

---

## 11. 备份与恢复

### 11.1 数据库备份程序

**使用pg_dump手动备份:**

```bash
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### 11.2 自动化备份脚本

创建`/etc/cron.d/blacksentinel-backup`:

```bash
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel/blacksentinel_$(date +\%Y\%m\%d).dump.gz
```

### 11.3 从备份恢复

```bash
# 停止后端服务
pm2 stop blacksentinel-api

# 恢复数据库
gunzip -c backup_20260630_020000.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel --verbose

# 重启后端服务
pm2 start blacksentinel-api
```

### 11.4 灾难恢复程序

1. 识别故障点
2. 如有需要,配置新基础设施
3. 从最近的备份恢复数据库
4. 部署后端和前端
5. 验证代理连接性
6. 测试关键功能

### 11.5 RPO和RTO考虑

| 指标 | 目标 | 描述 |
|------|------|------|
| RPO | 1小时 | 可接受的最大数据丢失 |
| RTO | 4小时 | 可接受的最大停机时间 |

---

## 12. 监控与维护

### 12.1 健康检查端点

```bash
# API健康检查
curl http://localhost:3001/api/health

# 预期响应:
# {"status":"ok","version":"1.0.0","uptime":123.456}
```

### 12.2 日志监控

```bash
# 使用PM2查看API日志
pm2 logs blacksentinel-api

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看PostgreSQL日志
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 12.3 性能监控

监控以下指标:

- API响应时间(目标: < 200ms p95)
- 数据库连接池利用率
- Redis内存使用
- CPU和内存利用率
- 磁盘I/O和存储容量

### 12.4 数据库维护

```bash
# 运行VACUUM ANALYZE
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"

# 重建索引
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

### 12.5 升级程序

**后端升级:**

```bash
cd backend
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart blacksentinel-api
```

**前端升级:**

```bash
cd blacksentinel-guardian
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/guardian/html/
sudo systemctl reload nginx
```

---

## 13. 故障排除

### 13.1 常见问题和解决方案

| 问题 | 解决方案 |
|------|----------|
| API无法启动 | 检查`.env`配置,确保所有必需变量已设置 |
| 数据库连接被拒绝 | 验证PostgreSQL是否正在运行,连接字符串是否正确 |
| Redis连接被拒绝 | 验证Redis是否正在运行: `redis-cli ping` |
| 构建失败 | 运行`npm ci`干净安装依赖 |
| 前端显示空白页 | 检查`VITE_API_URL`是否在`.env.production`中正确设置 |

### 13.2 连接被拒绝错误

```bash
# 验证PostgreSQL正在监听
sudo ss -tlnp | grep 5432

# 验证Redis正在监听
sudo ss -tlnp | grep 6379

# 验证API正在监听
sudo ss -tlnp | grep 3001
```

### 13.3 认证失败

- 验证JWT_SECRET已设置且一致
- 检查令牌是否未过期
- 确保CORS_ORIGINS包含您的前端域名
- 验证用户账户处于活动状态且未被锁定

### 13.4 数据库连接问题

```bash
# 手动测试连接
psql -h localhost -U blacksentinel_user -d blacksentinel

# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查连接限制
sudo -u postgres psql -c "SHOW max_connections;"
```

### 13.5 代理无法连接

1. 验证从代理到服务器的网络连接性
2. 检查防火墙规则是否允许出站端口8443
3. 验证注册令牌是否有效
4. 检查代理日志中的错误消息
5. 确保服务器SSL证书被代理信任

### 13.6 构建失败

```bash
# 清理node_modules并重新安装
rm -rf node_modules package-lock.json
npm ci

# 清理TypeScript构建缓存
rm -rf dist
npm run build
```

### 13.7 启用调试日志

设置以下环境变量:

```
LOG_LEVEL=debug
```

重启服务以应用更改。

---

## 14. 角色参考表

| 角色 | 描述 | 查看面板 | 查看终端 | 查看威胁 | 编辑威胁 | 删除记录 | 管理用户 | 管理设置 | 管理集成 | 查看审计日志 | 使用AI助手 |
|------|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | 完全系统访问 | 是 | 是 | 是 | 是 | 是 | 是 | 是 | 是 | 是 | 是 |
| ADMIN | 系统管理 | 是 | 是 | 是 | 是 | 否 | 是 | 是 | 是 | 是 | 是 |
| SOC_TIER_5 | SOC负责人/经理 | 是 | 是 | 是 | 是 | 是 | 否 | 否 | 否 | 是 | 是 |
| SOC_TIER_4 | 高级SOC分析师 | 是 | 是 | 是 | 是 | 否 | 否 | 否 | 否 | 是 | 是 |
| SOC_TIER_3 | 高级SOC分析师 | 是 | 是 | 是 | 是 | 否 | 否 | 否 | 否 | 是 | 否 |
| SOC_TIER_2 | 中级SOC分析师 | 是 | 是 | 是 | 部分 | 否 | 否 | 否 | 否 | 是 | 否 |
| SOC_TIER_1 | 初级SOC分析师 | 是 | 是 | 是 | 否 | 否 | 否 | 否 | 否 | 否 | 否 |
| AUDITOR_3 | 高级安全审计员 | 是 | 是 | 是 | 否 | 否 | 否 | 否 | 否 | 是 | 否 |
| AUDITOR_2 | 安全审计员 | 是 | 是 | 部分 | 否 | 否 | 否 | 否 | 否 | 是 | 否 |
| AUDITOR_1 | 初级审计员 | 是 | 部分 | 部分 | 否 | 否 | 否 | 否 | 否 | 否 | 否 |
| IT | IT运维 | 是 | 是 | 否 | 否 | 否 | 否 | 部分 | 否 | 否 | 否 |
| ANALYST | 通用分析师 | 是 | 是 | 是 | 否 | 否 | 否 | 否 | 否 | 否 | 否 |
| VIEWER | 只读访问 | 是 | 部分 | 部分 | 否 | 否 | 否 | 否 | 否 | 否 | 否 |

---

## 15. API参考

### 15.1 基础URL

```
https://api.yourdomain.com/api
```

### 15.2 认证头格式

```
Authorization: Bearer <JWT_TOKEN>
```

### 15.3 API端点

| 方法 | 路径 | 描述 | 所需角色 |
|------|------|------|----------|
| POST | `/api/auth/login` | 用户登录 | 公开 |
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/refresh` | 刷新访问令牌 | 公开 |
| POST | `/api/auth/logout` | 用户登出 | 已认证 |
| POST | `/api/auth/mfa/setup` | 启用MFA | 已认证 |
| POST | `/api/auth/mfa/verify` | 验证MFA代码 | 已认证 |
| GET | `/api/health` | 健康检查 | 公开 |
| GET | `/api/users` | 列出所有用户 | ADMIN+ |
| POST | `/api/users` | 创建用户 | ADMIN+ |
| GET | `/api/users/:id` | 按ID获取用户 | ADMIN+ |
| PUT | `/api/users/:id` | 更新用户 | ADMIN+ |
| DELETE | `/api/users/:id` | 删除用户 | SUPER_ADMIN |
| GET | `/api/endpoints` | 列出所有终端 | SOC_TIER_1+ |
| POST | `/api/endpoints` | 注册终端 | IT+ |
| GET | `/api/endpoints/:id` | 获取终端详情 | SOC_TIER_1+ |
| PUT | `/api/endpoints/:id` | 更新终端 | SOC_TIER_2+ |
| DELETE | `/api/endpoints/:id` | 删除终端 | ADMIN+ |
| GET | `/api/threats` | 列出所有威胁 | SOC_TIER_1+ |
| POST | `/api/threats` | 创建威胁条目 | SOC_TIER_2+ |
| GET | `/api/threats/:id` | 获取威胁详情 | SOC_TIER_1+ |
| PUT | `/api/threats/:id` | 更新威胁 | SOC_TIER_2+ |
| DELETE | `/api/threats/:id` | 删除威胁 | SOC_TIER_4+ |
| GET | `/api/alerts` | 列出所有告警 | SOC_TIER_1+ |
| POST | `/api/alerts` | 创建告警 | SOC_TIER_1+ |
| GET | `/api/alerts/:id` | 获取告警详情 | SOC_TIER_1+ |
| PUT | `/api/alerts/:id` | 更新告警 | SOC_TIER_2+ |
| DELETE | `/api/alerts/:id` | 删除告警 | SOC_TIER_3+ |
| GET | `/api/timeline` | 列出时间线事件 | SOC_TIER_1+ |
| GET | `/api/vulnerabilities` | 列出漏洞 | SOC_TIER_1+ |
| POST | `/api/vulnerabilities` | 创建漏洞 | SOC_TIER_3+ |
| GET | `/api/firewall/rules` | 列出防火墙规则 | SOC_TIER_2+ |
| POST | `/api/firewall/rules` | 创建防火墙规则 | SOC_TIER_3+ |
| GET | `/api/usb` | 列出USB设备 | SOC_TIER_1+ |
| POST | `/api/usb` | 注册USB设备 | IT+ |
| POST | `/api/response` | 执行响应操作 | SOC_TIER_3+ |
| GET | `/api/audit` | 列出审计日志 | AUDITOR_1+ |
| GET | `/api/dashboard` | 面板指标 | SOC_TIER_1+ |
| POST | `/api/copilot` | 发送AI查询 | SOC_TIER_3+ |
| GET | `/api/settings` | 获取系统设置 | ADMIN+ |
| PUT | `/api/settings` | 更新系统设置 | SUPER_ADMIN |
| GET | `/api/integrations` | 列出集成 | ADMIN+ |
| PUT | `/api/integrations/:id` | 更新集成 | ADMIN+ |

### 15.4 错误响应格式

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "无效或过期的令牌",
    "details": null
  }
}
```

**错误代码:** `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `RATE_LIMITED`

### 15.5 分页格式

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

查询参数: `?page=1&limit=20&sort=createdAt&order=desc`

---

## 16. 环境变量参考

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|:----:|--------|------|------|
| PORT | 否 | `3001` | 后端服务器端口 | `3001` |
| NODE_ENV | 是 | `development` | 环境模式 | `production` |
| DATABASE_URL | 是 | `file:./dev.db` | PostgreSQL连接字符串 | `postgresql://user:pass@host:5432/db` |
| REDIS_URL | 是 | `redis://localhost:6379` | Redis连接字符串 | `redis://redis:6379` |
| JWT_SECRET | 是 | 无 | JWT签名密钥(最少32字符) | `a1b2c3d4e5f6...` |
| JWT_REFRESH_SECRET | 是 | 无 | 刷新令牌签名密钥 | `z9y8x7w6v5u4...` |
| JWT_EXPIRES_IN | 否 | `15m` | 访问令牌过期时间 | `15m` |
| MFA_ISSUER | 否 | `BlackSentinel Guardian` | MFA颁发者 | `BlackSentinel Guardian` |
| CORS_ORIGINS | 是 | `http://localhost:5173` | 允许的CORS来源 | `https://guardian.example.com` |
| LOG_LEVEL | 否 | `info` | 日志级别 | `debug` |
| AGENT_SIGNING_KEY | 否 | 无 | 代理二进制签名密钥 | `您的签名密钥` |
| TLS_CERT_PATH | 否 | 无 | TLS证书路径 | `/etc/ssl/certs/guardian.pem` |
| TLS_KEY_PATH | 否 | 无 | TLS私钥路径 | `/etc/ssl/private/guardian.key` |
| VITE_API_URL | 是 | `http://localhost:3001` | 后端API URL(前端) | `https://api.example.com` |
| VITE_WS_URL | 否 | `ws://localhost:3001/ws` | WebSocket URL(前端) | `wss://api.example.com/ws` |
| POSTGRES_PASSWORD | Docker | `postgres` | PostgreSQL密码(Docker) | `安全密码` |
| REDIS_PASSWORD | Docker | 无 | Redis密码(Docker) | `安全密码` |

---

**文档结束**

如需额外支持,请联系: support@blacksentinel.io
