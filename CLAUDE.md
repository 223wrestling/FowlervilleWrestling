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
- `hs/coaches/index.html` - Coaches area with Flowchart Editor section
- `workers/coaches-auth.js` - Cloudflare Worker for basic auth on `/hs/coaches/*`
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
- **Cloudflare Worker** (`workers/coaches-auth.js`) protects `/hs/coaches/*` with HTTP basic auth
- Auth credentials (`AUTH_USER`, `AUTH_PASS`) stored as Cloudflare Worker secrets, not in source

## Key Design Decisions
- Single `techniques.html` with hash routing (not one file per technique)
- Flowcharts render dynamically from `techniques.json` — no Python generation step needed
- `flowcharts/chart.html` uses BFS tree layout (same algorithm as legacy `gen_flowcharts.py`) to position nodes
- `flowcharts/builder.html` is the visual editor with: drag to reposition, technique name autocomplete, Export/Import JSON, Preview mode with technique popups
- YouTube videos searched via `curl` to YouTube search results, parsed with Python JSON extraction
- Technique descriptions written as coaching points (starting position, key steps, common mistakes)

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

## Video Search Method
YouTube videos are found by curling YouTube search results and parsing the `ytInitialData` JSON. Preferred channels (Kolat, Iron Faith, Earn Your Gold, Wrestling Rabbit Hole) are prioritized in results.
