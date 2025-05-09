import { state } from '../core/state.js';
import { getComfyUIAppInstance, getSelectedNodes, getSelectedGroups } from '../utils/node-utils.js';
import { getDeeperColor } from '../utils/general-utils.js';
import { showNotification } from '../ui/notifications.js';

export function setNodesColor(colorType) {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      return { success: false, message: "Unable to get ComfyUI application instance" };
    }

    const selectedNodes = getSelectedNodes(appInstance);
    const selectedGroups = getSelectedGroups(appInstance);

    if (selectedNodes.length === 0 && selectedGroups.length === 0) {
      return { success: false, message: "Please select nodes or groups to apply color" };
    }

    let color;
    const colorName = colorType.replace('Circle', '').toLowerCase();

    const config = window.alignerPlugin.getConfig();
    const colorKey = config.colorMap[colorName];

    if (!colorKey || !config.colors[colorKey]) {
      return { success: false, message: `Unknown color type: ${colorType}` };
    }

    if (colorName === 'clear') {
      selectedNodes.forEach(node => {
        delete node.color;
        delete node.bgcolor;
      });

      selectedGroups.forEach(group => {
        delete group.color;
      });
    } else {
      color = config.colors[colorKey];

      selectedNodes.forEach(node => {
        if (config.applyToHeader && config.applyToPanel) {
          node.color = getDeeperColor(color);
          node.bgcolor = color;
        } else {
          if (config.applyToHeader) {
            node.color = color;
          }
          if (config.applyToPanel) {
            node.bgcolor = color;
          }
        }
      });

      selectedGroups.forEach(group => {
        group.color = color;
      });
    }

    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error("Setting color failed:", error);
    return { success: false, message: `Operation failed: ${error.message}` };
  }
}

export function openNativeColorPicker() {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      showNotification("Unable to get ComfyUI application instance");
      return { success: false, message: "Unable to get ComfyUI application instance" };
    }

    state.colorPickerUsed = true;
    hideUI();
    setTimeout(async () => {
      const colorPickerModule = await import('../ui/color-picker.js');
      colorPickerModule.toggleColorPicker();
    }, 100);

    return { success: true };
  } catch (error) {
    console.error("Opening color picker failed:", error);
    return { success: false, message: `Operation failed: ${error.message}` };
  }
}

function hideUI() {
  if (!state.container) return;

  state.container.style.display = 'none';
  state.container.style.pointerEvents = 'none';
  state.visible = false;
}
