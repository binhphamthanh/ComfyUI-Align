import state, { CONFIG } from "../states/state.js";
import { ColorBar } from "../ui/colorBar.js";
import { CrossPanel } from "../ui/crossPanel.js";
import { 
  debounce, 
  throttle, 
  getDeeperColor, 
  createSVG, 
  calculatePosition, 
  keepInViewport, 
  calculateUIBoundingBox 
} from "../utils/utils.js";

export class DOM {
  constructor() {
    this.colorBar = null;
    this.crossPanel = null;
  }

  createElement(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }

  createContainer() {
    if (!state.container) {
      state.container = this.createElement('div', 'comfy-align-container');
      document.body.appendChild(state.container);
      
      const utils = {
        createSVG: (id, size) => createSVG(id, state.ICONS || {}, [], size),
        calculatePosition: (index, x, y) => {
          const { iconSize, spacing } = CONFIG;
          return calculatePosition(index, iconSize, spacing);
        },
        keepInViewport,
        calculateUIBoundingBox: (centerX, centerY) => {
          const { iconSize, spacing } = CONFIG;
          return calculateUIBoundingBox(centerX, centerY, iconSize, spacing);
        },
        debounce,
        throttle,
        getDeeperColor,
        dom: this
      };
      
      this.colorBar = new ColorBar(CONFIG, utils);
      this.colorBar.createContainer(state.container);
      
      if (state.handleAlignActionCallback) {
        this.colorBar.setHandleActionCallback(state.handleAlignActionCallback);
      }
      
      this.crossPanel = new CrossPanel(
        CONFIG, 
        utils, 
        state.container, 
        state.handleAlignActionCallback
      );
      
      const crossIcons = this.crossPanel.createIcons();
      Object.assign(state.icons, crossIcons);
      
      if (state.ICONS) {
        this.colorBar.createColorCircles(state.ICONS, this);
      }
    }
  }

  initializeOnce() {
    if (state.initialized) return;
    
    try {
      this.injectStyles();
      this.createContainer();
      
      if (state.container) {
        state.container.style.display = 'none';
      }
      
      state.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Align plugin:", error);
      this.destroy();
    }
  }

  showUI() {
    if (!state.container) return;
    
    state.container.style.display = 'block';
    state.visible = true;
    
    if (state.updateIconPositions) {
      state.updateIconPositions();
    }
    
    setTimeout(() => {
      if (state.container) {
        state.container.style.pointerEvents = 'auto';
      }
    }, 100);
  }
  
  hideUI() {
    if (!state.container) return;
    
    state.container.style.display = 'none';
    state.container.style.pointerEvents = 'none';
    state.visible = false;
  }
  
  toggleVisibility() {
    if (state.visible) {
      this.hideUI();
    } else {
      this.showUI();
    }
  }

  injectStyles() {
    if (state.styleElement) return;

    state.styleElement = document.createElement('style');
    state.styleElement.textContent = `
      .comfy-align-container {
        position: fixed;
        z-index: 99999;
        pointer-events: none;
        display: none;
        filter: none;
      }
    `;
    document.head.appendChild(state.styleElement);
  }

  showNotification(message, isError = true) {
    if (this.crossPanel) {
      this.crossPanel.showNotification(message, isError);
    }
  }

  destroy() {
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
    
    if (this.colorBar) {
      this.colorBar.removeStyles();
    }
    
    if (this.crossPanel) {
      this.crossPanel.removeStyles();
    }

    state.visible = false;
    state.icons = {};
    state.initialized = false;
  }

  setHandleActionCallback(callback) {
    state.handleAlignActionCallback = callback;
    
    if (this.colorBar) {
      this.colorBar.setHandleActionCallback(callback);
    }
    
    if (this.crossPanel && state.container) {
      this.crossPanel.removeStyles();
      
      const utils = {
        createSVG: (id, size) => createSVG(id, state.ICONS || {}, [], size),
        calculatePosition: (index, x, y) => {
          const { iconSize, spacing } = CONFIG;
          return calculatePosition(index, iconSize, spacing);
        },
        keepInViewport,
        calculateUIBoundingBox: (centerX, centerY) => {
          const { iconSize, spacing } = CONFIG;
          return calculateUIBoundingBox(centerX, centerY, iconSize, spacing);
        },
        debounce,
        throttle,
        getDeeperColor
      };
      
      this.crossPanel = new CrossPanel(
        CONFIG,
        utils,
        state.container,
        callback
      );
      const crossIcons = this.crossPanel.createIcons();
      Object.assign(state.icons, crossIcons);
    }
  }

  getColorBar() {
    return this.colorBar;
  }

  getCrossPanel() {
    return this.crossPanel;
  }
} 