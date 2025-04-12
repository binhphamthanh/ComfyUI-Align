import { app } from "../../../scripts/app.js";
import { SVG_PATHS } from "./svg-paths.js";

// Default configuration for the alignment tool
// Contains settings for appearance, behavior, and layout of the UI
// These values can be overridden by user settings through the ComfyUI settings panel
const DEFAULT_CONFIG = {
  iconSize: 36,             // Size of main alignment icons in pixels
  spacing: 112,             // Spacing between icons
  horizontalMinSpacing: 30, // Minimum horizontal spacing when aligning nodes
  verticalMinSpacing: 25,   // Minimum vertical spacing when aligning nodes
  colors: {
    circle1: '#a93232',     // Red
    circle2: '#79461d',     // Orange
    circle3: '#6e6e1d',     // Yellow
    circle4: '#2b652b',     // Green
    circle5: '#248382',     // Cyan
    circle6: '#246283',     // Blue
    circle7: '#3c3c83',     // Purple
    circle8: '#ffffff',     // White (clear)
    circle9: '#ffd700',     // Gold (rainbow/color picker)
    circle10: '#ff00ff',    // Magenta (bypass)
    icon: 'rgba(198, 198, 198, 0.8)', // Icon color
    bg: 'rgba(12, 12, 12, 0.95)',     // Background color
    hover: 'rgba(255,255,255,0.2)'    // Hover highlight color
  },
  colorMap: {
    // Maps color name identifiers to actual color keys
    'red': 'circle1',
    'orange': 'circle2',
    'yellow': 'circle3',
    'green': 'circle4',
    'cyan': 'circle5',
    'blue': 'circle6',
    'purple': 'circle7',
    'clear': 'circle8',
    'rainbow': 'circle9',
    'bypass': 'circle10'
  },
  transition: 'all 0.2s ease',
  shortcut: 'alt+a',
  applyToHeader: true,
  applyToPanel: false,
  safetyMargin: {
    horizontal: 20,
    vertical: 30
  },
  minNodeSize: {
    width: 100,
    height: 60
  }
};

