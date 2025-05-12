import { createElement, showConfirmDialog } from './dom-utils.js';
import { showNotification } from './notifications.js';
import { SVG_PATHS } from '../utils/svg-paths.js';
import { rgbToHex, hexToRgb, ensureHexColor, findColorPosition } from '../utils/color-processing.js';
import { createMoonIcon } from './about-panel.js';
import { DEFAULT_CLIP_TITLES, getColorPresets, collectNodeColors, saveColorPreset, updatePresetsGrid as updatePresetsGridUtil, traceClipTextEncodePath } from '../utils/color-preset-manager.js';
import { DEFAULT_COLOR_CONFIG, getNodeColorByConfig, updateColorPickerFromSelectedNode as getColorFromSelectedNode, setCurrentColor, getCurrentColor } from '../core/color-manager.js';
import { getComfyUIAppInstance, getSelectedNodes, getSelectedGroups } from '../utils/node-utils.js';
import { getDeeperColor } from '../utils/general-utils.js';
import eventListenerManager from '../events/event-listener-manager.js';
import { setupSelectionChangeListener, removeSelectionChangeListener } from '../events/selection-change-listener.js';

const PRESET_NAME = "Moon";

function drawColorArea(hue, targetCanvas) {
  if (!targetCanvas) return;

  const width = targetCanvas.width;
  const height = targetCanvas.height;
  if (width <= 0 || height <= 0) return;

  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) return;

  targetCtx.clearRect(0, 0, width, height);

  const whiteGradient = targetCtx.createLinearGradient(width, 0, 0, 0);
  whiteGradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
  whiteGradient.addColorStop(1, '#ffffff');

  targetCtx.fillStyle = whiteGradient;
  targetCtx.fillRect(0, 0, width, height);

  const blackGradient = targetCtx.createLinearGradient(0, 0, 0, height);
  blackGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  blackGradient.addColorStop(1, '#000000');

  targetCtx.fillStyle = blackGradient;
  targetCtx.fillRect(0, 0, width, height);
}

function updateColorCanvas(canvas, hueSlider) {
  if (!canvas || !hueSlider) return;

  const hue = parseInt(hueSlider.value) || 0;
  drawColorArea(hue, canvas);
}

function updateColorUI(color, opacitySlider) {
  updateOpacitySliderBackground(color, opacitySlider);
}

