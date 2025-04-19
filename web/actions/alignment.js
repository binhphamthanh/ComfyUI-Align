import state from "../states/state.js";
import { openNativeColorPicker } from "./color.js";
import { getComfyUIAppInstance, getSelectedNodes, getSelectedGroups } from "./selection.js";

export function handleAlignAction(action, dom) {
  let result;
  const colorBar = dom.getColorBar();
  const crossPanel = dom.getCrossPanel();

  if (action.includes('Circle')) {
    if (action === 'moonCircle') {
      openNativeColorPicker(dom);
    } else if (colorBar) {
      result = colorBar.setNodesColor(
        action,
        getComfyUIAppInstance,
        getSelectedNodes,
        getSelectedGroups
      );
    }
  } else if (crossPanel) {
    switch(action) {
      case 'left':
        result = crossPanel.alignNodesToLeft(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'right':
        result = crossPanel.alignNodesToRight(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'top':
        result = crossPanel.alignNodesToTop(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'bottom':
        result = crossPanel.alignNodesToBottom(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'horizontalCenter':
        result = crossPanel.alignNodesToHorizontalCenter(
          getComfyUIAppInstance,
          getSelectedNodes,
          state.altKeyPressed
        );
        break;
      case 'verticalCenter':
        result = crossPanel.alignNodesToVerticalCenter(
          getComfyUIAppInstance,
          getSelectedNodes,
          state.altKeyPressed
        );
        break;
      case 'leftStretch':
        result = crossPanel.stretchNodesToLeft(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'rightStretch':
        result = crossPanel.stretchNodesToRight(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'topStretch':
        result = crossPanel.stretchNodesToTop(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'bottomStretch':
        result = crossPanel.stretchNodesToBottom(
          getComfyUIAppInstance,
          getSelectedNodes
        );
        break;
      case 'horizontalStretch':
        result = crossPanel.stretchNodesHorizontally(
          getComfyUIAppInstance,
          getSelectedNodes,
          state.altKeyPressed
        );
        break;
      case 'verticalStretch':
        result = crossPanel.stretchNodesVertically(
          getComfyUIAppInstance,
          getSelectedNodes,
          state.altKeyPressed
        );
        break;
      default:
        return;
    }
  }
  
  if (result && !result.success) {
    dom.showNotification(result.message, true);
  }

  if (!state.shiftKeyPressed) {
    dom.hideUI();
  }
} 