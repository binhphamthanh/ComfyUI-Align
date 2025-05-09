import { getComfyUIAppInstance } from '../utils/node-utils.js';

let selectionChangeListener = null;
let originalSelectionChangeHandler = null;
let wrappedSelectionChangeHandler = null;

export function setupSelectionChangeListener(options) {
  if (selectionChangeListener) {
    removeSelectionChangeListener();
  }

  const appInstance = getComfyUIAppInstance();
  if (!appInstance || !appInstance.canvas) return;

  const isColorPickerVisibleIsGetter = options.isColorPickerVisible !== undefined && typeof Object.getOwnPropertyDescriptor(options, 'isColorPickerVisible')?.get === 'function';

  selectionChangeListener = () => {
    const isVisible = isColorPickerVisibleIsGetter ? options.isColorPickerVisible : options.isColorPickerVisible;

    if (isVisible && options.colorPickerContainer) {
      options.updateColorPickerFromSelectedNode();
    }
  };

  if (appInstance.canvas.onSelectionChange) {
    originalSelectionChangeHandler = appInstance.canvas.onSelectionChange;

    wrappedSelectionChangeHandler = function(...args) {
      originalSelectionChangeHandler.apply(this, args);

      if (typeof selectionChangeListener === 'function') {
        selectionChangeListener();
      }
    };

    appInstance.canvas.onSelectionChange = wrappedSelectionChangeHandler;
  } else {
    appInstance.canvas.onSelectionChange = selectionChangeListener;
  }
}

export function removeSelectionChangeListener() {
  if (!selectionChangeListener) return;

  const appInstance = getComfyUIAppInstance();
  if (!appInstance || !appInstance.canvas) return;

  if (appInstance.canvas.onSelectionChange === wrappedSelectionChangeHandler) {
    appInstance.canvas.onSelectionChange = originalSelectionChangeHandler;
  } else if (appInstance.canvas.onSelectionChange === selectionChangeListener) {
    appInstance.canvas.onSelectionChange = null;
  }

  selectionChangeListener = null;
  wrappedSelectionChangeHandler = null;
  originalSelectionChangeHandler = null;
}