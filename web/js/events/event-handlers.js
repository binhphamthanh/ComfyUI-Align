import { state, THROTTLE_MS } from '../core/state.js';
import { throttle } from '../utils/general-utils.js';
import * as domUtils from '../ui/dom-utils.js';
import { setupMenuInteractions } from '../ui/menu.js';
import { handleAlignAction } from '../actions/index.js';

let keydownHandler;
let keyupHandler;
let mousemoveHandler;

let shortcutKeyPressed = false;
let hoveredIconId = null;

const KEY_MAPPING = {
  '~': '`'
};

export function setupEventListeners() {
  setupKeyboardEvents();
  setupMouseEvents();
  setupMenuInteractions();
}

function setupKeyboardEvents() {
  keydownHandler = handleKeyDown;
  keyupHandler = handleKeyUp;

  document.addEventListener('keydown', keydownHandler);
  document.addEventListener('keyup', keyupHandler);
}

function setupMouseEvents() {
  mousemoveHandler = throttle(trackMousePosition, THROTTLE_MS);
  document.addEventListener('mousemove', mousemoveHandler);
}

export function removeEventListeners() {
  removeEventListener('keydown', keydownHandler, handler => keydownHandler = handler);
  removeEventListener('keyup', keyupHandler, handler => keyupHandler = handler);
  removeEventListener('mousemove', mousemoveHandler, handler => mousemoveHandler = handler);
}

function removeEventListener(eventType, handler, setHandler) {
  if (handler) {
    document.removeEventListener(eventType, handler);
    setHandler(null);
  }
}

function trackMousePosition(e) {
  if (!state.positionLocked) {
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  }
}

function handleKeyDown(e) {
  const config = window.alignerPlugin.getConfig();
  const shortcut = config.shortcut.toLowerCase();
  const parts = shortcut.split('+');

  updateModifierState(e.key, true);

  if (!isShortcutMatch(e, parts)) {
    return;
  }

  e.preventDefault();

  if (config.shortcutHoldMode) {
    activateHoldMode();
  } else {
    activateToggleMode();
  }
}

function activateHoldMode() {
  shortcutKeyPressed = true;
  state.visible = true;
  domUtils.showUI();
  state.positionLocked = true;
}

function activateToggleMode() {
  window.alignerPlugin.toggle();
  if (state.visible) {
    state.positionLocked = true;
  }
}

function updateModifierState(key, isKeyDown) {
  if (key === 'Shift') {
    state.shiftKeyPressed = isKeyDown;
  } else if (key === 'Alt') {
    state.altKeyPressed = isKeyDown;
  }
}

function isShortcutMatch(e, parts) {
  if (parts.length === 1) {
    const keyToCheck = KEY_MAPPING[parts[0].toLowerCase()] || parts[0].toLowerCase();
    return e.key.toLowerCase() === keyToCheck;
  }

  if (parts.length === 2) {
    const [modifier, key] = parts;
    const mappedKey = KEY_MAPPING[key.toLowerCase()] || key.toLowerCase();

    const modifierPressed =
      (modifier === 'alt' && e.altKey) ||
      (modifier === 'ctrl' && (e.ctrlKey || e.metaKey)) ||
      (modifier === 'shift' && e.shiftKey);

    return modifierPressed && e.key.toLowerCase() === mappedKey;
  }

  return false;
}

function handleKeyUp(e) {
  const config = window.alignerPlugin.getConfig();
  const shortcut = config.shortcut.toLowerCase();
  const parts = shortcut.split('+');

  updateModifierState(e.key, false);

  if (!config.shortcutHoldMode || !shortcutKeyPressed) {
    return;
  }

  const keyMatches = isShortcutKeyMatch(e.key, parts);
  if (!keyMatches) {
    return;
  }

  shortcutKeyPressed = false;

  processHoveredIcon();

  if (shouldHideUI()) {
    hideUIAndResetState();
  }
}

function processHoveredIcon() {
  if (hoveredIconId) {
    handleAlignAction(hoveredIconId);
    hoveredIconId = null;
  }
}

function shouldHideUI() {
  return !state.shiftKeyPressed || !hoveredIconId;
}

function isShortcutKeyMatch(key, parts) {
  const keyToMatch = parts.length === 1
    ? parts[0].toLowerCase()
    : parts[1].toLowerCase();

  const mappedKey = KEY_MAPPING[keyToMatch] || keyToMatch;
  return key.toLowerCase() === mappedKey;
}

function hideUIAndResetState() {
  state.visible = false;
  domUtils.hideUI();
  state.positionLocked = false;
}

export function setHoveredIconId(id) {
  hoveredIconId = id;
}

export function isShortcutKeyPressed() {
  return shortcutKeyPressed;
}
