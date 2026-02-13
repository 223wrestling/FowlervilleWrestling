# Wrestling Technique Website

A wrestling curriculum website for Fowlerville Wrestling Club with technique breakdowns, instructional videos, printable checklists, and interactive chain wrestling flow charts. Hosted on GitHub Pages at `fowlervillewrestling.com`.

## Quick Start

```bash
cd /home/dave/Claude/Wrestling
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

## File Structure

```
├── techniques.json          Master data file (all techniques, videos, flowcharts)
├── index.html               Hub page linking to everything
├── checklist.html           Printable student checklist
├── techniques.html          Technique viewer (hash-routed single-page app)
├── gen_flowcharts.py        Legacy script (static flowcharts, no longer needed)
├── CNAME                    Custom domain for GitHub Pages
├── wrangler.toml            Cloudflare Worker config
├── workers/
│   ├── coaches-auth.js      Basic auth Worker for /hs/coaches/*
│   └── README.md            Worker setup instructions
├── css/
│   └── styles.css           Shared stylesheet
├── flowcharts/
│   ├── chart.html           Dynamic flowchart viewer (renders from techniques.json)
│   ├── builder.html         Visual flowchart builder/editor
│   ├── index.html           Flowchart listing page
│   └── *.html               Legacy static flowcharts (kept for reference)
├── hs/coaches/
│   ├── index.html           Coaches area (Flowchart Editor + Technique Editor)
│   └── editor.html          Technique editor with GitHub API save
└── cards.pptx               Original PowerPoint source material
```

## Editing Videos

All video data lives in `techniques.json`. Each technique has a `videos` array:

```json
"videos": [
  {
    "id": "vFvl1tdr8l4",
    "title": "Double Leg Head Drive - Cary Kolat Wrestling Moves",
    "channel": "Cary Kolat",
    "url": "https://www.youtube.com/watch?v=vFvl1tdr8l4"
  }
]
```

To change a video:

1. Find the YouTube video you want. The `id` is the 11-character code after `watch?v=` in the URL.
2. Open `techniques.json` and search for the technique name.
3. Replace the `id`, `title`, `channel`, and `url` fields.
4. Refresh the browser. No rebuild needed — the HTML pages read from `techniques.json` live.

You can add more than 2 videos per technique by adding objects to the array.

### Preferred YouTube Channels

When searching for videos, prioritize these channels:

1. **@KOLATCOM** (Cary Kolat) — Largest wrestling technique library
2. **@ironfaithwrestling** (Iron Faith Wrestling) — Technique breakdowns
3. **@earnyourgold** (Earn Your Gold) — Wrestling instruction
4. **@WrestlingRabbitHole** (Wrestling Rabbit Hole) — Technique deep dives

## Editing Flow Charts

Flowcharts are rendered dynamically from `techniques.json` — no build step or Python script needed. Edit visually with the builder, or edit the JSON directly on GitHub.

### Visual Editor (Recommended)

1. Go to the **Coaches Area** → **Flowchart Editor** and pick a chart
   - Or open `flowcharts/builder.html?chart=<id>` directly
2. Drag nodes to reposition, double-click to rename (with technique autocomplete), use toolbar to add/remove nodes and connections
3. Click **Preview** to test popups with technique details and videos
4. Click **Export JSON** — downloads a `techniques.json`-ready block
5. Open `techniques.json` on GitHub, find the matching flowchart entry, and paste the exported block over it
6. Commit — the live site picks up the change immediately

### Creating a New Flowchart

1. Open the builder at `flowcharts/builder.html` (blank canvas)
2. Add a **Starting Position** node first (this becomes the root)
3. Build out the chart with Technique, Finish, and Link nodes
4. Click **Export JSON**
5. Add `id`, `name`, and `file` fields to the exported block:

```json
{
  "id": "my-new-series",
  "name": "My New Series",
  "file": "flowcharts/chart.html?chart=my-new-series",
  "rootNode": "n1",
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

6. Add the block to the `"flowcharts"` array in `techniques.json`
7. The index page and dynamic viewer pick it up automatically

### Node Types

| Type       | Color       | Use For                          |
|------------|-------------|----------------------------------|
| `root`     | Dark blue   | Starting position                |
| `action`   | Gray        | Technique or option              |
| `finish`   | Light blue  | End technique                    |
| `link`     | Yellow      | Links to another series          |
| `reaction` | Green       | Opponent reaction (Russian Tie Reactions) |

### Editing JSON Directly

You can also edit the `"flowcharts"` section of `techniques.json` by hand on GitHub:

- **Add a node** — Add `{"id": "unique-id", "label": "Display Name", "type": "action"}` to the `nodes` array
- **Add a connection** — Add `{"from": "parent-id", "to": "child-id"}` to the `edges` array
- **Remove a node** — Delete it from `nodes` and remove any edges that reference its `id`

### Popup Links

When you click a flowchart node, it looks up the node's label in `techniques.json` to show a popup with description and video. For this to work, the node `label` should match (or be a substring of) a technique `name` in the categories section. The builder's label autocomplete suggests matching technique names to make this easy.

## Editing Techniques

### Technique Editor (Recommended)

1. Go to the **Coaches Area** → **Technique Editor** (or open `hs/coaches/editor.html` directly)
2. Browse all techniques in the table view — search by name/description, filter by category
3. Click a technique row to open the detail panel with form fields for all data
4. Edit key points, common mistakes, related techniques (with autocomplete), and videos (with YouTube thumbnail preview)
5. Click **Apply Changes** to save to in-memory data, then **Save to GitHub** to commit
6. The save uses GitHub's API with SHA-based conflict detection — if someone else edited the file since you loaded it, you'll be warned

**First-time setup:** Click **Settings** in the toolbar and enter:
- **Owner/Repo**: `223wrestling/FowlervilleWrestling`
- **Branch**: `main`
- **Access Token**: A GitHub fine-grained personal access token with **Contents** read/write permission on the repo

You can also use **Export JSON** to download the file and commit manually.

### Editing JSON Directly

Technique data is in the `"categories"` section of `techniques.json`. Each technique has:

- `id` — URL-safe identifier (used in hash routing: `techniques.html#double-leg`)
- `name` — Display name
- `description` — Text description
- `keyPoints` — Array of coaching points
- `commonMistakes` — Array of common errors
- `related` — Array of other technique `id`s for cross-linking
- `videos` — Array of YouTube video objects (see above)

Changes to technique data take effect on browser refresh with no rebuild needed.

## Editing the Checklist

The checklist auto-generates from the categories in `techniques.json`. Just edit the techniques there:

- **Add a technique** — Add an object to a category's `techniques` array (needs at minimum `id` and `name`)
- **Remove a technique** — Delete it from the array
- **Rename** — Change the `name` field
- **Reorder** — Move items up/down within the array
- **Add a category** — Add a new object to the `categories` array with its own `techniques` array

Refresh the browser and the checklist updates automatically. No rebuild needed.

Student progress (checkboxes) is saved in the browser's localStorage. The "Clear All" button resets it. Checked state does not print — the print version always shows empty checkboxes.

## Testing Locally

```bash
cd /home/dave/Claude/Wrestling
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Press `Ctrl+C` in the terminal to stop the server.

## Hosting

The site is hosted on **GitHub Pages** with **Cloudflare** providing DNS and the coaches auth Worker.

### GitHub Pages Setup
1. Push to a GitHub repo
2. Go to Settings > Pages > set source to `main` branch
3. The `CNAME` file tells GitHub Pages to use `fowlervillewrestling.com`

### Cloudflare Setup
1. Add `fowlervillewrestling.com` to Cloudflare
2. Set DNS records to point to GitHub Pages (see [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site))
3. Deploy the coaches auth Worker — see `workers/README.md`

### Coaches Auth
The `/hs/coaches/` path is protected by a Cloudflare Worker that requires HTTP basic auth. Credentials are stored as Worker secrets, not in source. See `workers/README.md` for setup.

## Tech Stack

Pure HTML, CSS, and JavaScript. No frameworks, no build tools, no external dependencies. SVG for flowcharts. CSS Grid/Flexbox for layouts. `@media print` for the checklist.
