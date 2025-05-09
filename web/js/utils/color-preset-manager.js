import { getComfyUIAppInstance } from './comfy-app.js';
import { getSelectedNodes } from './node-utils.js';
import { showNotification } from '../ui/notifications.js';

export const DEFAULT_CLIP_TITLES = [
  "CLIP Text Encode (Prompt)",
  "CLIP文本编码",
  "Кодирование текста CLIP (Запрос)",
  "CLIPテキストエンコード（プロンプト）",
  "CLIP 텍스트 인코딩 (프롬프트)",
  "Codificar Texto CLIP (Prompt)"
];

function hexToRgba(hex) {
  hex = hex.replace(/^#/, '');

  let r, g, b, a = 1;

  if (hex.length === 8) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    a = parseInt(hex.substring(6, 8), 16) / 255;
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  return { r, g, b, a };
}

function hexToRgbaString(hex) {
  if (!hex || hex === 'none') {
    return hex;
  }

  const rgba = hexToRgba(hex);
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

export function traceClipTextEncodePath(node, appInstance, maxDepth = 6) {
  const result = {
    path: [],
    purpose: null
  };

  if (!node.outputs || !node.outputs[0] || !node.outputs[0].links || node.outputs[0].links.length === 0) {
    return result;
  }

  const visitedNodes = new Set();
  const visitedLinks = new Set();

  function trace(currentNode, path, depth = 0, inputName = null) {
    if (depth >= maxDepth) {
      return false;
    }

    if (visitedNodes.has(currentNode.id)) {
      return false;
    }
    visitedNodes.add(currentNode.id);

    if (inputName === 'positive') {
      result.purpose = 'positive';
      return true;
    } else if (inputName === 'negative') {
      result.purpose = 'negative';
      return true;
    }

    if (currentNode.type && currentNode.type.includes('Sampler')) {
      return false;
    }

    const outputs = currentNode.outputs || [];
    for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
      const output = outputs[outputIndex];
      if (!output || !output.links || output.links.length === 0) {
        continue;
      }

      for (const linkId of output.links) {
        if (visitedLinks.has(linkId)) {
          continue;
        }
        visitedLinks.add(linkId);

        path.push(linkId);

        const link = appInstance.graph.links[linkId];
        if (!link) {
          path.pop();
          continue;
        }

        const targetNodeId = link.target_id;
        const targetSlot = link.target_slot;

        const targetNode = appInstance.graph.getNodeById(targetNodeId);
        if (!targetNode) {
          path.pop();
          continue;
        }

        let nextInputName = null;
        if (targetNode.inputs && targetNode.inputs[targetSlot]) {
          nextInputName = targetNode.inputs[targetSlot].name;
        }
        if (nextInputName === 'positive') {
          result.purpose = 'positive';
          return true;
        } else if (nextInputName === 'negative') {
          result.purpose = 'negative';
          return true;
        } else {
          if (trace(targetNode, path, depth + 1, nextInputName)) {
            return true;
          }
        }

        path.pop();
      }
    }

    return false;
  }

  const success = trace(node, result.path, 0);

  if (!success || !result.purpose) {
    result.purpose = 'positive';
    result.traceSuccess = false;
  } else {
    result.traceSuccess = true;
  }

  return result;
}

async function getNodeParams(node) {
  const inputs = node.inputs ? node.inputs.map(input => ({
    name: input.name || "",
    type: input.type || "",
    link: input.link || null
  })) : [];

  const outputs = node.outputs ? node.outputs.map(output => ({
    name: output.name || "",
    type: output.type || "",
    links: output.links || []
  })) : [];

  let tracePath = null;
  let purpose = null;

  const hasCustomTitle = node.title && !DEFAULT_CLIP_TITLES.includes(node.title);

  if (node.type === "CLIPTextEncode" && !hasCustomTitle) {
    const appInstance = getComfyUIAppInstance();
    if (appInstance) {
      const traceResult = traceClipTextEncodePath(node, appInstance);
      tracePath = traceResult.path;
      purpose = traceResult.purpose;
    }
  }

  let color = node.color || "none";
  let bgcolor = node.bgcolor || "none";

  if (typeof color === 'string' && color.startsWith('rgba')) {
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const alpha = parseFloat(rgbaMatch[4]);

      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();

      color = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase() + alphaHex;
    }
  }

  if (typeof bgcolor === 'string' && bgcolor.startsWith('rgba')) {
    const rgbaMatch = bgcolor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const alpha = parseFloat(rgbaMatch[4]);

      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();

      bgcolor = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase() + alphaHex;
    }
  }

  return {
    type: node.type || "none",
    title: node.title || null,
    color: color,
    bgcolor: bgcolor,
    inputs: inputs,
    outputs: outputs,
    tracePath: tracePath,
    purpose: purpose
  };
}