function getHexColorValue(color) {
  if (!color) return '';
  return color.length > 7 ? color.substring(1, 7) : color.replace(/^#/, '');
}

function updateHexInput(color, hexInput) {
  if (!hexInput) return;
  const colorValue = getHexColorValue(color);
  hexInput.value = colorValue.toUpperCase();
}

let colorPickerContainer = null;
let isColorPickerVisible = false;
let findColorPositionFn = null;

let handleDocumentMouseMove = null;
let handleDocumentMouseUp = null;
let handleCanvasMouseMove = null;
let handleCanvasMouseUp = null;

let activeContextMenus = [];

const domElements = {
  colorPickerContainer: null,
  colorCanvas: null,
  colorIndicator: null,
  hueSlider: null,
  opacitySlider: null,
  opacityValue: null,
  hexInput: null,
  rInput: null,
  gInput: null,
  bInput: null,
  presetsGrid: null,
  colorArea: null,
  slidersContainer: null,
  colorValues: null,
  presetsContainer: null,
  bottomButtonsContainer: null
};



function updateOpacitySliderBackground(color, slider) {
  if (!slider) {
    slider = domElements.opacitySlider;
    if (!slider) return;
  }

  const rgb = hexToRgb(color);
  slider.style.backgroundImage = `
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%),
    linear-gradient(to right,
      rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0) 0%,
      rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1) 100%)
  `;
  slider.style.backgroundSize = '8px 8px, 8px 8px, 8px 8px, 8px 8px, 100% 100%';
  slider.style.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px, 0 0';
}


export function createColorPicker() {
  if (colorPickerContainer) {
    return colorPickerContainer;
  }

  domElements.colorPickerContainer = createElement('div', 'aligner-color-picker');
  domElements.colorPickerContainer.style.display = 'none';

  colorPickerContainer = domElements.colorPickerContainer;
  const header = createElement('div', 'aligner-color-picker-header');
  const title = createElement('div', 'aligner-color-picker-title');

  const titleContainer = createElement('div', 'aligner-color-picker-title-container');
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';

  const moonIcon = createMoonIcon();

  const titleText = createElement('span');
  titleText.textContent = 'Color Picker';

  titleContainer.appendChild(moonIcon);
  titleContainer.appendChild(titleText);
  title.appendChild(titleContainer);

  header.appendChild(title);

  const closeButton = createElement('div', 'aligner-color-picker-close');
  eventListenerManager.add(closeButton, 'click', () => {
    hideColorPicker();
  });
  header.appendChild(closeButton);

  let isDragging = false;
  let offsetX, offsetY;

  function handleHeaderMouseDown(e) {
    isDragging = true;
    const rect = colorPickerContainer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    colorPickerContainer.style.transition = 'none';
  }

  handleDocumentMouseMove = function(e) {
    if (!isDragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    colorPickerContainer.style.left = `${x}px`;
    colorPickerContainer.style.top = `${y}px`;
    colorPickerContainer.style.transform = 'none';
  };

  handleDocumentMouseUp = function() {
    isDragging = false;
    colorPickerContainer.style.transition = '';
  };

  eventListenerManager.add(header, 'mousedown', handleHeaderMouseDown);
  eventListenerManager.add(document, 'mousemove', handleDocumentMouseMove);
  eventListenerManager.add(document, 'mouseup', handleDocumentMouseUp);

  colorPickerContainer.appendChild(header);

  const content = createElement('div', 'aligner-color-picker-content');
  colorPickerContainer.appendChild(content);

  domElements.colorArea = createElement('div', 'aligner-color-area');

  domElements.colorCanvas = createElement('canvas', 'aligner-color-canvas');

  domElements.colorCanvas.width = 280;
  domElements.colorCanvas.height = 160;
  domElements.colorArea.appendChild(domElements.colorCanvas);

  domElements.colorIndicator = createElement('div', 'aligner-color-indicator');
  domElements.colorArea.appendChild(domElements.colorIndicator);

  content.appendChild(domElements.colorArea);

  domElements.slidersContainer = createElement('div', 'aligner-sliders-container');

  const hueContainer = createElement('div', 'aligner-hue-container');

  const opacityContainer = createElement('div', 'aligner-opacity-container');

  const eyedropperButton = createElement('button', 'aligner-eyedropper-button');
  eyedropperButton.innerHTML = `<svg viewBox="0 0 1024 1024"><path d="${SVG_PATHS.colorPicker}" fill="currentColor"/></svg>`;
  domElements.slidersContainer.appendChild(eyedropperButton);

  eventListenerManager.add(eyedropperButton, 'click', () => {
    if (window.EyeDropper) {
      const eyeDropper = new window.EyeDropper();
      eyeDropper.open()
        .then(result => {
          const color = result.sRGBHex;
          setCurrentColor(color, getCurrentColor().opacity);
          if (domElements.hexInput) {
            updateHexInput(color, domElements.hexInput);
            const event = new Event('change');
            domElements.hexInput.dispatchEvent(event);

            const { x, y } = findColorPositionFn(color);
            domElements.colorIndicator.style.left = `${x}px`;
            domElements.colorIndicator.style.top = `${y}px`;

            applyCurrentColorToSelectedNodes();
          }
        })
    } else {
      showNotification('Your browser does not support the eyedropper tool');
    }
  });

  domElements.hueSlider = createElement('input', 'aligner-hue-slider');
  domElements.hueSlider.type = 'range';
  domElements.hueSlider.min = '0';
  domElements.hueSlider.max = '360';
  domElements.hueSlider.value = '0';

  hueContainer.appendChild(domElements.hueSlider);
  domElements.slidersContainer.appendChild(hueContainer);

  domElements.opacitySlider = createElement('input', 'aligner-opacity-slider');
  domElements.opacitySlider.type = 'range';
  domElements.opacitySlider.min = '0';
  domElements.opacitySlider.max = '100';
  domElements.opacitySlider.value = getCurrentColor().opacity.toString();

  domElements.opacityValue = createElement('div', 'aligner-slider-value');
  domElements.opacityValue.textContent = `${getCurrentColor().opacity}%`;
  opacityContainer.appendChild(domElements.opacityValue);

  opacityContainer.appendChild(domElements.opacitySlider);
  domElements.slidersContainer.appendChild(opacityContainer);

  content.appendChild(domElements.slidersContainer);

  domElements.colorValues = createElement('div', 'aligner-color-values');

  const hexContainer = createElement('div', 'aligner-color-value-container');
  hexContainer.style.marginLeft = '0';
  domElements.hexInput = createElement('input', 'aligner-color-value-input');
  domElements.hexInput.type = 'text';
  domElements.hexInput.value = 'FF0000';
  hexContainer.appendChild(domElements.hexInput);
  const hexLabel = createElement('div', 'aligner-color-value-label');
  hexLabel.textContent = 'HEX';
  hexContainer.appendChild(hexLabel);
  domElements.colorValues.appendChild(hexContainer);

  const rgbContainer = createElement('div', 'aligner-color-rgb-container');

  const rContainer = createElement('div', 'aligner-color-value-container');
  domElements.rInput = createElement('input', 'aligner-color-value-input');
  domElements.rInput.type = 'number';
  domElements.rInput.min = '0';
  domElements.rInput.max = '255';
  domElements.rInput.value = '255';
  rContainer.appendChild(domElements.rInput);
  const rLabel = createElement('div', 'aligner-color-value-label');
  rLabel.textContent = 'R';
  rContainer.appendChild(rLabel);
  rgbContainer.appendChild(rContainer);

  const gContainer = createElement('div', 'aligner-color-value-container');
  domElements.gInput = createElement('input', 'aligner-color-value-input');
  domElements.gInput.type = 'number';
  domElements.gInput.min = '0';
  domElements.gInput.max = '255';
  domElements.gInput.value = '0';
  gContainer.appendChild(domElements.gInput);
  const gLabel = createElement('div', 'aligner-color-value-label');
  gLabel.textContent = 'G';
  gContainer.appendChild(gLabel);
  rgbContainer.appendChild(gContainer);

  const bContainer = createElement('div', 'aligner-color-value-container');
  bContainer.style.marginRight = '0';
  domElements.bInput = createElement('input', 'aligner-color-value-input');
  domElements.bInput.type = 'number';
  domElements.bInput.min = '0';
  domElements.bInput.max = '255';
  domElements.bInput.value = '0';
  bContainer.appendChild(domElements.bInput);
  const bLabel = createElement('div', 'aligner-color-value-label');
  bLabel.textContent = 'B';
  bContainer.appendChild(bLabel);
  rgbContainer.appendChild(bContainer);

  domElements.colorValues.appendChild(rgbContainer);
  content.appendChild(domElements.colorValues);

  domElements.presetsContainer = createElement('div', 'aligner-presets-container');

  const presetsHeader = createElement('div', 'aligner-presets-header');

  const presetsTitle = createElement('div', 'aligner-presets-title');
  presetsTitle.textContent = 'Color Presets';
  presetsHeader.appendChild(presetsTitle);

  domElements.presetsContainer.appendChild(presetsHeader);

  domElements.presetsGrid = createElement('div', 'aligner-presets-grid');
  domElements.presetsContainer.appendChild(domElements.presetsGrid);

  content.appendChild(domElements.presetsContainer);

  domElements.bottomButtonsContainer = createElement('div', 'aligner-bottom-buttons-container');

  const clearButton = createElement('button', 'aligner-clear-preset-button');
  clearButton.textContent = 'Clear';
  clearButton.style.marginLeft = '0';

  const handleClearButtonClick = async () => {
    try {
      const presets = await getColorPresets();

      if (presets.length === 0) {
        showNotification("No presets to clear");
        return;
      }

      showConfirmDialog("Are you sure you want to clear all presets?", async () => {
        const response = await fetch('/align/color-presets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([])
        });

        if (response.ok) {
          showNotification("All presets cleared");
          currentPresetName = null;
          if (domElements.presetsGrid) {
            await updatePresetsGrid(domElements.presetsGrid, null);
          }
        } else {
          showNotification("Failed to clear presets");
        }
      });
    } catch (error) {
      showNotification("Failed to clear presets");
      console.error(error);
    }
  };

  eventListenerManager.add(clearButton, 'click', handleClearButtonClick);
  domElements.bottomButtonsContainer.appendChild(clearButton);

  const rightButtonsContainer = createElement('div', 'aligner-right-buttons-container');
  rightButtonsContainer.style.display = 'flex';
  rightButtonsContainer.style.gap = '4px';
  rightButtonsContainer.style.marginLeft = 'auto';

  const saveButton = createElement('button', 'aligner-save-preset-button');
  saveButton.textContent = 'Save';

  const handleSaveButtonClick = async () => {
    try {
      const presetName = PRESET_NAME;
      const nodeColors = await collectNodeColors(true);

      let newColors = nodeColors;
      if (nodeColors.length === 0) {
        const allNodeColors = await collectNodeColors(false);
        newColors = allNodeColors.length === 0 ? [] : allNodeColors;
      }

      if (newColors.length === 0) {
        showNotification("No colored nodes to save");
        return;
      }

      const uniqueNodesMap = new Map();
      newColors.forEach(newNode => {
        const isDefaultClip = newNode.type === "CLIPTextEncode" &&
                             (!newNode.title || DEFAULT_CLIP_TITLES.includes(newNode.title));
        const key = isDefaultClip ?
          `${newNode.type}:${newNode.title || ''}:${newNode.purpose || ''}` :
          `${newNode.type}:${newNode.title || ''}`;

        uniqueNodesMap.set(key, newNode);
      });

      const uniqueNewColors = Array.from(uniqueNodesMap.values());

      const presets = await getColorPresets();
      const existingPreset = presets.find(p => p.name === presetName);

      if (existingPreset && existingPreset.nodes && existingPreset.nodes.length > 0) {
        const existingNodesMap = new Map();
        existingPreset.nodes.forEach(node => {
          const isDefaultClip = node.type === "CLIPTextEncode" &&
                               (!node.title || DEFAULT_CLIP_TITLES.includes(node.title));
          const key = isDefaultClip ?
            `${node.type}:${node.title || ''}:${node.purpose || ''}` :
            `${node.type}:${node.title || ''}`;

          existingNodesMap.set(key, node);
        });

        uniqueNewColors.forEach(newNode => {
          const isDefaultClip = newNode.type === "CLIPTextEncode" &&
                               (!newNode.title || DEFAULT_CLIP_TITLES.includes(newNode.title));
          const key = isDefaultClip ?
            `${newNode.type}:${newNode.title || ''}:${newNode.purpose || ''}` :
            `${newNode.type}:${newNode.title || ''}`;

          existingNodesMap.set(key, newNode);
        });

        const mergedColors = Array.from(existingNodesMap.values());

        await saveColorPreset(presetName, mergedColors);
      } else {
        await saveColorPreset(presetName, uniqueNewColors);
      }

      currentPresetName = presetName;

      if (domElements.presetsGrid) {
        await updatePresetsGrid(domElements.presetsGrid, presetName);
      }

    } catch (error) {
      showNotification("Failed to save preset");
      console.error(error);
    }
  };

  eventListenerManager.add(saveButton, 'click', handleSaveButtonClick);
  rightButtonsContainer.appendChild(saveButton);

  const applyButton = createElement('button', 'aligner-apply-preset-button');
  applyButton.textContent = 'Apply';
  applyButton.style.marginRight = '0';

  const handleApplyButtonClick = async () => {
    try {
      const { color, opacity } = getCurrentColor();
      const appInstance = getComfyUIAppInstance();
      if (!appInstance) {
        showNotification("Unable to get ComfyUI application instance");
        return;
      }

      const selectedNodes = getSelectedNodes(appInstance);
      const selectedGroups = getSelectedGroups(appInstance);
      const config = window.alignerPlugin?.getConfig() || DEFAULT_COLOR_CONFIG;
      const alpha = opacity / 100;

      if (selectedNodes.length > 0 || selectedGroups.length > 0) {
        selectedNodes.forEach(node => {
          if (config.applyToHeader && config.applyToPanel) {
            const deeperColor = getDeeperColor(color);
            const deeperRgb = hexToRgb(deeperColor);
            node.color = rgbToHex(deeperRgb.r, deeperRgb.g, deeperRgb.b, alpha);

            const rgb = hexToRgb(color);
            node.bgcolor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
          } else if (config.applyToHeader) {
            const rgb = hexToRgb(color);
            node.color = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
          } else if (config.applyToPanel) {
            const rgb = hexToRgb(color);
            node.bgcolor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
          }
        });

        selectedGroups.forEach(group => {
          const rgb = hexToRgb(color);
          group.color = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        });

        appInstance.graph.setDirtyCanvas(true, true);
      } else {
        const presets = await getColorPresets();
        const presetName = PRESET_NAME;
        const preset = presets.find(p => p.name === presetName);

        if (!preset || !preset.nodes || preset.nodes.length === 0) {
          showNotification("Preset not found or no nodes in preset");
          return;
        }

        const allNodes = appInstance.graph._nodes || [];
        let appliedCount = 0;

        allNodes.forEach(node => {
          let matchingPresetNodes = preset.nodes.filter(presetNode => {
            if (presetNode.type !== node.type) return false;

            if (presetNode.title && node.title) {
              return presetNode.title === node.title;
            } else if (!presetNode.title && !node.title) {
              return true;
            }

            return false;
          });

          if (node.type === "CLIPTextEncode" && (!node.title || DEFAULT_CLIP_TITLES.includes(node.title))) {
            const traceResult = traceClipTextEncodePath(node, appInstance);
            const currentPurpose = traceResult.purpose;

            if (currentPurpose && matchingPresetNodes.length > 0) {
              matchingPresetNodes = matchingPresetNodes.filter(presetNode =>
                presetNode.purpose === currentPurpose
              );
            }
          }

          if (matchingPresetNodes.length > 0) {
            const presetNode = matchingPresetNodes[0];

            if (config.applyToHeader && presetNode.color && presetNode.color !== "none") {
              const presetColor = ensureHexColor(presetNode.color);
              const presetRgb = hexToRgb(presetColor);
              const presetAlpha = presetRgb.a !== undefined ? presetRgb.a : alpha;

              if (config.applyToPanel) {
                const bgColor = presetNode.bgcolor && presetNode.bgcolor !== "none"
                  ? ensureHexColor(presetNode.bgcolor)
                  : presetColor;

                const deeperColor = getDeeperColor(bgColor);
                const deeperRgb = hexToRgb(deeperColor);
                node.color = rgbToHex(deeperRgb.r, deeperRgb.g, deeperRgb.b, presetAlpha);

                if (presetNode.bgcolor && presetNode.bgcolor !== "none") {
                  const bgPresetColor = ensureHexColor(presetNode.bgcolor);
                  const bgPresetRgb = hexToRgb(bgPresetColor);
                  const bgPresetAlpha = bgPresetRgb.a !== undefined ? bgPresetRgb.a : alpha;
                  node.bgcolor = rgbToHex(bgPresetRgb.r, bgPresetRgb.g, bgPresetRgb.b, bgPresetAlpha);
                } else {
                  node.bgcolor = rgbToHex(presetRgb.r, presetRgb.g, presetRgb.b, presetAlpha);
                }
              } else {
                node.color = rgbToHex(presetRgb.r, presetRgb.g, presetRgb.b, presetAlpha);
              }
              appliedCount++;
            } else if (config.applyToPanel && presetNode.bgcolor && presetNode.bgcolor !== "none") {
              const bgPresetColor = ensureHexColor(presetNode.bgcolor);
              const bgPresetRgb = hexToRgb(bgPresetColor);
              const bgPresetAlpha = bgPresetRgb.a !== undefined ? bgPresetRgb.a : alpha;
              node.bgcolor = rgbToHex(bgPresetRgb.r, bgPresetRgb.g, bgPresetRgb.b, bgPresetAlpha);
              appliedCount++;
            }
          }
        });

        if (appliedCount > 0) {
          appInstance.graph.setDirtyCanvas(true, true);
          showNotification(`Applied color to ${appliedCount} nodes`);
        } else {
          showNotification("No matching nodes to apply color");
        }
      }
    } catch (error) {
      console.error("Failed to apply color:", error);
      showNotification("Failed to apply color");
    }
  };

  eventListenerManager.add(applyButton, 'click', handleApplyButtonClick);
  rightButtonsContainer.appendChild(applyButton);

  domElements.bottomButtonsContainer.appendChild(rightButtonsContainer);

  content.appendChild(domElements.bottomButtonsContainer);

  initColorPicker(
    domElements.colorCanvas,
    domElements.colorIndicator,
    domElements.hueSlider,
    domElements.opacitySlider,
    domElements.opacityValue,
    domElements.hexInput,
    domElements.rInput,
    domElements.gInput,
    domElements.bInput
  );

  document.body.appendChild(colorPickerContainer);

  return colorPickerContainer;
}

function initColorPicker(canvas, indicator, hueSlider, opacitySlider, opacityValue, hexInput, rInput, gInput, bInput) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let isDragging = false;

  function updateCanvasSize() {
    if (domElements.colorArea) {
      const rect = domElements.colorArea.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        updateColorCanvas(canvas, hueSlider);
      }
    }
  }

  setTimeout(updateCanvasSize, 0);

  findColorPositionFn = function(color) {
    return findColorPosition(color, canvas, hueSlider, function(color, slider) {
      updateColorUI(color, slider || opacitySlider);
    });
  }



  function updateColor(x, y) {
    const width = canvas.width;
    const height = canvas.height;

    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));

    let r, g, b;

    const isLeftEdge = x <= 1;
    const isRightEdge = x >= width - 2;
    const isTopEdge = y <= 1;
    const isBottomEdge = y >= height - 2;

    if (isLeftEdge && isTopEdge) {
      r = 255;
      g = 255;
      b = 255;
    } else if (isLeftEdge && isBottomEdge) {

      r = 0;
      g = 0;
      b = 0;
    } else if (isRightEdge && isTopEdge) {
      const hue = parseInt(hueSlider.value);
      if (hue <= 15 || hue >= 345) {
        r = 255;
        g = 0;
        b = 0;
      } else if (hue < 45) {
        r = 255;
        g = 128;
        b = 0;
      } else if (hue < 75) {
        r = 255;
        g = 255;
        b = 0;
      } else if (hue < 150) {
        r = 0;
        g = 255;
        b = 0;
      } else if (hue < 210) {
        r = 0;
        g = 255;
        b = 255;
      } else if (hue < 270) {
        r = 0;
        g = 0;
        b = 255;
      } else {
        r = 255;
        g = 0;
        b = 255;
      }
    } else if (isRightEdge && isBottomEdge) {
      r = 0;
      g = 0;
      b = 0;
    } else {
      const safeX = Math.max(0, Math.min(width - 1, x));
      const safeY = Math.max(0, Math.min(height - 1, y));

      const pixel = ctx.getImageData(safeX, safeY, 1, 1).data;
      r = pixel[0];
      g = pixel[1];
      b = pixel[2];
    }

    const color = rgbToHex(r, g, b);
    const { opacity } = getCurrentColor();
    setCurrentColor(color, opacity);

    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;

    hexInput.value = color.replace(/^#/, '').toUpperCase();
    rInput.value = r;
    gInput.value = g;
    bInput.value = b;

    updateColorUI(color, opacitySlider);

    applyCurrentColorToSelectedNodes();
  }

  updateColorUI(getCurrentColor().color, opacitySlider);

  updateColorCanvas(canvas, hueSlider);

  const handleHueSliderInput = () => {
    updateColorCanvas(canvas, hueSlider);

    const x = parseInt(indicator.style.left) || 0;
    const y = parseInt(indicator.style.top) || 0;
    updateColor(x, y);
  };

  eventListenerManager.add(hueSlider, 'input', handleHueSliderInput);

  const handleOpacitySliderInput = () => {
    const opacity = parseInt(opacitySlider.value);
    const { color } = getCurrentColor();
    setCurrentColor(color, opacity);

    opacityValue.textContent = `${opacity}%`;
    opacityValue.classList.add('visible');

    applyCurrentColorToSelectedNodes();

    clearTimeout(opacitySlider.valueTimeout);
    opacitySlider.valueTimeout = setTimeout(() => {
      opacityValue.classList.remove('visible');
    }, 1500);
  };

  eventListenerManager.add(opacitySlider, 'input', handleOpacitySliderInput);

  function handleCanvasMouseDown(e) {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateColor(x, y);
  }

  handleCanvasMouseMove = function(e) {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateColor(x, y);
  };

  handleCanvasMouseUp = function() {
    isDragging = false;
  };

  eventListenerManager.add(canvas, 'mousedown', handleCanvasMouseDown);
  eventListenerManager.add(document, 'mousemove', handleCanvasMouseMove);
  eventListenerManager.add(document, 'mouseup', handleCanvasMouseUp);

  const handleHexInputChange = () => {
    let hex = hexInput.value;

    hex = hex.replace(/^#/, '').toUpperCase();

    hexInput.value = hex;

    if (/^([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
      let formattedHex = '#' + hex;

      if (hex.length === 3) {
        formattedHex = '#' + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }

      let newColor = formattedHex;
      const { color, opacity } = getCurrentColor();

      if (color.length > 7) {
        const alpha = color.substring(7);
        newColor = formattedHex + alpha;
      }

      setCurrentColor(newColor, opacity);

      const rgb = hexToRgb(newColor);
      rInput.value = rgb.r;
      gInput.value = rgb.g;
      bInput.value = rgb.b;

      const { x, y } = findColorPositionFn(newColor);
      indicator.style.left = `${x}px`;
      indicator.style.top = `${y}px`;

      applyCurrentColorToSelectedNodes();
    } else {
      updateHexInput(getCurrentColor().color, hexInput);
    }
  };

  eventListenerManager.add(hexInput, 'change', handleHexInputChange);

  function updateFromRgb() {
    const r = parseInt(rInput.value) || 0;
    const g = parseInt(gInput.value) || 0;
    const b = parseInt(bInput.value) || 0;

    const validR = Math.max(0, Math.min(255, r));
    const validG = Math.max(0, Math.min(255, g));
    const validB = Math.max(0, Math.min(255, b));

    rInput.value = validR;
    gInput.value = validG;
    bInput.value = validB;

    let newColor = rgbToHex(validR, validG, validB);
    const { color, opacity } = getCurrentColor();

    if (color.length > 7) {
      const alpha = color.substring(7);
      newColor = newColor + alpha;
    }

    setCurrentColor(newColor, opacity);

    updateHexInput(newColor, hexInput);

    const { x, y } = findColorPositionFn(newColor);
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;

    applyCurrentColorToSelectedNodes();
  }

  eventListenerManager.add(rInput, 'change', updateFromRgb);
  eventListenerManager.add(gInput, 'change', updateFromRgb);
  eventListenerManager.add(bInput, 'change', updateFromRgb);
}

let currentPresetName = null;

async function applyCurrentColorToSelectedNodes() {
  try {
    const { color, opacity } = getCurrentColor();
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) return;

    const selectedNodes = getSelectedNodes(appInstance);
    const selectedGroups = getSelectedGroups(appInstance);
    const config = window.alignerPlugin?.getConfig() || DEFAULT_COLOR_CONFIG;
    const alpha = opacity / 100;

    if (selectedNodes.length > 0 || selectedGroups.length > 0) {
      selectedNodes.forEach(node => {
        if (config.applyToHeader && config.applyToPanel) {
          const deeperColor = getDeeperColor(color);
          const deeperRgb = hexToRgb(deeperColor);
          node.color = rgbToHex(deeperRgb.r, deeperRgb.g, deeperRgb.b, alpha);

          const rgb = hexToRgb(color);
          node.bgcolor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        } else if (config.applyToHeader) {
          const rgb = hexToRgb(color);
          node.color = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        } else if (config.applyToPanel) {
          const rgb = hexToRgb(color);
          node.bgcolor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        }
      });

      selectedGroups.forEach(group => {
        const rgb = hexToRgb(color);
        group.color = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
      });

      appInstance.graph.setDirtyCanvas(true, true);
    }
  } catch (error) {
    console.error("Failed to apply color:", error);
  }
}

async function updatePresetsGrid(gridElement, presetName = null) {
  await updatePresetsGridUtil(gridElement, presetName, {
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
    DEFAULT_COLOR_CONFIG,
    applyCurrentColorToSelectedNodes
  });
}

function reinitializeDragHandlers() {
  if (handleDocumentMouseMove && handleDocumentMouseUp) {
    return;
  }

  let isDragging = false;
  let offsetX, offsetY;

  function handleHeaderMouseDown(e) {
    isDragging = true;
    const rect = colorPickerContainer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    colorPickerContainer.style.transition = 'none';
  }

  handleDocumentMouseMove = function(e) {
    if (!isDragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    colorPickerContainer.style.left = `${x}px`;
    colorPickerContainer.style.top = `${y}px`;
    colorPickerContainer.style.transform = 'none';
  };

  handleDocumentMouseUp = function() {
    isDragging = false;
    colorPickerContainer.style.transition = '';
  };

  const header = colorPickerContainer.querySelector('.aligner-color-picker-header');
  if (header) {
    eventListenerManager.add(header, 'mousedown', handleHeaderMouseDown);
    eventListenerManager.add(document, 'mousemove', handleDocumentMouseMove);
    eventListenerManager.add(document, 'mouseup', handleDocumentMouseUp);
  }
}

function reinitializeCanvasHandlers() {
  if (handleCanvasMouseMove && handleCanvasMouseUp || !domElements.colorCanvas) {
    return;
  }

  let isDragging = false;

  handleCanvasMouseMove = function(e) {
    if (!isDragging) return;

    const rect = domElements.colorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateColorFromCanvasPosition(x, y);
  };

  handleCanvasMouseUp = function() {
    isDragging = false;
  };

  eventListenerManager.add(document, 'mousemove', handleCanvasMouseMove);
  eventListenerManager.add(document, 'mouseup', handleCanvasMouseUp);

  eventListenerManager.add(domElements.colorCanvas, 'mousedown', function(e) {
    isDragging = true;
    const rect = domElements.colorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateColorFromCanvasPosition(x, y);
  });
}

function updateColorFromCanvasPosition(x, y) {
  if (!domElements.colorCanvas) return;

  const width = domElements.colorCanvas.width;
  const height = domElements.colorCanvas.height;

  const safeX = Math.max(0, Math.min(width - 1, x));
  const safeY = Math.max(0, Math.min(height - 1, y));

  const ctx = domElements.colorCanvas.getContext('2d', { willReadFrequently: true });
  const pixel = ctx.getImageData(safeX, safeY, 1, 1).data;
  const r = pixel[0];
  const g = pixel[1];
  const b = pixel[2];

  const color = rgbToHex(r, g, b);
  const { opacity } = getCurrentColor();
  setCurrentColor(color, opacity);

  domElements.colorIndicator.style.left = `${x}px`;
  domElements.colorIndicator.style.top = `${y}px`;

  domElements.hexInput.value = color.replace(/^#/, '').toUpperCase();
  domElements.rInput.value = r;
  domElements.gInput.value = g;
  domElements.bInput.value = b;

  updateColorUI(color, domElements.opacitySlider);

  applyCurrentColorToSelectedNodes();
}

function reinitializeColorPositionFinder() {
  if (findColorPositionFn || !domElements.colorCanvas || !domElements.hueSlider || !domElements.opacitySlider) {
    return;
  }

  findColorPositionFn = function(color) {
    return findColorPosition(color, domElements.colorCanvas, domElements.hueSlider, function(color, slider) {
      updateColorUI(color, slider || domElements.opacitySlider);
    });
  };
}

function positionColorPicker(event) {
  if (event) {
    const rect = event.target.getBoundingClientRect();
    colorPickerContainer.style.position = 'absolute';
    colorPickerContainer.style.left = `${rect.left}px`;
    colorPickerContainer.style.top = `${rect.bottom + 10}px`;
    colorPickerContainer.style.transform = 'none';
  } else {
    colorPickerContainer.style.position = 'fixed';
    colorPickerContainer.style.left = '50%';
    colorPickerContainer.style.top = '50%';
    colorPickerContainer.style.transform = 'translate(-50%, -50%)';
  }
}

function adjustPresetsGridWidth() {
  if (!domElements.presetsGrid || !domElements.colorArea) return;

  const colorAreaRect = domElements.colorArea.getBoundingClientRect();
  domElements.presetsGrid.style.width = `${colorAreaRect.width}px`;
}

async function loadColorPresets() {
  if (!isColorPickerVisible || !colorPickerContainer) return;

  try {
    const presets = await getColorPresets();
    if (!isColorPickerVisible || !colorPickerContainer) return;

    if (!domElements.presetsGrid) return;

    const moonPreset = presets.find(preset => preset.name === PRESET_NAME);

    if (moonPreset) {
      currentPresetName = PRESET_NAME;
      await updatePresetsGrid(domElements.presetsGrid, currentPresetName);
    } else if (presets.length > 0) {
      const lastPreset = presets[presets.length - 1];
      currentPresetName = lastPreset.name;
      await updatePresetsGrid(domElements.presetsGrid, currentPresetName);
    } else {
      currentPresetName = null;
      await updatePresetsGrid(domElements.presetsGrid, null);
    }
  } catch (error) {
    console.error("Failed to load presets:", error);
  }
}

function updateColorCanvasDimensions() {
  if (!domElements.colorCanvas || !domElements.colorArea) return;

  const rect = domElements.colorArea.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  domElements.colorCanvas.width = rect.width;
  domElements.colorCanvas.height = rect.height;

  if (domElements.hueSlider) {
    updateColorCanvas(domElements.colorCanvas, domElements.hueSlider);
  }
}

function updateColorIndicatorPosition() {
  if (!domElements.colorIndicator || !findColorPositionFn) return;

  if (!domElements.colorIndicator.style.left || !domElements.colorIndicator.style.top) {
    const { x, y } = findColorPositionFn(getCurrentColor().color);
    domElements.colorIndicator.style.left = `${x}px`;
    domElements.colorIndicator.style.top = `${y}px`;
  }
}

function showColorPicker(event) {
  if (colorPickerContainer.style.display === 'none') {
    reinitializeDragHandlers();
    reinitializeCanvasHandlers();
    reinitializeColorPositionFinder();
  }

  colorPickerContainer.style.display = 'block';

  positionColorPicker(event);
  adjustPresetsGridWidth();
  loadColorPresets();
  updateColorCanvasDimensions();
  updateColorPickerFromSelectedNode();
  updateColorIndicatorPosition();
  setupSelectionChangeListener({
    get isColorPickerVisible() { return isColorPickerVisible; },
    colorPickerContainer,
    updateColorPickerFromSelectedNode
  });
}

export function toggleColorPicker(event) {
  if (!colorPickerContainer) {
    createColorPicker();
  }

  isColorPickerVisible = !isColorPickerVisible;

  if (isColorPickerVisible) {
    showColorPicker(event);
  } else {
    hideColorPicker();
  }
}

export function hideColorPicker() {
  if (colorPickerContainer) {
    colorPickerContainer.style.display = 'none';
    isColorPickerVisible = false;

    if (domElements.opacitySlider && domElements.opacitySlider.valueTimeout) {
      clearTimeout(domElements.opacitySlider.valueTimeout);
      domElements.opacitySlider.valueTimeout = null;
    }

    while (activeContextMenus.length > 0) {
      const { menu } = activeContextMenus.pop();
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    }

    removeSelectionChangeListener();

  }
}

export function destroyColorPicker() {
  hideColorPicker();

  if (colorPickerContainer && document.body.contains(colorPickerContainer)) {
    document.body.removeChild(colorPickerContainer);
  }

  eventListenerManager.removeAllListeners();

  colorPickerContainer = null;
  isColorPickerVisible = false;
  findColorPositionFn = null;
  handleDocumentMouseMove = null;
  handleDocumentMouseUp = null;
  handleCanvasMouseMove = null;
  handleCanvasMouseUp = null;

  setCurrentColor('#FF0000', 100);
  currentPresetName = null;

  for (const key in domElements) {
    if (Object.prototype.hasOwnProperty.call(domElements, key)) {
      domElements[key] = null;
    }
  }

  activeContextMenus = [];
}

function updateColorPickerFromSelectedNode() {
  const config = window.alignerPlugin?.getConfig() || DEFAULT_COLOR_CONFIG;
  const result = getColorFromSelectedNode(config);

  if (!result) return;

  const { color, opacity } = result;
  setCurrentColor(color, opacity);

  if (domElements.hexInput) {
    updateHexInput(color, domElements.hexInput);

    if (domElements.opacitySlider && domElements.opacityValue) {
      domElements.opacitySlider.value = opacity;
      domElements.opacityValue.textContent = `${opacity}%`;

      updateColorUI(color, domElements.opacitySlider);
    }

    const rgb = hexToRgb(color);

    if (domElements.rInput && domElements.gInput && domElements.bInput) {
      domElements.rInput.value = rgb.r;
      domElements.gInput.value = rgb.g;
      domElements.bInput.value = rgb.b;
    }

    if (domElements.colorCanvas && domElements.colorIndicator && domElements.hueSlider && findColorPositionFn) {
      const { x, y } = findColorPositionFn(color);
      domElements.colorIndicator.style.left = `${x}px`;
      domElements.colorIndicator.style.top = `${y}px`;
    }
  }
}