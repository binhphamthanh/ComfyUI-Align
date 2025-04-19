export const DEFAULT_CONFIG = {
  iconSize: 36,
  spacing: 112,
  horizontalMinSpacing: 30,
  verticalMinSpacing: 25,
  colors: {
    circle1: '#a93232',
    circle2: '#79461d',
    circle3: '#6e6e1d',
    circle4: '#2b652b',
    circle5: '#248382',
    circle6: '#246283',
    circle7: '#3c3c83',
    circle8: '#ffffff',
    circle9: '#ffd700',
    icon: 'rgba(180, 180, 180, 0.85)',
    bg: 'rgba(12, 12, 12, 0.95)',
    hover: 'rgba(255,255,255,0.2)'
  },
  colorMap: {
    'red': 'circle1',
    'orange': 'circle2',
    'yellow': 'circle3',
    'green': 'circle4',
    'cyan': 'circle5',
    'blue': 'circle6',
    'purple': 'circle7',
    'clear': 'circle8',
    'moon': 'circle9',
  },
  transition: 'all 0.2s ease',
  shortcut: 'alt+a',
  applyToHeader: true,
  applyToPanel: false,
  safetyMargin: {
    horizontal: 12,
    vertical: 42
  },
  minNodeSize: {
    width: 100,
    height: 60
  }
};

export const LGraphEventMode = Object.freeze({
  ALWAYS: 0,
  NEVER: 2,
  BYPASS: 4
});