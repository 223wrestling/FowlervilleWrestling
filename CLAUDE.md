# Wrestling Technique Website

## Project Overview
A self-contained wrestling curriculum website for Fowlerville Wrestling Club. Pure HTML/CSS/JS with zero dependencies. Hosted on GitHub Pages with custom domain `fowlervillewrestling.com` via Cloudflare DNS.

## File Structure
- `techniques.json` - Master data file: all techniques, categories, descriptions, videos, flowcharts
- `index.html` - Hub page linking to everything
- `checklist.html` - Printable student checklist (Learned/Mastered columns, localStorage persistence)
- `techniques.html` - Single-page app with hash routing (`#double-leg`) for individual technique pages
- `css/styles.css` - Shared stylesheet with print media queries
- `flowcharts/chart.html` - Dynamic flowchart viewer (renders live from `techniques.json`, no build step)
- `flowcharts/builder.html` - Visual flowchart builder/editor with preview mode
- `flowcharts/index.html` - Flowchart listing page with links to dynamic viewer
- `flowcharts/*.html` - Legacy static flowcharts (kept for reference, no longer linked)
- `hs/roster.json` - Roster data: wrestlers (name, weight, year, photo) and coaches/staff
- `hs/coaches/coaches-data.json` - Practice plans, wrestler notes, scouting reports, forms
- `hs/coaches/index.html` - Coaches area app: editable roster, plans, notes, scouting, forms with Worker API save
- `hs/coaches/editor.html` - Technique editor with table view, form editing, GitHub API save
- `hs/photos/` - Wrestler and coach photos (uploaded via roster editor)
- `hs/coaches/docs/` - Uploaded PDFs, practice plans, forms, documents
- `data/schedule-hs.json` - Static fallback schedule data (stale backup; live data comes from Google Calendar)
- `data/schedule-youth.json` - Static fallback youth schedule data
- `workers/coaches-auth.js` - Cloudflare Worker: basic auth + API proxy + Google Calendar proxy
- `wrangler.toml` - Cloudflare Worker config
- `gen_flowcharts.py` - Legacy Python generator (no longer needed, kept for reference)
- `CNAME` - Custom domain for GitHub Pages
- `cards.pptx` - Source PowerPoint with 19 slides (gitignored)
- `cards_extracted/` - Unzipped pptx XML for reference (gitignored)

## Source Material
- PowerPoint: `cards.pptx` with 19 slides covering full wrestling curriculum
- Slides 1-10: Technique cards by category (Tie-Ups, Hand Fighting, Takedowns I & II, Top Position, Finishers, Defense I-III, Drills)
- Slides 12-18: Flow charts for chain wrestling series

## Preferred YouTube Channels for Videos
Search these channels first when looking for technique videos:
1. **@KOLATCOM** (Cary Kolat) - Largest wrestling technique library, 2400+ videos
2. **@ironfaithwrestling** (Iron Faith Wrestling / Coach Ebed Jarrell) - Technique breakdowns
3. **@earnyourgold** (Earn Your Gold) - Wrestling instruction
4. **@WrestlingRabbitHole** (Wrestling Rabbit Hole) - Technique deep dives

## Tech Stack
- Pure HTML/CSS/JS - no frameworks, no build tools, no external dependencies
- SVG for flowcharts - rendered dynamically from `techniques.json` via BFS tree layout in JS
- Chain-link connectors on flowchart edges (stroke-dasharray with round linecaps, bi-directional)
- CSS Grid/Flexbox layouts
- `@media print` for checklist
- localStorage for checklist state persistence

## Hosting
- **GitHub Pages** serves the static site from the `main` branch
- **Cloudflare** handles DNS for `fowlervillewrestling.com` and runs the auth Worker
- **Cloudflare Worker** (`workers/coaches-auth.js`) protects `/hs/coaches/*` with HTTP basic auth, proxies GitHub API writes, and serves live Google Calendar data via `/api/calendar/*`
- Worker secrets: `AUTH_USER`, `AUTH_PASS` (basic auth), `GITHUB_TOKEN` (fine-grained PAT), `GITHUB_REPO` (e.g. `user/repo`)
- Worker deployment: `CLOUDFLARE_API_TOKEN=$(cat ~/.cloudflare-token) npx wrangler deploy`

## Key Design Decisions
- Single `techniques.html` with hash routing (not one file per technique)
- Flowcharts render dynamically from `techniques.json` — no Python generation step needed
- `flowcharts/chart.html` uses BFS tree layout (same algorithm as legacy `gen_flowcharts.py`) to position nodes
- `flowcharts/chart.html` has mobile-friendly touch pan/zoom: viewBox-based zooming (pinch + drag on touch, scroll wheel on desktop), floating +/−/reset zoom controls, auto-zoom to root node on mobile load (1.5x, 70vh wrapper), bottom sheet popup with "Watch Video" link instead of iframe
- `flowcharts/builder.html` is the visual editor with: drag to reposition, technique name autocomplete, Export/Import JSON, Preview mode with technique popups
- YouTube videos searched via `curl` to YouTube search results, parsed with Python JSON extraction
- Technique descriptions written as coaching points (starting position, key steps, common mistakes)
- `hs/coaches/editor.html` is a self-contained technique editor with: two-panel table+form layout, array editors for keyPoints/commonMistakes/related/videos, GitHub API save with SHA conflict detection and diff preview, export JSON fallback, validation, and settings stored in localStorage

