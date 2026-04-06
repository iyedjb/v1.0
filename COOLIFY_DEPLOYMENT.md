# Coolify Deployment Guide

This guide explains how to deploy this project to your VPS using Coolify.

## Quick Setup

1. Push code to GitHub
2. In Coolify: Create new project from your repo
3. Set **Build Pack**: `Dockerfile` (NOT Nixpacks)
4. Set **Port Exposes**: `3000`
5. Click **Reset Labels to Defaults**
6. Add environment variables (see below)
7. Deploy

## Environment Variables (REQUIRED)

Go to **Environment Variables** and add:

```
NODE_ENV=production
PORT=3000
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

**Get your Stripe keys from:** https://dashboard.stripe.com/apikeys

**Optional (for Stripe sync):**
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Coolify Configuration

### Build Settings

| Setting | Value |
|---------|-------|
| **Build Pack** | `Dockerfile` |
| **Port Exposes** | `3000` |
| **Is it a static site?** | `No` (unchecked) |

### Important: Reset Labels

Click **"Reset Labels to Defaults"** to remove any Caddy `try_files` configuration that interferes with the Node.js server.

### Domain

1. Go to **Domains** section
2. Add your domain: `https://yourdomain.com`
3. Enable SSL/TLS

## Stripe Webhook Setup

After deployment, configure webhooks in Stripe:

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Save and copy the webhook signing secret
6. Add to Coolify env vars: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

## Troubleshooting

### 404 Page Not Found
- Change Build Pack from "Nixpacks" to "Dockerfile"
- Click "Reset Labels to Defaults"
- Redeploy

### Module Not Found Error
- Make sure you're using the Dockerfile (it handles ESM modules correctly)

### Stripe Not Working
- Verify `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set
- Check the logs for "Using Stripe credentials from environment variables"

### Check Logs
In Coolify, go to **Logs** tab to see:
- Build logs (during deployment)
- Runtime logs (after deployment)

Look for: `Server running on http://0.0.0.0:3000`

## Project Structure

```
├── src/                  # Frontend React code
├── server/               # Backend Express API
├── public/               # Static assets
├── dist/                 # Built frontend (after build)
├── dist-server/          # Built server (after build)
├── Dockerfile            # Production container config
└── package.json          # Dependencies and scripts
```

## Build Commands

The Dockerfile handles everything:
- `npm ci` - Install dependencies
- `npm run build` - Build frontend (Vite) and backend (TypeScript)
- `node dist-server/index.js` - Start production server
