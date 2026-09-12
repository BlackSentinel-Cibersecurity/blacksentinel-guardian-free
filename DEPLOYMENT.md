b# BlackSentinel Guardian - Deployment Guide

## Quick Start (Local Development)

```bash
cd blacksentinel-guardian
npm run dev
```

Opens at **http://localhost:5173**

## Deployment Options

### Option 1: Docker Compose (Recommended for Small/Medium)

```bash
# Build and deploy locally
./scripts/deploy.sh local

# Or manually:
cd blacksentinel-guardian && npm ci && npm run build
docker build -t blacksentinel/guardian-frontend -f Dockerfile.frontend .
docker build -t blacksentinel/guardian-api ./backend
cd backend && docker compose -f docker/docker-compose.yml up -d
```

**Result:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Kubernetes (Recommended for Enterprise)

```bash
# Deploy to Kubernetes cluster
./scripts/deploy.sh k8s

# Or manually:
kubectl apply -f k8s/deployment.yaml
```

**Includes:**
- 3 API replicas with auto-scaling
- 3 Frontend replicas
- PostgreSQL with persistent storage
- Redis cache
- Ingress with TLS (Let's Encrypt)
- Health checks and resource limits

### Option 3: Cloud Platforms

#### AWS (ECS/Fargate)
```bash
# Build images
docker build -t blacksentinel/guardian-frontend -f Dockerfile.frontend .
docker build -t blacksentinel/guardian-api ./backend

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag blacksentinel/guardian-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/guardian-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/guardian-api:latest

# Deploy with ECS CLI or Terraform
```

#### Azure (AKS)
```bash
# Create AKS cluster
az aks create --resource-group blacksentinel --name guardian-cluster --node-count 3

# Get credentials
az aks get-credentials --resource-group blacksentinel --name guardian-cluster

# Deploy
kubectl apply -f k8s/deployment.yaml
```

#### Google Cloud (GKE)
```bash
# Create GKE cluster
gcloud container clusters create guardian-cluster --num-nodes=3

# Get credentials
gcloud container clusters get-credentials guardian-cluster

# Deploy
kubectl apply -f k8s/deployment.yaml
```

#### DigitalOcean
```bash
# Create DOKS cluster
doctl kubernetes cluster create guardian-cluster --region nyc1 --size s-3vcpu-1gb --count 3

# Get credentials
doctl kubernetes cluster kubeconfig show guardian-cluster > ~/.kube/config

# Deploy
kubectl apply -f k8s/deployment.yaml
```

### Option 4: Static Hosting (Frontend Only)

```bash
cd blacksentinel-guardian
npm run build

# Deploy dist/ to:
# - Vercel: npx vercel --prod
# - Netlify: npx netlify deploy --prod --dir=dist
# - Cloudflare Pages: wrangler pages deploy dist
# - AWS S3 + CloudFront
# - Firebase Hosting: firebase deploy
```

### Option 5: SaaS / White-Label

For multi-tenant SaaS deployment:

1. **Environment Variables:**
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
TENANT_ISOLATION=strict
BILLING_API_KEY=stripe-key
```

2. **Multi-tenant Architecture:**
- Row-level security in PostgreSQL
- Tenant-specific encryption keys
- Isolated Redis namespaces
- Per-tenant rate limiting

3. **White-Label Customization:**
- Brand colors in `src/index.css` (--color-bs-orange, etc.)
- Logo in `public/favicon.svg`
- Company name in `src/components/layout/Sidebar.tsx`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL URL | `file:./dev.db` |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing key | *(required in production)* |
| `CORS_ORIGINS` | Allowed origins | `http://localhost:5173` |

### Production Checklist

- [ ] Set strong `JWT_SECRET` (64+ random characters)
- [ ] Configure PostgreSQL (not SQLite)
- [ ] Enable Redis for caching
- [ ] Set up TLS/SSL certificates
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation (ELK/Loki)
- [ ] Enable backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling

## Monitoring

### Health Check Endpoints

```bash
# API Health
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","version":"1.0.0","uptime":123.456}
```

### Metrics

```bash
# Prometheus metrics endpoint
curl http://localhost:3001/metrics
```

## Security

### TLS/SSL

For production, always use HTTPS. Configure in your reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... rest of config
}
```

### Agent Security

- Agent binary signing with code signing certificate
- Tamper protection via kernel-level hooks
- Encrypted agent-backend communication (mTLS)
- Agent integrity verification on heartbeat

## Support

- Documentation: https://docs.blacksentinel.io
- Support: support@blacksentinel.io
- Status: https://status.blacksentinel.io
