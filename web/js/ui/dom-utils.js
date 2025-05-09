import { state, ICONS } from '../core/state.js';
import { calculateUIBoundingBox, keepInViewport } from '../utils/general-utils.js';
import { createIcon } from './icons.js';
import { injectStyles } from './styles.js';

export function createElement(tag, className = '', attributes = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

export function createContainer() {
  if (!state.container) {
    state.container = createElement('div', 'aligner-container');
    const colorCirclesContainer = createElement('div', 'color-circles-container');
    state.container.appendChild(colorCirclesContainer);

    document.body.appendChild(state.container);
  }
}

export function initializeOnce() {
  if (state.initialized) return;

  try {
    injectStyles();
    createContainer();
    createAllIcons();

    if (state.container) {
      state.container.style.display = 'none';
    }

    state.initialized = true;
  } catch (error) {
    console.error("Failed to initialize Align plugin:", error);
    destroy();
  }
}

export function showUI() {
  if (!state.container) return;

  state.container.style.display = 'block';
  state.visible = true;

  updateIconPositions();

  setTimeout(() => {
    if (state.container) {
      state.container.style.pointerEvents = 'auto';
    }
  }, 100);
}

export function hideUI() {
  if (!state.container) return;

  state.container.style.display = 'none';
  state.container.style.pointerEvents = 'none';
  state.visible = false;
  state.positionLocked = false;
}

export function toggleVisibility() {
  if (state.visible) {
    hideUI();
  } else {
    showUI();
  }
}

export function createAllIcons() {
  const mainFragment = document.createDocumentFragment();
  const colorCirclesFragment = document.createDocumentFragment();

  ICONS.forEach((iconInfo, index) => {
    const icon = createIcon(iconInfo, index, colorCirclesFragment, null, mainFragment);
    state.icons[iconInfo.id] = icon;
  });

  const colorCirclesContainer = state.container.querySelector('.color-circles-container');
  if (colorCirclesContainer) {
    colorCirclesContainer.appendChild(colorCirclesFragment);
  }

  state.container.appendChild(mainFragment);
}

export function updateIconPositions() {
  const config = window.alignerPlugin.getConfig();
  const { iconSize, spacing } = config;
  const halfSize = iconSize / 2;
  const effectiveSpacing = spacing + halfSize;

  const boundingBox = calculateUIBoundingBox(state.lastX, state.lastY, config);

  const [safeX, safeY] = keepInViewport(
    boundingBox.left,
    boundingBox.top,
    boundingBox.width,
    boundingBox.height + 10
  );

  const centerX = safeX + effectiveSpacing;
  const centerY = safeY + effectiveSpacing;

  Object.entries(state.icons).forEach(([id, icon], index) => {
    if (id.includes('Circle')) {
      return;
    }

    const relativePos = calculatePosition(index, 0, 0, config);
    if (relativePos) {
      const [relX, relY] = relativePos;
      icon.style.transform = `translate(${centerX + relX}px, ${centerY + relY}px)`;
    }
  });

  const colorCirclesContainer = state.container.querySelector('.color-circles-container');
  if (colorCirclesContainer) {
    const x = centerX - colorCirclesContainer.offsetWidth / 2;
    const y = centerY + config.spacing + config.iconSize / 2 + 15;

    colorCirclesContainer.style.transform = `translate(${x}px, ${y}px)`;
  }
}

function calculatePosition(index, _, __, config) {
  const { iconSize, spacing } = config;
  const halfSize = iconSize / 2;
  const effectiveSpacing = spacing + halfSize;

  if (index >= 12) {
    return null;
  }

  const positions = [
    [-effectiveSpacing, -halfSize - iconSize - 5],
    [-effectiveSpacing, -halfSize],
    [-effectiveSpacing, halfSize + 5],
    [-halfSize - iconSize - 5, -effectiveSpacing],
    [-halfSize, -effectiveSpacing],
    [halfSize + 5, -effectiveSpacing],
    [effectiveSpacing - iconSize, -halfSize - iconSize - 5],
    [effectiveSpacing - iconSize, -halfSize],
    [effectiveSpacing - iconSize, halfSize + 5],
    [-halfSize - iconSize - 5, effectiveSpacing - iconSize],
    [-halfSize, effectiveSpacing - iconSize],
    [halfSize + 5, effectiveSpacing - iconSize],
  ];

  return positions[index] || [0, 0];
}

export function showConfirmDialog(message, onConfirm, onCancel) {
  let dialog = document.querySelector('.aligner-custom-dialog');
  if (dialog) {
    document.body.removeChild(dialog);
  }

  dialog = createElement('div', 'aligner-custom-dialog');

  const messageEl = createElement('div', 'aligner-dialog-message');
  messageEl.textContent = message;
  dialog.appendChild(messageEl);

  const buttonsContainer = createElement('div', 'aligner-dialog-buttons');

  const cancelButton = createElement('button', 'aligner-dialog-button');
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => {
    dialog.classList.remove('visible');
    setTimeout(() => {
      document.body.removeChild(dialog);
      if (typeof onCancel === 'function') {
        onCancel();
      }
    }, 200);
  });
  buttonsContainer.appendChild(cancelButton);

  const confirmButton = createElement('button', 'aligner-dialog-button confirm');
  confirmButton.textContent = 'OK';
  confirmButton.addEventListener('click', () => {
    dialog.classList.remove('visible');
    setTimeout(() => {
      document.body.removeChild(dialog);
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    }, 200);
  });
  buttonsContainer.appendChild(confirmButton);

  dialog.appendChild(buttonsContainer);
  document.body.appendChild(dialog);

  setTimeout(() => {
    dialog.classList.add('visible');
  }, 10);

  return dialog;
}

export function destroy() {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  if (state.container) {
    document.body.removeChild(state.container);
    state.container = null;
  }

  if (state.styleElement) {
    document.head.removeChild(state.styleElement);
    state.styleElement = null;
  }

  state.visible = false;
  state.icons = {};
  state.initialized = false;
}
