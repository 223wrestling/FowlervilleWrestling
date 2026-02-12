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
├── gen_flowcharts.py        Script to regenerate flowchart HTML from JSON
├── CNAME                    Custom domain for GitHub Pages
├── wrangler.toml            Cloudflare Worker config
├── workers/
│   ├── coaches-auth.js      Basic auth Worker for /hs/coaches/*
│   └── README.md            Worker setup instructions
├── css/
│   └── styles.css           Shared stylesheet
├── flowcharts/
│   ├── underhook.html
│   ├── collar-tie.html
│   ├── head-on-wrist.html
│   ├── russian-tie.html
│   ├── russian-tie-reactions.html
│   ├── elbow-control.html
│   └── front-headlock.html
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

Flow chart data is in the `"flowcharts"` section at the bottom of `techniques.json`. Each flowchart has nodes and edges:

```json
{
  "id": "underhook-series",
  "name": "Underhook Series",
  "rootNode": "underhook",
  "nodes": [
    {"id": "throw-by", "label": "Throw-by", "type": "action"}
  ],
  "edges": [
    {"from": "underhook", "to": "throw-by"}
  ]
}
```

### Node Types

| Type       | Color       | Use For                          |
|------------|-------------|----------------------------------|
| `root`     | Dark blue   | Starting position                |
| `action`   | Gray        | Technique or option              |
| `finish`   | Light blue  | End technique                    |
| `link`     | Yellow      | Links to another series          |
| `reaction` | Green       | Opponent reaction (used in Russian Tie Reactions) |

### Adding a Node

Add an object to the `nodes` array with a unique `id`, a display `label`, and a `type` from the table above.

### Adding a Connection

Add `{"from": "parent-id", "to": "child-id"}` to the `edges` array.

### Removing a Node

Delete the node from `nodes` and remove any edges that reference its `id`.

### Regenerating After Edits

After editing flowchart data in `techniques.json`, regenerate the HTML files:

```bash
python3 gen_flowcharts.py
```

Then refresh the browser.

### Popup Links

When you click a flowchart node, it looks up the node's label in `techniques.json` to show a popup with description and video. For this to work, the node `label` should match (or be a substring of) a technique `name` in the categories section. If there's no match, the popup shows a generic message instead.

## Editing Techniques

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