## Flowchart Editing Workflow
1. **Coaches Area** → **Flowchart Editor** → pick a chart (or `builder.html?chart=<id>`)
2. Edit visually: drag nodes, double-click to rename (autocomplete from techniques), add/remove nodes and connections
3. **Preview** button toggles read-only mode with technique popups (description, key points, videos)
4. **Export JSON** downloads a `techniques.json`-ready block with `id`, `name`, `file`, `rootNode`, `nodes`, `edges`
5. Paste into `techniques.json` on GitHub — the dynamic viewer picks it up immediately

### Creating a New Flowchart
1. Open `flowcharts/builder.html` (blank canvas)
2. Add a Starting Position node first (becomes rootNode), then build out the chart
3. Export JSON, then add `id`, `name`, and `file` fields:
   ```json
   {
     "id": "my-new-series",
     "name": "My New Series",
     "file": "flowcharts/chart.html?chart=my-new-series",
     "rootNode": "n1",
     "nodes": [...],
     "edges": [...]
   }
   ```
4. Add the block to the `"flowcharts"` array in `techniques.json`

## Technique Editing Workflow
1. **Coaches Area** → **Technique Editor** (or `hs/coaches/editor.html` directly)
2. Search/filter techniques, click a row to open the detail panel
3. Edit fields, array items (keyPoints, commonMistakes, related, videos), manage categories
4. "Apply Changes" writes to in-memory data; "Save to GitHub" saves via Worker API (same as coaches area)
5. Shows diff preview and custom commit message before saving
6. No browser-side GitHub tokens needed — Worker handles authentication

## Coaches Area Workflow
The coaches area (`hs/coaches/index.html`) is a full editing app behind Cloudflare basic auth:

1. **Roster** — Add/edit/delete wrestlers and coaches, upload photos, CSV import/export (Name, Weight Class, Year)
2. **Practice Plans** — Create plans with drill arrays, upload PDF attachments
3. **Wrestler Notes** — Table with roster autocomplete for name/weight
4. **Scouting Reports** — Opponent data with CSV import/export per report (Weight, Name, Record, Style, Notes)
5. **Forms & Documents** — Upload PDFs/docs to `hs/coaches/docs/`, auto-delete on remove

**CSV Import/Export:**
- Roster and Scouting Reports both support CSV export (downloads file) and import (file picker)
- Roster import merges by name: updates existing wrestlers, adds new ones; columns: `Name`, `Weight Class`, `Year`
- Scouting import appends wrestlers to the selected report; columns: `Weight`, `Name`, `Record`, `Style`, `Notes`
- CSV parser handles quoted fields with commas and newlines; import shows error modal with details on failure

**Save flow:** Coach edits data → clicks "Save to GitHub" → `POST /hs/coaches/api/save` → Worker (already authenticated via basic auth) uses `GITHUB_TOKEN` to commit via GitHub API → returns success/error. No browser-side API tokens needed.

**Worker API endpoints:**
- `GET /api/calendar/:id` — Public (no auth). Proxies Google Calendar iCal feed, returns JSON events. IDs: `hs`, `ms`, `youth-k3`, `youth-48`, `youth-gold`. Cached 1hr.
- `POST /hs/coaches/api/save` — Save JSON file (`hs/roster.json`, `hs/coaches/coaches-data.json`, or `techniques.json`)
- `POST /hs/coaches/api/upload` — Upload file to `hs/photos/*` or `hs/coaches/docs/*`
- `DELETE /hs/coaches/api/file` — Delete uploaded file from repo

## Google Calendar Integration
Schedule pages (`hs/schedule.html`, `youth/schedule.html`, `hs/index.html`, `youth/index.html`, `index.html`) fetch live event data from Google Calendar via the Worker's `/api/calendar/:id` endpoint. The Worker fetches the public iCal feed, parses VEVENT blocks (including RRULE recurring events with BYDAY/UNTIL/COUNT/EXDATE and TZID-prefixed datetimes), classifies events by keyword (practice/match/tournament/event), and returns JSON. Pages fall back to static `data/schedule-*.json` files if the Worker is unreachable.

**Calendar IDs** (hardcoded in Worker):
- `hs` — Fowlerville HS Wrestling
- `ms` — Middle School
- `youth-k3` — Youth K-3
- `youth-48` — Youth 4-8
- `youth-gold` — Youth Gold

## Video Search Method
YouTube videos are found by curling YouTube search results and parsing the `ytInitialData` JSON. Preferred channels (Kolat, Iron Faith, Earn Your Gold, Wrestling Rabbit Hole) are prioritized in results.
