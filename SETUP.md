# LendFlow Namibia - Deployment Setup Guide

## Prerequisites
- Node.js 20+
- Docker & Docker Compose (for local development)
- GitHub account (code already pushed to `peneyambekosakaria07-glitch/lendflow-namibia`)
- Railway account (https://railway.app)
- Twilio account (https://console.twilio.com)
- Cloudflare account with R2 bucket (https://dash.cloudflare.com)

---

## Part 1: Local Development Setup

### 1. Start PostgreSQL and Redis with Docker Compose

```bash
cd lendflow
docker-compose up -d postgres redis
```

Wait for services to be healthy (5-10 seconds).

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your local values
```

### 4. Run Database Migrations

```bash
cd apps/api
npx drizzle-kit generate   # Generate migration files
npx drizzle-kit migrate    # Apply migrations to PostgreSQL
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000` with Swagger docs at `http://localhost:3000/docs`.

---

## Part 2: Railway Deployment

### Step 1: Create Railway Project

1. Go to https://railway.app and log in
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select the repository: `peneyambekosaria07-glitch/lendflow-namibia`
4. Railway will auto-detect Nixpacks build

### Step 2: Add PostgreSQL Database

1. In Railway dashboard, click **"+ Add Service"** → **"Database"** → **"PostgreSQL"**
2. Wait for the database to provision
3. Go to the PostgreSQL service → **"Variables"** tab
4. Copy the `DATABASE_URL` connection string (format: `postgresql://user:pass@host:5432/db`)

### Step 3: Add Redis

1. Click **"+ Add Service"** → **"Database"** → **"Redis"**
2. Wait for Redis to provision
3. Copy the `REDIS_URL` from the service variables

### Step 4: Configure Environment Variables

In your Railway project's **Variables** tab, add:

```env
# From Railway PostgreSQL service
DATABASE_URL=postgresql://postgres:your-password@your-host.railway.app:5432/lendflow

# From Railway Redis service
REDIS_URL=redis://default:your-password@your-host.railway.app:6379

# Authentication - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-32-char-random-secret
JWT_REFRESH_SECRET=your-32-char-refresh-secret

# Twilio (from https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+264XXXXXXXXX
TWILIO_WHATSAPP_NUMBER=+264XXXXXXXXX

# Cloudflare R2 (from Cloudflare dashboard → R2 → Manage API Tokens)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET=lendflow-documents

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### Step 5: Configure Startup Command

In Railway, go to **Settings** → **Start Command**, set:

```
node dist/index.js
```

### Step 6: Run Database Migrations

Use Railway's **Shell** (click on the API service → **Shell**) or connect via a temporary `npx drizzle-kit migrate` step in the build:

1. Go to your API service in Railway
2. Click **"Deployments"** → find the current deployment
3. Click **"Rollback"** to the previous version
4. Add this to your build command in `railway.json`:

Or use Railway's Nixpacks build with a post-build script. Add to `package.json` scripts in `apps/api`:

```json
"postinstall": "npx drizzle-kit migrate"
```

And configure Railway to run migrations after each deploy.

### Step 7: Deploy

Railway will automatically build and deploy from GitHub. Monitor the deployment logs in the Railway dashboard.

---

## Part 3: Twilio Configuration

### 1. Get Twilio Credentials

1. Go to https://console.twilio.com
2. Copy your **Account SID** and **Auth Token** from the dashboard

### 2. Configure Phone Numbers

1. Go to **Phone Numbers** → **Manage Numbers** → **Active Numbers**
2. Note your SMS-capable number (format: `+264XXXXXXXXX` for Namibia)
3. For WhatsApp, use your Twilio WhatsApp sandbox number

### 3. Set Webhook URLs (for inbound messages)

For Twilio to forward inbound SMS/WhatsApp to your API, set the webhook URL:

```
https://your-railway-app.railway.app/api/webhooks/twilio
```

Configure this in Twilio console at **Phone Numbers** → your number → **Messaging**.

---

## Part 4: Cloudflare R2 Setup (Document Storage)

### 1. Create R2 Bucket

1. Go to https://dash.cloudflare.com → **R2** → **Create Bucket**
2. Name it `lendflow-documents`
3. Note your **Account ID** from the right sidebar

### 2. Create API Token

1. Go to **My Profile** → **API Tokens** → **Create Token**
2. Use **"Edit"** template for R2
3. Copy `Access Key ID` and `Secret Access Key`

### 3. Configure in Railway

Add the R2 credentials to your Railway environment variables.

---

## Part 5: Verifying Deployment

### Health Check

```bash
curl https://your-railway-app.railway.app/health
```

Expected response: `{"status":"ok","timestamp":"..."}`

### API Documentation

Visit: `https://your-railway-app.railway.app/docs`

### Register a Test Lender

```bash
curl -X POST https://your-railway-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lendflow.com","password":"Test123!","businessName":"Test Lender"}'
```

---

## Quick Reference

| Service | Variable | Where to Find |
|---------|----------|---------------|
| PostgreSQL | `DATABASE_URL` | Railway → PostgreSQL → Variables |
| Redis | `REDIS_URL` | Railway → Redis → Variables |
| Twilio | `TWILIO_ACCOUNT_SID` | console.twilio.com |
| Twilio | `TWILIO_AUTH_TOKEN` | console.twilio.com |
| Cloudflare | `R2_ACCOUNT_ID` | dash.cloudflare.com (top-right) |
| Cloudflare | `R2_ACCESS_KEY_ID` | R2 → Manage API Tokens |

---

## Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` is correctly formatted
- Ensure Railway PostgreSQL is in the same project

### Redis Connection Failed
- Verify `REDIS_URL` format is `redis://default:...`
- Check that Redis is running in Railway

### Twilio Webhook Not Receiving Messages
- Check Twilio console for webhook URL configuration
- Verify your Railway app has a valid HTTPS URL
- Check Railway logs for incoming webhook requests

### Build Failed
- Ensure Node.js 20+ is specified in Railway settings
- Check that `npm run build` succeeds locally
- Review Railway deployment logs for specific errors