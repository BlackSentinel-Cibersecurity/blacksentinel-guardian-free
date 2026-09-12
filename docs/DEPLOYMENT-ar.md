# BlackSentinel Guardian - دليل النشر

**الإصدار:** 1.0.0  
**آخر تحديث:** يونيو 2026  
**التصنيف:** للнутج / الشركاء فقط  

---

## جدول المحتويات

1. [المقدمة](#1-المقدمة)
2. [المتطلباتiệu](#2-المتطلبات)
3. [إعداد قاعدة البيانات](#3-إعداد-قاعدة-البيانات)
4. [نشر الخلفية](#4-نشر-الخلفية)
5. [نشر الواجهة الأمامية](#5-نشر-الواجهة-الأمامية)
6. [نشر Docker](#6-نشر-docker)
7. [نشر Kubernetes](#7-نشر-kubernetes)
8. [تثبيت الوكيل](#8-تثبيت-الوكيل)
9. [تقوية الأمان](#9-تقوية-الأمان)
10. [الإعداد الأولي](#10-الإعداد-الأولي)
11. [النسخ الاحتياطي والاستعادة](#11-النسخ-الاحتياطي-والاستعادة)
12. [المراقبة والصيانة](#12-المراقبة-والصيانة)
13. [استكشاف الأخطاء](#13-استكشاف-الأخطاء)
14. [مرجع الأدوار](#14-مرجع-الأدوار)
15. [مرجع API](#15-مرجع-api)
16. [مرجع متغيرات البيئة](#16-مرجع-متغيرات-البيئة)

---

## 1. المقدمة

### 1.1 ما هو BlackSentinel Guardian

BlackSentinel Guardian هو منصة دفاع نقاط النهاية التالية للجيل تدمج EPP وEDR وXDR وصيد التهديدات وتحليل السلوك والثقة الصفرية وتكنولوجيا الخداع والحماية من برامج الفدية وحماية الذاكرة والكشف بالذكاء الاصطناعي وإصلاح الأخطاء تلقائيًا في منصة أمان موحدة واحدة.

### 1.2 نظرة عامة على بنية النظام

```
[المتصفح] <--> [React الواجهة] <--> [Express API الخلفية] <--> [PostgreSQL / Redis]
                                                              |
                                                       [التواصل مع الوكيل]
                                                              |
                                               [وكيل نقاط النهاية]
```

| المكون | التكنولوجيا | الغرض |
|--------|------------|-------|
| الواجهة | React 19, TypeScript, Vite, Tailwind CSS v4 | واجهة إدارة ويب |
| الخلفية | Express.js, TypeScript, Prisma ORM | API REST / WebSocket |
| قاعدة البيانات | PostgreSQL 16 | التخزين الدائم |
| التخزين المؤقت | Redis 7 | إدارة الجلسات |
| الوكيل | ملفات ثنائية خاصة بالمنصة | حماية نقطة النهاية |

### 1.3 متطلبات الأجهزة

| المورد | الحد الأدنى | الإنتاج الموصى به (حتى 500 نقطة) | المؤسسات (500+) |
|--------|------------|----------------------------------|-----------------|
| المعالج | 2 نواة 2.0GHz | 8 أنوية 3.0GHz | 16+ نواة 3.5GHz |
| الذاكرة | 4 GB | 16 GB | 32+ GB |
| القرص | 20GB SSD | 100GB NVMe | 500+GB NVMe RAID10 |
| الشبكة | 100Mbps | 1Gbps | 10Gbps |

### 1.4 أنظمة التشغيل المدعومة

**للخادم:** Ubuntu 22.04/24.04 LTS, Debian 12, Rocky Linux 9, RHEL 9, Amazon Linux 2023  
**للوكيل:** Windows 10/11, Windows Server 2019/2022, macOS 12+, Ubuntu 20.04+, CentOS/RHEL 8+

---

## 2. المتطلبات

### 2.1 البرمجيات المطلوبة

| البرنامج | الإصدار | الغرض |
|----------|--------|-------|
| Node.js | 20.x LTS+ | بيئة تشغيل الخلفية |
| PostgreSQL | 15.x+(16 موصى به) | قاعدة البيانات |
| Redis | 7.x+ | التخزين المؤقت |
| Docker | 24.x+(اختياري) | النشر بالحاويات |
| npm | 10.x+ | إدارة الحزم |
| Nginx | 1.24+(إنتاج) | الوكيل العكسي |

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

### 2.2 متطلبات الشبكة

| المنفذ | الخدمة | الاتجاه |
|--------|-------|---------|
| 3001 | API الخلفية | وارد |
| 443 | HTTPS | وارد |
| 5432 | PostgreSQL | داخلي |
| 6379 | Redis | داخلي |
| 8443 | تسجيل الوكيل | وارد |

### 2.3 شهادات SSL/TLS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d guardian.yourdomain.com -d api.yourdomain.com
```

---

## 3. إعداد قاعدة البيانات

```bash
sudo -u postgres psql
CREATE DATABASE blacksentinel;
CREATE USER blacksentinel_user WITH PASSWORD 'كلمة_مرور_آمنة';
GRANT ALL PRIVILEGES ON DATABASE blacksentinel TO blacksentinel_user;
\c blacksentinel
GRANT ALL ON SCHEMA public TO blacksentinel_user;
\q
```

```bash
cd backend
echo 'DATABASE_URL=postgresql://blacksentinel_user:كلمة_مرور_آمنة@localhost:5432/blacksentinel' > .env
npx prisma generate
npx prisma migrate deploy
npm run seed
```

** SUPER_ADMIN الافتراضي:** admin@blacksentinel.io / admin123 (يجب تغييره فور تسجيل الدخول الأول)

---

## 4. نشر الخلفية

### 4.1 متغيرات البيئة

```bash
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=سلسلة عشوائية من 64 حرفاً
JWT_REFRESH_SECRET=سلسلة عشوائية من 64 حرفاً
JWT_EXPIRES_IN=15m
DATABASE_URL=postgresql://blacksentinel_user:كلمة_المرور@localhost:5432/blacksentinel
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=https://guardian.yourdomain.com
LOG_LEVEL=info
EOF
```

### 4.2 البناء والتشغيل

```bash
cd backend && npm ci && npm run build
npm run start
```

### 4.3 إدارة العمليات بـ PM2

```bash
npm install -g pm2
pm2 start dist/server.js --name blacksentinel-api
pm2 save && pm2 startup
```

---

## 5. نشر الواجهة الأمامية

### 5.1 متغيرات البيئة والبناء

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws
EOF
npm ci && npm run build
```

### 5.2 إعداد Nginx

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

## 6. نشر Docker

```bash
docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .
docker build -t blacksentinel/guardian-api:latest ./backend
docker compose up -d
curl http://localhost:3001/api/health
```

استخدم `backend/docker/docker-compose.yml` للإعداد الكامل. يتضمن:
- الواجهة والخلفية وPostgreSQL وRedis
- فحص صحي لكل خدمة
- أ volumes للبيانات الدائمة

---

## 7. نشر Kubernetes

```bash
kubectl create namespace blacksentinel
kubectl create secret generic blacksentinel-secrets \
  --namespace blacksentinel \
  --from-literal=database-url='postgresql://postgres:كلمة_المرور@postgres:5432/blacksentinel' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='JWT_SECRET' \
  --from-literal=jwt-refresh-secret='JWT_REFRESH_SECRET' \
  --from-literal=postgres-password='كلمة_المرور'
kubectl apply -f k8s/deployment.yaml
```

يرجى الرجوع إلى `k8s/deployment.yaml`. يشمل:
- API: 3 نسخ احتياطية، HPA (3-10)، فحص صحي
- الواجهة: 3 نسخ احتياطية
- PostgreSQL: PVC 50Gi
- Redis: PVC 10Gi
- Ingress: TLS (Let's Encrypt)

---

## 8. تثبيت الوكيل

### 8.1 تسجيل نقطة نهاية جديدة

1. سجل الدخول إلى واجهة الويب
2. انتقل إلى "نقاط النهاية > إضافة نقطة نهاية"
3. انسخ أمر التسجيل المُنشأ

### 8.2 أوامر التثبيت

```powershell
# Windows (كمسؤول)
irm https://install.blacksentinel.io/agent.ps1 | iex
```

```bash
# Linux (كجذر)
curl -fsSL https://install.blacksentinel.io/agent.sh | sudo bash
```

```bash
# macOS (كجذر)
curl -fsSL https://install.blacksentinel.io/agent-mac.sh | sudo bash
```

### 8.3 التحقق

```bash
blacksentinel-agent status
```

---

## 9. تقوية الأمان

1. **تغيير بيانات الاعتماد الافتراضية:** غيّر كلمة مرور SUPER_ADMIN وكلمات مرور قاعدة البيانات وJWT والأمان فوراً
2. **تفعيل MFA:** الإعدادات > الأمان > تفعيل MFA لجميع حسابات المسؤول
3. **جدار الحماية:**

```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3001/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp
sudo ufw enable
```

4. **SSL/TLS:** استخدم TLS 1.2 أو أعلى فقط، فعّل HSTS
5. **سجلات المراجعة:** راجع `SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;` بانتظام

---

## 10. الإعداد الأولي

1. افتح `https://guardian.yourdomain.com` وسجل الدخول بـ SUPER_ADMIN
2. غيّر كلمة المرور وفعّل MFA
3. أنشئ الأقسام والعلامات (الإعدادات > الأقسام/العلامات)
4. اضبط التكاملات (الإعدادات > التكاملات): SMTP, Slack, Teams, SIEM, AD
5. أنشئ قواعد الإشعارات (الإعدادات > الإشعارات)
6. اضبط سياسات الاحتفاظ (الإعدادات > الاحتفاظ)
7. أنشئ المستخدمين بأدوار مناسبة (الإعدادات > المستخدمين)

---

## 11. النسخ الاحتياطي والاستعادة

```bash
# نسخ احتياطي يدوي
pg_dump -h localhost -U postgres -d blacksentinel -F c -f backup_$(date +%Y%m%d).dump

# نسخ احتياطي تلقائي (يومياً الساعة 2 صباحاً)
# /etc/cron.d/blacksentinel-backup
0 2 * * * root pg_dump -h localhost -U postgres -d blacksentinel -F c | gzip > /var/backups/blacksentinel_$(date +\%Y\%m\%d).dump.gz

# الاستعادة
pm2 stop blacksentinel-api
gunzip -c backup.dump.gz | pg_restore -h localhost -U postgres -d blacksentinel
pm2 start blacksentinel-api
```

**RPO:** ساعة واحدة / **RTO:** 4 ساعات

---

## 12. المراقبة والصيانة

```bash
# فحص الصحة
curl http://localhost:3001/api/health

# عرض السجلات
pm2 logs blacksentinel-api
sudo tail -f /var/log/nginx/error.log

# صيانة قاعدة البيانات
sudo -u postgres psql -d blacksentinel -c "VACUUM ANALYZE;"
sudo -u postgres psql -d blacksentinel -c "REINDEX DATABASE blacksentinel;"
```

**الترقية:**
```bash
cd backend && git pull && npm ci && npm run build && npx prisma migrate deploy && pm2 restart blacksentinel-api
cd ../blacksentinel-guardian && git pull && npm ci && npm run build && sudo cp -r dist/* /var/www/guardian/html/
```

---

## 13. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| فشل تشغيل API | تحقق من .env وتأكد من جميع المتغيرات المطلوبة |
| رفض اتصال قاعدة البيانات | تحقق من تشغيل PostgreSQL و字符串 الاتصال |
| رفض اتصال Redis | تحقق بـ `redis-cli ping` |
| فشل البناء | `rm -rf node_modules && npm ci` |
| صفحة بيضاء في الواجهة | تحقق من VITE_API_URL |
| الوكيل لا يتصل | تحقق من المنفذ 8443 وجدار الحماية ورمز التسجيل |

**الوضع التنقيفي:** اضبط `LOG_LEVEL=debug` وأعد تشغيل الخدمة

---

## 14. مرجع الأدوار

| الدور | الوصف | لوحة القيادة | نقاط النهاية | التهديدات | تعديل | حذف | إدارة المستخدمين | الإعدادات | التكاملات | السجلات | AI |
|-------|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUPER_ADMIN | صلاحيات كاملة | نعم | نعم | نعم | نعم | نعم | نعم | نعم | نعم | نعم | نعم |
| ADMIN | إدارة النظام | نعم | نعم | نعم | نعم | لا | نعم | نعم | نعم | نعم | نعم |
| SOC_TIER_5 | قائد SOC | نعم | نعم | نعم | نعم | نعم | لا | لا | لا | نعم | نعم |
| SOC_TIER_4 | محلل SOC أول | نعم | نعم | نعم | نعم | لا | لا | لا | لا | نعم | نعم |
| SOC_TIER_3 | محلل SOC متقدم | نعم | نعم | نعم | نعم | لا | لا | لا | لا | نعم | لا |
| SOC_TIER_2 | محلل SOC متوسط | نعم | نعم | نعم | جزئي | لا | لا | لا | لا | نعم | لا |
| SOC_TIER_1 | محلل SOC مبتدئ | نعم | نعم | نعم | لا | لا | لا | لا | لا | لا | لا |
| AUDITOR_3 | مراجع أمان أول | نعم | نعم | نعم | لا | لا | لا | لا | لا | نعم | لا |
| AUDITOR_2 | مراجع أمان | نعم | نعم | جزئي | لا | لا | لا | لا | لا | نعم | لا |
| AUDITOR_1 | مراجع مبتدئ | نعم | جزئي | جزئي | لا | لا | لا | لا | لا | لا | لا |
| IT | العمليات التقنية | نعم | نعم | لا | لا | لا | لا | جزئي | لا | لا | لا |
| ANALYST | محلل عام | نعم | نعم | نعم | لا | لا | لا | لا | لا | لا | لا |
| VIEWER | قراءة فقط | نعم | جزئي | جزئي | لا | لا | لا | لا | لا | لا | لا |

---

## 15. مرجع API

**URL الأساسي:** `https://api.yourdomain.com/api`  
**المصادقة:** `Authorization: Bearer <JWT_TOKEN>`

| الطريقة | المسار | الوصف | الدور المطلوب |
|---------|--------|-------|--------------|
| POST | /api/auth/login | تسجيل الدخول | عام |
| POST | /api/auth/register | التسجيل | عام |
| POST | /api/auth/refresh | تحديث الرمز | عام |
| GET | /api/health | فحص الصحة | عام |
| GET/POST | /api/users | المستخدمون | ADMIN+ |
| GET/PUT/DELETE | /api/users/:id | إدارة المستخدم | ADMIN+/SUPER |
| GET/POST | /api/endpoints | نقاط النهاية | SOC1+/IT+ |
| GET/PUT/DELETE | /api/endpoints/:id | إدارة نقطة النهاية | SOC1-2+/ADMIN+ |
| GET/POST | /api/threats | التهديدات | SOC1-2+ |
| GET/PUT/DELETE | /api/threats/:id | إدارة التهديدات | SOC1-4+ |
| GET/POST | /api/alerts | التنبيهات | SOC1+ |
| GET/PUT/DELETE | /api/alerts/:id | إدارة التنبيهات | SOC1-3+ |
| GET | /api/timeline | الجدول الزمني | SOC1+ |
| GET/POST | /api/vulnerabilities | الثغرات | SOC1-3+ |
| GET/POST | /api/firewall/rules | قواعد جدار الحماية | SOC2-3+ |
| GET/POST | /api/usb | أجهزة USB | SOC1+/IT+ |
| POST | /api/response | إجراء الاستجابة | SOC3+ |
| GET | /api/audit | سجلات المراجعة | AUDITOR1+ |
| GET | /api/dashboard | لوحة القيادة | SOC1+ |
| POST | /api/copilot | استفسار AI | SOC3+ |
| GET/PUT | /api/settings | الإعدادات | ADMIN+/SUPER |
| GET/PUT | /api/integrations | التكاملات | ADMIN+ |

**شكل الخطأ:** `{"error": {"code": "UNAUTHORIZED", "message": "...", "details": null}}`  
**الترقيم:** `{"data": [...], "pagination": {"total": 150, "page": 1, "limit": 20, "pages": 8}}`

---

## 16. مرجع متغيرات البيئة

| المتغير | مطلوب | الافتراضي | الوصف | مثال |
|---------|:-----:|----------|-------|------|
| PORT | لا | 3001 | منفذ الخادم | 3001 |
| NODE_ENV | نعم | development | بيئة التشغيل | production |
| DATABASE_URL | نعم | file:./dev.db | رابط PostgreSQL | postgresql://user:pass@host:5432/db |
| REDIS_URL | نعم | redis://localhost:6379 | رابط Redis | redis://redis:6379 |
| JWT_SECRET | نعم | - | سر توقيع JWT (32+ حرفاً) | a1b2c3... |
| JWT_REFRESH_SECRET | نعم | - | سر تحديث الرمز | z9y8x7... |
| JWT_EXPIRES_IN | لا | 15m | صلاحية رمز الوصول | 15m |
| MFA_ISSUER | لا | BlackSentinel Guardian | مصدر MFA | BlackSentinel Guardian |
| CORS_ORIGINS | نعم | http://localhost:5173 | أصل CORS المسموح | https://guardian.example.com |
| LOG_LEVEL | لا | info | مستوى السجل | debug |
| AGENT_SIGNING_KEY | لا | - | مفتاح توقيع الوكيل | key |
| TLS_CERT_PATH | لا | - | مسار شهادة TLS | /etc/ssl/certs/guardian.pem |
| TLS_KEY_PATH | لا | - | مسار مفتاح TLS الخاص | /etc/ssl/private/guardian.key |
| VITE_API_URL | نعم | http://localhost:3001 | رابط API للواجهة | https://api.example.com |
| VITE_WS_URL | لا | ws://localhost:3001/ws | رابط WebSocket | wss://api.example.com/ws |
| POSTGRES_PASSWORD | Docker | postgres | كلمة مرور قاعدة البيانات | password |
| REDIS_PASSWORD | Docker | - | كلمة مرور Redis | password |

---

نهاية الوثيقة | support@blacksentinel.io