const AlignerPlugin = (() => {
  // Function to validate configuration and ensure all required properties exist
  const validateConfig = (config) => {
    // Essential configuration properties
    const required = [
      'iconSize', 'spacing', 'horizontalMinSpacing', 'verticalMinSpacing', 
      'colors', 'colorMap', 'transition', 'shortcut'
    ];
    
    // Check for missing properties
    const missing = required.filter(prop => !(prop in config));
    if (missing.length > 0) {
      console.warn(`ComfyUI-Align plugin: Missing required configuration properties: ${missing.join(', ')}`);
      console.warn('Using default values for missing properties');
      
      // Ensure defaults are applied for missing properties
      missing.forEach(prop => {
        if (prop in DEFAULT_CONFIG) {
          config[prop] = DEFAULT_CONFIG[prop];
        }
      });
    }
    
    // Ensure proper nesting
    if (!config.colors) config.colors = {...DEFAULT_CONFIG.colors};
    if (!config.colorMap) config.colorMap = {...DEFAULT_CONFIG.colorMap};
    if (!config.safetyMargin) config.safetyMargin = {...DEFAULT_CONFIG.safetyMargin};
    if (!config.minNodeSize) config.minNodeSize = {...DEFAULT_CONFIG.minNodeSize};
    
    return config;
  };

  // FPS target for throttled functions
  const THROTTLE_FPS = 60;
  const THROTTLE_MS = Math.floor(1000 / THROTTLE_FPS);

  // Initialize configuration with validation
  const CONFIG = validateConfig({...DEFAULT_CONFIG});
  
  // Define node operation modes used in ComfyUI
  const LGraphEventMode = Object.freeze({
    ALWAYS: 0,  // Normal operation mode
    NEVER: 2,   // Muted/disabled mode - node won't execute
    BYPASS: 4   // Bypass mode - inputs are passed directly to outputs
  });

  // Global state object to track UI state and user interactions
  // Contains references to DOM elements, visibility flags, and interaction state
  const state = {
    container: null,       // Main container element for the alignment UI
    visible: false,        // Whether the alignment UI is currently visible
    lastX: 0,              // Last known mouse X position
    lastY: 0,              // Last known mouse Y position
    icons: {},             // References to all icon elements
    styleElement: null,    // Reference to injected CSS style element
    initialized: false,    // Whether the plugin has been initialized
    shiftKeyPressed: false, // Current state of Shift key
    altKeyPressed: false,   // Current state of Alt key
    isUtilsExpanded: false, // Whether the utility icons panel is expanded
    animationFrameId: null  // To track ongoing animations
  };

  const ICONS = [
    { id: 'left', type: 'align' },
    { id: 'horizontalCenter', type: 'align' },
    { id: 'leftStretch', type: 'stretch' },
    { id: 'top', type: 'align' },
    { id: 'verticalCenter', type: 'align' },
    { id: 'topStretch', type: 'stretch' },
    { id: 'right', type: 'align' },
    { id: 'horizontalStretch', type: 'stretch' },
    { id: 'rightStretch', type: 'stretch' },
    { id: 'bottom', type: 'align' },
    { id: 'verticalStretch', type: 'stretch' },
    { id: 'bottomStretch', type: 'stretch' },
    { id: 'redCircle', type: 'color' },
    { id: 'orangeCircle', type: 'color' },
    { id: 'yellowCircle', type: 'color' },
    { id: 'greenCircle', type: 'color' },
    { id: 'cyanCircle', type: 'color' },
    { id: 'blueCircle', type: 'color' },
    { id: 'purpleCircle', type: 'color' },
    { id: 'rainbowCircle', type: 'color' },
    { id: 'clearCircle', type: 'color' },
    { id: 'toggleArrowCircle', type: 'toggle' },
    { id: 'bypassCircle', type: 'bypass' },
    { id: 'muteCircle', type: 'mute' },
    { id: 'pinCircle', type: 'pin' }
  ];

  const utils = {
    // Prevents a function from being called too frequently
    // Only executes the function after a specified delay has passed since its last invocation
    debounce(fn, delay) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    },

    // Limits the rate at which a function can be called
    // Ensures function is called at most once per specified time interval
    throttle(fn, limit) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
          lastCall = now;
          return fn.apply(this, args);
        }
      };
    },

    getDeeperColor(hexColor) {
      if (!hexColor || hexColor.startsWith('linear-gradient') || !hexColor.startsWith('#')) {
        return '#444444';
      }
      
      const hex = hexColor.replace('#', '');
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      r = Math.floor(r * 0.7);
      g = Math.floor(g * 0.7);
      b = Math.floor(b * 0.7);

      const deeperHex = '#' + 
        r.toString(16).padStart(2, '0') + 
        g.toString(16).padStart(2, '0') + 
        b.toString(16).padStart(2, '0');
      
      return deeperHex;
    },

    createSVG(id, size = 20) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.setAttribute('viewBox', '0 0 1024 1024');
      svg.style.position = 'relative';
      svg.style.zIndex = '1';
      
      if (SVG_PATHS[id]) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', SVG_PATHS[id]);
        path.style.fill = CONFIG.colors.icon;
        svg.appendChild(path);
      }
      
      return svg;
    },

    // Calculate the position of icons around a circular UI layout
    // Each index corresponds to a specific position in a 3x4 grid layout
    // Returns relative [x,y] coordinates for positioning the icon
    calculatePosition(index, x, y) {
      const { iconSize, spacing } = CONFIG;
      const halfSize = iconSize / 2;
      const effectiveSpacing = spacing + halfSize;

      if (index >= 12) {
        return null;
      }
      
      // Defines positions for all 12 alignment/stretch icons in a grid layout
      // Format: [x, y] in relative coordinates from the center point
      const positions = [
        [-effectiveSpacing, -halfSize - iconSize - 5],       // Left top
        [-effectiveSpacing, -halfSize],                      // Left middle
        [-effectiveSpacing, halfSize + 5],                   // Left bottom
        [-halfSize - iconSize - 5, -effectiveSpacing],       // Top left
        [-halfSize, -effectiveSpacing],                      // Top middle
        [halfSize + 5, -effectiveSpacing],                   // Top right
        [effectiveSpacing - iconSize, -halfSize - iconSize - 5], // Right top
        [effectiveSpacing - iconSize, -halfSize],            // Right middle
        [effectiveSpacing - iconSize, halfSize + 5],         // Right bottom
        [-halfSize - iconSize - 5, effectiveSpacing - iconSize], // Bottom left
        [-halfSize, effectiveSpacing - iconSize],            // Bottom middle
        [halfSize + 5, effectiveSpacing - iconSize],         // Bottom right
      ];

      return positions[index] || [0, 0];
    },

    keepInViewport(x, y, entireWidth, entireHeight) {
      const margin = 20;
      return [
        Math.max(margin, Math.min(x, window.innerWidth - entireWidth - margin)),
        Math.max(margin, Math.min(y, window.innerHeight - entireHeight - margin))
      ];
    },
    
    // Calculate the dimensions and position of the entire UI panel
    // Takes the center coordinates where the UI should be positioned
    // Returns an object with width, height, and position information
    calculateUIBoundingBox(centerX, centerY) {
      const { iconSize, spacing } = CONFIG;
      const effectiveSpacing = spacing + iconSize / 2;

      const width = effectiveSpacing * 2;
      const height = effectiveSpacing * 2;

      // Add extra height for the color picker panel at the bottom
      const colorPickerHeight = 50;
      const totalHeight = height + colorPickerHeight + 15;

      // Calculate top-left corner from center point
      const left = centerX - effectiveSpacing;
      const top = centerY - effectiveSpacing;
      
      return {
        width,
        height: totalHeight,
        left,
        top
      };
    }
  };

  const dom = {
    createElement(tag, className = '', attributes = {}) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      
      return element;
    },

    createContainer() {
      if (!state.container) {
        state.container = this.createElement('div', 'aligner-container');
        const colorCirclesContainer = this.createElement('div', 'color-circles-container');
        const utilCirclesContainer = this.createElement('div', 'util-circles-container');
        state.container.appendChild(colorCirclesContainer);
        state.container.appendChild(utilCirclesContainer);
        
        document.body.appendChild(state.container);
      }
    },

    initializeOnce() {
      if (state.initialized) return;
      
      try {
        this.injectStyles();
        this.createContainer();
        
        // Load state from localStorage safely
        try {
          const savedState = localStorage.getItem('ComfyUI-Align.isUtilsExpanded');
          if (savedState !== null) {
            state.isUtilsExpanded = savedState === 'true';
          }
        } catch (e) {
          console.warn("Failed to load state from localStorage", e);
          // Continue with default state if localStorage fails
        }
        
        this.createAllIcons();
        
        if (state.container) {
          state.container.style.display = 'none';
        }
        
        state.initialized = true;
        events.handleIconInteraction();
      } catch (error) {
        console.error("Failed to initialize Align plugin:", error);
        // Attempt cleanup in case of initialization error
        this.destroy();
      }
    },

    showUI() {
      if (!state.container) return;
      
      state.container.style.display = 'block';
      state.visible = true;
      
      actions.updateIconPositions();
      
      // Immediately update utility icons position to avoid floating effect
      this.updateUtilIconsVisibility(true);
      
      // Immediately set the initial rotation angle of the arrow
      const toggleArrow = state.container.querySelector('.toggle-arrow');
      if (toggleArrow) {
        toggleArrow.style.transform = `rotate(${state.isUtilsExpanded ? 180 : 0}deg)`;
      }
      
      setTimeout(() => {
        if (state.container) {
          state.container.style.pointerEvents = 'auto';
        }
      }, 100);
    },
    
    hideUI() {
      if (!state.container) return;
      
      state.container.style.display = 'none';
      state.container.style.pointerEvents = 'none';
      state.visible = false;
    },
    
    toggleVisibility() {
      if (state.visible) {
        this.hideUI();
      } else {
        this.showUI();
      }
    },

    injectStyles() {
      if (state.styleElement) return;

      state.styleElement = document.createElement('style');
      state.styleElement.textContent = `
        .aligner-container {
          position: fixed;
          z-index: 99999;
          pointer-events: none;
          display: none;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
        }
        
        .aligner-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: ${CONFIG.transition};
          cursor: pointer;
          border-radius: 6px;
          pointer-events: auto;
        }
        
        .aligner-icon-circle {
          position: relative !important;
          transform: none !important;
          margin: 0 4px !important;
          border-radius: 50%;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          transition: all 0.2s ease;
        }
        
        .aligner-icon-circle:hover {
          transform: scale(1.1) !important;
        }
        
        .aligner-icon-bg {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 6px;
          background-color: ${CONFIG.colors.bg};
          transition: background-color 0.2s ease;
        }
        
        .aligner-icon-circle .aligner-icon-bg {
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .color-circles-container {
          position: absolute;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-evenly;
          gap: 0;
          padding: 6px 10px;
          pointer-events: auto;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 10px;
          width: auto;
        }
        
        .util-circles-container {
          position: absolute;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-evenly;
          gap: 0;
          padding: 6px 10px;
          pointer-events: auto;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 10px;
          width: auto;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .util-circles-container.collapsed {
          transform: translateX(-10px);
          opacity: 0;
          pointer-events: none;
        }
        
        .toggle-arrow {
          transition: none;
          transform-origin: center;
        }
        
        .toggle-arrow.expanded {
          /* Controlled only by JS */
        }
        
        .aligner-notification {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          z-index: 10000;
          transition: opacity 0.3s ease;
          background-color: rgba(255, 0, 0, 0.8);
          color: white;
        }
      `;
      document.head.appendChild(state.styleElement);
    },

    createIcon(iconInfo, index, colorCirclesFragment, utilCirclesFragment, mainFragment) {
      const { id, type } = iconInfo;
      const isCircle = id.includes('Circle');
      const size = isCircle ? CONFIG.iconSize / 2 : CONFIG.iconSize;

      const iconWrapper = this.createElement('div', `aligner-icon ${isCircle ? 'aligner-icon-circle' : ''}`);
      iconWrapper.dataset.id = id;
      iconWrapper.dataset.type = type;
      iconWrapper.style.width = `${size}px`;
      iconWrapper.style.height = `${size}px`;
      iconWrapper.style.pointerEvents = 'auto';

      const bg = this.createElement('div', 'aligner-icon-bg');

      if (isCircle) {
        if (id === 'rainbowCircle') {
            bg.style.background = 'transparent';
            
            // Create crescent moon icon
            const moonContainer = this.createElement('div', '', {
              style: 'position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%;'
            });
            
            // Create base circle for the moon
            const moonBase = this.createElement('div', '', {
              style: `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background-color: ${CONFIG.colors.circle9};
                box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
              `
            });
            
            // Create mask circle, offset to create crescent shape
            const moonMask = this.createElement('div', '', {
              style: `
                position: absolute;
                top: -25%;
                left: -25%;
                width: 95%;
                height: 95%;
                border-radius: 50%;
                background-color: ${CONFIG.colors.bg};
                box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
              `
            });
            
            moonContainer.appendChild(moonBase);
            moonContainer.appendChild(moonMask);
            bg.appendChild(moonContainer);
        } else if (id === 'bypassCircle' || id === 'muteCircle' || id === 'pinCircle') {
            bg.style.background = CONFIG.colors.bg;
            
            // Unified creation of SVG icons
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('width', size * 0.8);
            svg.setAttribute('height', size * 0.8);
            svg.setAttribute('viewBox', '0 0 1024 1024');
            svg.style.position = 'absolute';
            svg.style.top = '50%';
            svg.style.left = '50%';
            svg.style.transform = 'translate(-50%, -50%)';
            svg.style.zIndex = '1';
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            // Set different SVG paths based on icon type
            if (id === 'bypassCircle') {
              path.setAttribute('d', SVG_PATHS.byPass);
              path.style.fill = CONFIG.colors.icon;
            } else if (id === 'muteCircle') {
              path.setAttribute('d', SVG_PATHS.muteNode);
              path.style.fill = CONFIG.colors.icon;
            } else if (id === 'pinCircle') {
              path.setAttribute('d', SVG_PATHS.pin);
              path.style.fill = '#FFFFFF'; // Set to white
            }
            
            svg.appendChild(path);
            bg.appendChild(svg);
        } else if (id === 'toggleArrowCircle') {
            bg.style.background = CONFIG.colors.bg;
            
            // Create a wrapper container to handle positioning
            const svgContainer = document.createElement('div');
            svgContainer.style.position = 'absolute';
            svgContainer.style.top = '50%';
            svgContainer.style.left = '50%';
            svgContainer.style.transform = 'translate(-50%, -50%)';
            svgContainer.style.width = '100%';
            svgContainer.style.height = '100%';
            svgContainer.style.display = 'flex';
            svgContainer.style.alignItems = 'center';
            svgContainer.style.justifyContent = 'center';
            
            // Create arrow icon, remove positioning styles, only keep toggle-arrow class
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('width', size * 0.8);
            svg.setAttribute('height', size * 0.8);
            svg.setAttribute('viewBox', '0 0 1024 1024');
            svg.style.zIndex = '1';
            svg.classList.add('toggle-arrow');
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', SVG_PATHS.toggleArrow);
            path.style.fill = '#FFFFFF'; // Set to white
            
            svg.appendChild(path);
            svgContainer.appendChild(svg);
            bg.appendChild(svgContainer);
        } else if (id === 'clearCircle') {
            const circleContainer = this.createElement('div', '', {
              style: 'position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%;'
            });
            
            // Create black background circle
            const circleBase = this.createElement('div', '', {
              style: `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background-color: rgba(12, 12, 12, 0.95);
                box-shadow: 0 0 1px rgba(255, 255, 255, 0.2);
              `
            });
            
            // Use SVG path to create white icon
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('width', size * 0.8);
            svg.setAttribute('height', size * 0.8);
            svg.setAttribute('viewBox', '0 0 1024 1024');
            svg.style.position = 'absolute';
            svg.style.top = '50%';
            svg.style.left = '50%';
            svg.style.transform = 'translate(-50%, -50%) scale(0.8)';
            svg.style.zIndex = '1';
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', SVG_PATHS.clearColor);
            path.style.fill = '#ffffff'; // Set color to white
            path.style.strokeWidth = '4';
            
            svg.appendChild(path);
            
            circleContainer.appendChild(circleBase);
            circleContainer.appendChild(svg);
            bg.appendChild(circleContainer);
            bg.style.background = 'transparent';
        } else {
          const colorName = id.replace('Circle', '').toLowerCase();
          const colorKey = CONFIG.colorMap[colorName];
          if (colorKey && CONFIG.colors[colorKey]) {
            bg.style.backgroundColor = CONFIG.colors[colorKey];
          } else {
            console.warn(`Unknown color circle: ${id}`);
            bg.style.backgroundColor = '#555555';
          }
        }
      }

      iconWrapper.appendChild(bg);

      if (!isCircle) {
        const svg = utils.createSVG(id);
        iconWrapper.appendChild(svg);
      }

      if (isCircle) {
        if (type === 'color' || type === 'toggle') {
          if (colorCirclesFragment) {
            colorCirclesFragment.appendChild(iconWrapper);
          }
        } else {
          if (utilCirclesFragment) {
            utilCirclesFragment.appendChild(iconWrapper);
          }
        }
      } else {
        // Use mainFragment instead of directly appending to container
        // to reduce DOM reflows
        if (mainFragment) {
          mainFragment.appendChild(iconWrapper);
        } else {
          state.container.appendChild(iconWrapper);
        }
      }
      
      return iconWrapper;
    },

    createAllIcons() {
      // Use DocumentFragment to batch DOM operations and reduce reflow/repaint
      const mainFragment = document.createDocumentFragment();
      const colorCirclesFragment = document.createDocumentFragment();
      const utilCirclesFragment = document.createDocumentFragment();
      
      ICONS.forEach((iconInfo, index) => {
        const icon = this.createIcon(iconInfo, index, colorCirclesFragment, utilCirclesFragment, mainFragment);
        state.icons[iconInfo.id] = icon;
      });
      
      // Append fragments to containers
      const colorCirclesContainer = state.container.querySelector('.color-circles-container');
      if (colorCirclesContainer) {
        colorCirclesContainer.appendChild(colorCirclesFragment);
      }
      
      const utilCirclesContainer = state.container.querySelector('.util-circles-container');
      if (utilCirclesContainer) {
        utilCirclesContainer.appendChild(utilCirclesFragment);
      }
      
      // Append non-circle icons to main container
      state.container.appendChild(mainFragment);
      
      // Initialize utility icons display state
      this.updateUtilIconsVisibility();
    },
    
    // Update utility icons container position
    updateUtilIconsVisibility(immediate = false) {
      const utilCirclesContainer = state.container.querySelector('.util-circles-container');
      if (utilCirclesContainer) {
        // If immediate application is needed, temporarily remove transition effect
        if (immediate) {
          const originalTransition = utilCirclesContainer.style.transition;
          utilCirclesContainer.style.transition = 'none';
          
          // Apply visibility state
          if (state.isUtilsExpanded) {
            utilCirclesContainer.classList.remove('collapsed');
            const toggleArrow = state.container.querySelector('.toggle-arrow');
            if (toggleArrow) {
              toggleArrow.style.transition = 'none';
              // Directly set rotation angle, don't use class
              toggleArrow.style.transform = `rotate(180deg)`;
            }
          } else {
            utilCirclesContainer.classList.add('collapsed');
            const toggleArrow = state.container.querySelector('.toggle-arrow');
            if (toggleArrow) {
              toggleArrow.style.transition = 'none';
              // Directly set rotation angle, don't use class
              toggleArrow.style.transform = `rotate(0deg)`;
            }
          }
          
          // Force redraw
          utilCirclesContainer.offsetHeight;
          toggleArrow?.offsetHeight;
          
          // Restore transition effect
          setTimeout(() => {
            utilCirclesContainer.style.transition = originalTransition;
          }, 50);
        } else {
          // Normal application of visibility state
          if (state.isUtilsExpanded) {
            utilCirclesContainer.classList.remove('collapsed');
          } else {
            utilCirclesContainer.classList.add('collapsed');
          }
          // Rotation animation is handled by animateRotation in toggleUtilIcons
        }
      }
    },
    
    // Toggle utility icons display state
    toggleUtilIcons() {
      state.isUtilsExpanded = !state.isUtilsExpanded;
      this.updateUtilIconsVisibility();
      
      // Add rotation animation
      const toggleArrow = state.container.querySelector('.toggle-arrow');
      if (toggleArrow) {
        // Use GSAP-style JS animation method
        this.animateRotation(toggleArrow, state.isUtilsExpanded ? 180 : 0);
      }
      
      // Save state to localStorage
      try {
        localStorage.setItem('ComfyUI-Align.isUtilsExpanded', state.isUtilsExpanded ? 'true' : 'false');
      } catch (e) {
        console.warn("Failed to save state to localStorage", e);
      }
    },

    // Rotate element using JS animation
    animateRotation(element, targetDegree) {
      if (!element) return;
      
      // Cancel any existing animation
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
      
      const startDegree = state.isUtilsExpanded ? 0 : 180;
      const duration = 500; // Duration (milliseconds)
      const startTime = performance.now();
      
      // Remove expanded class, we only use inline style to control rotation
      element.classList.remove('expanded');
      
      // Animation frame function that calculates and applies rotation angle
      // Uses requestAnimationFrame for smooth animation with easing
      const animate = (currentTime) => {
        // Calculate progress (0 to 1) based on elapsed time
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function to make animation more natural
        const easeProgress = this.cubicBezier(0.34, 1.56, 0.64, 1, progress);
        const currentDegree = startDegree + (targetDegree - startDegree) * easeProgress;
        
        // Apply the current rotation angle
        element.style.transform = `rotate(${currentDegree}deg)`;
        
        // Continue animation until complete
        if (progress < 1) {
          state.animationFrameId = requestAnimationFrame(animate);
        } else {
          state.animationFrameId = null;
        }
      };
      
      state.animationFrameId = requestAnimationFrame(animate);
    },
    
    // Easing function implementation, simulating cubic-bezier
    cubicBezier(x1, y1, x2, y2, t) {
      // Simplified bezier easing
      const p0 = 0;
      const p1 = y1;
      const p2 = y2;
      const p3 = 1;
      
      return p0 * Math.pow(1 - t, 3) + 
             3 * p1 * Math.pow(1 - t, 2) * t + 
             3 * p2 * (1 - t) * Math.pow(t, 2) + 
             p3 * Math.pow(t, 3);
    },

    showNotification(message, isError = true) {
      if (!message) return;
      
      const notification = this.createElement('div', 'aligner-notification');
      notification.textContent = message;
      
      if (!isError) {
        notification.style.backgroundColor = 'rgba(21, 87, 36, 0.8)';
      }
      
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    },

    destroy() {
      // Cancel any ongoing animations
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
      
      // Remove event listeners
      events.removeEventListeners();
      
      // Remove DOM elements
      if (state.container) {
        document.body.removeChild(state.container);
        state.container = null;
      }
      
      if (state.styleElement) {
        document.head.removeChild(state.styleElement);
        state.styleElement = null;
      }
      
      // Reset state
      state.visible = false;
      state.icons = {};
      state.initialized = false;
    }
  };

  const actions = {
    toggle() {
      dom.initializeOnce();
      dom.toggleVisibility();
    },
    
    // Original implementation of updateIconPositions
    _updateIconPositions() {
      const { iconSize, spacing } = CONFIG;
      const halfSize = iconSize / 2;
      const effectiveSpacing = spacing + halfSize;

      const boundingBox = utils.calculateUIBoundingBox(state.lastX, state.lastY);

      const [safeX, safeY] = utils.keepInViewport(
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
        
        const relativePos = utils.calculatePosition(index, 0, 0);
        if (relativePos) {
          const [relX, relY] = relativePos;
          icon.style.transform = `translate(${centerX + relX}px, ${centerY + relY}px)`;
        }
      });

      const colorCirclesContainer = state.container.querySelector('.color-circles-container');
      if (colorCirclesContainer) {
        const x = centerX - colorCirclesContainer.offsetWidth / 2;
        const y = centerY + CONFIG.spacing + CONFIG.iconSize / 2 + 15;
        
        colorCirclesContainer.style.transform = `translate(${x}px, ${y}px)`;
      }
      
      // Update utility icons container position
      const utilCirclesContainer = state.container.querySelector('.util-circles-container');
      if (utilCirclesContainer) {
        const utilX = centerX + colorCirclesContainer.offsetWidth / 2 + 10;
        const utilY = centerY + CONFIG.spacing + CONFIG.iconSize / 2 + 15;
        
        utilCirclesContainer.style.transform = `translate(${utilX}px, ${utilY}px)`;
      }
    },
    
    // Throttled version to optimize performance
    // Only updates UI position at most once every 16ms (approx 60fps)
    updateIconPositions: null, // Will be initialized below

    getComfyUIAppInstance() {
      if (window.app?.canvas && window.app?.graph) {
        return window.app;
      }

      if (window.LiteGraph?.LGraphCanvas?.active_canvas) {
        const canvas = LiteGraph.LGraphCanvas.active_canvas;
        if (canvas?.graph) {
          return { canvas, graph: canvas.graph };
        }
      }

      const canvasElement = document.querySelector(".litegraph.litegraph-canvas");
      if (canvasElement?.lgraphcanvas) {
        const canvas = canvasElement.lgraphcanvas;
        if (canvas?.graph) {
          return { canvas, graph: canvas.graph };
        }
      }
      
      return null;
    },
    
    getSelectedNodes(appInstance) {
      if (appInstance.canvas.selected_nodes?.length) {
        return Array.from(appInstance.canvas.selected_nodes);
      }

      const selectedNodes = [];
      if (appInstance.graph?._nodes) {
        for (const node of appInstance.graph._nodes) {
          if (node.is_selected) {
            selectedNodes.push(node);
          }
        }
      }
      
      return selectedNodes;
    },
    
    getSelectedGroups(appInstance) {
      const selectedGroups = [];
      
      if (appInstance.canvas?.selected_groups?.length) {
        return Array.from(appInstance.canvas.selected_groups);
      }
      
      if (appInstance.graph?.groups) {
        for (const group of appInstance.graph.groups) {
          if (group.selected) {
            selectedGroups.push(group);
          }
        }
      }
      
      return selectedGroups;
    },

    openNativeColorPicker() {
      const appInstance = this.getComfyUIAppInstance();
      if (!appInstance) {
        dom.showNotification("Unable to get ComfyUI application instance");
        return;
      }

      const selectedNodes = this.getSelectedNodes(appInstance);
      const selectedGroups = this.getSelectedGroups(appInstance);
      
      if (selectedNodes.length === 0 && selectedGroups.length === 0) {
        dom.showNotification("Please select nodes or groups to apply color");
        return;
      }

      const colorInput = dom.createElement('input', '', {
        type: 'color',
        value: selectedNodes.length > 0 ? selectedNodes[0].color?.replace(/rgba?\(.*\)/, '#000000') || '#3355aa' : selectedGroups.length > 0 ? selectedGroups[0].color || '#3355aa' : '#3355aa'
      });

      colorInput.style.position = 'absolute';
      colorInput.style.visibility = 'hidden';
      document.body.appendChild(colorInput);

      const handleColorChange = (e) => {
        const color = e.target.value;

        selectedNodes.forEach(node => {
          node.color = color;
        });

        selectedGroups.forEach(group => {
          group.color = color;
        });

        appInstance.graph.setDirtyCanvas(true, true);
      };

      colorInput.addEventListener('input', handleColorChange);
      colorInput.addEventListener('change', () => {
        document.body.removeChild(colorInput);
      });
      
      colorInput.click();
    },

    handleAlignAction(action) {
      let result;
      
      switch(action) {
        case 'left':
          result = this.alignNodesToLeft();
          break;
        case 'right':
          result = this.alignNodesToRight();
          break;
        case 'top':
          result = this.alignNodesToTop();
          break;
        case 'bottom':
          result = this.alignNodesToBottom();
          break;
        case 'horizontalCenter':
          result = this.alignNodesToHorizontalCenter();
          break;
        case 'verticalCenter':
          result = this.alignNodesToVerticalCenter();
          break;
        case 'leftStretch':
          result = this.stretchNodesToLeft();
          break;
        case 'rightStretch':
          result = this.stretchNodesToRight();
          break;
        case 'topStretch':
          result = this.stretchNodesToTop();
          break;
        case 'bottomStretch':
          result = this.stretchNodesToBottom();
          break;
        case 'horizontalStretch':
          result = this.stretchNodesHorizontally();
          break;
        case 'verticalStretch':
          result = this.stretchNodesVertically();
          break;
        case 'redCircle':
        case 'orangeCircle':
        case 'yellowCircle':
        case 'greenCircle':
        case 'cyanCircle':
        case 'blueCircle':
        case 'purpleCircle':
          result = this.setNodesColor(action);
          break;
        case 'bypassCircle':
          result = this.toggleNodesBypass();
          break;  
        case 'muteCircle':
          result = this.toggleNodesMute();
          break;
        case 'pinCircle':
          result = this.toggleNodesPin();
          break;
        case 'clearCircle':
          result = this.setNodesColor(action);
          break;
        case 'toggleArrowCircle':
          dom.toggleUtilIcons();
          return;
        case 'rainbowCircle':
          this.openNativeColorPicker();
          return;
        default:
          return;
      }
      
      if (result && !result.success) {
        dom.showNotification(result.message, true);
      }
    },

    alignNodesToLeft() {
      return this.executeNodeOperation("alignment", nodes => {
        const leftmostX = Math.min(...nodes.map(node => node.pos[0]));
        nodes.forEach(node => {
          node.pos[0] = leftmostX;
        });
      });
    },
    
    alignNodesToRight() {
      return this.executeNodeOperation("alignment", nodes => {
        const rightmostEdge = Math.max(...nodes.map(node => node.pos[0] + node.size[0]));
        nodes.forEach(node => {
          node.pos[0] = rightmostEdge - node.size[0];
        });
      });
    },

    alignNodesToTop() {
      return this.executeNodeOperation("alignment", nodes => {
        const topmostY = Math.min(...nodes.map(node => node.pos[1]));
        nodes.forEach(node => {
          node.pos[1] = topmostY;
        });
      });
    },

    alignNodesToBottom() {
      return this.executeNodeOperation("alignment", nodes => {
        const bottommostEdge = Math.max(...nodes.map(node => node.pos[1] + node.size[1]));
        nodes.forEach(node => {
          node.pos[1] = bottommostEdge - node.size[1];
        });
      });
    },

    alignNodesToHorizontalCenter() {
      return this.executeNodeOperation("alignment", nodes => {
        this.alignNodesToHorizontalCenterInternal(nodes);
      });
    },

    alignNodesToVerticalCenter() {
      return this.executeNodeOperation("alignment", nodes => {
        this.alignNodesToVerticalCenterInternal(nodes);
      });
    },

    stretchNodesToLeft() {
      return this.executeNodeOperation("resizing", nodes => {
        const leftmostX = Math.min(...nodes.map(node => node.pos[0]));
        const isLeftAligned = nodes.every(node => Math.abs(node.pos[0] - leftmostX) < 1);
        
        if (isLeftAligned) {
          const minWidth = Math.min(...nodes.map(node => node.size[0]));
          nodes.forEach(node => {
            if (node.size[0] > minWidth) {
              node.size[0] = minWidth;
            }
          });
        } else {
          nodes.forEach(node => {
            if (node.pos[0] > leftmostX) {
              const rightEdge = node.pos[0] + node.size[0];
              node.pos[0] = leftmostX;
              const newWidth = Math.max(rightEdge - leftmostX, 100);
              node.size[0] = newWidth;
            }
          });
        }
      });
    },

    stretchNodesToRight() {
      return this.executeNodeOperation("resizing", nodes => {
        const rightmostEdge = Math.max(...nodes.map(node => node.pos[0] + node.size[0]));
        const isRightAligned = nodes.every(node => 
          Math.abs((node.pos[0] + node.size[0]) - rightmostEdge) < 1
        );
        
        if (isRightAligned) {
          const minWidth = Math.min(...nodes.map(node => node.size[0]));
          nodes.forEach(node => {
            if (node.size[0] > minWidth) {
              const rightEdge = node.pos[0] + node.size[0];
              node.size[0] = minWidth;
              node.pos[0] = rightEdge - minWidth;
            }
          });
        } else {
          nodes.forEach(node => {
            if (node.pos[0] + node.size[0] < rightmostEdge) {
              const newWidth = Math.max(rightmostEdge - node.pos[0], 100);
              node.size[0] = newWidth;
            }
          });
        }
      });
    },

    stretchNodesToTop() {
      return this.executeNodeOperation("resizing", nodes => {
        const topmostY = Math.min(...nodes.map(node => node.pos[1]));
        const isTopAligned = nodes.every(node => 
          Math.abs(node.pos[1] - topmostY) < 1
        );
        
        if (isTopAligned) {
          const minHeight = Math.min(...nodes.map(node => node.size[1]));
          nodes.forEach(node => {
            if (node.size[1] > minHeight) {
              node.size[1] = minHeight;
            }
          });
        } else {
          nodes.forEach(node => {
            if (node.pos[1] > topmostY) {
              const bottomEdge = node.pos[1] + node.size[1];
              node.pos[1] = topmostY;
              const newHeight = Math.max(bottomEdge - topmostY, 60);
              node.size[1] = newHeight;
            }
          });
        }
      });
    },

    stretchNodesToBottom() {
      return this.executeNodeOperation("resizing", nodes => {
        const bottommostEdge = Math.max(...nodes.map(node => node.pos[1] + node.size[1]));
        const isBottomAligned = nodes.every(node => 
          Math.abs((node.pos[1] + node.size[1]) - bottommostEdge) < 1
        );
        
        if (isBottomAligned) {
          const minHeight = Math.min(...nodes.map(node => node.size[1]));
          nodes.forEach(node => {
            if (node.size[1] > minHeight) {
              const bottomEdge = node.pos[1] + node.size[1];
              node.size[1] = minHeight;
              node.pos[1] = bottomEdge - minHeight;
            }
          });
        } else {
          nodes.forEach(node => {
            if (node.pos[1] + node.size[1] < bottommostEdge) {
              const newHeight = Math.max(bottommostEdge - node.pos[1], 60);
              node.size[1] = newHeight;
            }
          });
        }
      });
    },
    
    stretchNodesHorizontally() {
      return this.executeNodeOperation("resizing", nodes => {
        let targetWidth;
        if (state.altKeyPressed) {
          targetWidth = Math.min(...nodes.map(node => node.size[0]));
        } else {
          targetWidth = Math.max(...nodes.map(node => node.size[0]));
        }

        targetWidth = Math.max(targetWidth, CONFIG.minNodeSize.width);

        nodes.forEach(node => {
          if (node.size[0] !== targetWidth) {
            const centerX = node.pos[0] + (node.size[0] / 2);
            node.size[0] = targetWidth;
            node.pos[0] = centerX - (targetWidth / 2);
          }
        });
      });
    },

    stretchNodesVertically() {
      return this.executeNodeOperation("resizing", nodes => {
        let targetHeight;
        if (state.altKeyPressed) {
          targetHeight = Math.min(...nodes.map(node => node.size[1]));
        } else {
          targetHeight = Math.max(...nodes.map(node => node.size[1]));
        }

        targetHeight = Math.max(targetHeight, CONFIG.minNodeSize.height);

        nodes.forEach(node => {
          if (node.size[1] !== targetHeight) {
            const centerY = node.pos[1] + (node.size[1] / 2);
            node.size[1] = targetHeight;
            node.pos[1] = centerY - (targetHeight / 2);
          }
        });
      });
    },

    setNodesColor(colorType) {
      try {
        const appInstance = this.getComfyUIAppInstance();
        if (!appInstance) {
          return { success: false, message: "Unable to get ComfyUI application instance" };
        }

        const selectedNodes = this.getSelectedNodes(appInstance);
        const selectedGroups = this.getSelectedGroups(appInstance);
        
        if (selectedNodes.length === 0 && selectedGroups.length === 0) {
          return { success: false, message: "Please select nodes or groups to apply color" };
        }

        let color;
        const colorName = colorType.replace('Circle', '').toLowerCase();
        
        const colorKey = CONFIG.colorMap[colorName];
        
        if (!colorKey || !CONFIG.colors[colorKey]) {
          return { success: false, message: `Unknown color type: ${colorType}` };
        }

        if (colorName === 'clear') {
          selectedNodes.forEach(node => {
            delete node.color;
            delete node.bgcolor;
          });
          
          selectedGroups.forEach(group => {
            delete group.color;
          });
        } else {
          color = CONFIG.colors[colorKey];
          
          selectedNodes.forEach(node => {
            if (CONFIG.applyToHeader && CONFIG.applyToPanel) {
              node.color = utils.getDeeperColor(color);
              node.bgcolor = color;
            } else {
              if (CONFIG.applyToHeader) {
                node.color = color;
              }
              if (CONFIG.applyToPanel) {
                node.bgcolor = color;
              }
            }
          });
          
          selectedGroups.forEach(group => {
            group.color = color;
          });
        }

        appInstance.graph.setDirtyCanvas(true, true);
        
        return { success: true };
      } catch (error) {
        console.error("Setting color failed:", error);
        return { success: false, message: `Operation failed: ${error.message}` };
      }
    },

    performNodeOperation(operationFn, requireMultipleNodes = true) {
      try {
        const appInstance = this.getComfyUIAppInstance();
        if (!appInstance) {
          return { success: false, message: "Failed to get ComfyUI application instance" };
        }

        const selectedNodes = this.getSelectedNonPinnedNodes(appInstance);
        if (requireMultipleNodes && selectedNodes.length <= 1) {
          return { success: false, message: "Cannot perform operation. Some nodes are pinned and cannot be moved or resized" };
        }

        if (selectedNodes.length > 100) {
          console.warn(`Processing ${selectedNodes.length} nodes, this may take a moment...`);
        }
        
        window.requestAnimationFrame(() => {
          operationFn(selectedNodes);
          appInstance.graph.setDirtyCanvas(true, true);
        });
        
        return { success: true };
      } catch (error) {
        console.error("Operation failed:", error);
        return { success: false, message: `Operation failed: ${error.message}` };
      }
    },

    performColorOperation(operationFn) {
      try {
        const appInstance = this.getComfyUIAppInstance();
        if (!appInstance) {
          return { success: false, message: "Failed to get ComfyUI application instance" };
        }

        const selectedNodes = this.getSelectedNodes(appInstance);
        const selectedGroups = this.getSelectedGroups(appInstance);
        
        if (selectedNodes.length === 0 && selectedGroups.length === 0) {
          return { success: false, message: "Please select nodes or groups to apply color" };
        }

        operationFn(selectedNodes, selectedGroups);
        appInstance.graph.setDirtyCanvas(true, true);
        
        return { success: true };
      } catch (error) {
        console.error("Color operation failed:", error);
        return { success: false, message: `Operation failed: ${error.message}` };
      }
    },

    alignNodesToHorizontalCenterInternal(nodes) {
      const sortedNodes = [...nodes].sort((a, b) => a.pos[0] - b.pos[0]);
      const nodeWidthSum = sortedNodes.reduce((sum, node) => sum + node.size[0], 0);
      
      const leftmostX = Math.min(...nodes.map(node => node.pos[0]));
      const rightmostX = Math.max(...nodes.map(node => node.pos[0] + node.size[0]));
      const totalWidth = rightmostX - leftmostX;
      
      const referenceNode = state.altKeyPressed 
        ? sortedNodes[sortedNodes.length - 1]
        : sortedNodes[0];
      
      const referenceNodeTopY = referenceNode.pos[1];
      
      nodes.forEach(node => {
        node.pos[1] = referenceNodeTopY;
      });
      
      const minSpacing = CONFIG.horizontalMinSpacing;
      const safetyMargin = CONFIG.safetyMargin.horizontal;
      const effectiveMinSpacing = minSpacing + safetyMargin;
      
      const totalRequiredSpace = nodeWidthSum + (sortedNodes.length - 1) * effectiveMinSpacing;
      
      let spacing = effectiveMinSpacing;
      
      if (totalWidth > totalRequiredSpace) {
        spacing = (totalWidth - nodeWidthSum) / (sortedNodes.length - 1);
        spacing = Math.max(spacing, effectiveMinSpacing);
      }
      
      if (state.altKeyPressed) {
        const rightNodeRightEdge = referenceNode.pos[0] + referenceNode.size[0];
        
        let currentX = rightNodeRightEdge;
        
        for (let i = sortedNodes.length - 1; i >= 0; i--) {
          const node = sortedNodes[i];
          currentX -= node.size[0];
          node.pos[0] = currentX;
          
          if (i > 0) {
            currentX -= spacing;
          }
        }
      } else {
        let currentX = leftmostX;
        sortedNodes.forEach((node, index) => {
          node.pos[0] = currentX;
          
          if (index < sortedNodes.length - 1) {
            const nextMinX = currentX + node.size[0] + effectiveMinSpacing;
            currentX += node.size[0] + spacing;
            
            if (currentX < nextMinX) {
              currentX = nextMinX;
            }
          }
        });
      }
    },

    alignNodesToVerticalCenterInternal(nodes) {
      const sortedNodes = [...nodes].sort((a, b) => a.pos[1] - b.pos[1]);
      const nodeHeightSum = sortedNodes.reduce((sum, node) => sum + node.size[1], 0);
      
      const topmostY = Math.min(...nodes.map(node => node.pos[1]));
      const bottommostY = Math.max(...nodes.map(node => node.pos[1] + node.size[1]));
      const totalHeight = bottommostY - topmostY;

      const referenceNode = state.altKeyPressed 
        ? sortedNodes[sortedNodes.length - 1]
        : sortedNodes[0];
      
      const referenceNodeCenterX = referenceNode.pos[0] + (referenceNode.size[0] / 2);

      nodes.forEach(node => {
        const nodeCenterX = node.pos[0] + (node.size[0] / 2);
        const offsetX = referenceNodeCenterX - nodeCenterX;
        node.pos[0] += offsetX;
      });

      const minSpacing = CONFIG.verticalMinSpacing;
      const safetyMargin = CONFIG.safetyMargin.vertical;
      const effectiveMinSpacing = minSpacing + safetyMargin;
      
      const totalRequiredSpace = nodeHeightSum + (sortedNodes.length - 1) * effectiveMinSpacing;
      
      let spacing = effectiveMinSpacing;
      
      if (totalHeight > totalRequiredSpace) {
        spacing = (totalHeight - nodeHeightSum) / (sortedNodes.length - 1);
        spacing = Math.max(spacing, effectiveMinSpacing);
      }
      
      if (state.altKeyPressed) {
        const bottomNodeBottomEdge = referenceNode.pos[1] + referenceNode.size[1];
        
        let currentY = bottomNodeBottomEdge;
        
        for (let i = sortedNodes.length - 1; i >= 0; i--) {
          const node = sortedNodes[i];
          currentY -= node.size[1];
          node.pos[1] = currentY;
          
          if (i > 0) {
            currentY -= spacing;
          }
        }
      } else {
        let currentY = topmostY;
        sortedNodes.forEach((node, index) => {
          node.pos[1] = currentY;
          
          if (index < sortedNodes.length - 1) {
            const nextMinY = currentY + node.size[1] + effectiveMinSpacing;
            currentY += node.size[1] + spacing;
            
            if (currentY < nextMinY) {
              currentY = nextMinY;
            }
          }
        });
      }
    },

    toggleNodesBypass() {
      try {
        const appInstance = this.getComfyUIAppInstance();
        if (!appInstance) {
          return { success: false, message: "Unable to get ComfyUI application instance" };
        }

        const selectedNodes = this.getSelectedNodes(appInstance);
        if (selectedNodes.length === 0) {
          return { success: false, message: "Please select nodes to toggle bypass" };
        }

        selectedNodes.forEach(node => {
          // Toggle between BYPASS and ALWAYS mode
          if (node.mode === LGraphEventMode.BYPASS) {
            node.mode = LGraphEventMode.ALWAYS; // Set to ALWAYS (normal)
          } else {
            node.mode = LGraphEventMode.BYPASS; // Set to BYPASS
          }
        });

        appInstance.graph.setDirtyCanvas(true, true);
        
        return { success: true };
      } catch (error) {
        console.error("Toggling bypass failed:", error);
        return { success: false, message: `Operation failed: ${error.message}` };
      }
    },

    toggleNodesMute() {
      try {
        const appInstance = this.getComfyUIAppInstance();
        if (!appInstance) {
          return { success: false, message: "Unable to get ComfyUI application instance" };
        }

        const selectedNodes = this.getSelectedNodes(appInstance);
        if (selectedNodes.length === 0) {
          return { success: false, message: "Please select nodes to toggle mute" };
        }

        selectedNodes.forEach(node => {
          // Toggle between NEVER and ALWAYS mode
          if (node.mode === LGraphEventMode.NEVER) {
            node.mode = LGraphEventMode.ALWAYS; // Set to ALWAYS (normal)
          } else {
            node.mode = LGraphEventMode.NEVER; // Set to NEVER (mute)
          }
        });

        appInstance.graph.setDirtyCanvas(true, true);
        
        return { success: true };
      } catch (error) {
        console.error("Toggling mute failed:", error);
        return { success: false, message: `Operation failed: ${error.message}` };
      }
    },

    toggleNodesPin() {
      try {
        const appInstance = this.getComfyUIAppInstance();
        if (!appInstance) {
          return { success: false, message: "Unable to get ComfyUI application instance" };
        }

        const selectedNodes = this.getSelectedNodes(appInstance);
        if (selectedNodes.length === 0) {
          return { success: false, message: "No nodes selected" };
        }

        // Check if all selected nodes are already pinned
        const allPinned = selectedNodes.every(node => node.flags?.pinned);
        
        // Toggle the pinned state
        selectedNodes.forEach(node => {
          if (!node.flags) {
            node.flags = {};
          }
          node.flags.pinned = !allPinned;
        });

        appInstance.graph.setDirtyCanvas(true, true);
        
        return { success: true };
      } catch (error) {
        console.error("Toggle pin failed:", error);
        return { success: false, message: `Operation failed: ${error.message}` };
      }
    },

    // Get selected non-pinned nodes
    getSelectedNonPinnedNodes(appInstance) {
      const selectedNodes = this.getSelectedNodes(appInstance);
      return selectedNodes.filter(node => !(node.flags?.pinned));
    },

    // Main function to execute node operations safely with proper error handling
    // Handles node selection, pinned node filtering, and validation before running the operation
    // Parameters:
    //   - operationType: String identifying the type of operation ("alignment" or "resizing")
    //   - operationFn: Function that performs the actual operation on the nodes
    // Returns an object with success status and error message if applicable
    executeNodeOperation(operationType, operationFn) {
      try {
        const appInstance = this.getComfyUIAppInstance();
        if (!appInstance) {
          return { success: false, message: "Unable to get ComfyUI application instance" };
        }

        // Get selected nodes and filter out pinned nodes that cannot be modified
        const selectedNodes = this.getSelectedNodes(appInstance);
        const pinnedNodes = selectedNodes.filter(node => node.flags?.pinned);
        const nonPinnedNodes = selectedNodes.filter(node => !(node.flags?.pinned));
        
        // Validate that we have enough non-pinned nodes to perform the operation
        if (nonPinnedNodes.length <= 1) {
          let errorMessage = "Cannot perform operation.";
          
          if (pinnedNodes.length > 0) {
            if (operationType === "alignment") {
              errorMessage = "Cannot perform alignment. Some nodes are pinned and cannot be moved.";
            } else if (operationType === "resizing") {
              errorMessage = "Cannot perform resizing. Some nodes are pinned and cannot be resized.";
            } else {
              errorMessage = "Cannot perform operation. Some nodes are pinned and cannot be moved or resized.";
            }
          } else {
            errorMessage = "At least two nodes must be selected.";
          }
          
          return { success: false, message: errorMessage };
        }

        // Execute the operation and update the canvas
        operationFn(nonPinnedNodes);
        appInstance.graph.setDirtyCanvas(true, true);
        
        return { success: true };
      } catch (error) {
        console.error(`Operation failed:`, error);
        return { success: false, message: `Operation failed: ${error.message}` };
      }
    }
  };

  const events = {
    trackMousePosition(e) {
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    },

    handleKeyDown(e) {
      const shortcut = CONFIG.shortcut.toLowerCase();
      const parts = shortcut.split('+');

      if (parts.length === 1) {
        if (e.key.toLowerCase() === parts[0]) {
          e.preventDefault();
          actions.toggle();
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
          actions.toggle();
        }
      }
    },

    handleShiftKey(e) {
      if (e.key === 'Shift') {
        state.shiftKeyPressed = e.type === 'keydown';
        
        if (e.type === 'keyup' && state.visible && !state.shiftKeyPressed) {
          actions.toggle();
        }
      }
    },

    handleAltKey(e) {
      if (e.key === 'Alt') {
        state.altKeyPressed = e.type === 'keydown';
      }
    },

    handleIconInteraction() {
      if (!state.container) return;

      state.container.addEventListener('mouseover', (e) => {
        const icon = e.target.closest('.aligner-icon');
        if (!icon) return;
        
        const bg = icon.querySelector('.aligner-icon-bg');
        if (!bg) return;
        
        this.handleIconHover(icon, bg, true);
      });
      
      state.container.addEventListener('mouseout', (e) => {
        const icon = e.target.closest('.aligner-icon');
        if (!icon) return;
        
        const bg = icon.querySelector('.aligner-icon-bg');
        if (!bg) return;
        
        this.handleIconHover(icon, bg, false);
      });

      state.container.addEventListener('click', (e) => {
        const icon = e.target.closest('.aligner-icon');
        if (!icon) return;
        
        e.stopPropagation();
        
        const action = icon.dataset.id;
        if (action) {
          actions.handleAlignAction(action);
        }
        
        // If clicking the toggle button, don't close the panel
        if (!state.shiftKeyPressed && action !== 'toggleArrowCircle') {
          actions.toggle();
        }
      });
    },

    handleIconHover(icon, bg, isHovering) {
      if (!icon.classList.contains('aligner-icon-circle')) {
        bg.style.backgroundColor = isHovering ? CONFIG.colors.hover : CONFIG.colors.bg;
        return;
      }
      
      const id = icon.dataset.id;
      if (!id) return;
      
      if (isHovering) {
        // Unified handling of hover effects for all circular icons
        let shadowColor = 'rgba(255, 255, 255, 0.7)';
        
        // Set different shadow colors based on icon type
        if (id === 'muteCircle') {
          shadowColor = 'rgba(255, 0, 0, 0.5)';
        } else if (id === 'pinCircle') {
          shadowColor = 'rgba(255, 255, 255, 0.7)';
        } else {
          const colorName = id.replace('Circle', '').toLowerCase();
          const colorKey = CONFIG.colorMap[colorName];
          
          if (colorKey && CONFIG.colors[colorKey]) {
            shadowColor = CONFIG.colors[colorKey];
            
            if (colorKey === 'circle8') {
              shadowColor = 'rgba(255, 255, 255, 0.8)';
            } else if (colorKey === 'circle9') {
              shadowColor = 'rgba(255, 215, 0, 0.5)';
            } else if (colorKey === 'circle10') {
              shadowColor = 'rgba(128, 0, 128, 0.6)';
            }
            
            if (shadowColor.includes('gradient')) {
              shadowColor = 'rgba(255, 215, 0, 0.5)';
            }
          }
        }
        
        // Uniformly apply shadow and increase z-index
        bg.style.boxShadow = `0 0 12px 4px ${shadowColor}`;
        icon.style.zIndex = 2;
      } else {
        // Uniformly reset styles for all circular icons
        bg.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        icon.style.zIndex = 1;
      }
    },

    handleOutsideClick(e) {
      if (state.visible && state.container && !state.container.contains(e.target)) {
        actions.toggle();
      }
    },

    registerEventListeners() {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('mousemove', this.trackMousePosition);
      document.addEventListener('click', this.handleOutsideClick);
      
      document.addEventListener('keydown', this.handleShiftKey);
      document.addEventListener('keyup', this.handleShiftKey);
      document.addEventListener('keydown', this.handleAltKey);
      document.addEventListener('keyup', this.handleAltKey);
    },

    removeEventListeners() {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('mousemove', this.trackMousePosition);
      document.removeEventListener('click', this.handleOutsideClick);
      
      document.removeEventListener('keydown', this.handleShiftKey);
      document.removeEventListener('keyup', this.handleShiftKey);
      document.removeEventListener('keydown', this.handleAltKey);
      document.removeEventListener('keyup', this.handleAltKey);
    }
  };

  // Initialize throttled functions
  actions.updateIconPositions = utils.throttle(actions._updateIconPositions, THROTTLE_MS);

  return {
    init() {
      CONFIG.horizontalMinSpacing = DEFAULT_CONFIG.horizontalMinSpacing;
      CONFIG.verticalMinSpacing = DEFAULT_CONFIG.verticalMinSpacing;

      const shortcutSetting = app.extensionManager.setting.get("Align.Shortcut");
      if (shortcutSetting !== undefined) {
        CONFIG.shortcut = shortcutSetting;
      }
      
      events.registerEventListeners();
    },
    destroy() {
      events.removeEventListeners();
      dom.destroy();
      if (state.styleElement) {
        document.head.removeChild(state.styleElement);
        state.styleElement = null;
      }
    },
    CONFIG
  };
})();