export async function getColorPresets() {
  try {
    const response = await fetch('/align/color-presets');
    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`);
    }

    const presets = await response.json();

    if (!Array.isArray(presets)) {
      return [];
    }

    const uniquePresets = [];
    const presetNames = new Set();

    for (const preset of presets) {
      if (preset && preset.name && !presetNames.has(preset.name)) {
        presetNames.add(preset.name);
        uniquePresets.push(preset);
      }
    }

    return uniquePresets;
  } catch (error) {
    console.error("Failed to get color presets:", error);
    return [];
  }
}

export async function saveColorPreset(name, nodeParams) {
  try {
    if (!name) {
      showNotification("Preset name cannot be empty");
      return false;
    }

    if (!nodeParams || !Array.isArray(nodeParams)) {
      nodeParams = [];
    }

    let presets = await getColorPresets();

    const existingIndex = presets.findIndex(preset => preset.name === name);

    let createdAt = new Date().toISOString();
    if (existingIndex >= 0 && presets[existingIndex].createdAt) {
      createdAt = presets[existingIndex].createdAt;
    }

    const newPreset = {
      name,
      nodes: nodeParams,
      createdAt: createdAt,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      presets[existingIndex] = newPreset;
    } else {
      presets.push(newPreset);
    }

    const response = await fetch('/align/color-presets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(presets)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned error: ${response.status}`);
    }

    return true;
  } catch (error) {
    showNotification(`Failed to save preset: ${error.message}`);
    return false;
  }
}

export async function deleteColorPreset(name) {
  try {
    let presets = await getColorPresets();

    const newPresets = presets.filter(preset => preset.name !== name);

    if (newPresets.length === presets.length) {
      showNotification(`Preset "${name}" not found`);
      return false;
    }

    const response = await fetch('/align/color-presets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPresets)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned error: ${response.status}`);
    }

    return true;
  } catch (error) {
    showNotification(`Failed to delete preset: ${error.message}`);
    return false;
  }
}

export async function deleteColorFromPreset(presetName, nodeType, nodeTitle = null, nodeData = null) {
  try {
    if (!presetName || !nodeType) {
      return false;
    }

    let presets = await getColorPresets();
    const presetIndex = presets.findIndex(preset => preset.name === presetName);

    if (presetIndex === -1) {
      showNotification(`Preset "${presetName}" not found`);
      return false;
    }

    const preset = presets[presetIndex];
    if (!preset.nodes || !Array.isArray(preset.nodes)) {
      return false;
    }

    const originalLength = preset.nodes.length;

    if (!nodeData || !nodeData.color) {
      showNotification("Unable to delete color: Missing node data");
      return false;
    }

    const nodeIndex = preset.nodes.findIndex(node => {
      if (node.type !== nodeType) return false;

      if (nodeTitle && node.title !== nodeTitle) return false;
      if (!nodeTitle && node.title) return false;

      const isDefaultClip = nodeType === "CLIPTextEncode" &&
                           (!nodeTitle || DEFAULT_CLIP_TITLES.includes(nodeTitle));

      if (isDefaultClip && nodeData.purpose && node.purpose !== nodeData.purpose) return false;

      if (node.color !== nodeData.color) return false;

      return true;
    });

    if (nodeIndex !== -1) {
      preset.nodes.splice(nodeIndex, 1);
    }

    if (preset.nodes.length === originalLength) {
      const displayName = nodeTitle || nodeType;
      showNotification(`Color not found for node "${displayName}"`);
      return false;
    }

    presets[presetIndex] = {
      ...preset,
      updatedAt: new Date().toISOString()
    };

    const response = await fetch('/align/color-presets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(presets)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned error: ${response.status}`);
    }

    return true;
  } catch (error) {
    showNotification(`Failed to delete color: ${error.message}`);
    return false;
  }
}

export async function applyColorPreset(presetName) {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      showNotification("Failed to get ComfyUI app instance");
      return false;
    }

    const presets = await getColorPresets();
    const preset = presets.find(p => p.name === presetName);

    if (!preset) {
      showNotification(`Preset "${presetName}" not found`);
      return false;
    }

    const selectedNodes = getSelectedNodes(appInstance);

    if (selectedNodes.length > 0) {
      selectedNodes.forEach(node => {
        applyPresetToNode(node, preset, appInstance);
      });
    } else {

      const allNodes = appInstance.graph._nodes || [];

      allNodes.forEach(node => {
        applyPresetToNode(node, preset, appInstance);
      });
    }

    appInstance.graph.setDirtyCanvas(true, true);

    return true;
  } catch (error) {
    showNotification(`Failed to apply preset: ${error.message}`);
    return false;
  }
}

