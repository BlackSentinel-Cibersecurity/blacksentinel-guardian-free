# BlackSentinel Guardian - デプロイメントマニュアル

**バージョン:** 1.0.0  
**最終更新:** 2026年6月  
**分類:** 社内/パートナー専用  

---

## 目次

1. [はじめに](#1-はじめに)
2. [前提条件](#2-前提条件)
3. [データベース設定](#3-データベース設定)
4. [バックエンドデプロイメント](#4-バックエンドデプロイメント)
5. [フロントエンドデプロイメント](#5-フロントエンドデプロイメント)
6. [Dockerデプロイメント](#6-dockerデプロイメント)
7. [Kubernetesデプロイメント](#7-kubernetesデプロイメント)
8. [エージェントインストール](#8-エージェントインストール)
9. [セキュリティ強化](#9-セキュリティ強化)
10. [初期設定](#10-初期設定)
11. [バックアップと復旧](#11-バックアップと復旧)
12. [監視とメンテナンス](#12-監視とメンテナンス)
13. [トラブルシューティング](#13-トラブルシューティング)
14. [ロールリファレンス](#14-ロールリファレンス)
15. [APIリファレンス](#15-apiリファレンス)
16. [環境変数リファレンス](#16-環境変数リファレンス)

---

## 1. はじめに

### 1.1 BlackSentinel Guardianとは

BlackSentinel Guardianは、EPP、EDR、XDR、脅威ハンティング、行動分析、ゼロトラスト、デセプション技術、ランサムウェア保護、メモリ保護、AI検出、脆弱性認識、自動修復を単一の統合セキュリティプラットフォームに統合した次世代の自律エンドポイント防御プラットフォームです。

### 1.2 システムアーキテクチャ

```
[ブラウザ] <--> [React フロントエンド] <--> [Express API バックエンド] <--> [PostgreSQL / Redis]
                                                              |
                                                       [エージェント通信]
                                                              |
                                               [エンドポイントエージェント]
```

| コンポーネント | 技術 | 目的 |
|---------------|------|------|
| フロントエンド | React 19, TypeScript, Vite, Tailwind CSS v4 | Web管理コンソール |
| バックエンド | Express.js, TypeScript, Prisma ORM | REST API / WebSocket |
| データベース | PostgreSQL 16 | 永続データストレージ |
| キャッシュ | Redis 7 | セッション管理 |
| エージェント | プラットフォーム固有バイナリ | エンドポイント保護 |

### 1.3 ハードウェア要件

| リソース | 最小要件 | 本番推奨(500EP以下) | エンタープライズ(500EP+) |
|---------|---------|-------------------|------------------------|
| CPU | 2コア 2.0GHz | 8コア 3.0GHz | 16+コア 3.5GHz |
| RAM | 4 GB | 16 GB | 32+ GB |
| ディスク | 20GB SSD | 100GB NVMe | 500+GB NVMe RAID10 |
| ネットワーク | 100Mbps | 1Gbps | 10Gbps |

### 1.4 サポートOS

**サーバー:** Ubuntu 22.04/24.04 LTS, Debian 12, Rocky Linux 9, RHEL 9, Amazon Linux 2023  
**エージェント:** Windows 10/11, Windows Server 2019/2022, macOS 12+, Ubuntu 20.04+, CentOS/RHEL 8+

---

## 2. 前提条件

### 2.1 必須ソフトウェア

| ソフトウェア | バージョン | 目的 |
|------------|-----------|------|
| Node.js | 20.x LTS+ | バックエンドランタイム |
| PostgreSQL | 15.x+(16推奨) | データベース |
| Redis | 7.x+ | キャッシュ |
| Docker | 24.x+(任意) | コンテナ |
| npm | 10.x+ | パッケージ管理 |
| Nginx | 1.24+(本番) | リバースプロキシ |

```bash
# Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt-get update && sudo apt-get install -y postgresql-16

# Redis 7
sudo apt-get install -y redis-server
```

### 2.2 ネットワーク要件

| ポート | サービス | 方向 |
|-------|---------|------|
| 3001 | バックエンドAPI | インバウンド |
| 443 | HTTPS | インバウンド |
| 5432 | PostgreSQL | 内部 |
| 6379 | Redis | 内部 |
| 8443 | エージェント登録 | インバウンド |

### 2.3 SSL/TLS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.yourdomain.com -d api.yourdomain.com
```

---

## 3. データベース設定

```bash
sudo -u postgres psql
CREATE DATABASE blacksentinel;
CREATE USER blacksentinel_user WITH PASSWORD 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
\q
```

```bash
cd backend
echo 'DATABASE_URL=postgresql://blacksentinel_user:SECURE_PASSWORD@localhost:5432/blacksentinel' > .env
npx prisma generate
npx prisma migrate deploy
npm run seed
```

**デフォルトSUPER_ADMIN:** admin@blacksentinel.io / admin123 (初回ログイン後変更必須)

---

## 4. バックエンドデプロイメント

### 4.1 環境変数

```bash
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=64文字のランダム文字列
JWT_REFRESH_SECRET=64文字のランダム文字列
JWT_EXPIRES_IN=15m
DATABASE_URL=postgresql://blacksentinel_user:PASS@localhost:5432/blacksentinel
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=https://guardian.yourdomain.com
LOG_LEVEL=info
EOF
```

### 4.2 ビルドと起動

```bash
cd backend && npm ci && npm run build
npm run start
```

### 4.3 PM2本番管理

```bash
npm install -g pm2
pm2 start dist/server.js --name blacksentinel-api
pm2 save && pm2 startup
```

---

## 5. フロントエンドデプロイメント

### 5.1 環境変数とビルド

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws
EOF
npm ci && npm run build
```

### 5.2 Nginx設定

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
    root /var/www/guardian/html;
    index index.html;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location / { try_files $uri $uri/ /index.html; }
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo mkdir -p /var/www/guardian/html
sudo cp -r dist/* /var/www/guardian/html/
sudo chown -R www-data:www-data /var/www/guardian
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Dockerデプロイメント

```bash
# docker-compose.yml
cat > docker-compose.yml << 'EOF'
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
volumes:
  postgres_data:
  redis_data:
EOF
```

```bash
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .
docker build -t blacksentinel/guardian-api:latest ./backend
docker compose up -d
curl http://localhost:3001/api/health
```

---

## 7. Kubernetesデプロイメント

```bash
kubectl create namespace blacksentinel
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:PASS@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='JWT_SECRET' \
  --from-literal=jwt-refresh-secret='JWT_REFRESH_SECRET' \
  --from-literal=postgres-password='PASS'
```

k8s/deployment.yaml を参照してください。構成内容:
- API: 3レプリカ、HPA(3-10)、ヘルスチェック、リソース制限
- フロントエンド: 3レプリカ
- PostgreSQL: 1レプリカ、50Gi PVC
- Redis: 1レプリカ、10Gi PVC
- Ingress: TLS(Let's Encrypt)、リバースプロキシ

---

## 8. エージェントインストール

### 8.1 登録手順

1. Webコンソールで「エンドポイント > 追加」をクリック
2. 登録コマンドをコピー

### 8.2 インストールコマンド

```powershell
# Windows (管理者PowerShell)
irm https://install.blacksentinel.io/agent.ps1 | iex
```

```bash
# Linux (root)
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

```bash
# macOS (root)
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 確認

```bash
blacksentinel-agent status
```

---

## 9. セキュリティ強化

1. **デフォルト認証情報の変更:** SUPER_ADMINパスワード、DBパスワード、JWT秘密鍵、Redisパスワードを即座に変更
2. **MFA有効化:** 設定 > セキュリティ で全管理者アカウントにMFA設定
3. **ファイアウォール:**

```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3001/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp
sudo ufw enable
```

4. **SSL/TLS:** TLS 1.2以上、HSTS有効化
5. **監査ログ:** 定期的に `SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;` を確認

---

## 10. 初期設定

1. `https://guardian.yourdomain.com` にアクセスし、SUPER_ADMINでログイン
2. パスワード変更、MFA設定
3. 部署とタグの作成 (設定 > 部署/タグ)
4. 統合設定 (設定 > 統合): SMTP, Slack, Teams, SIEM, AD
5. 通知ルール設定 (設定 > 通知)
6. 保持ポリシー設定 (設定 > 保持)
7. ユーザー作成 (設定 > ユーザー): 適切なロールを割り当て

---

## 11. バックアップと復旧

```bash
# 手動バックアップ
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d).dump

# cron自動バックアップ (毎日午前2時)
# /etc/cron.d/blacksentinel-backup
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel_$(date +\%Y\%m\%d).dump.gz

# 復元
pm2 stop blacksentinel-api
gunzip -c backup.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel
pm2 start blacksentinel-api
```

**RPO:** 1時間 / **RTO:** 4時間

---

## 12. 監視とメンテナンス

```bash
# ヘルスチェック
curl http://localhost:3001/api/health

# ログ確認
pm2 logs blacksentinel-api
sudo tail -f /var/log/nginx/error.log

# DBメンテナンス
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

**アップグレード:**
```bash
cd backend && git pull && npm ci && npm run build && npx prisma migrate deploy && pm2 restart blacksentinel-api
cd ../blacksentinel-guardian && git pull && npm ci && npm run build && sudo cp -r dist/* /var/www/guardian/html/
```

---

## 13. トラブルシューティング

| 問題 | 解決策 |
|------|--------|
| API起動失敗 | .env設定確認、全必須変数設定済みか確認 |
| DB接続拒否 | PostgreSQL起動確認、接続文字列確認 |
| Redis接続拒否 | `redis-cli ping` で確認 |
| ビルド失敗 | `rm -rf node_modules && npm ci` |
| フロントエンド白画面 | VITE_API_URL設定確認 |
| エージェント接続不可 | ポート8443/ファイアウォール確認、登録トークン確認 |

**デバッグモード:** `LOG_LEVEL=debug` を設定後サービス再起動

---

## 14. ロールリファレンス

| ロール | 説明 | ダッシュボード | エンドポイント | 脅威閲覧 | 脅威編集 | 削除 | ユーザー管理 | 設定管理 | 統合管理 | 監査ログ | AI |
|--------|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | 全権限 | O | O | O | O | O | O | O | O | O | O |
| ADMIN | システム管理 | O | O | O | O | - | O | O | O | O | O |
| SOC_TIER_5 | SOCリーダー | O | O | O | O | O | - | - | - | O | O |
| SOC_TIER_4 | シニアSOC | O | O | O | O | - | - | - | - | O | O |
| SOC_TIER_3 | 上級SOC | O | O | O | O | - | - | - | - | O | - |
| SOC_TIER_2 | 中級SOC | O | O | O | 部分 | - | - | - | - | O | - |
| SOC_TIER_1 | ジュニアSOC | O | O | O | - | - | - | - | - | - | - |
| AUDITOR_3 | シニア監査 | O | O | O | - | - | - | - | - | O | - |
| AUDITOR_2 | 監査人 | O | O | 部分 | - | - | - | - | - | O | - |
| AUDITOR_1 | ジュニア監査 | O | 部分 | 部分 | - | - | - | - | - | - | - |
| IT | IT運用 | O | O | - | - | - | - | 部分 | - | - | - |
| ANALYST | 一般分析 | O | O | O | - | - | - | - | - | - | - |
| VIEWER | 閲覧のみ | O | 部分 | 部分 | - | - | - | - | - | - | - |

---

## 15. APIリファレンス

**ベースURL:** `https://api.yourdomain.com/api`  
**認証:** `Authorization: Bearer <JWT_TOKEN>`

| メソッド | パス | 説明 | ロール |
|---------|------|------|--------|
| POST | /api/auth/login | ログイン | 公開 |
| POST | /api/auth/register | 登録 | 公開 |
| POST | /api/auth/refresh | トークン更新 | 公開 |
| GET | /api/health | ヘルスチェック | 公開 |
| GET/POST | /api/users | ユーザー一覧/作成 | ADMIN+ |
| GET/PUT/DELETE | /api/users/:id | ユーザー操作 | ADMIN+/SUPER |
| GET/POST | /api/endpoints | エンドポイント一覧/登録 | SOC1+/IT+ |
| GET/PUT/DELETE | /api/endpoints/:id | エンドポイント操作 | SOC1-2+/ADMIN+ |
| GET/POST | /api/threats | 脅威一覧/作成 | SOC1-2+ |
| GET/PUT/DELETE | /api/threats/:id | 脅威操作 | SOC1-4+ |
| GET/POST | /api/alerts | アラート一覧/作成 | SOC1+ |
| GET/PUT/DELETE | /api/alerts/:id | アラート操作 | SOC1-3+ |
| GET | /api/timeline | タイムライン | SOC1+ |
| GET/POST | /api/vulnerabilities | 脆弱性 | SOC1-3+ |
| GET/POST | /api/firewall/rules | ファイアウォール | SOC2-3+ |
| GET/POST | /api/usb | USBデバイス | SOC1+/IT+ |
| POST | /api/response | レスポンス操作 | SOC3+ |
| GET | /api/audit | 監査ログ | AUDITOR1+ |
| GET | /api/dashboard | ダッシュボード | SOC1+ |
| POST | /api/copilot | AI询问 | SOC3+ |
| GET/PUT | /api/settings | 設定 | ADMIN+/SUPER |
| GET/PUT | /api/integrations | 統合 | ADMIN+ |

**エラー形式:** `{"error": {"code": "UNAUTHORIZED", "message": "...", "details": null}}`  
**ページネーション:** `{"data": [...], "pagination": {"total": 150, "page": 1, "limit": 20, "pages": 8}}`

---

## 16. 環境変数リファレンス

| 変数 | 必須 | デフォルト | 説明 | 例 |
|------|:----:|----------|------|-----|
| PORT | No | 3001 | APIサーバーポート | 3001 |
| NODE_ENV | Yes | development | 環境モード | production |
| DATABASE_URL | Yes | file:./dev.db | PostgreSQL接続 | postgresql://user:pass@host:5432/db |
| REDIS_URL | Yes | redis://localhost:6379 | Redis接続 | redis://redis:6379 |
| JWT_SECRET | Yes | - | JWT署名鍵(32文字以上) | a1b2c3... |
| JWT_REFRESH_SECRET | Yes | - | リフレッシュ鍵 | z9y8x7... |
| JWT_EXPIRES_IN | No | 15m | アクセストークン有効期限 | 15m |
| MFA_ISSUER | No | BlackSentinel Guardian | MFA発行者 | BlackSentinel Guardian |
| CORS_ORIGINS | Yes | http://localhost:5173 | CORS許可Origin | https://guardian.example.com |
| LOG_LEVEL | No | info | ログレベル | debug |
| AGENT_SIGNING_KEY | No | - | エージェント署名鍵 | key |
| TLS_CERT_PATH | No | - | TLS証明書 | /etc/ssl/certs/guardian.pem |
| TLS_KEY_PATH | No | - | TLS秘密鍵 | /etc/ssl/private/guardian.key |
| VITE_API_URL | Yes | http://localhost:3001 | フロントエンドAPI URL | https://api.example.com |
| VITE_WS_URL | No | ws://localhost:3001/ws | WebSocket URL | wss://api.example.com/ws |
| POSTGRES_PASSWORD | Docker | postgres | DBパスワード | password |
| REDIS_PASSWORD | Docker | - | Redisパスワード | password |

---

ドキュメント終了 | support@blacksentinel.io
