# MetroMap.js

A parametric SVG library and a WYSIWYG builder for creating beautiful metro-style roadmap diagrams. Perfect for visualizing project timelines, product roadmaps, and strategic plans.

![MetroMap Example](https://img.shields.io/badge/version-2.1-blue) ![License](https://img.shields.io/badge/license-MIT-green) 

<img width="1000" alt="example" src="https://github.com/user-attachments/assets/03d9e677-02dc-461e-a281-5b9ce729a26b" />


## Features

- **Vertical & Horizontal Layouts** - Switch orientation with a single config option
- **Multiple Track Styles** - Solid, gradient, and dashed lines
- **Station Statuses** - Completed, active, milestone, future, and default states
- **Crossing Connections** - Link stations across tracks with bezier, metro 45°, metro smooth, or straight styles
- **Auto-fit Canvas** - Automatically sizes to content
- **Customizable Styling** - Global text size, colors, spacing, and per-element overrides
- **Complete JSON Export** - Preserves all design settings for perfect restoration
- **Interactive Builder** - Visual WYSIWYG editor with theme support
- **Export Options** - SVG, PNG, and JSON export
- **Zero Dependencies** - Pure vanilla JavaScript

## Quick Start

### 1. Include the Library

```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="roadmap"></div>
  <script src="js/metro-map.js"></script>
</body>
```

### 2. Create a Map

```javascript
const map = new MetroMap('#roadmap', {
  orientation: 'vertical',
  autoFit: true
});

map.setData({
  title: 'Product Roadmap 2024',
  tracks: [
    {
      name: 'Backend',
      color: '#1e3a8a',
      stations: [
        { name: 'API v2', date: 'Q1', status: 'completed' },
        { name: 'Database Migration', date: 'Q2', status: 'active' },
        { name: 'Microservices', date: 'Q3', status: 'future' }
      ]
    },
    {
      name: 'Frontend',
      color: '#D63384',
      stations: [
        { name: 'Design System', date: 'Q1', status: 'completed' },
        { name: 'React Upgrade', date: 'Q2', status: 'active' }
      ]
    }
  ],
  crossings: []
}).render();
```

## Configuration Options

```javascript
const map = new MetroMap('#container', {
  // Layout
  orientation: 'vertical',      // 'vertical' or 'horizontal'
  width: 800,                   // Canvas width (ignored if autoFit: true)
  height: 600,                  // Canvas height (ignored if autoFit: true)
  autoFit: true,                // Auto-size canvas to content
  
  // Spacing
  trackSpacing: 140,            // Horizontal gap between tracks
  stationSpacing: 100,          // Vertical gap between stations
  padding: {                    // Canvas padding
    top: 80,
    right: 60,
    bottom: 80,
    left: 60
  },
  
  // Element Sizing
  lineWidth: 6,                 // Track line thickness
  stationRadius: 12,            // Station circle radius
  
  // Text Styling
  fontSizeAdjust: 0,            // Relative adjustment to all text sizes
  textColor: '#1e293b',         // Global text color
  labelOffset: 8,               // Distance from station to label
  
  // Track Title Box
  titleBg: '#ffffff',           // Title box background
  titleBorder: true,            // Show title box border
  titleBorderColor: '#e2e8f0',  // Border color
  titlePadding: 12,             // Internal padding
  
  // Background
  backgroundColor: '#eff6ff',   // Canvas background color
  
  // Theme Colors (override default status colors)
  colors: {
    primary: '#1e3a8a',         // Default track color
    accent: '#D63384',          // Active station color
    success: '#10b981',         // Completed station color
    muted: '#94a3b8',           // Future station color
    white: '#ffffff',           // Station fill
    light: '#f8fafc',           // Future station fill
    dark: '#0a1628'             // Shadow color
  },
  
  // Legend
  showLegend: false             // Show status legend at bottom
});
```

See the [Config Properties](#config-properties) table for a complete reference.

## Data Structure

### Complete JSON Export Format

The builder exports a complete project file containing both configuration and data:

```json
{
  "config": {
    "orientation": "vertical",
    "trackSpacing": 140,
    "stationSpacing": 100,
    "lineWidth": 6,
    "stationRadius": 12,
    "backgroundColor": "#eff6ff",
    "autoFit": true,
    "width": 800,
    "height": 600,
    "fontSizeAdjust": 0,
    "textColor": "#1e293b",
    "labelOffset": 8,
    "titleBg": "#ffffff",
    "titleBorder": true,
    "titleBorderColor": "#e2e8f0",
    "titlePadding": 12,
    "showLegend": false
  },
  "data": {
    "title": "Roadmap Title",
    "tracks": [
      {
        "name": "Track Name",
        "description": "Optional subtitle",
        "color": "#1e3a8a",
        "style": "solid",
        "lineWidth": 8,
        "stations": [
          {
            "name": "Station Name",
            "date": "Q1 2024",
            "description": "Optional details",
            "status": "completed",
            "labelSide": "right",
            "labelOffsetX": 0,
            "labelOffsetY": 0,
            "radius": 14
          }
        ]
      }
    ],
    "crossings": [
      {
        "fromTrack": 0,
        "toTrack": 1,
        "fromStation": 2,
        "toStation": 2,
        "style": "metro-smooth",
        "color": "#888888",
        "label": "Integration Point",
        "markerStyle": "circle"
      }
    ],
    "phases": [],
    "timeMarkers": []
  }
}
```

### Config Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `orientation` | string | `vertical` | Layout direction: `vertical` or `horizontal` |
| `trackSpacing` | number | `140` | Horizontal gap between tracks |
| `stationSpacing` | number | `100` | Vertical gap between stations |
| `lineWidth` | number | `6` | Default track line thickness |
| `stationRadius` | number | `12` | Default station circle radius |
| `backgroundColor` | string | `#eff6ff` | Canvas background color |
| `autoFit` | boolean | `true` | Auto-size canvas to content |
| `width` | number | `800` | Manual canvas width (when autoFit is false) |
| `height` | number | `600` | Manual canvas height (when autoFit is false) |
| `fontSizeAdjust` | number | `0` | Relative adjustment to all text sizes |
| `textColor` | string | `#1e293b` | Global text color |
| `labelOffset` | number | `8` | Distance from station to label |
| `titleBg` | string | `#ffffff` | Track title box background |
| `titleBorder` | boolean | `true` | Show track title box border |
| `titleBorderColor` | string | `#e2e8f0` | Title box border color |
| `titlePadding` | number | `12` | Title box internal padding |
| `showLegend` | boolean | `false` | Show status legend |

### Track Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | required | Track display name |
| `description` | string | - | Subtitle shown below name |
| `color` | string | `#1e3a8a` | Track line color (hex) |
| `style` | string | `solid` | Line style: `solid`, `gradient`, `dashed` |
| `lineWidth` | number | config value | Override line thickness |
| `stations` | array | required | Array of station objects |

### Station Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | required | Station display name |
| `date` | string | - | Date/time label (e.g., "Q1 2024") |
| `description` | string | - | Additional description text |
| `status` | string | `default` | Visual status (see below) |
| `labelSide` | string | `auto` | Label position: `auto`, `left`, `right`, `top`, `bottom` |
| `labelOffsetX` | number | 0 | Horizontal label offset in pixels |
| `labelOffsetY` | number | 0 | Vertical label offset in pixels |
| `radius` | number | config value | Override station circle size |

### Station Statuses

| Status | Appearance |
|--------|------------|
| `default` | White fill with track-colored border |
| `completed` | Green fill with checkmark |
| `active` | Pulsing track-colored fill |
| `milestone` | Larger diamond shape |
| `future` | Gray dashed border |

### Crossing Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fromTrack` | number | required | Source track index (0-based) |
| `toTrack` | number | required | Target track index (0-based) |
| `fromStation` | number | required | Source station index (0-based) |
| `toStation` | number | required | Target station index (0-based) |
| `style` | string | `bezier` | Path style (see below) |
| `color` | string | `#888888` | Line color or `gradient` |
| `label` | string | - | Optional label at midpoint |
| `markerStyle` | string | `circle` | Marker: `circle`, `diamond`, `dot`, `none` |

### Crossing Styles

| Style | Description |
|-------|-------------|
| `bezier` | Smooth S-curve |
| `metro` | Sharp 45° angled corners |
| `metro-smooth` | Rounded 45° corners |
| `straight` | Direct line |

## Methods

```javascript
const map = new MetroMap('#container', config);

// Set data and render
map.setData(jsonData).render();

// Update configuration
map.setConfig({ orientation: 'horizontal' }).render();

// Get current data (for export)
const data = map.getData();

// Reset canvas size calculation
map.resetCanvasSize();
```

## Loading External JSON

```javascript
// Load complete project (config + data)
fetch('roadmap.json')
  .then(res => res.json())
  .then(project => {
    new MetroMap('#roadmap', project.config)
      .setData(project.data)
      .render();
  });

// Load with custom config overrides
async function loadRoadmap() {
  const response = await fetch('/api/roadmap');
  const project = await response.json();
  
  // Merge with custom overrides
  const config = { ...project.config, autoFit: true };
  
  new MetroMap('#roadmap', config)
    .setData(project.data)
    .render();
}

// Load legacy format (data only)
fetch('legacy-roadmap.json')
  .then(res => res.json())
  .then(data => {
    new MetroMap('#roadmap', { autoFit: true })
      .setData(data)
      .render();
  });
```

## Responsive Embedding

```html
<style>
  .roadmap-wrapper {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    overflow-x: auto;
  }
</style>

<div class="roadmap-wrapper">
  <div id="roadmap"></div>
</div>
```

For true responsive scaling:

```css
.roadmap-wrapper svg {
  width: 100%;
  height: auto;
  max-width: 100%;
}
```

## Visual Builder

A full-featured WYSIWYG editor is included at `metro-map-builder.html`.

### Builder Features

- Drag-and-drop station positioning
- Visual track and station editing
- Crossing creation tool
- Real-time preview
- **Complete JSON import/export** (preserves all settings)
- SVG and PNG export
- Zoom controls (5% - 500%)
- Canvas size presets
- Theme switching (Default / S-Theme)

### Using the Builder

1. Open `metro-map-builder.html` in a browser
2. Add tracks using the sidebar
3. Click on tracks to add stations
4. Use the Crossing tool to connect stations
5. Double-click elements to edit properties
6. Export JSON when finished

### JSON Import/Export

The builder exports a complete project file that preserves **all design settings**:

- **Global config**: orientation, spacing, line widths, colors, text styling
- **Track data**: names, colors, styles, per-track line width overrides
- **Station data**: names, dates, statuses, per-station radius overrides, label positions
- **Crossings**: connections between tracks with styles and colors

When you import a JSON file, all UI controls automatically update to reflect the imported settings.

### Loading Builder Output in Code

```javascript
// Load exported JSON file
fetch('my-roadmap.json')
  .then(res => res.json())
  .then(project => {
    // Project contains { config: {...}, data: {...} }
    const map = new MetroMap('#roadmap', project.config);
    map.setData(project.data).render();
  });

// Or with async/await
async function loadRoadmap() {
  const response = await fetch('my-roadmap.json');
  const project = await response.json();
  
  new MetroMap('#roadmap', project.config)
    .setData(project.data)
    .render();
}
```

### Backward Compatibility

The library also accepts the legacy format (data only, no config wrapper):

```javascript
// Legacy format still works
const legacyData = {
  title: 'My Roadmap',
  tracks: [...],
  crossings: [...]
};

new MetroMap('#roadmap', { autoFit: true })
  .setData(legacyData)
  .render();
```

## Examples

### Horizontal Timeline

```javascript
new MetroMap('#timeline', {
  orientation: 'horizontal',
  autoFit: true,
  trackSpacing: 80,
  stationSpacing: 150
}).setData({
  tracks: [{
    name: '2024 Milestones',
    color: '#1e3a8a',
    stations: [
      { name: 'Kickoff', date: 'Jan', status: 'completed' },
      { name: 'Alpha', date: 'Apr', status: 'completed' },
      { name: 'Beta', date: 'Jul', status: 'active' },
      { name: 'Launch', date: 'Oct', status: 'milestone' }
    ]
  }]
}).render();
```

### Multi-Track Roadmap with Crossings

```javascript
new MetroMap('#roadmap', {
  autoFit: true,
  fontSizeAdjust: 2,
  titleBorder: false
}).setData({
  title: 'Platform Evolution',
  tracks: [
    {
      name: 'Infrastructure',
      color: '#0891b2',
      stations: [
        { name: 'Cloud Migration', status: 'completed' },
        { name: 'Kubernetes', status: 'active' },
        { name: 'Service Mesh', status: 'future' }
      ]
    },
    {
      name: 'Data Platform',
      color: '#8b5cf6',
      stations: [
        { name: 'Data Lake', status: 'completed' },
        { name: 'Real-time Pipeline', status: 'active' },
        { name: 'ML Platform', status: 'future' }
      ]
    }
  ],
  crossings: [{
    fromTrack: 0,
    toTrack: 1,
    fromStation: 1,
    toStation: 1,
    style: 'metro-smooth',
    color: 'gradient',
    label: 'Integration'
  }]
}).render();
```

### Dark Theme

```javascript
new MetroMap('#dark-roadmap', {
  autoFit: true,
  backgroundColor: '#0a1628',
  textColor: '#e2e8f0',
  titleBg: '#1e293b',
  titleBorderColor: '#334155'
}).setData(data).render();
```

## Export

### JSON Export (Recommended)

Export a complete project file that preserves all settings:

```javascript
function exportJSON(map, data, config, filename) {
  const project = {
    config: config,
    data: data
  };
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.json';
  a.click();
  URL.revokeObjectURL(url);
}
```

### SVG Export

```javascript
// Get SVG element
const svg = document.querySelector('#roadmap svg');
const svgData = new XMLSerializer().serializeToString(svg);
const blob = new Blob([svgData], { type: 'image/svg+xml' });

// Download
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'roadmap.svg';
a.click();
```

### PNG Export

```javascript
const svg = document.querySelector('#roadmap svg');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();

// Set dimensions
canvas.width = parseInt(svg.getAttribute('width')) * 2;  // 2x for retina
canvas.height = parseInt(svg.getAttribute('height')) * 2;
ctx.scale(2, 2);

// Convert and download
const svgData = new XMLSerializer().serializeToString(svg);
const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
const url = URL.createObjectURL(svgBlob);

img.onload = () => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  
  const pngUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = 'roadmap.png';
  a.click();
};

img.src = url;
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - feel free to use in personal and commercial projects.

## Credits
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/vincentmakes)  
Created for the [Architecting Tomorrow](https://architecting.verdet.me) blog by Vincent Verdet.
