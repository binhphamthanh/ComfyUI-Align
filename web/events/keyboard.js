import state from "../states/state.js";
import { CONFIG } from "../states/state.js";
import { toggle } from "../actions/actions.js";

export function handleKeyDown(e) {
  const shortcut = CONFIG.shortcut.toLowerCase();
  const parts = shortcut.split('+');

  if (parts.length === 1) {
    if (e.key.toLowerCase() === parts[0]) {
      e.preventDefault();
      toggle(state.dom);
    }
    return;
  }

  if (parts.length === 2) {
    const [modifier, key] = parts;

    let modifierPressed = false;
    if (modifier === 'alt' && e.altKey) modifierPressed = true;
    if (modifier === 'ctrl' && (e.ctrlKey || e.metaKey)) modifierPressed = true;
    if (modifier === 'shift' && e.shiftKey) modifierPressed = true;

    if (modifierPressed && e.key.toLowerCase() === key) {
      e.preventDefault();
      toggle(state.dom);
    }
  }
}

export function handleShiftKey(e) {
  if (e.key === 'Shift') {
    state.shiftKeyPressed = e.type === 'keydown';

    if (e.type === 'keyup' && state.visible && !state.shiftKeyPressed) {
      state.dom.hideUI();
    }
  }
}

export function handleAltKey(e) {
  if (e.key === 'Alt') {
    state.altKeyPressed = e.type === 'keydown';
    if (e.type === "keydown"){
      e.preventDefault();
    }
  }
} 