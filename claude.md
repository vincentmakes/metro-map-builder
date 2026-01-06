# Metro Map Builder - Claude Documentation

## Project Overview

MetroMap.js is a parametric SVG library for creating metro-style roadmap diagrams, accompanied by a full-featured WYSIWYG visual builder. The project is part of the "Architecting Tomorrow" blog.

## File Structure

```
public/
├── metro-map-builder.html    # WYSIWYG visual editor
├── README.md                 # Public documentation
├── claude.md                 # This file - development guidelines
├── css/
│   ├── metro-builder-default.css  # Default theme (Architecting Tomorrow)
│   └── metro-builder-s-theme.css  # S-Theme (professional blue palette)
└── js/
    └── metro-map.js          # Core library
```

## Architecture

### Core Library (metro-map.js)

The `MetroMap` class is a self-contained SVG generator with:

- **Static Properties**:
  - `COLORS` - Design system colors (primary, accent, success, muted, etc.)
  - `DEFAULTS` - Default configuration values

- **Key Methods**:
  - `constructor(container, config)` - Initialize with DOM selector and config
  - `setConfig(config)` - Update configuration (chainable)
  - `setData(data)` - Set roadmap data (chainable)
  - `render()` - Generate SVG
  - `toSVG()` - Export as SVG string (Inkscape-compatible)
  - `toDataURL()` - Export as base64 data URL
  - `toJSON()` / `fromJSON()` - Serialize/deserialize complete project

### Builder (metro-map-builder.html)

Single-file application with:
- External CSS via `<link id="theme-stylesheet">`
- Inline JavaScript for all interactivity
- State management via `state` object containing `config` and `data`

## Data Model

### Project Format (JSON Export)

```javascript
{
  config: {
    // Layout
    orientation: 'vertical',    // 'vertical' | 'horizontal'
    autoFit: true,
    width: 800,
    height: 600,
    
    // Spacing
    trackSpacing: 140,
    stationSpacing: 100,
    
    // Element sizing
    lineWidth: 6,
    stationRadius: 12,
    
    // Colors
    backgroundColor: '#eff6ff',
    textColor: '#1e293b',
    
    // Text styling
    fontSizeAdjust: 0,
    labelOffset: 8,
    
    // Title box
    titleBg: '#ffffff',
    titleBorder: true,
    titleBorderColor: '#e2e8f0',
    titlePadding: 12,
    
    // Features
    showLegend: false
  },
  data: {
    title: 'Roadmap Title',
    tracks: [...],
    crossings: [...],
    phases: [],
    timeMarkers: []
  }
}
```

### Track Object

```javascript
{
  name: 'Track Name',
  description: 'Optional subtitle',
  color: '#1e3a8a',
  style: 'solid',           // 'solid' | 'gradient' | 'dashed'
  lineWidth: 8,             // Override global lineWidth
  stations: [...]
}
```

### Station Object

```javascript
{
  name: 'Station Name',
  date: 'Q1 2024',
  description: 'Optional details',
  status: 'completed',      // 'default' | 'completed' | 'active' | 'milestone' | 'future'
  labelSide: 'right',       // 'auto' | 'left' | 'right' | 'top' | 'bottom'
  labelOffsetX: 0,
  labelOffsetY: 0,
  radius: 14                // Override global stationRadius
}
```

### Crossing Object

```javascript
{
  fromTrack: 0,
  toTrack: 1,
  fromStation: 2,
  toStation: 2,
  style: 'metro-smooth',    // 'bezier' | 'metro' | 'metro-smooth' | 'straight'
  color: '#888888',         // Hex color or 'gradient'
  label: 'Integration',
  markerStyle: 'circle'     // 'circle' | 'diamond' | 'dot' | 'none'
}
```

## Theme System

### CSS Architecture

Themes use CSS custom properties for easy switching:

```css
:root {
  --theme-primary: #0a1628;
  --theme-secondary: #1e3a8a;
  --theme-accent: #1d4ed8;
  --theme-highlight: #D63384;
  --theme-success: #10b981;
  /* ... etc */
}
```

### Available Themes

