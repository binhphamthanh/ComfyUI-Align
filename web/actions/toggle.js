import state from "../states/state.js";

export function toggle(dom) {
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
    dom.showUI();
    return;
  }

  if (state.visible) {
    dom.hideUI();
  } else {
    state.shiftKeyPressed = false;
    dom.showUI();
  }
}
