import state from "../states/state.js";
import { CONFIG } from "../states/state.js";
import { toggle } from "../actions/actions.js";

export function handleKeyDown(e) {
  const shortcut = CONFIG.shortcut.toLowerCase();
  const parts = shortcut.split("+");

  // Debug logging
  if (CONFIG.debug) {
    console.log(`Key pressed: ${e.key}, Alt: ${e.altKey}, Ctrl: ${e.ctrlKey}, Shift: ${e.shiftKey}`);
    console.log(`Current shortcut: ${shortcut}`);
  }

  // Don't prevent all Alt key presses, only within our shortcut
  // Removed the aggressive prevention and early return

  if (parts.length === 1) {
    if (e.key.toLowerCase() === parts[0]) {
      e.preventDefault();
      if (CONFIG.debug) console.log(`Triggering toggle from single key shortcut: ${parts[0]}`);
      toggle(state.dom);
    }
    return;
  }

  if (parts.length === 2) {
    const [modifier, key] = parts;

    let modifierPressed = false;
    if (modifier === "alt" && e.altKey) {
      modifierPressed = true;
      // Only prevent default if this is our shortcut combination
      if (e.key.toLowerCase() === key) {
        e.preventDefault();
        if (CONFIG.debug) console.log(`Preventing default for Alt+${key}`);
      }
    }
    if (modifier === "ctrl" && (e.ctrlKey || e.metaKey)) modifierPressed = true;
    if (modifier === "shift" && e.shiftKey) modifierPressed = true;

    if (modifierPressed && e.key.toLowerCase() === key) {
      e.preventDefault();
      if (CONFIG.debug) console.log(`Triggering toggle from combination: ${modifier}+${key}`);
      toggle(state.dom);
      return false;
    }
  }
}

export function handleShiftKey(e) {
  if (e.key === "Shift") {
    state.shiftKeyPressed = e.type === "keydown";

    if (CONFIG.debug && e.type === "keydown") {
      console.log("Shift key pressed");
    }

    if (e.type === "keyup" && state.visible && !state.shiftKeyPressed) {
      if (CONFIG.debug) console.log("Hiding UI on Shift key release");
      state.dom.hideUI();
    }
  }
}

export function handleAltKey(e) {
  if (e.key === "Alt") {
    // Only prevent default if Alt is part of our shortcut
    if (CONFIG.shortcut.toLowerCase().includes("alt")) {
      e.preventDefault();
      if (CONFIG.debug) console.log(`Preventing default for Alt key (${e.type})`);
    }
    state.altKeyPressed = e.type === "keydown";
    
    if (CONFIG.debug) {
      console.log(`Alt key ${e.type}, state.altKeyPressed: ${state.altKeyPressed}`);
    }
  }
}
