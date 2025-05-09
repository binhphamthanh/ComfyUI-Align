import { AlignerPlugin } from './core/plugin.js';
import { updateIconPositions } from './ui/dom-utils.js';
import { throttle } from './utils/general-utils.js';
import { THROTTLE_MS } from './core/state.js';
import { waitForApp } from './utils/comfy-app.js';

(async function() {
  try {
    const originalConsoleWarn = console.warn;
    console.warn = function(message, ...args) {
      if (typeof message === 'string' && message.includes('Unsupported color format in color palette')) {
        return;
      }
      originalConsoleWarn.apply(console, [message, ...args]);
    };

    await waitForApp();

    window.alignerPlugin = new AlignerPlugin();
    await window.alignerPlugin.initialize();

    const throttledUpdateIconPositions = throttle(updateIconPositions, THROTTLE_MS);
    window.updateIconPositions = throttledUpdateIconPositions;

    console.log("ComfyUI-Align plugin initialized");
  } catch (error) {
    console.error("Failed to initialize ComfyUI-Align plugin:", error);
  }
})();