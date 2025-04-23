import state from "../states/state.js";
import { CONFIG } from "../states/state.js";

export function toggle(dom) {
  if (CONFIG.debug) {
    console.log("Toggle function called");
    console.log(`Current state - visible: ${state.visible}, alt: ${state.altKeyPressed}, shift: ${state.shiftKeyPressed}`);
  }
  
  dom.initializeOnce();
  if (state.lastX === 0 && state.lastY === 0) {
    const mouseEvent = window.event || {};
    if (mouseEvent.clientX !== undefined && mouseEvent.clientY !== undefined) {
      state.lastX = mouseEvent.clientX;
      state.lastY = mouseEvent.clientY;
    } else {
      state.lastX = window.innerWidth / 2;
      state.lastY = window.innerHeight / 2;
    }
  }

  if (state.colorPickerUsed) {
    state.colorPickerUsed = false;
    state.visible = false;
    state.shiftKeyPressed = false;
    if (CONFIG.debug) console.log("Toggle: Showing UI after color picker usage");
    dom.showUI();
    return;
  }

  if (state.visible) {
    if (CONFIG.debug) console.log("Toggle: Hiding UI");
    dom.hideUI();
  } else {
    state.shiftKeyPressed = false;
    if (CONFIG.debug) console.log("Toggle: Showing UI");
    dom.showUI();
  }
}
