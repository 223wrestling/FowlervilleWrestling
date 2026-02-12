#!/usr/bin/env python3
"""
Generate interactive SVG flowchart HTML files from techniques.json.

Usage:
    python3 gen_flowcharts.py

Reads flowchart data from techniques.json and generates one HTML file
per chain wrestling series in the flowcharts/ directory. Re-run this
script after editing flowchart nodes or edges in techniques.json.
"""
import json, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'techniques.json')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'flowcharts')

with open(DATA_FILE) as f:
    data = json.load(f)

def layout_tree(flowchart):
    """Compute positions for nodes in a tree layout."""
    nodes = {n['id']: n for n in flowchart['nodes']}
    edges = flowchart['edges']
    root_id = flowchart['rootNode']

    # Build adjacency list (children)
    children = {}
    has_parent = set()
    for e in edges:
        children.setdefault(e['from'], []).append(e['to'])
        has_parent.add(e['to'])

    # BFS to get levels
    levels = {}
    queue = [root_id]
    levels[root_id] = 0
    visited = {root_id}
    while queue:
        nid = queue.pop(0)
        for child in children.get(nid, []):
            if child not in visited:
                levels[child] = levels[nid] + 1
                visited.add(child)
                queue.append(child)

    # Add any orphan nodes
    for n in nodes:
        if n not in levels:
            levels[n] = 1

    # Group by level
    level_groups = {}
    for nid, lvl in levels.items():
        level_groups.setdefault(lvl, []).append(nid)

    max_level = max(levels.values()) if levels else 0

    # Compute positions
    NODE_W = 150
    NODE_H = 50
    H_GAP = 30
    V_GAP = 100

    positions = {}
    max_width = 0

    for lvl in range(max_level + 1):
        group = level_groups.get(lvl, [])
        n = len(group)
        row_width = n * NODE_W + (n - 1) * H_GAP
        max_width = max(max_width, row_width)

    svg_width = max(max_width + 80, 600)

    for lvl in range(max_level + 1):
        group = level_groups.get(lvl, [])
        n = len(group)
        row_width = n * NODE_W + (n - 1) * H_GAP
        start_x = (svg_width - row_width) / 2
        y = 60 + lvl * (NODE_H + V_GAP)
        for i, nid in enumerate(group):
            x = start_x + i * (NODE_W + H_GAP) + NODE_W / 2
            positions[nid] = (x, y)

    svg_height = 60 + (max_level + 1) * (NODE_H + V_GAP) + 40

    return positions, svg_width, svg_height, NODE_W, NODE_H

