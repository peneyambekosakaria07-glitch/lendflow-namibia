# LendFlow Namibia - Deployment Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local development)
- GitHub account
- Railway account (or alternative PaaS)
- Turso account for distributed database
- Twilio account for SMS/WhatsApp
- Cloudflare account for R2 storage

---

## Local Development

### Using Docker Compose

```bash
# Start PostgreSQL and Redis
docker-compose up postgres redis

# Install dependencies
npm install

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your values

# 3. Generate migrations
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Start dev server
npm run dev
```

---

## Railway Deployment

### 1. Connect GitHub Repository

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub account
3. Select the `lendflow` repository

### 2. Add Database

```bash
# Create PostgreSQL database
railway add postgres

# Create Redis database
railway add redis
```

### 3. Configure Environment Variables

Add these in Railway dashboard:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<from Railway PostgreSQL>
REDIS_URL=<from Railway Redis>
JWT_SECRET=<generate random 32-char string>
JWT_REFRESH_SECRET=<generate random 32-char string>
TWILIO_ACCOUNT_SID=<from Twilio>
TWILIO_AUTH_TOKEN=<from Twilio>
TWILIO_PHONE_NUMBER=<Twilio SMS number>
TWILIO_WHATSAPP_NUMBER=<Twilio WhatsApp number>
R2_ACCOUNT_ID=<from Cloudflare>
R2_ACCESS_KEY_ID=<from Cloudflare R2>
R2_SECRET_ACCESS_KEY=<from Cloudflare R2>
R2_BUCKET=lendflow-documents
```

### 4. Deploy

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### 5. Custom Domain (Optional)

1. Go to Railway project settings
2. Add custom domain (e.g., `api.lendflow.na`)
3. Configure DNS records

---

## Turso Database Setup

### 1. Create Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create lendflow

# Get connection URL
turso db show lendflow --url
```

### 2. Use with Drizzle

```env
TURSO_DATABASE_URL=<libsql://...>
TURSO_AUTH_TOKEN=<your auth token>
```

---

## Alternative Deployment Options

### Vercel (Backend + Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy API
cd apps/api
vercel --prod

# Deploy Mobile (expo)
cd apps/mobile
eas deploy --platform android
```

### Render

1. Connect GitHub repo to Render
2. Create Web Service for API
3. Add PostgreSQL plus
4. Add Redis
5. Configure environment variables
6. Deploy

### Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Create app
fly launch

# Set secrets
fly secrets set JWT_SECRET=<secret>
fly secrets set DATABASE_URL=<url>

# Deploy
fly deploy
```

---

## Cloudflare R2 Setup

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create bucket named `lendflow-documents`
3. Create API token with Read/Write permissions

### 2. Configure

```env
R2_ACCOUNT_ID=<your cloudflare account id>
R2_ACCESS_KEY_ID=<from R2 API token>
R2_SECRET_ACCESS_KEY=<from R2 API token>
R2_BUCKET=lendflow-documents
```

### 3. Public URL (Optional)

Enable public access or use Cloudflare Workers for signed URLs.

---

## Twilio Setup

### 1. Get Credentials

1. Create Twilio account at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token from console
3. Get phone numbers for SMS and WhatsApp

### 2. Configure

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+1xxxxxxxxxx
```

### 3. Verify Webhook URLs

For production, verify your webhook endpoints:
- `https://yourdomain.com/api/webhooks/twilio/inbound`
- `https://yourdomain.com/api/webhooks/twilio/status`

---

## Database Migrations

### Generate Migration

```bash
# In apps/api directory
npm run db:generate
```

### Apply Migrations

```bash
npm run db:migrate
```

### Reset Database (Caution!)

```bash
npm run db:reset
```

---

## Monitoring & Error Tracking

### Sentry Integration

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure
sentry-cli config --org <org> --project <project>
```

Add to your environment:
```env
SENTRY_DSN=https://xxxx@sentry.io/xxxxx
```

---

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Enable rate limiting in production
- [ ] Configure CORS origins
- [ ] Enable Redis password in production
- [ ] Use SSL/TLS for all connections
- [ ] Verify Twilio webhook signatures
- [ ] Enable database SSL connections
- [ ] Set up R2 bucket CORS rules

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -U postgres

# Test connection
psql <DATABASE_URL>
```

### Redis Connection Issues

```bash
# Check Redis
redis-cli ping
```

### API Won't Start

```bash
# Check logs
docker-compose logs api

# Verify environment
echo $DATABASE_URL
echo $REDIS_URL
```

---

## Support

For deployment issues, check:
- Railway docs: https://docs.railway.app
- Turso docs: https://docs.tur.so
- Twilio docs: https://www.twilio.com/docs
