# Coaches Auth Worker

Cloudflare Worker that protects `/hs/coaches/*` with HTTP basic auth.

## Setup

1. Install wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set the auth credentials (you'll be prompted to enter each value):
   ```bash
   wrangler secret put AUTH_USER
   wrangler secret put AUTH_PASS
   ```

4. Deploy the worker:
   ```bash
   wrangler deploy
   ```

## How It Works

- Requests to `/hs/coaches/*` require HTTP basic auth
- Credentials are checked against `AUTH_USER` and `AUTH_PASS` secrets stored in Cloudflare
- All other requests pass through unchanged
- Browsers will show a native login prompt on first visit
