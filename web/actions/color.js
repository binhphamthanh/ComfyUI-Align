import state from "../states/state.js";
import { getComfyUIAppInstance, getSelectedNodes, getSelectedGroups } from "./selection.js";

export function openNativeColorPicker(dom) {
  const colorBar = dom.getColorBar();
  if (colorBar) {
    colorBar.openNativeColorPicker(
      getComfyUIAppInstance,
      getSelectedNodes,
      getSelectedGroups,
      dom
    );
    state.colorPickerUsed = true;
    dom.hideUI();
  }
} 