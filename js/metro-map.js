/**
 * MetroMap.js v2.0 - Parametric SVG Metro Map Library
 * For Architecting Tomorrow blog roadmaps
 * 
 * Features:
 * - Horizontal and vertical orientations
 * - Smooth bezier curve crossings with proper flow
 * - Configurable text (size, color, orientation)
 * - Auto-fit to container width
 * - Multiple station and track styles
 */

class MetroMap {
  // Design system colors (defaults)
  static COLORS = {
    primary: '#1e3a8a',
    secondary: '#0284c7',
    tertiary: '#0891b2',
    accent: '#D63384',
    success: '#10b981',
    warning: '#f59e0b',
    muted: '#94a3b8',
    white: '#ffffff',
    light: '#f8fafc',
    paleBlue: '#eff6ff',
    lightBlue: '#dbeafe',
    border: '#e2e8f0',
    text: '#334155',
    dark: '#0a1628'
  };

  // Default configuration
  static DEFAULTS = {
    orientation: 'vertical', // 'vertical' or 'horizontal'
    width: 800,
    height: 600,
    autoFit: true,
    showLegend: true,
    padding: { top: 80, right: 60, bottom: 80, left: 60 },
    trackSpacing: 120,
    stationSpacing: 100,
    lineWidth: 6,
    stationRadius: 12,
    milestoneRadius: 16,
    
    // Global text settings
    fontSizeAdjust: 0,  // Relative adjustment to base font sizes
    textColor: '#1e293b',
    labelOffset: 8,
    
    // Title box settings
    titleBg: '#ffffff',
    titleBorder: true,
    titleBorderColor: '#e2e8f0',
    titlePadding: 12,
    
    // Theme colors (override static COLORS)
    colors: null,
    
    text: {
      trackName: { size: 13, color: null, weight: 700 },
      trackDesc: { size: 10, color: '#64748b', weight: 400 },
      stationName: { size: 13, color: '#0a1628', weight: 600 },
      stationDate: { size: 11, color: '#64748b', weight: 500 },
      stationDesc: { size: 11, color: '#334155', weight: 400 },
      phaseLabel: { size: 11, color: null, weight: 700 },
      timeMarker: { size: 11, color: '#64748b', weight: 600 }
    },
    
    labelRotation: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  };
  
  // Get color with config override support
  getColor(name) {
    if (this.config.colors && this.config.colors[name]) {
      return this.config.colors[name];
    }
    return MetroMap.COLORS[name];
  }

  constructor(container, config = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.config = this.mergeConfig(MetroMap.DEFAULTS, config);
    this.data = { title: '', tracks: [], crossings: [], phases: [], timeMarkers: [] };
    this.svg = null;
    this.defs = null;
  }

  mergeConfig(defaults, custom) {
    if (!custom) return { ...defaults };
    return { ...defaults, ...custom };
  }

  setConfig(config) {
    this.config = this.mergeConfig(this.config, config);
    return this;
  }

  setData(data) {
    this.data = {
      title: data.title || '',
      tracks: data.tracks || [],
      crossings: data.crossings || [],
      phases: data.phases || [],
      timeMarkers: data.timeMarkers || []
    };
    return this;
  }
  
  resetCanvasSize() {
    this._canvasWidth = null;
    this._canvasHeight = null;
    return this;
  }

  isHorizontal() {
    return this.config.orientation === 'horizontal';
  }

  calculateDimensions() {
    const trackCount = this.data.tracks?.length || 1;
    const padding = this.config.padding || { top: 80, right: 60, bottom: 80, left: 60 };
    const trackSpacing = this.config.trackSpacing || 120;
    const stationSpacing = this.config.stationSpacing || 100;

    // If autoFit is disabled, use manual dimensions directly
    if (!this.config.autoFit) {
      return;
    }

    // Find the actual extents by checking all station positions including offsets
    let maxStationPos = 0;
    let minStationPos = 0;
    
    (this.data.tracks || []).forEach((track, trackIdx) => {
      (track.stations || []).forEach((station, stationIdx) => {
        const basePos = stationIdx * stationSpacing;
        const offset = station.positionOffset || 0;
        const actualPos = basePos + offset;
        
        maxStationPos = Math.max(maxStationPos, actualPos);
        minStationPos = Math.min(minStationPos, actualPos);
      });
    });
    
    // Calculate content bounds (where the furthest element is)
    const stationExtent = maxStationPos - minStationPos + stationSpacing;
    
    let contentRight, contentBottom;
    if (this.isHorizontal()) {
      const contentHeight = (trackCount - 1) * trackSpacing;
      contentRight = stationExtent + padding.left + 200;
      contentBottom = contentHeight + padding.top + padding.bottom + 80;
    } else {
      const contentWidth = (trackCount - 1) * trackSpacing;
      contentRight = contentWidth + padding.left + padding.right + 200;
      contentBottom = stationExtent + padding.top + 120;
    }
    
    // Get visible viewport size (the scrollable parent container)
    let viewportWidth = 1200;
    let viewportHeight = 800;
    if (this.container && this.container.parentElement) {
      viewportWidth = this.container.parentElement.clientWidth || 1200;
      viewportHeight = this.container.parentElement.clientHeight || 800;
    }
    
    // Initialize canvas to viewport size if not set
    if (!this._canvasWidth) this._canvasWidth = viewportWidth;
    if (!this._canvasHeight) this._canvasHeight = viewportHeight;
    
    // Only expand when content is within 30px of current canvas edge
    const edgeThreshold = 30;
    const expandAmount = 400;
    
    if (contentRight > this._canvasWidth - edgeThreshold) {
      this._canvasWidth = contentRight + expandAmount;
    }
    if (contentBottom > this._canvasHeight - edgeThreshold) {
      this._canvasHeight = contentBottom + expandAmount;
    }
    
    this.config.width = this._canvasWidth;
    this.config.height = this._canvasHeight;
  }

