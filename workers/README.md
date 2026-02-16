# Coaches Auth Worker

Cloudflare Worker that protects `/hs/coaches/*` with multi-user basic auth backed by Cloudflare KV, and proxies GitHub API writes for the coaches area app.

## Roles

| Role | Access |
|------|--------|
| **admin** | All coach features + User Management |
| **coach** | Roster, Practice Plans, Wrestler Notes, Scouting Reports, Forms, Flowcharts, Techniques |
| **player** | Forms & Documents (read-only) |

Permissions are configurable by admin from the User Management section in the coaches area.

## Setup

1. Install wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create KV namespace:
   ```bash
   wrangler kv:namespace create COACHES_AUTH
   ```
   Copy the `id` from the output into `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "COACHES_AUTH"
   id = "<your-namespace-id>"
   ```

4. Set secrets:
   ```bash
   wrangler secret put GITHUB_TOKEN   # Fine-grained PAT with Contents read/write
   wrangler secret put GITHUB_REPO    # e.g. "223wrestling/FowlervilleWrestling"
   ```
   (`AUTH_USER` and `AUTH_PASS` are no longer used — remove them if set.)

5. Deploy the worker:
   ```bash
   wrangler deploy
   ```

6. Seed initial users:
   ```bash
   # Create admin account
   node workers/seed-admin.js dave <password>
   # Run the outputted wrangler kv:key put command

   # Create player account
   node workers/seed-admin.js player <password> --role player --name "Players"
   # Run the outputted wrangler kv:key put command

   # Initialize default permissions
   node workers/seed-admin.js --init-permissions
   # Run the outputted wrangler kv:key put command
   ```

After seeding, the admin can manage all users and permissions from the browser (Coaches Area > User Management).

## How It Works

- Requests to `/hs/coaches/*` require HTTP basic auth
- Worker reads user accounts from KV, hashes the provided password, and compares
- Each user has a role (admin/coach/player) that determines access
- Browsers show a native login prompt on first visit (same UX as before)
- The page fetches `/hs/coaches/api/me` on load to determine what to show

## Password Storage

Passwords are hashed with SHA-256 using a random 16-byte salt, stored as `<hex-salt>:<hex-hash>` in KV. The Web Crypto API is used in the Worker runtime — no external dependencies.

## API Endpoints

All API endpoints are behind basic auth.

### Auth & User Management

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/hs/coaches/api/me` | any | Current user info + permissions |
| GET | `/hs/coaches/api/users` | admin | List users (no password hashes) |
| POST | `/hs/coaches/api/users` | admin | Create/update user `{ username, password?, role, name }` (password optional for updates) |
| DELETE | `/hs/coaches/api/users` | admin | Delete user `{ username }` |
| GET | `/hs/coaches/api/permissions` | admin | Get role permissions |
| POST | `/hs/coaches/api/permissions` | admin | Update role permissions |

### Data Endpoints

### `POST /hs/coaches/api/save` — Save a JSON file

Commits a JSON file to the GitHub repo. Requires coach or admin role.

```
Request:  { "file": "hs/roster.json", "content": { ... }, "message": "Update roster" }
Response: { "ok": true, "sha": "abc1234" }
```

Allowed files (whitelist): `hs/roster.json`, `hs/coaches/coaches-data.json`

### `POST /hs/coaches/api/upload` — Upload a binary file

Uploads a file (photo, PDF, document) to the GitHub repo. Requires coach or admin role.

```
Request:  multipart/form-data with fields: file (blob), path (e.g. "hs/photos/photo.jpg")
Response: { "ok": true, "url": "hs/photos/photo.jpg", "sha": "abc1234" }
```

Allowed paths: `hs/photos/*`, `hs/coaches/docs/*`

### `DELETE /hs/coaches/api/file` — Delete a file

Deletes an uploaded file from the GitHub repo. Requires coach or admin role.

```
Request:  { "file": "hs/coaches/docs/form.pdf" }
Response: { "ok": true }
```

Allowed paths: `hs/photos/*`, `hs/coaches/docs/*`

## GitHub Token

Create a fine-grained personal access token at https://github.com/settings/tokens with:
- **Repository access:** Select the wrestling site repo only
- **Permissions:** Contents → Read and write
