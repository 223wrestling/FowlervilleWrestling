# Wrestling Technique Website

## Project Overview
A self-contained wrestling curriculum website for Fowlerville Wrestling Club. Pure HTML/CSS/JS with zero dependencies. Hosted on GitHub Pages with custom domain `fowlervillewrestling.com` via Cloudflare DNS.

## File Structure
- `techniques.json` - Master data file: all techniques, categories, descriptions, videos, flowcharts
- `index.html` - Hub page linking to everything
- `checklist.html` - Printable student checklist (Learned/Mastered columns, localStorage persistence)
- `techniques.html` - Single-page app with hash routing (`#double-leg`) for individual technique pages
- `css/styles.css` - Shared stylesheet with print media queries
- `flowcharts/*.html` - 7 interactive SVG flow charts (underhook, collar-tie, head-on-wrist, russian-tie, russian-tie-reactions, elbow-control, front-headlock)
- `workers/coaches-auth.js` - Cloudflare Worker for basic auth on `/hs/coaches/*`
- `wrangler.toml` - Cloudflare Worker config
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
- SVG for flowcharts - generated via Python script from `techniques.json` data
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
- Flowcharts generated from JSON data via Python script (`/tmp/gen_flowcharts.py`)
- YouTube videos searched via `curl` to YouTube search results, parsed with Python JSON extraction
- Technique descriptions written as coaching points (starting position, key steps, common mistakes)

## Regenerating Flowcharts
If flowchart data in `techniques.json` changes, re-run the generator:
```bash
python3 gen_flowcharts.py
```

## Video Search Method
YouTube videos are found by curling YouTube search results and parsing the `ytInitialData` JSON. Preferred channels (Kolat, Iron Faith, Earn Your Gold, Wrestling Rabbit Hole) are prioritized in results.