function applyPresetToNode(node, preset, appInstance) {
  const hasCustomTitle = node.title && !DEFAULT_CLIP_TITLES.includes(node.title);

  if (hasCustomTitle) {
    const titleMatch = preset.nodes.find(presetNode =>
      presetNode.title === node.title && presetNode.type === node.type
    );

    if (titleMatch) {
      if (titleMatch.color && titleMatch.color !== "none") {
        node.color = hexToRgbaString(titleMatch.color);
      }

      if (titleMatch.bgcolor && titleMatch.bgcolor !== "none") {
        node.bgcolor = hexToRgbaString(titleMatch.bgcolor);
      }

      return;
    }
  }

  if (node.type === "CLIPTextEncode" && (!node.title || DEFAULT_CLIP_TITLES.includes(node.title))) {
    const traceResult = traceClipTextEncodePath(node, appInstance);
    const currentPurpose = traceResult.purpose;

    const clipNodes = preset.nodes.filter(presetNode =>
      presetNode.type === "CLIPTextEncode" &&
      (!presetNode.title || DEFAULT_CLIP_TITLES.includes(presetNode.title))
    );

    if (clipNodes.length > 0) {
      let bestMatch = null;

      if (currentPurpose) {
        bestMatch = clipNodes.find(clipNode => clipNode.purpose === currentPurpose);
      }

      if (!bestMatch && node.outputs && node.outputs.length > 0 && node.outputs[0].links) {
        const outputLinks = node.outputs[0].links;

        for (const clipNode of clipNodes) {
          if (clipNode.outputs && clipNode.outputs.length > 0 && clipNode.purpose === currentPurpose) {
            if (JSON.stringify(clipNode.outputs[0].links) === JSON.stringify(outputLinks)) {
              bestMatch = clipNode;
              break;
            }
          }
        }
      }

      if (!bestMatch) {
        bestMatch = clipNodes.find(clipNode =>
          (!clipNode.outputs || !clipNode.outputs[0] || !clipNode.outputs[0].links || clipNode.outputs[0].links.length === 0) &&
          clipNode.purpose === currentPurpose
        );

        if (!bestMatch) {
          bestMatch = clipNodes.find(clipNode =>
            !clipNode.outputs || !clipNode.outputs[0] || !clipNode.outputs[0].links || clipNode.outputs[0].links.length === 0
          );
        }
      }

      if (bestMatch) {
        if (bestMatch.color && bestMatch.color !== "none") {
          node.color = hexToRgbaString(bestMatch.color);
        }

        if (bestMatch.bgcolor && bestMatch.bgcolor !== "none") {
          node.bgcolor = hexToRgbaString(bestMatch.bgcolor);
        }
      }
    }
  }

  const typeMatches = preset.nodes.filter(presetNode =>
    presetNode.type === node.type && !presetNode.title
  );

  if (typeMatches.length > 0) {
    const match = typeMatches[0];

    if (match.color && match.color !== "none") {
      node.color = hexToRgbaString(match.color);
    }

    if (match.bgcolor && match.bgcolor !== "none") {
      node.bgcolor = hexToRgbaString(match.bgcolor);
    }
  }
}

export async function collectNodeColors(selectedOnly = true) {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      showNotification("Failed to get ComfyUI app instance");
      return [];
    }

    let nodes = [];

    if (selectedOnly) {
      nodes = getSelectedNodes(appInstance);

      if (nodes.length === 0) {
        return [];
      }
    } else {
      nodes = appInstance.graph._nodes;
    }

    const coloredNodes = nodes.filter(node =>
      (node.color && node.color !== "none") ||
      (node.bgcolor && node.bgcolor !== "none")
    );

    if (coloredNodes.length === 0) {

      return [];
    }

    const nodeParamsPromises = coloredNodes.map(node => getNodeParams(node));
    return Promise.all(nodeParamsPromises);
  } catch (error) {
    showNotification(`Failed to collect node colors: ${error.message}`);
    return [];
  }
}

export async function loadPresets() {
  try {
    await getColorPresets();
  } catch (error) {
    console.error("Load Preset Failed:", error);
  }
}

export function addPlaceholderSwatch(gridElement) {
  gridElement.style.display = 'grid';
  const placeholderSwatch = document.createElement('div');
  placeholderSwatch.className = 'aligner-preset-swatch placeholder';
  placeholderSwatch.style.backgroundColor = 'transparent';
  placeholderSwatch.style.border = '1px dashed rgba(255, 255, 255, 0.2)';
  gridElement.appendChild(placeholderSwatch);
}