1. **Default** (`metro-builder-default.css`) - Architecting Tomorrow design system
   - Blue dominant (#1e3a8a, #1d4ed8)
   - Magenta accent (#D63384)
   
2. **S-Theme** (`metro-builder-s-theme.css`) - Professional palette
   - Primary blue (#002EFF)
   - Structured grays and blues

### Switching Themes

```javascript
function switchTheme(theme) {
  document.getElementById('theme-stylesheet').href = `css/metro-builder-${theme}.css`;
  updateThemeColors(theme);  // Also updates map color palettes
}
```

## SVG Export

### Inkscape Compatibility

The `toSVG()` method generates Inkscape-compatible SVG with:

1. **Proper filter primitives** - Uses `feGaussianBlur`, `feOffset`, `feFlood`, `feComposite`, `feMerge` instead of `feDropShadow`
2. **System font fallbacks** - `'Inter', 'Arial', 'Helvetica', sans-serif`
3. **XML declaration** - Includes `<?xml version="1.0" encoding="UTF-8"?>`
4. **Explicit font-family** on all text elements
5. **Proper SVG namespaces** - xmlns and xmlns:xlink attributes

### Export Code

```javascript
// SVG export
const svgString = map.toSVG();
const blob = new Blob([svgString], { type: 'image/svg+xml' });

// JSON export (preserves all settings)
const json = JSON.stringify({ config: state.config, data: state.data }, null, 2);
```

## Builder UI Components

### Sidebar Sections

- **Map Properties** - Title, orientation, canvas size
- **Layout** - Track/station spacing, line width, station size
- **Text Styling** - Font size adjust, text color, title box settings
- **Background** - Color picker with presets
- **Tracks** - Draggable list with add/edit functionality

### Modals

- **Station Modal** (`#station-modal`) - Edit station properties
- **Track Modal** (`#track-modal`) - Edit track properties
- **Crossing Modal** (`#crossing-modal`) - Edit crossing properties

### Floating Panels

- **Legend Panel** - Draggable status legend

## Key Functions

### State Management

```javascript
const state = {
  config: { /* map configuration */ },
  data: { title: '', tracks: [], crossings: [], phases: [], timeMarkers: [] },
  tool: 'select',       // Current tool mode
  selection: null,      // Selected element
  crossingStart: null,  // Crossing creation state
  drag: null,           // Drag operation state
  zoom: 1,
  sizeMode: 'auto'      // 'auto' | 'manual'
};
```

### Render Pipeline

```javascript
function render() {
  map.setConfig(state.config).setData(state.data).render();
  renderTrackList();
  applySelection();
  updateHint();
  // Sync canvas background
  document.getElementById('canvas-wrap').style.setProperty('--canvas-bg', state.config.backgroundColor);
}
```

### Import/Export

```javascript
// Import - restores both config and data
function importJSON(e) {
  const obj = JSON.parse(fileContent);
  state.data = obj.data || obj;
  if (obj.config) Object.assign(state.config, obj.config);
  updateUIFromState();  // Sync all UI controls
  render();
}

// Export - saves complete project
function exportJSON() {
  const { colors, ...exportConfig } = state.config;  // Exclude theme colors
  const blob = new Blob([JSON.stringify({ config: exportConfig, data: state.data }, null, 2)]);
  download(blob, filename + '.json');
}
```

## Common Tasks

### Adding a New Config Option

1. Add default value to `state.config` in builder
2. Add default value to `MetroMap.DEFAULTS` in library
3. Add UI control in sidebar HTML
4. Add event handler to update `state.config.newOption`
5. Add to `updateUIFromState()` for import sync
6. Use in library's render methods as needed

### Adding a New Station Status

1. Add color to `MetroMap.COLORS` static property
2. Add rendering logic in `renderStation()` method
3. Add CSS class in theme files (`.status-pill.newstatus`, `.legend-dot.newstatus`)
4. Add to status pills in station modal HTML

### Adding a New Crossing Style

1. Add case in `createCrossingPath()` method
2. Document in README.md crossing styles table

## Development Notes

### Browser Compatibility

- Target: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- Known issue: Edge may crash with file input on some systems (browser bug, not code issue)

### Performance Considerations

- SVG re-renders on every change - acceptable for typical roadmap sizes
- Drag operations use direct DOM manipulation for responsiveness
- Large maps (50+ stations) may benefit from virtualization (not implemented)

### Testing

Test any changes with:
1. Browser preview (Chrome/Firefox/Safari)
2. SVG export → open in Inkscape
3. JSON export → import → verify all settings restored
4. Theme switching → verify colors update

## Version History

- **v2.1** - Complete JSON export (preserves all config), Inkscape-compatible SVG export
- **v2.0** - Theme system, crossing improvements, global text controls
- **v1.0** - Initial release with basic functionality
