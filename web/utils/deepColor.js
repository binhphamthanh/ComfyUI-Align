export function getDeeperColor(hexColor) {
  if (!hexColor || hexColor.startsWith('linear-gradient') || !hexColor.startsWith('#')) {
    return '#444444';
  }
  
  const hex = hexColor.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.floor(r * 0.66);
  g = Math.floor(g * 0.66);
  b = Math.floor(b * 0.66);

  const deeperHex = '#' + 
    r.toString(16).padStart(2, '0') + 
    g.toString(16).padStart(2, '0') + 
    b.toString(16).padStart(2, '0');
  
  return deeperHex;
} 