export async function updatePresetsGrid(gridElement, presetName = null, options = {}) {
  const {
    createElement,
    eventListenerManager,
    domElements,
    findColorPositionFn,
    activeContextMenus,
    ensureHexColor,
    hexToRgb,
    updateHexInput,
    updateColorUI,
    setCurrentColor,
    getCurrentColor,
    getNodeColorByConfig,
    DEFAULT_COLOR_CONFIG
  } = options;

  gridElement.innerHTML = '';

  try {
    if (!presetName) {
      addPlaceholderSwatch(gridElement);
      return;
    }

    gridElement.style.display = 'grid';
    if (domElements?.colorArea) {
      const colorAreaRect = domElements.colorArea.getBoundingClientRect();
      gridElement.style.width = `${colorAreaRect.width}px`;
    }

    const presets = await getColorPresets();
    const preset = presets.find(p => p.name === presetName);

    if (!preset || !preset.nodes || preset.nodes.length === 0) {
      addPlaceholderSwatch(gridElement);
      return;
    }

    preset.nodes.forEach(node => {
      if (node.color && node.color !== "none") {
        const colorSwatch = createElement('div', 'aligner-preset-swatch');
        colorSwatch.style.backgroundColor = node.color;

        const displayName = node.title || node.type || "Unknown Node Type";

        const tooltip = createElement('div', 'aligner-swatch-tooltip');

        const tooltipContent = document.createElement('div');
        tooltipContent.style.display = 'flex';
        tooltipContent.style.alignItems = 'center';
        tooltipContent.style.gap = '6px';

        const colorIndicator = document.createElement('div');
        colorIndicator.style.width = '8px';
        colorIndicator.style.height = '8px';
        colorIndicator.style.borderRadius = '50%';
        colorIndicator.style.backgroundColor = node.color;
        colorIndicator.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        colorIndicator.style.flexShrink = '0';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = displayName;

        tooltipContent.appendChild(colorIndicator);
        tooltipContent.appendChild(nameSpan);
        tooltip.appendChild(tooltipContent);

        colorSwatch.appendChild(tooltip);

        const handleColorSwatchClick = () => {
          const config = window.alignerPlugin?.getConfig() || DEFAULT_COLOR_CONFIG;

          const colorToUse = getNodeColorByConfig(node, config);

          const color = ensureHexColor(colorToUse);

          let opacity = 100;
          const rgba = hexToRgb(color);
          if (rgba.a !== undefined && rgba.a !== 1) {
            opacity = Math.round(rgba.a * 100);
          }

          setCurrentColor(color, opacity);

          if (domElements.opacitySlider && domElements.opacityValue) {
            domElements.opacitySlider.value = opacity;
            domElements.opacityValue.textContent = `${opacity}%`;

            updateColorUI(color, domElements.opacitySlider);
          }

          if (domElements.hexInput) {
            updateHexInput(color, domElements.hexInput);

            const event = new Event('change');
            domElements.hexInput.dispatchEvent(event);

            if (domElements.colorIndicator && findColorPositionFn) {
              const { x, y } = findColorPositionFn(color);
              domElements.colorIndicator.style.left = `${x}px`;
              domElements.colorIndicator.style.top = `${y}px`;
            }

            if (options.applyCurrentColorToSelectedNodes) {
              options.applyCurrentColorToSelectedNodes();
            }
          }
        };

        eventListenerManager.add(colorSwatch, 'click', handleColorSwatchClick);

        eventListenerManager.add(colorSwatch, 'contextmenu', async (e) => {
          e.preventDefault();

          const contextMenu = createElement('div', 'aligner-context-menu');
          contextMenu.style.position = 'absolute';
          contextMenu.style.left = `${e.clientX}px`;
          contextMenu.style.top = `${e.clientY}px`;

          const deleteOption = createElement('div', 'aligner-context-menu-item');
          deleteOption.textContent = 'Delete Color';

          const handleDeleteOptionClick = async () => {
            const success = await deleteColorFromPreset(presetName, node.type, node.title, node);

            if (success) {
              await updatePresetsGrid(gridElement, presetName, options);
            }

            if (document.body.contains(contextMenu)) {
              document.body.removeChild(contextMenu);
            }
          };

          eventListenerManager.add(deleteOption, 'click', handleDeleteOptionClick);

          contextMenu.appendChild(deleteOption);
          document.body.appendChild(contextMenu);

          const closeMenu = (event) => {
            if (!contextMenu.contains(event.target)) {
              if (document.body.contains(contextMenu)) {
                document.body.removeChild(contextMenu);
              }
              eventListenerManager.remove(document, 'click', closeMenu);

              const index = activeContextMenus.findIndex(item => item.menu === contextMenu);
              if (index !== -1) {
                activeContextMenus.splice(index, 1);
              }
            }
          };

          activeContextMenus.push({ menu: contextMenu, closeHandler: closeMenu });

          setTimeout(() => {
            eventListenerManager.add(document, 'click', closeMenu);
          }, 0);
        });

        gridElement.appendChild(colorSwatch);
      }
    });

    if (gridElement.childElementCount === 0) {
      addPlaceholderSwatch(gridElement);
    }
  } catch (error) {
    addPlaceholderSwatch(gridElement);
    console.error("Failed to load presets:", error);
  }
}
