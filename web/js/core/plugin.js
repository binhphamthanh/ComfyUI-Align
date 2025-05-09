import { app } from "../../../../scripts/app.js";
import { validateConfig } from '../config/config-validator.js';
import { DEFAULT_CONFIG } from '../config/default-config.js';
import { state } from './state.js';
import * as domUtils from '../ui/dom-utils.js';
import * as events from '../events/event-handlers.js';

export class AlignerPlugin {
  constructor() {
    this.CONFIG = validateConfig({...DEFAULT_CONFIG});
    this.registerSettings();
  }

  async initialize() {
    domUtils.initializeOnce();
    events.setupEventListeners();

    try {
      const { loadPresets } = await import('../utils/color-preset-manager.js');
      await loadPresets();
    } catch (error) {
      console.error("Failed to load color presets:", error);
    }
  }

  registerSettings() {
    app.registerExtension({
      name: "ComfyUI-Align",
      settings: [
        {
          id: "Align.Spacing.horizontal",
          name: "Node Horizontal Spacing",
          type: "slider",
          defaultValue: DEFAULT_CONFIG.horizontalSpacing,
          attrs: {
            min: 0,
            max: 200,
            step: 1
          },
          tooltip: "Horizontal spacing between nodes when aligning (in pixels)",
          category: ["Align", "Spacing", "Horizontal"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().horizontalSpacing = value;
            }
          }
        },
        {
          id: "Align.Spacing.vertical",
          name: "Node Vertical Spacing",
          type: "slider",
          defaultValue: DEFAULT_CONFIG.verticalSpacing,
          attrs: {
            min: 0,
            max: 200,
            step: 1
          },
          tooltip: "Vertical spacing between nodes when aligning (in pixels)",
          category: ["Align", "Spacing", "Vertical"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().verticalSpacing = value;
            }
          }
        },

        {
          id: "Align.Spacing.groupHorizontal",
          name: "Group Horizontal Spacing",
          type: "slider",
          defaultValue: DEFAULT_CONFIG.groupHorizontalSpacing,
          attrs: {
            min: 0,
            max: 200,
            step: 1
          },
          tooltip: "Horizontal spacing between nodes when aligning (in pixels)",
          category: ["Align", "Spacing", "Grouphorizontal"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().groupHorizontalSpacing = value;
            }
          }
        },

        {
          id: "Align.Spacing.groupVertical",
          name: "Group Vertical Spacing",
          type: "slider",
          defaultValue: DEFAULT_CONFIG.groupVerticalSpacing,
          attrs: {
            min: 0,
            max: 200,
            step: 1
          },
          tooltip: "Vertical spacing between nodes when aligning (in pixels)",
          category: ["Align", "Spacing", "Groupvertical"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().groupVerticalSpacing = value;
            }
          }
        },

        {
          id: "Align.Shortcut.Key",
          name: "Shortcut",
          type: "text",
          defaultValue: DEFAULT_CONFIG.shortcut,
          tooltip: "Shortcut to open the alignment tool (e.g. 'alt+a', 'shift+s', etc.)",
          category: ["Align", "Shortcut", "Key"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().shortcut = value;
            }
          }
        },
        {
          id: "Align.Shortcut.Mode",
          name: "Hold Shortcut Mode",
          type: "boolean",
          defaultValue: DEFAULT_CONFIG.shortcutHoldMode,
          tooltip: "When enabled, hold the shortcut key to show the panel, hover over an icon, and release to execute the action",
          category: ["Align", "Shortcut", "Mode"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().shortcutHoldMode = value;
            }
          }
        },
        {
          id: "Align.Color.applyToPanel",
          name: "Apply color to node panel (background)",
          type: "boolean",
          defaultValue: DEFAULT_CONFIG.applyToPanel,
          tooltip: "When enabled, colors will be applied to the node's panel background",
          category: ["Align", "Color Application", "Panel"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().applyToPanel = value;
            }
          }
        },
        {
          id: "Align.Color.applyToHeader",
          name: "Apply color to node header",
          type: "boolean",
          defaultValue: DEFAULT_CONFIG.applyToHeader,
          tooltip: "When enabled, colors will be applied to the node's header",
          category: ["Align", "Color Application", "Header"],
          onChange: (value) => {
            if (window.alignerPlugin) {
              window.alignerPlugin.getConfig().applyToHeader = value;
            }
          }
        }
      ],
      async setup() {
        const horizontalSetting = app.extensionManager.setting.get("Align.Spacing.horizontal");
        if (horizontalSetting === undefined) {
          await app.extensionManager.setting.set("Align.Spacing.horizontal", DEFAULT_CONFIG.horizontalSpacing);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().horizontalSpacing = horizontalSetting;
        }

        const verticalSetting = app.extensionManager.setting.get("Align.Spacing.vertical");
        if (verticalSetting === undefined) {
          await app.extensionManager.setting.set("Align.Spacing.vertical", DEFAULT_CONFIG.verticalSpacing);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().verticalSpacing = verticalSetting;
        }

        const groupHorizontalSetting = app.extensionManager.setting.get("Align.Spacing.groupHorizontal");
        if (groupHorizontalSetting === undefined) {
          await app.extensionManager.setting.set("Align.Spacing.groupHorizontal", DEFAULT_CONFIG.groupHorizontalSpacing);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().groupHorizontalSpacing = groupHorizontalSetting;
        }

        const groupVerticalSetting = app.extensionManager.setting.get("Align.Spacing.groupVertical");
        if (groupVerticalSetting === undefined) {
          await app.extensionManager.setting.set("Align.Spacing.groupVertical", DEFAULT_CONFIG.groupVerticalSpacing);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().groupVerticalSpacing = groupVerticalSetting;
        }

        const panelSetting = app.extensionManager.setting.get("Align.Color.applyToPanel");
        if (panelSetting === undefined) {
          await app.extensionManager.setting.set("Align.Color.applyToPanel", DEFAULT_CONFIG.applyToPanel);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().applyToPanel = panelSetting;
        }

        const headerSetting = app.extensionManager.setting.get("Align.Color.applyToHeader");
        if (headerSetting === undefined) {
          await app.extensionManager.setting.set("Align.Color.applyToHeader", DEFAULT_CONFIG.applyToHeader);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().applyToHeader = headerSetting;
        }

        const shortcutSetting = app.extensionManager.setting.get("Align.Shortcut.Key");
        if (shortcutSetting === undefined) {
          await app.extensionManager.setting.set("Align.Shortcut.Key", DEFAULT_CONFIG.shortcut);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().shortcut = shortcutSetting;
        }

        const shortcutHoldModeSetting = app.extensionManager.setting.get("Align.Shortcut.Mode");
        if (shortcutHoldModeSetting === undefined) {
          await app.extensionManager.setting.set("Align.Shortcut.Mode", DEFAULT_CONFIG.shortcutHoldMode);
        } else if (window.alignerPlugin) {
          window.alignerPlugin.getConfig().shortcutHoldMode = shortcutHoldModeSetting;
        }
      }
    });
  }

  toggle() {
    domUtils.initializeOnce();

    if (state.colorPickerUsed) {
      state.colorPickerUsed = false;
      state.visible = false;
      state.shiftKeyPressed = false;
      domUtils.showUI();
      state.positionLocked = true;
      return;
    }

    if (state.visible) {
      domUtils.hideUI();
    } else {
      state.shiftKeyPressed = false;
      domUtils.showUI();
      state.positionLocked = true;
    }
  }

  getConfig() {
    return this.CONFIG;
  }

  destroy() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }

    events.removeEventListeners();

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
}
