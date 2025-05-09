export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

export function getDeeperColor(hexColor) {
  if (!hexColor || hexColor.startsWith('linear-gradient') || !hexColor.startsWith('#')) {
    return '#444444';
  }

  const hex = hexColor.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.floor(r * 0.7);
  g = Math.floor(g * 0.7);
  b = Math.floor(b * 0.7);

  const deeperHex = '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');

  return deeperHex;
}

export function calculatePosition(index, x, y, config) {
  const { iconSize, spacing } = config;
  const halfSize = iconSize / 2;
  const effectiveSpacing = spacing + halfSize;

  if (index >= 12) {
    return null;
  }

  const positions = [
    [-effectiveSpacing, -halfSize - iconSize - 5],
    [-effectiveSpacing, -halfSize],
    [-effectiveSpacing, halfSize + 5],
    [-halfSize - iconSize - 5, -effectiveSpacing],
    [-halfSize, -effectiveSpacing],
    [halfSize + 5, -effectiveSpacing],
    [effectiveSpacing - iconSize, -halfSize - iconSize - 5],
    [effectiveSpacing - iconSize, -halfSize],
    [effectiveSpacing - iconSize, halfSize + 5],
    [-halfSize - iconSize - 5, effectiveSpacing - iconSize],
    [-halfSize, effectiveSpacing - iconSize],
    [halfSize + 5, effectiveSpacing - iconSize],
  ];

  return positions[index] || [0, 0];
}

export function keepInViewport(x, y, entireWidth, entireHeight) {
  const margin = 20;
  return [
    Math.max(margin, Math.min(x, window.innerWidth - entireWidth - margin)),
    Math.max(margin, Math.min(y, window.innerHeight - entireHeight - margin))
  ];
}

export function calculateUIBoundingBox(centerX, centerY, config) {
  const { iconSize, spacing } = config;
  const effectiveSpacing = spacing + iconSize / 2;

  const width = effectiveSpacing * 2;
  const height = effectiveSpacing * 2;

  const colorPickerHeight = 50;
  const totalHeight = height + colorPickerHeight + 15;

  const left = centerX - effectiveSpacing;
  const top = centerY - effectiveSpacing;
  
  return {
    width,
    height: totalHeight,
    left,
    top
  };
}

export function cubicBezier(x1, y1, x2, y2, t) {
  const p0 = 0;
  const p1 = y1;
  const p2 = y2;
  const p3 = 1;
  
  return p0 * Math.pow(1 - t, 3) + 
         3 * p1 * Math.pow(1 - t, 2) * t + 
         3 * p2 * (1 - t) * Math.pow(t, 2) + 
         p3 * Math.pow(t, 3);
}
