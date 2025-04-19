import state from "../states/state.js";

export function trackMousePosition(e) {
  state.lastX = e.clientX;
  state.lastY = e.clientY;
}

export function handleOutsideClick(e) {
  if (state.visible && state.container && !state.container.contains(e.target) && !state.shiftKeyPressed) {
    state.dom.hideUI();
  }
} 