def generate_flowchart_html(fc):
    positions, svg_width, svg_height, NODE_W, NODE_H = layout_tree(fc)
    nodes = {n['id']: n for n in fc['nodes']}

    # Build SVG nodes
    svg_nodes = []
    for n in fc['nodes']:
        if n['id'] not in positions:
            continue
        x, y = positions[n['id']]
        rx = NODE_W / 2
        ry = NODE_H / 2
        ntype = n.get('type', 'action')

        # Multi-line text for long labels
        label = n['label']
        lines = []
        if len(label) > 18:
            words = label.split()
            line = ''
            for w in words:
                if len(line + ' ' + w) > 18 and line:
                    lines.append(line)
                    line = w
                else:
                    line = (line + ' ' + w).strip()
            if line:
                lines.append(line)
        else:
            lines = [label]

        text_y_start = y - (len(lines) - 1) * 8
        text_els = '\n'.join(
            f'<tspan x="{x}" dy="{0 if i == 0 else 16}">{l}</tspan>'
            for i, l in enumerate(lines)
        )

        svg_nodes.append(f'''
    <g class="fc-node node-{ntype}" data-id="{n['id']}" onclick="showNodeInfo('{n['id']}')">
      <ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry + (len(lines)-1)*6}"/>
      <text x="{x}" y="{text_y_start}">{text_els}</text>
    </g>''')

    # Build SVG edges
    svg_edges = []
    for e in fc['edges']:
        if e['from'] not in positions or e['to'] not in positions:
            continue
        x1, y1 = positions[e['from']]
        x2, y2 = positions[e['to']]
        from_node = nodes.get(e['from'], {})
        to_node = nodes.get(e['to'], {})

        # Adjust start/end to ellipse borders
        from_ry = NODE_H / 2 + (len(from_node.get('label', '')) > 18) * 6
        to_ry = NODE_H / 2 + (len(to_node.get('label', '')) > 18) * 6

        # Simple bezier curve
        y1_adj = y1 + from_ry
        y2_adj = y2 - to_ry
        mid_y = (y1_adj + y2_adj) / 2

        svg_edges.append(f'''
    <path class="fc-edge" d="M {x1} {y1_adj} C {x1} {mid_y}, {x2} {mid_y}, {x2} {y2_adj}"/>''')

    # Build node data for popups
    node_data = {}
    for n in fc['nodes']:
        node_data[n['id']] = {
            'label': n['label'],
            'type': n.get('type', 'action')
        }

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{fc['name']} - Wrestling Flow Chart</title>
  <link rel="stylesheet" href="../../css/styles.css">
  <style>
    .flowchart-wrapper {{
      text-align: center;
      overflow-x: auto;
      padding: 1rem;
    }}
    svg {{ max-width: 100%; height: auto; }}
    .legend {{
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin: 1rem 0;
      font-size: 0.85rem;
    }}
    .legend-item {{
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }}
    .legend-dot {{
      width: 16px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--primary);
    }}
    .legend-dot.root {{ background: var(--primary); }}
    .legend-dot.action {{ background: #d9d9d9; }}
    .legend-dot.finish {{ background: #e8eef4; }}
    .legend-dot.link {{ background: #fff3cd; border-color: #856404; }}
    .legend-dot.reaction {{ background: #d4edda; border-color: #155724; }}
  </style>
</head>
<body>
  <header class="site-header">
    <div>
      <h1>{fc['name']}</h1>
      <div class="subtitle">Chain Wrestling Flow Chart</div>
    </div>
    <nav>
      <a href="../../index.html">Home</a>
      <a href="../index.html">Youth Club</a>
      <a href="../checklist.html">Checklist</a>
      <a href="../techniques.html">Techniques</a>
    </nav>
  </header>

  <div class="container">
    <a href="../index.html" class="back-link" style="display:inline-flex;align-items:center;gap:0.3rem;color:var(--primary);text-decoration:none;font-weight:500;margin-bottom:1rem;">&larr; All Flow Charts</a>

    <div class="legend">
      <div class="legend-item"><div class="legend-dot root"></div> Starting Position</div>
      <div class="legend-item"><div class="legend-dot action"></div> Technique / Action</div>
      <div class="legend-item"><div class="legend-dot finish"></div> Finish</div>
      <div class="legend-item"><div class="legend-dot link"></div> Links to Another Series</div>
    </div>

    <div class="flowchart-wrapper">
      <svg viewBox="0 0 {svg_width} {svg_height}" width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">
        <defs></defs>
        {''.join(svg_edges)}
        {''.join(svg_nodes)}
      </svg>
    </div>

    <p style="text-align:center;color:var(--text-light);font-size:0.85rem;margin-top:0.5rem;">Click any node to see technique details and video links</p>
  </div>

  <!-- Popup -->
  <div class="popup-overlay" id="popup" onclick="if(event.target===this)closePopup()">
    <div class="popup-panel">
      <button class="popup-close" onclick="closePopup()">&times;</button>
      <div id="popup-content"></div>
    </div>
  </div>

  <script>
    const nodeData = {json.dumps(node_data)};
    let techniquesData = null;

    async function loadTechniques() {{
      try {{
        const resp = await fetch('../techniques.json');  // youth/techniques.json
        techniquesData = await resp.json();
      }} catch(e) {{
        console.log('Could not load techniques.json for popup details');
      }}
    }}
    loadTechniques();

    function findTechnique(label) {{
      if (!techniquesData) return null;
      const labelLower = label.toLowerCase();
      for (const cat of techniquesData.categories) {{
        for (const t of cat.techniques) {{
          if (t.name.toLowerCase() === labelLower ||
              labelLower.includes(t.name.toLowerCase()) ||
              t.name.toLowerCase().includes(labelLower)) {{
            return t;
          }}
        }}
      }}
      return null;
    }}

    function showNodeInfo(nodeId) {{
      const node = nodeData[nodeId];
      if (!node) return;

      const technique = findTechnique(node.label);
      const popup = document.getElementById('popup');
      const content = document.getElementById('popup-content');

      let html = '<h2 style="color:var(--primary);margin-bottom:0.5rem;">' + node.label + '</h2>';

      if (technique) {{
        html += '<p style="margin-bottom:1rem;">' + technique.description + '</p>';

        if (technique.keyPoints && technique.keyPoints.length) {{
          html += '<h3 style="color:var(--primary-light);margin-bottom:0.5rem;">Key Points</h3>';
          html += '<ul class="key-points">' + technique.keyPoints.map(p => '<li>' + p + '</li>').join('') + '</ul>';
        }}

        if (technique.videos && technique.videos.length) {{
          html += '<h3 style="color:var(--primary-light);margin:1rem 0 0.5rem;">Video</h3>';
          const v = technique.videos[0];
          html += '<div class="video-container"><iframe src="https://www.youtube.com/embed/' + v.id + '" allowfullscreen loading="lazy"></iframe></div>';
          html += '<p style="font-size:0.85rem;color:var(--text-light);">' + v.title + '</p>';
        }}

        html += '<div style="margin-top:1rem;"><a href="../techniques.html#' + technique.id + '" class="btn btn-primary" style="color:white;">View Full Details</a></div>';
      }} else {{
        html += '<p style="color:var(--text-light);">Click "View Full Details" for more information about this technique.</p>';

        // Try to link to a search
        const searchTerm = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        html += '<div style="margin-top:1rem;"><a href="../techniques.html#' + searchTerm + '" class="btn btn-outline">Search Techniques</a></div>';
      }}

      content.innerHTML = html;
      popup.classList.add('active');
    }}

    function closePopup() {{
      document.getElementById('popup').classList.remove('active');
    }}

    document.addEventListener('keydown', e => {{
      if (e.key === 'Escape') closePopup();
    }});
  </script>
</body>
</html>'''


# Generate all flowcharts
os.makedirs(OUTPUT_DIR, exist_ok=True)

FILE_MAP = {
    'underhook-series': 'underhook.html',
    'collar-tie-series': 'collar-tie.html',
    'head-on-wrist-series': 'head-on-wrist.html',
    'russian-tie-series': 'russian-tie.html',
    'russian-tie-reactions': 'russian-tie-reactions.html',
    'elbow-control-series': 'elbow-control.html',
    'front-headlock-series': 'front-headlock.html',
}

if __name__ == '__main__':
    for fc in data['flowcharts']:
        filename = FILE_MAP.get(fc['id'], fc['id'] + '.html')
        filepath = os.path.join(OUTPUT_DIR, filename)
        html = generate_flowchart_html(fc)
        with open(filepath, 'w') as f:
            f.write(html)
        print(f"Generated: {filepath}")

    print(f"\nDone! {len(data['flowcharts'])} flowcharts generated in {OUTPUT_DIR}/")