app.registerExtension({
  name: "ComfyUI-Align.Settings",
  settings: [
    {
      id: "Align.Spacing.horizontalMin",
      name: "Horizontal Min Spacing",
      type: "slider",
      defaultValue: DEFAULT_CONFIG.horizontalMinSpacing,
      attrs: {
        min: 10,
        max: 200,
        step: 1
      },
      tooltip: "Minimum horizontal spacing between nodes when aligning (in pixels)",
      category: ["Align", "Spacing", "Horizontal"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.horizontalMinSpacing = value;
        }
      }
    },
    {
      id: "Align.Spacing.verticalMin",
      name: "Vertical Min Spacing",
      type: "slider",
      defaultValue: DEFAULT_CONFIG.verticalMinSpacing,
      attrs: {
        min: 10,
        max: 200,
        step: 1
      },
      tooltip: "Minimum vertical spacing between nodes when aligning (in pixels)",
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
      defaultValue: DEFAULT_CONFIG.shortcut,
      tooltip: "Shortcut to open the alignment tool (e.g. 'alt+a', 'shift+s', etc.)",
      category: ["Align", "General"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.shortcut = value;
        }
      }
    },
  ]
});

app.registerExtension({
  name: "ComfyUI-Align.ColorSettings",
  settings: [
    {
      id: "Align.Color.applyToPanel",
      name: "Apply color to node panel (background)",
      type: "boolean",
      defaultValue: DEFAULT_CONFIG.applyToPanel,
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
      defaultValue: DEFAULT_CONFIG.applyToHeader,
      tooltip: "When checked, colors will be applied to node headers",
      category: ["Align", "Color Application", "Header"],
      onChange: (value) => {
        if (AlignerPlugin && AlignerPlugin.CONFIG) {
          AlignerPlugin.CONFIG.applyToHeader = value;
        }
      }
    },
  ]
});

