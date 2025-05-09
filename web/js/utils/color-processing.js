export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h, s, v;

  if (delta === 0) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  s = max === 0 ? 0 : delta / max;
  v = max;

  return { h, s, v };
}

export function rgbToHex(r, g, b, a) {
  if (a !== undefined) {
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase() + alphaHex;
  }
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');

  let r, g, b, a = 1;

  if (hex.length === 8) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    a = parseInt(hex.substring(6, 8), 16) / 255;
  } else {
    const bigint = parseInt(hex, 16);
    r = (bigint >> 16) & 255;
    g = (bigint >> 8) & 255;
    b = bigint & 255;
  }

  return { r, g, b, a };
}

export function ensureHexColor(color) {
  if (typeof color !== 'string') {
    return '#FF0000';
  }

  if (color.startsWith('#')) {
    return color;
  }

  if (color.startsWith('rgba')) {
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const a = parseFloat(rgbaMatch[4]);
      return rgbToHex(r, g, b, a);
    }
  }

  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return rgbToHex(r, g, b);
    }
  }

  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = parseInt(rgbMatch[0]);
    const g = parseInt(rgbMatch[1]);
    const b = parseInt(rgbMatch[2]);
    const a = rgbMatch.length >= 4 ? parseInt(rgbMatch[3]) / 255 : undefined;
    return rgbToHex(r, g, b, a);
  }

  return '#FF0000';
}

export function findColorPosition(color, canvas, hueSlider, updateOpacitySliderBackground) {
  const rgb = hexToRgb(color);
  const { r, g, b } = rgb;

  const hsv = rgbToHsv(r, g, b);
  const { h, s, v } = hsv;

  hueSlider.value = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const whiteGradient = ctx.createLinearGradient(width, 0, 0, 0);
  whiteGradient.addColorStop(0, `hsl(${h}, 100%, 50%)`);
  whiteGradient.addColorStop(1, '#ffffff');

  ctx.fillStyle = whiteGradient;
  ctx.fillRect(0, 0, width, height);

  const blackGradient = ctx.createLinearGradient(0, 0, 0, height);
  blackGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  blackGradient.addColorStop(1, '#000000');

  ctx.fillStyle = blackGradient;
  ctx.fillRect(0, 0, width, height);

  updateOpacitySliderBackground(color);

  if (r === 255 && g === 255 && b === 255) {
    return { x: 0, y: 0 };
  } else if (r === 0 && g === 0 && b === 0) {
    return { x: 0, y: height - 1 };
  } else if (
    (r === 255 && g === 0 && b === 0) ||
    (r === 255 && g === 255 && b === 0) ||
    (r === 0 && g === 255 && b === 0) ||
    (r === 0 && g === 255 && b === 255) ||
    (r === 0 && g === 0 && b === 255) ||
    (r === 255 && g === 0 && b === 255)
  ) {
    return { x: width - 1, y: 0 };
  }

  let x = width * s;
  let y = height * (1 - v);

  x = Math.max(0, Math.min(width - 1, x));
  y = Math.max(0, Math.min(height - 1, y));

  return { x, y };
}