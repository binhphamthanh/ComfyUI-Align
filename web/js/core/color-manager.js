import { getComfyUIAppInstance, getSelectedNodes, getSelectedGroups } from '../utils/node-utils.js';
import { rgbToHex, hexToRgb, ensureHexColor } from '../utils/color-processing.js';
import { getDeeperColor } from '../utils/general-utils.js';

export const DEFAULT_COLOR_CONFIG = {
  applyToHeader: true,
  applyToPanel: false
};

let currentColor = '#FF0000';
let currentOpacity = 100;

export function setCurrentColor(color, opacity = 100) {
  currentColor = color;
  currentOpacity = opacity;
  return { color, opacity };
}

export function getCurrentColor() {
  return { color: currentColor, opacity: currentOpacity };
}

export function applyCurrentColor() {
  return applyColorToSelectedNodes(currentColor, currentOpacity);
}

export function getNodeColorByConfig(node, config) {
  if (config.applyToHeader && config.applyToPanel) {
    return node.bgcolor && node.bgcolor !== "none" ? node.bgcolor : node.color;
  } else if (config.applyToHeader) {
    return node.color;
  } else if (config.applyToPanel) {
    return node.bgcolor && node.bgcolor !== "none" ? node.bgcolor : node.color;
  } else {
    return node.color || node.bgcolor;
  }
}

export function applyColorToSelectedNodes(color = currentColor, opacity = currentOpacity) {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) return { success: false, message: "Unable to get ComfyUI application instance" };

    const selectedNodes = getSelectedNodes(appInstance);
    const selectedGroups = getSelectedGroups(appInstance);

    if (selectedNodes.length === 0 && selectedGroups.length === 0) {
      console.log("No nodes or groups selected to apply color");
      return { success: false, message: "No nodes or groups selected" };
    }

    console.log(`Applying color to ${selectedNodes.length} nodes and ${selectedGroups.length} groups`);

    const config = window.alignerPlugin?.getConfig() || { ...DEFAULT_COLOR_CONFIG, applyToPanel: true };

    selectedNodes.forEach(node => {
      const alpha = opacity / 100;

      if (config.applyToHeader && config.applyToPanel) {
        const deeperColor = getDeeperColor(color);
        const deeperRgb = hexToRgb(deeperColor);

        node.color = rgbToHex(deeperRgb.r, deeperRgb.g, deeperRgb.b, alpha);

        const rgb = hexToRgb(color);
        node.bgcolor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
      } else {
        if (config.applyToHeader) {
          const rgb = hexToRgb(color);
          node.color = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        }
        if (config.applyToPanel) {
          const rgb = hexToRgb(color);
          node.bgcolor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        }
      }
    });

    selectedGroups.forEach(group => {
      const rgb = hexToRgb(color);
      const alpha = opacity / 100;
      group.color = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
    });

    appInstance.graph.setDirtyCanvas(true, true);
    return { success: true };
  } catch (error) {
    console.error("Failed to apply color to selected nodes", error);
    return { success: false, message: error.message };
  }
}

export function updateColorPickerFromSelectedNode(config = DEFAULT_COLOR_CONFIG) {
  const appInstance = getComfyUIAppInstance();
  if (!appInstance) return null;

  const selectedNodes = getSelectedNodes(appInstance);
  const selectedGroups = getSelectedGroups(appInstance);

  if (selectedNodes.length === 0 && selectedGroups.length === 0) return null;

  let elementColor;
  let opacity = 100;

  if (selectedNodes.length > 0) {
    const node = selectedNodes[0];
    elementColor = getNodeColorByConfig(node, config);
  } else if (selectedGroups.length > 0) {
    const group = selectedGroups[0];
    elementColor = group.color;
  }

  if (!elementColor || elementColor === 'none') return null;

  elementColor = ensureHexColor(elementColor);

  const rgba = hexToRgb(elementColor);
  if (rgba.a !== undefined && rgba.a !== 1) {
    opacity = Math.round(rgba.a * 100);
  }

  if (elementColor.startsWith('rgba')) {
    const rgbaMatch = elementColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const alpha = parseFloat(rgbaMatch[4]);
      opacity = Math.round(alpha * 100);
      elementColor = rgbToHex(r, g, b);
    }
  }
  else if (elementColor.startsWith('rgb')) {
    const rgbMatch = elementColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      elementColor = rgbToHex(r, g, b);
    }
  }

  setCurrentColor(elementColor, opacity);
  return { color: elementColor, opacity };
}