app.registerExtension({
  name: "ComfyUI-Align.SettingsUpdate",
  async setup() {
    await app.extensionManager.setting.set("Align.Spacing.horizontalMin", DEFAULT_CONFIG.horizontalMinSpacing);
    await app.extensionManager.setting.set("Align.Spacing.verticalMin", DEFAULT_CONFIG.verticalMinSpacing);

    const panelSetting = app.extensionManager.setting.get("Align.Color.applyToPanel");
    if (panelSetting === undefined) {
      await app.extensionManager.setting.set("Align.Color.applyToPanel", DEFAULT_CONFIG.applyToPanel);
    } else {
      AlignerPlugin.CONFIG.applyToPanel = panelSetting;
    }
    
    const headerSetting = app.extensionManager.setting.get("Align.Color.applyToHeader");
    if (headerSetting === undefined) {
      await app.extensionManager.setting.set("Align.Color.applyToHeader", DEFAULT_CONFIG.applyToHeader);
    } else {
      AlignerPlugin.CONFIG.applyToHeader = headerSetting;
    }

    AlignerPlugin.CONFIG.horizontalMinSpacing = app.extensionManager.setting.get("Align.Spacing.horizontalMin") || DEFAULT_CONFIG.horizontalMinSpacing;
    AlignerPlugin.CONFIG.verticalMinSpacing = app.extensionManager.setting.get("Align.Spacing.verticalMin") || DEFAULT_CONFIG.verticalMinSpacing;

    const shortcutSetting = app.extensionManager.setting.get("Align.Shortcut");
    if (shortcutSetting !== undefined) {
      AlignerPlugin.CONFIG.shortcut = shortcutSetting;
    }
  }
});

function safeGetApp() {
  if (typeof app === 'undefined' || !app) {
    console.warn('ComfyUI-Align: app is not available');
    return null;
  }
  return app;
}

function initializePlugin() {
  if (safeGetApp()) {
    AlignerPlugin.init();
  } else {
    console.error('ComfyUI-Align: Cannot initialize in this environment');
  }
}

setTimeout(initializePlugin, 1000);