  createSVG(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, value);
      }
    });
    return el;
  }

  getTrackPos(trackIndex) {
    const count = this.data.tracks.length;
    const spacing = this.config.trackSpacing;
    
    if (this.isHorizontal()) {
      const totalHeight = (count - 1) * spacing;
      const startY = this.config.padding.top + 40;
      return startY + trackIndex * spacing;
    } else {
      const totalWidth = (count - 1) * spacing;
      const startX = (this.config.width - totalWidth) / 2;
      return startX + trackIndex * spacing;
    }
  }

  getStationPos(stationIndex, offset = 0) {
    const spacing = this.config.stationSpacing;
    
    if (this.isHorizontal()) {
      // More space for track headers (wider boxes)
      return this.config.padding.left + 130 + stationIndex * spacing + offset;
    } else {
      return this.config.padding.top + 70 + stationIndex * spacing + offset;
    }
  }

  getStationCoords(trackIndex, stationIndex, station = null) {
    const offset = station?.positionOffset || 0;
    if (this.isHorizontal()) {
      return { x: this.getStationPos(stationIndex, offset), y: this.getTrackPos(trackIndex) };
    } else {
      return { x: this.getTrackPos(trackIndex), y: this.getStationPos(stationIndex, offset) };
    }
  }

  render() {
    this.calculateDimensions();
    
    this.svg = this.createSVG('svg', {
      width: '100%',
      height: this.config.height,
      viewBox: `0 0 ${this.config.width} ${this.config.height}`,
      class: 'metro-map-svg',
      style: 'font-family: ' + this.config.fontFamily
    });

    this.defs = this.createSVG('defs');
    this.svg.appendChild(this.defs);
    this.createDefs();

    this.renderBackground();
    this.renderPhases();
    this.renderTimeMarkers();
    this.renderTrackLines();
    this.renderCrossings();
    this.renderStations();
    this.renderTrackHeaders();
    this.renderTitle();
    if (false && this.config.showLegend !== false) {
      this.renderLegend();
    }

    if (this.container) {
      this.container.innerHTML = '';
      this.container.appendChild(this.svg);
    }
    
    return this;
  }

  createDefs() {
    // Gradients
    const progressV = this.createSVG('linearGradient', { id: 'grad-progress-v', x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
    progressV.innerHTML = `<stop offset="0%" stop-color="${this.getColor('success')}"/><stop offset="50%" stop-color="${this.getColor('primary')}"/><stop offset="100%" stop-color="${this.getColor('muted')}"/>`;
    this.defs.appendChild(progressV);

    const progressH = this.createSVG('linearGradient', { id: 'grad-progress-h', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
    progressH.innerHTML = `<stop offset="0%" stop-color="${this.getColor('success')}"/><stop offset="50%" stop-color="${this.getColor('primary')}"/><stop offset="100%" stop-color="${this.getColor('muted')}"/>`;
    this.defs.appendChild(progressH);

    const glow = this.createSVG('radialGradient', { id: 'grad-glow' });
    glow.innerHTML = `<stop offset="0%" stop-color="${this.getColor('accent')}" stop-opacity="0.5"/><stop offset="100%" stop-color="${this.getColor('accent')}" stop-opacity="0"/>`;
    this.defs.appendChild(glow);

    const shadow = this.createSVG('filter', { id: 'shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    shadow.innerHTML = `<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${this.getColor('dark')}" flood-opacity="0.12"/>`;
    this.defs.appendChild(shadow);
  }

  renderBackground() {
    const bgColor = this.config.backgroundColor || this.getColor('paleBlue');
    const bgRadius = this.config.backgroundRadius !== undefined ? this.config.backgroundRadius : 4;
    const bg = this.createSVG('rect', {
      x: 0, y: 0, width: this.config.width, height: this.config.height,
      fill: bgColor, rx: bgRadius
    });
    this.svg.appendChild(bg);
  }

  renderPhases() {
    if (!this.data.phases.length) return;
    const group = this.createSVG('g', { class: 'phases' });
    const { padding } = this.config;
    
    this.data.phases.forEach(phase => {
      const color = phase.color || this.getColor('primary');
      
      if (this.isHorizontal()) {
        const x1 = this.getStationPos(phase.startStation) - this.config.stationSpacing / 2;
        const x2 = this.getStationPos(phase.endStation) + this.config.stationSpacing / 2;
        
        group.appendChild(this.createSVG('rect', {
          x: x1, y: padding.top - 10, width: x2 - x1, height: this.config.height - padding.top - padding.bottom + 20,
          fill: color, 'fill-opacity': 0.05
        }));
        group.appendChild(this.createSVG('line', {
          x1: x1, y1: padding.top - 10, x2: x1, y2: this.config.height - padding.bottom + 10,
          stroke: color, 'stroke-opacity': 0.2, 'stroke-width': 1, 'stroke-dasharray': '4,4'
        }));
        const label = this.createSVG('text', { x: x1 + 8, y: padding.top - 20, fill: color, 'font-size': this.config.text.phaseLabel.size, 'font-weight': this.config.text.phaseLabel.weight });
        label.textContent = phase.name;
        group.appendChild(label);
      } else {
        const y1 = this.getStationPos(phase.startStation) - this.config.stationSpacing / 2;
        const y2 = this.getStationPos(phase.endStation) + this.config.stationSpacing / 2;
        
        group.appendChild(this.createSVG('rect', {
          x: padding.left, y: y1, width: this.config.width - padding.left - padding.right, height: y2 - y1,
          fill: color, 'fill-opacity': 0.05
        }));
        group.appendChild(this.createSVG('line', {
          x1: padding.left, y1: y1, x2: this.config.width - padding.right, y2: y1,
          stroke: color, 'stroke-opacity': 0.2, 'stroke-width': 1, 'stroke-dasharray': '4,4'
        }));
        const label = this.createSVG('text', { x: padding.left + 8, y: y1 + 16, fill: color, 'font-size': this.config.text.phaseLabel.size, 'font-weight': this.config.text.phaseLabel.weight });
        label.textContent = phase.name;
        group.appendChild(label);
      }
    });
    this.svg.appendChild(group);
  }

  renderTimeMarkers() {
    if (!this.data.timeMarkers.length) return;
    const group = this.createSVG('g', { class: 'time-markers' });
    const { padding, text } = this.config;
    
    this.data.timeMarkers.forEach(marker => {
      if (this.isHorizontal()) {
        const x = this.getStationPos(marker.stationIndex);
        group.appendChild(this.createSVG('line', { x1: x, y1: padding.top, x2: x, y2: this.config.height - padding.bottom - 30, stroke: this.getColor('border'), 'stroke-width': 1 }));
        const label = this.createSVG('text', { x: x, y: this.config.height - padding.bottom - 10, fill: text.timeMarker.color, 'font-size': text.timeMarker.size, 'font-weight': text.timeMarker.weight, 'text-anchor': 'middle' });
        label.textContent = marker.label;
        group.appendChild(label);
      } else {
        const y = this.getStationPos(marker.stationIndex);
        group.appendChild(this.createSVG('line', { x1: padding.left, y1: y, x2: this.config.width - padding.right - 50, y2: y, stroke: this.getColor('border'), 'stroke-width': 1 }));
        const label = this.createSVG('text', { x: this.config.width - padding.right - 25, y: y + 4, fill: text.timeMarker.color, 'font-size': text.timeMarker.size, 'font-weight': text.timeMarker.weight, 'text-anchor': 'middle' });
        label.textContent = marker.label;
        group.appendChild(label);
      }
    });
    this.svg.appendChild(group);
  }

  renderTrackLines() {
    const group = this.createSVG('g', { class: 'track-lines' });
    
    this.data.tracks.forEach((track, idx) => {
      const color = track.color || this.getColor('primary');
      const stationCount = track.stations?.length || 0;
      if (stationCount < 1) return;

      // Get first and last stations with their offsets
      const firstStation = track.stations[0];
      const lastStation = track.stations[stationCount - 1];
      const start = this.getStationCoords(idx, 0, firstStation);
      const end = this.getStationCoords(idx, stationCount - 1, lastStation);
      
      // Lines start and end at station centers (no extension)
      const x1 = start.x;
      const y1 = start.y;
      const x2 = end.x;
      const y2 = end.y;

      let stroke = color;
      if (track.style === 'gradient') {
        stroke = this.isHorizontal() ? 'url(#grad-progress-h)' : 'url(#grad-progress-v)';
      }
      
      // Use per-track lineWidth if specified, otherwise use config default
      const lineWidth = track.lineWidth || this.config.lineWidth;

      group.appendChild(this.createSVG('line', {
        x1, y1, x2, y2, stroke, 'stroke-width': lineWidth,
        'stroke-linecap': 'round', 'stroke-dasharray': track.style === 'dashed' ? '12,8' : 'none'
      }));
    });
    this.svg.appendChild(group);
  }

  renderCrossings() {
    if (!this.data.crossings.length) return;
    const group = this.createSVG('g', { class: 'crossings' });
    
    this.data.crossings.forEach((crossing, crossingIdx) => {
      const fromTrack = this.data.tracks[crossing.fromTrack];
      const toTrack = this.data.tracks[crossing.toTrack];
      const fromStation = fromTrack?.stations?.[crossing.fromStation];
      const toStation = toTrack?.stations?.[crossing.toStation];
      
      const from = this.getStationCoords(crossing.fromTrack, crossing.fromStation, fromStation);
      const to = this.getStationCoords(crossing.toTrack, crossing.toStation, toStation);
      const style = crossing.style || 'bezier';
      
      // Determine stroke color - either solid or gradient
      let strokeColor;
      if (crossing.color === 'gradient' || crossing.gradient) {
        // Create gradient from track colors
        const fromColor = fromTrack?.color || this.getColor('primary');
        const toColor = toTrack?.color || this.getColor('primary');
        const gradientId = `crossing-gradient-${crossingIdx}`;
        
        // Create linear gradient
        const gradient = this.createSVG('linearGradient', {
          id: gradientId,
          x1: from.x, y1: from.y,
          x2: to.x, y2: to.y,
          gradientUnits: 'userSpaceOnUse'
        });
        gradient.appendChild(this.createSVG('stop', { offset: '0%', 'stop-color': fromColor }));
        gradient.appendChild(this.createSVG('stop', { offset: '100%', 'stop-color': toColor }));
        this.defs.appendChild(gradient);
        
        strokeColor = `url(#${gradientId})`;
      } else {
        strokeColor = crossing.color || this.getColor('tertiary');
      }

      const pathD = this.createCrossingPath(from, to, style, crossing);
      
      group.appendChild(this.createSVG('path', {
        d: pathD, fill: 'none', stroke: strokeColor,
        'stroke-width': this.config.lineWidth - 1,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));

      if (crossing.marker !== false) {
        this.renderCrossingMarker(group, from, to, crossing, crossingIdx);
      } else {
        // Always render an invisible clickable area for crossings with no marker
        this.renderCrossingHitArea(group, from, to, crossingIdx);
      }
    });
    this.svg.appendChild(group);
  }
  
  renderCrossingHitArea(group, from, to, crossingIdx) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    const hitArea = this.createSVG('circle', {
      cx: midX, cy: midY, r: 15,
      fill: 'transparent',
      class: 'crossing-marker crossing-hit-area',
      'data-crossing': crossingIdx
    });
    group.appendChild(hitArea);
  }

  /**
   * Create bezier path - the key to elegant crossings
   * Curves exit perpendicular to tracks and smoothly connect
   */
  createCrossingPath(from, to, style, crossing) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    if (style === 'straight') {
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }
    
    if (style === 'metro' || style === 'step') {
      // Metro style with consistent angle - use 0.4 factor (no cap to maintain angle at all distances)
      if (this.isHorizontal()) {
        const midX = from.x + dx / 2;
        const offset = Math.abs(dy) * 0.4;
        return `M ${from.x} ${from.y} L ${midX - offset} ${from.y} L ${midX + offset} ${to.y} L ${to.x} ${to.y}`;
      } else {
        const midY = from.y + dy / 2;
        const offset = Math.abs(dx) * 0.4;
        return `M ${from.x} ${from.y} L ${from.x} ${midY - offset} L ${to.x} ${midY + offset} L ${to.x} ${to.y}`;
      }
    }
    
    if (style === 'metro-smooth' || style === 'rounded') {
      // Metro style with smooth rounded corners - same angle as metro
      const r = 18; // Corner radius
      
      if (this.isHorizontal()) {
        const midX = from.x + dx / 2;
        const offset = Math.abs(dy) * 0.4;
        
        // Sharp corner positions
        const c1x = midX - offset;
        const c1y = from.y;
        const c2x = midX + offset;
        const c2y = to.y;
        
        // Diagonal direction vector (normalized)
        const diagDx = c2x - c1x;
        const diagDy = c2y - c1y;
        const diagLen = Math.sqrt(diagDx * diagDx + diagDy * diagDy);
        const diagUnitX = diagDx / diagLen;
        const diagUnitY = diagDy / diagLen;
        
        // Limit radius based on available space
        const maxR = Math.min(r, offset * 0.6, diagLen * 0.3);
        
        // Corner 1: horizontal → diagonal
        const c1_start_x = c1x - maxR;
        const c1_start_y = c1y;
        const c1_end_x = c1x + diagUnitX * maxR;
        const c1_end_y = c1y + diagUnitY * maxR;
        
        // Corner 2: diagonal → horizontal
        const c2_start_x = c2x - diagUnitX * maxR;
        const c2_start_y = c2y - diagUnitY * maxR;
        const c2_end_x = c2x + maxR;
        const c2_end_y = c2y;
        
        return `M ${from.x} ${from.y} L ${c1_start_x} ${c1_start_y} Q ${c1x} ${c1y} ${c1_end_x} ${c1_end_y} L ${c2_start_x} ${c2_start_y} Q ${c2x} ${c2y} ${c2_end_x} ${c2_end_y} L ${to.x} ${to.y}`;
      } else {
        const midY = from.y + dy / 2;
        const offset = Math.abs(dx) * 0.4;
        
        // Sharp corner positions
        const c1x = from.x;
        const c1y = midY - offset;
        const c2x = to.x;
        const c2y = midY + offset;
        
        // Diagonal direction vector (normalized)
        const diagDx = c2x - c1x;
        const diagDy = c2y - c1y;
        const diagLen = Math.sqrt(diagDx * diagDx + diagDy * diagDy);
        const diagUnitX = diagDx / diagLen;
        const diagUnitY = diagDy / diagLen;
        
        // Limit radius
        const maxR = Math.min(r, offset * 0.6, diagLen * 0.3);
        
        // Corner 1: vertical → diagonal
        const c1_start_x = c1x;
        const c1_start_y = c1y - maxR;
        const c1_end_x = c1x + diagUnitX * maxR;
        const c1_end_y = c1y + diagUnitY * maxR;
        
        // Corner 2: diagonal → vertical
        const c2_start_x = c2x - diagUnitX * maxR;
        const c2_start_y = c2y - diagUnitY * maxR;
        const c2_end_x = c2x;
        const c2_end_y = c2y + maxR;
        
        return `M ${from.x} ${from.y} L ${c1_start_x} ${c1_start_y} Q ${c1x} ${c1y} ${c1_end_x} ${c1_end_y} L ${c2_start_x} ${c2_start_y} Q ${c2x} ${c2y} ${c2_end_x} ${c2_end_y} L ${to.x} ${to.y}`;
      }
    }
    
    // Smooth bezier - exits perpendicular to track direction
    if (this.isHorizontal()) {
      // Tracks run horizontally, crossing goes vertically
      // Control points push the curve out horizontally first, then curve to destination
      const dist = Math.abs(dy);
      const curvature = crossing.curvature || 0.5;
      const cpDist = dist * curvature;
      
      // Exit from 'from' going down/up, enter 'to' coming from up/down
      const cp1x = from.x;
      const cp1y = from.y + (dy > 0 ? cpDist : -cpDist);
      const cp2x = to.x;
      const cp2y = to.y + (dy > 0 ? -cpDist : cpDist);
      
      return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
    } else {
      // Tracks run vertically, crossing goes horizontally
      const dist = Math.abs(dx);
      const curvature = crossing.curvature || 0.5;
      const cpDist = dist * curvature;
      
      // Exit from 'from' going left/right, enter 'to' coming from right/left
      const cp1x = from.x + (dx > 0 ? cpDist : -cpDist);
      const cp1y = from.y;
      const cp2x = to.x + (dx > 0 ? -cpDist : cpDist);
      const cp2y = to.y;
      
      return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
    }
  }

  renderCrossingMarker(group, from, to, crossing, crossingIdx = 0) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const markerStyle = crossing.markerStyle || 'circle';
    
    // Determine marker color - use blended color for gradient
    let color;
    if (crossing.color === 'gradient' || crossing.gradient) {
      const fromTrack = this.data.tracks[crossing.fromTrack];
      const toTrack = this.data.tracks[crossing.toTrack];
      const fromColor = fromTrack?.color || this.getColor('primary');
      const toColor = toTrack?.color || this.getColor('primary');
      // Use the midpoint blend or just use one of the colors
      color = this.blendColors(fromColor, toColor, 0.5);
    } else {
      color = crossing.color || this.getColor('tertiary');
    }

    const markerGroup = this.createSVG('g', { 
      class: 'crossing-marker',
      'data-crossing': crossingIdx
    });

    if (markerStyle === 'diamond') {
      markerGroup.appendChild(this.createSVG('rect', {
        x: midX - 10, y: midY - 10, width: 20, height: 20,
        fill: this.getColor('white'), stroke: color, 'stroke-width': 3,
        transform: `rotate(45 ${midX} ${midY})`
      }));
      markerGroup.appendChild(this.createSVG('circle', { cx: midX, cy: midY, r: 5, fill: color }));
    } else if (markerStyle === 'dot') {
      markerGroup.appendChild(this.createSVG('circle', { cx: midX, cy: midY, r: 8, fill: color }));
    } else {
      markerGroup.appendChild(this.createSVG('circle', { cx: midX, cy: midY, r: 12, fill: this.getColor('white'), stroke: color, 'stroke-width': 3 }));
      markerGroup.appendChild(this.createSVG('circle', { cx: midX, cy: midY, r: 5, fill: color }));
    }

    if (crossing.label) {
      const labelY = midY + (this.isHorizontal() ? -20 : 24);
      const label = this.createSVG('text', { x: midX, y: labelY, fill: this.getColor('text'), 'font-size': 10, 'font-weight': 600, 'text-anchor': 'middle' });
      label.textContent = crossing.label;
      markerGroup.appendChild(label);
    }

    group.appendChild(markerGroup);
  }
  
  // Helper to blend two hex colors
  blendColors(color1, color2, ratio) {
    const hex = c => parseInt(c.slice(1), 16);
    const r = c => (c >> 16) & 255;
    const g = c => (c >> 8) & 255;
    const b = c => c & 255;
    
    const c1 = hex(color1);
    const c2 = hex(color2);
    
    const blend = (a, b) => Math.round(a + (b - a) * ratio);
    
    const rr = blend(r(c1), r(c2));
    const gg = blend(g(c1), g(c2));
    const bb = blend(b(c1), b(c2));
    
    return `#${((1 << 24) + (rr << 16) + (gg << 8) + bb).toString(16).slice(1)}`;
  }

  renderStations() {
    const group = this.createSVG('g', { class: 'stations' });
    
    this.data.tracks.forEach((track, trackIdx) => {
      const color = track.color || this.getColor('primary');
      const labelSide = track.labelSide || (this.isHorizontal() 
        ? (trackIdx % 2 === 0 ? 'top' : 'bottom')
        : (trackIdx % 2 === 0 ? 'right' : 'left'));
      
      (track.stations || []).forEach((station, stationIdx) => {
        const coords = this.getStationCoords(trackIdx, stationIdx, station);
        this.renderStation(group, station, coords, color, labelSide, trackIdx, stationIdx);
      });
    });
    this.svg.appendChild(group);
  }

  renderStation(group, station, coords, trackColor, labelSide, trackIdx = 0, stationIdx = 0) {
    const stationGroup = this.createSVG('g', { 
      class: `station station-${station.status || 'default'}`,
      'data-track': trackIdx,
      'data-station': stationIdx
    });
    const { x, y } = coords;
    const status = station.status || 'default';
    
    // Use per-station radius if specified, otherwise use config default
    const baseRadius = station.radius || this.config.stationRadius;
    let radius = baseRadius;
    let fillColor = this.getColor('white');
    let strokeColor = station.color || trackColor;
    let strokeWidth = 4;
    let dashed = false;

    switch (status) {
      case 'completed':
        fillColor = this.getColor('success');
        strokeColor = this.getColor('success');
        break;
      case 'active':
        fillColor = this.getColor('accent');
        strokeColor = this.getColor('accent');
        break;
      case 'milestone':
        radius = baseRadius + 4;
        fillColor = strokeColor;
        strokeWidth = 5;
        break;
      case 'milestone-lg':
        radius = baseRadius + 8;
        fillColor = strokeColor;
        strokeWidth = 0;
        break;
      case 'future':
        fillColor = this.getColor('light');
        strokeColor = this.getColor('muted');
        dashed = true;
        break;
    }

    if (status === 'active') {
      stationGroup.appendChild(this.createSVG('circle', { cx: x, cy: y, r: radius + 14, fill: 'url(#grad-glow)' }));
    }

    stationGroup.appendChild(this.createSVG('circle', {
      cx: x, cy: y, r: radius, fill: fillColor, stroke: strokeColor,
      'stroke-width': strokeWidth, 'stroke-dasharray': dashed ? '4,3' : 'none', filter: 'url(#shadow)'
    }));

    if (status === 'completed') {
      // Scale checkmark based on radius
      const scale = radius / 12;
      const cx = x, cy = y;
      stationGroup.appendChild(this.createSVG('path', {
        d: `M ${cx - 5*scale} ${cy} L ${cx - 1*scale} ${cy + 4*scale} L ${cx + 6*scale} ${cy - 4*scale}`,
        fill: 'none', stroke: this.getColor('white'), 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    }

    this.renderStationLabel(stationGroup, station, x, y, labelSide, radius);
    group.appendChild(stationGroup);
  }

  renderStationLabel(group, station, x, y, defaultSide, radius) {
    const { text, labelOffset, labelRotation, fontSizeAdjust, textColor } = this.config;
    const offset = radius + labelOffset;
    const sizeAdj = fontSizeAdjust || 0;
    
    // Use station's labelSide if specified, otherwise use track default
    const side = station.labelSide || defaultSide;
    
    // Get custom offsets from station
    const customOffsetX = station.labelOffsetX || 0;
    const customOffsetY = station.labelOffsetY || 0;
    
    let labelX, labelY, textAnchor, rotation = labelRotation;
    
    if (this.isHorizontal()) {
      textAnchor = 'middle';
      labelX = x;
      labelY = side === 'top' ? y - offset : y + offset + 14;
      // For horizontal, allow left/right to work too
      if (side === 'left') { textAnchor = 'end'; labelX = x - offset; labelY = y + 4; }
      else if (side === 'right') { textAnchor = 'start'; labelX = x + offset; labelY = y + 4; }
    } else {
      labelY = y + 4;
      if (side === 'left') { textAnchor = 'end'; labelX = x - offset; }
      else if (side === 'right') { textAnchor = 'start'; labelX = x + offset; }
      else if (side === 'top') { textAnchor = 'middle'; labelX = x; labelY = y - offset; }
      else if (side === 'bottom') { textAnchor = 'middle'; labelX = x; labelY = y + offset + 14; }
      else { textAnchor = 'start'; labelX = x + offset; }
    }
    
    // Apply custom offsets
    labelX += customOffsetX;
    labelY += customOffsetY;
    
    // Use global textColor and apply size adjustment to base sizes
    const labelColor = textColor || text.stationName.color;
    const labelSize = text.stationName.size + sizeAdj;
    const dateSize = text.stationDate.size + sizeAdj;
    const descSize = text.stationDesc.size + sizeAdj;

    const labelGroup = this.createSVG('g');
    if (rotation !== 0 && this.isHorizontal()) {
      labelGroup.setAttribute('transform', `rotate(${rotation} ${labelX} ${labelY})`);
    }

    const name = this.createSVG('text', {
      x: labelX, y: labelY,
      fill: labelColor,
      'font-size': Math.max(6, labelSize),
      'font-weight': text.stationName.weight, 'text-anchor': textAnchor
    });
    name.textContent = station.name;
    labelGroup.appendChild(name);

    if (station.date) {
      const dateY = labelY + Math.max(14, labelSize + 2);
      const date = this.createSVG('text', {
        x: labelX, y: dateY,
        fill: labelColor,
        'font-size': Math.max(6, dateSize),
        'font-weight': text.stationDate.weight, 'text-anchor': textAnchor
      });
      date.textContent = station.date;
      labelGroup.appendChild(date);
    }

    if (station.description) {
      const descY = labelY + (station.date ? Math.max(28, (labelSize + 2) * 2) : Math.max(14, labelSize + 2));
      const desc = this.createSVG('text', {
        x: labelX, y: descY,
        fill: labelColor,
        'font-size': Math.max(6, descSize),
        'font-weight': text.stationDesc.weight, 'text-anchor': textAnchor
      });
      desc.textContent = station.description;
      labelGroup.appendChild(desc);
    }

    group.appendChild(labelGroup);
  }

  renderTrackHeaders() {
    const group = this.createSVG('g', { class: 'track-headers' });
    const { padding, text, fontSizeAdjust, textColor, titleBg, titleBorder, titleBorderColor, titlePadding } = this.config;
    const sizeAdj = fontSizeAdjust || 0;

    this.data.tracks.forEach((track, idx) => {
      const color = track.color || this.getColor('primary');
      const stations = track.stations || [];
      
      // Use global settings - apply size adjustment to base sizes
      const titleTextColor = textColor || text.trackName.color || color;
      const titleSize = Math.max(6, text.trackName.size + sizeAdj);
      const descSize = Math.max(6, text.trackDesc.size + sizeAdj);
      const bgColor = titleBg || this.getColor('white');
      const showBorder = titleBorder !== false;
      const borderColor = titleBorderColor || this.getColor('border');
      const boxPadding = titlePadding || 12;
      
      // Calculate box dimensions based on text length and adjusted size
      const nameLength = (track.name || '').length;
      const descLength = (track.description || '').length;
      const maxLength = Math.max(nameLength, descLength);
      
      const charWidth = titleSize * 0.65;
      let boxWidth = Math.max(90, maxLength * charWidth + boxPadding * 2);
      let boxHeight = track.description ? titleSize + descSize + boxPadding + 8 : titleSize + boxPadding + 4;
      
      // Get the position and size of the first station
      const firstStation = stations[0];
      const firstStationCoords = stations.length > 0 
        ? this.getStationCoords(idx, 0, firstStation)
        : null;
      
      // Calculate first station radius (same logic as renderStation)
      let firstStationRadius = this.config.stationRadius;
      if (firstStation) {
        const baseRadius = firstStation.radius || this.config.stationRadius;
        const status = firstStation.status || 'default';
        if (status === 'milestone') {
          firstStationRadius = baseRadius + 4;
        } else if (status === 'milestone-lg') {
          firstStationRadius = baseRadius + 8;
        } else {
          firstStationRadius = baseRadius;
        }
      }
      
      // Gap between station and label box
      const gap = 15;
      
      let x, y;
      if (this.isHorizontal()) {
        // Position to the left of the first station, accounting for station radius
        x = firstStationCoords ? firstStationCoords.x - firstStationRadius - gap : padding.left + 120;
        y = this.getTrackPos(idx);
      } else {
        x = this.getTrackPos(idx);
        // Position above the first station, accounting for station radius
        y = firstStationCoords ? firstStationCoords.y - firstStationRadius - gap : padding.top + 40;
      }

      // Wrap header elements in a group for interactivity
      const headerGroup = this.createSVG('g', { 
        class: 'track-header',
        'data-track': idx
      });

      // Background rect
      const rectAttrs = {
        x: this.isHorizontal() ? x - boxWidth : x - boxWidth/2,
        y: this.isHorizontal() ? y - boxHeight/2 : y - boxHeight,
        width: boxWidth, 
        height: boxHeight,
        fill: bgColor,
        rx: 4
      };
      
      if (showBorder) {
        rectAttrs.stroke = borderColor;
        rectAttrs['stroke-width'] = 1;
      }
      
      headerGroup.appendChild(this.createSVG('rect', rectAttrs));

      const nameEl = this.createSVG('text', {
        x: this.isHorizontal() ? x - boxWidth/2 : x,
        y: this.isHorizontal() ? (track.description ? y - 4 : y + titleSize/3) : (track.description ? y - boxHeight/2 - 4 : y - boxHeight/2 + titleSize/3),
        fill: titleTextColor,
        'font-size': titleSize, 
        'font-weight': text.trackName.weight, 
        'text-anchor': 'middle'
      });
      nameEl.textContent = track.name;
      headerGroup.appendChild(nameEl);

      if (track.description) {
        const descEl = this.createSVG('text', {
          x: this.isHorizontal() ? x - boxWidth/2 : x,
          y: this.isHorizontal() ? y + titleSize/2 + 4 : y - boxHeight/2 + titleSize/2 + 6,
          fill: textColor || text.trackDesc.color, 
          'font-size': descSize, 
          'font-weight': text.trackDesc.weight, 
          'text-anchor': 'middle'
        });
        descEl.textContent = track.description;
        headerGroup.appendChild(descEl);
      }
      
      group.appendChild(headerGroup);
    });
    this.svg.appendChild(group);
  }

  renderTitle() {
    if (!this.data.title) return;
    const { fontSizeAdjust, textColor } = this.config;
    const sizeAdj = fontSizeAdjust || 0;
    const titleSize = Math.max(10, 18 + sizeAdj);
    const title = this.createSVG('text', { 
      x: this.config.padding.left, 
      y: 28, 
      fill: textColor || this.getColor('primary'), 
      'font-size': titleSize, 
      'font-weight': 700 
    });
    title.textContent = this.data.title;
    this.svg.appendChild(title);
  }

  renderLegend() {
    const legendY = this.config.height - 30;
    const group = this.createSVG('g', { class: 'legend' });
    
    group.appendChild(this.createSVG('line', {
      x1: this.config.padding.left, y1: legendY - 12,
      x2: this.config.width - this.config.padding.right, y2: legendY - 12,
      stroke: this.getColor('border'), 'stroke-width': 1
    }));

    const items = [
      { label: 'Completed', color: this.getColor('success'), filled: true },
      { label: 'In Progress', color: this.getColor('accent'), filled: true },
      { label: 'Milestone', color: this.getColor('primary'), filled: true },
      { label: 'Planned', color: this.getColor('muted'), filled: false, dashed: true }
    ];

    let xOffset = this.config.padding.left;
    items.forEach(item => {
      group.appendChild(this.createSVG('circle', {
        cx: xOffset + 6, cy: legendY, r: 5,
        fill: item.filled ? item.color : this.getColor('light'),
        stroke: item.color, 'stroke-width': 2, 'stroke-dasharray': item.dashed ? '2,2' : 'none'
      }));
      const label = this.createSVG('text', { x: xOffset + 18, y: legendY + 4, fill: this.getColor('muted'), 'font-size': 10 });
      label.textContent = item.label;
      group.appendChild(label);
      xOffset += 90;
    });
    this.svg.appendChild(group);
  }

  toSVG() { 
    if (!this.svg) return '';
    
    // Clone the SVG to avoid modifying the original
    const svgClone = this.svg.cloneNode(true);
    
    // Set explicit dimensions for export
    svgClone.setAttribute('width', this.config.width);
    svgClone.setAttribute('height', this.config.height);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Remove interactive classes that won't be styled
    svgClone.removeAttribute('class');
    
    // Embed font style in defs
    const defs = svgClone.querySelector('defs');
    if (defs) {
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `;
      defs.insertBefore(style, defs.firstChild);
    }
    
    return svgClone.outerHTML;
  }
  
  toDataURL() {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(this.toSVG())));
  }
  
  toJSON() {
    return JSON.stringify({ config: this.config, data: this.data }, null, 2);
  }
  
  fromJSON(json) {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (parsed.config) this.config = this.mergeConfig(MetroMap.DEFAULTS, parsed.config);
    if (parsed.data) this.data = parsed.data;
    return this;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetroMap;
}
