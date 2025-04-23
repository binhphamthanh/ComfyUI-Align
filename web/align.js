import { app } from "../../../scripts/app.js";
import { ICONS } from "./assets/icons.js";
import state, { CONFIG } from "./states/state.js";
import { throttle } from "./utils/utils.js";
import { DOM } from "./components/dom.js";
import { updateIconPositions, handleAlignAction } from "./actions/actions.js";
import { registerEventListeners, removeEventListeners } from "./events/events.js";
import { setupExtension, delayedInitialization } from "./config/config.js";

// Add a debug flag for troubleshooting keyboard shortcuts
CONFIG.debug = false;

const AlignerPlugin = (() => {
  const THROTTLE_FPS = 60;
  const THROTTLE_MS = Math.floor(1000 / THROTTLE_FPS);

  state.ICONS = ICONS;
  const dom = new DOM();

  state.dom = dom;

  dom.setHandleActionCallback(action => handleAlignAction(action, dom));

  const updateIconPositionsWithUtils = () => {
    updateIconPositions({}, dom);
  };
  
  const throttledUpdateIconPositions = throttle(updateIconPositionsWithUtils, THROTTLE_MS);
  state.updateIconPositions = throttledUpdateIconPositions;

  return {
    init() {
      registerEventListeners();
    },
    destroy() {
      removeEventListeners();
      dom.destroy();
      if (state.styleElement) {
        document.head.removeChild(state.styleElement);
        state.styleElement = null;
      }
      state.dom = null;
    },
    CONFIG
  };
})();

app.registerExtension({
  name: "ComfyUI-Align",
  settings: [
    {
      id: "Align.Spacing.horizontalMin",
      name: "Horizontal Spacing",
      type: "slider",
      defaultValue: CONFIG.horizontalMinSpacing,
      attrs: {
        min: 0,
        max: 200,
        step: 1
      },
      tooltip: "Horizontal spacing between nodes when aligning (in pixels)",
      category: ["Align", "Spacing", "Horizontal"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.horizontalMinSpacing = value;
        }
      }
    },
    {
      id: "Align.Spacing.verticalMin",
      name: "Vertical Spacing",
      type: "slider",
      defaultValue: CONFIG.verticalMinSpacing,
      attrs: {
        min: 0,
        max: 200,
        step: 1
      },
      tooltip: "Vertical spacing between nodes when aligning (in pixels)",
      category: ["Align", "Spacing", "Vertical"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.verticalMinSpacing = value;
        }
      }
    },
    {
      id: "Align.Shortcut",
      name: "Shortcut",
      type: "text",
      defaultValue: CONFIG.shortcut,
      tooltip: "Shortcut to open the alignment tool (e.g. 'alt+a', 'shift+s', etc.)",
      category: ["Align", "Shortcut"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.shortcut = value;
        }
      }
    },
    {
      id: "Align.Color.applyToPanel",
      name: "Apply color to node panel (background)",
      type: "boolean",
      defaultValue: CONFIG.applyToPanel,
      tooltip: "When checked, colors will be applied to node panels (background area)",
      category: ["Align", "Color Application", "Panel"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.applyToPanel = value;
        }
      }
    },
    {
      id: "Align.Color.applyToHeader",
      name: "Apply color to node header",
      type: "boolean",
      defaultValue: CONFIG.applyToHeader,
      tooltip: "When checked, colors will be applied to node headers",
      category: ["Align", "Color Application", "Header"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.applyToHeader = value;
        }
      }
    },
    {
      id: "Align.Debug",
      name: "Debug Mode",
      type: "boolean",
      defaultValue: CONFIG.debug,
      tooltip: "Enable debugging for keyboard shortcuts",
      category: ["Align", "Developer"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.debug = value;
        }
      }
    },
  ],
  async setup() {
    await setupExtension(app, AlignerPlugin);
  }
});

delayedInitialization(AlignerPlugin);