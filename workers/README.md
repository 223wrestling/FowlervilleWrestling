# Coaches Auth Worker

Cloudflare Worker that protects `/hs/coaches/*` with HTTP basic auth and proxies GitHub API writes for the coaches area app.

## Setup

1. Install wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set secrets (you'll be prompted to enter each value):
   ```bash
   wrangler secret put AUTH_USER      # Basic auth username
   wrangler secret put AUTH_PASS      # Basic auth password
   wrangler secret put GITHUB_TOKEN   # Fine-grained PAT with Contents read/write
   wrangler secret put GITHUB_REPO    # e.g. "223wrestling/FowlervilleWrestling"
   ```

4. Deploy the worker:
   ```bash
   wrangler deploy
   ```

## How It Works

- Requests to `/hs/coaches/*` require HTTP basic auth
- Credentials are checked against `AUTH_USER` and `AUTH_PASS` secrets
- All other requests pass through unchanged
- Browsers show a native login prompt on first visit

## API Endpoints

All API endpoints are behind basic auth (same credentials as the coaches area).

### `POST /hs/coaches/api/save` — Save a JSON file

Commits a JSON file to the GitHub repo.

```
Request:  { "file": "hs/roster.json", "content": { ... }, "message": "Update roster" }
Response: { "ok": true, "sha": "abc1234" }
```

Allowed files (whitelist): `hs/roster.json`, `hs/coaches/coaches-data.json`

### `POST /hs/coaches/api/upload` — Upload a binary file

Uploads a file (photo, PDF, document) to the GitHub repo.

```
Request:  multipart/form-data with fields: file (blob), path (e.g. "hs/photos/photo.jpg")
Response: { "ok": true, "url": "hs/photos/photo.jpg", "sha": "abc1234" }
```

Allowed paths: `hs/photos/*`, `hs/coaches/docs/*`

### `DELETE /hs/coaches/api/file` — Delete a file

Deletes an uploaded file from the GitHub repo.

```
Request:  { "file": "hs/coaches/docs/form.pdf" }
Response: { "ok": true }
```

Allowed paths: `hs/photos/*`, `hs/coaches/docs/*`

## GitHub Token

Create a fine-grained personal access token at https://github.com/settings/tokens with:
- **Repository access:** Select the wrestling site repo only
- **Permissions:** Contents → Read and write
