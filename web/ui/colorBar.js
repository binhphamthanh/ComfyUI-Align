import { getDeeperColor } from "../utils/utils.js";
import { ArrowButton } from "../components/ArrowButton.js";
import { ToolBar } from "./toolBar.js";

export class ColorBar {
  constructor(config, utils) {
    this.CONFIG = config;
    this.utils = utils;
    this.container = null;
    this.circles = {};
    this.styleElement = null;
    this.handleActionCallback = null;
    this.arrowButton = null;
    this.toolBar = null;
    
    this.COLOR_ICONS = [
      { id: 'redCircle', type: 'color' },
      { id: 'orangeCircle', type: 'color' },
      { id: 'yellowCircle', type: 'color' },
      { id: 'greenCircle', type: 'color' },
      { id: 'cyanCircle', type: 'color' },
      { id: 'blueCircle', type: 'color' },
      { id: 'purpleCircle', type: 'color' },
      { id: 'moonCircle', type: 'color' },
      { id: 'clearCircle', type: 'color' }
    ];
  }

  injectStyles() {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .aligner-icon-circle {
        position: relative !important;
        transform: none !important;
        margin: 0 4px !important;
        border-radius: 50%;
        filter: none;
        transition: all 0.2s ease;
      }
      
      .aligner-icon-circle:hover {
        transform: scale(1.15) !important;
        z-index: 10 !important;
      }
      
      .aligner-icon-circle .aligner-icon-bg {
        border-radius: 50%;
        box-shadow: 0 1px 6px rgba(0,0,0,0.25);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }

      .aligner-icon-circle[data-type="action"] {
        margin: 0 4px !important;
      }
      
      .aligner-icon-circle[data-type="action"]:before {
        display: none;
      }

      .aligner-icon-circle[data-type="action"] .aligner-icon-bg {
        background-color: inherit;
      }

      .aligner-icon-circle[data-type="action"]:hover .aligner-icon-bg {
        background-color: inherit !important;
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
        background: rgba(0, 0, 0, 0.75);
        border-radius: 10px;
        width: auto;
        box-shadow: 0 0 6px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(255, 255, 255, 0.15);
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  createContainer(parentContainer) {
    this.injectStyles();
    this.container = document.createElement('div');
    this.container.className = 'color-circles-container';
    parentContainer.appendChild(this.container);

    this.toolBar = new ToolBar(this.CONFIG, this.utils, this.utils.dom || this);
    this.toolBar.createContainer(parentContainer);
    
    return this.container;
  }

  createColorCircles(icons, dom) {
    const fragment = document.createDocumentFragment();
    
    this.ICONS = icons;
    
    this.COLOR_ICONS.forEach(iconInfo => {
      const icon = this.createColorCircle(iconInfo, dom);
      this.circles[iconInfo.id] = icon;
      
      const bg = icon.querySelector('.aligner-icon-bg');
      icon.addEventListener('mouseover', () => this.handleHover(icon, bg, true));
      icon.addEventListener('mouseout', () => this.handleHover(icon, bg, false));
      
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (this.handleActionCallback) {
          this.handleActionCallback(iconInfo.id);
        }
      });
      
      fragment.appendChild(icon);
    });
    
    this.arrowButton = new ArrowButton(this.CONFIG, dom);
    const arrowElement = this.arrowButton.create(this.CONFIG.iconSize / 2);
    
    const arrowBg = arrowElement.querySelector('.aligner-icon-bg');
    arrowElement.addEventListener('mouseover', () => this.handleHover(arrowElement, arrowBg, true));
    arrowElement.addEventListener('mouseout', () => this.handleHover(arrowElement, arrowBg, false));
    
    this.arrowButton.setCallback((isRotated) => {
      if (this.toolBar) {
        this.toolBar.toggle();
      }
    });
    
    fragment.appendChild(arrowElement);
    
    this.container.appendChild(fragment);

    if (this.toolBar) {
      this.toolBar.createTools(icons, dom);
      this.toolBar.setHandleToolActionCallback((toolType) => {
        this.handleToolAction(toolType, dom);
      });
    }
  }

  createColorCircle(iconInfo, dom) {
    const { id, type } = iconInfo;
    const size = this.CONFIG.iconSize / 2;

    const iconWrapper = dom.createElement('div', 'aligner-icon aligner-icon-circle');
    iconWrapper.dataset.id = id;
    iconWrapper.dataset.type = type;
    iconWrapper.style.width = `${size}px`;
    iconWrapper.style.height = `${size}px`;
    iconWrapper.style.pointerEvents = 'auto';
    iconWrapper.style.cursor = 'pointer';

    const bg = dom.createElement('div', 'aligner-icon-bg');

    if (id === 'clearCircle') {
      bg.style.backgroundColor = '#0C0C0C';
      bg.style.border = '1px solid rgba(200, 200, 200, 0.2)';
      
      const checkerboardOverlay = dom.createElement('div');
      checkerboardOverlay.style.position = 'absolute';
      checkerboardOverlay.style.width = '100%';
      checkerboardOverlay.style.height = '100%';
      checkerboardOverlay.style.borderRadius = '50%';
      checkerboardOverlay.style.background = `
        conic-gradient(rgba(200, 200, 200, 0.8) 0% 25%, transparent 0% 50%, 
                      rgba(200, 200, 200, 0.8) 0% 75%, transparent 0% 100%)
        0% 0% / 50% 50%
      `;
      
      bg.appendChild(checkerboardOverlay);
    } else if (id === 'moonCircle') {
      bg.style.background = 'transparent';
    
      const moonContainer = dom.createElement('div', '', {
        style: 'position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%;'
      });
    
      const moonBase = dom.createElement('div', '', {
        style: `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${this.CONFIG.colors.circle9};
          box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
        `
      });
    
      const moonMask = dom.createElement('div', '', {
        style: `
          position: absolute;
          top: -25%;
          left: -25%;
          width: 95%;
          height: 95%;
          border-radius: 50%;
          background-color: ${this.CONFIG.colors.bg};
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        `
      });
      
      moonContainer.appendChild(moonBase);
      moonContainer.appendChild(moonMask);
      bg.appendChild(moonContainer);
    } else {
      const colorName = id.replace('Circle', '').toLowerCase();
      const colorKey = this.CONFIG.colorMap[colorName];
      if (colorKey && this.CONFIG.colors[colorKey]) {
        bg.style.backgroundColor = this.CONFIG.colors[colorKey];
      } else {
        console.warn(`Unknown color circle: ${id}`);
        bg.style.backgroundColor = '#555555';
      }
    }

    iconWrapper.appendChild(bg);
    return iconWrapper;
  }

  updatePosition(centerX, centerY) {
    if (!this.container) return;

    const x = centerX - this.container.offsetWidth / 2;
    const y = centerY + 140;
    
    this.container.style.transform = `translate(${x}px, ${y}px)`;

    this.updateToolBarPosition(centerX, y + this.container.offsetHeight + 10);
  }
  
  updateToolBarPosition(centerX, y) {
    if (!this.toolBar) return;

    this.toolBar.updatePosition(centerX, y);
  }
  
  handleToolAction(toolType, dom) {
    if (toolType === 'bypass') {
      const result = this.toolBar.tools['bypass'].toggleNodesBypass(
        this.getComfyUIAppInstance.bind(this),
        this.getSelectedNodes.bind(this)
      );
      
      if (!result.success) {
        dom.showNotification(result.message, true);
      }
    }
  }

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
  }
  
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
  }
  
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
  }
  
  handleHover(icon, bg, isHovering) {
    const id = icon.dataset.id;
    const type = icon.dataset.type;
    if (!id) return;
    
    if (isHovering) {
      let shadowColor = 'rgba(255, 255, 255, 0.7)';
      
      if (type === 'action') {
        shadowColor = 'rgba(255, 255, 255, 0.7)';
      } else {
        const colorName = id.replace('Circle', '').toLowerCase();
        const colorKey = this.CONFIG.colorMap[colorName];
        
        if (colorKey && this.CONFIG.colors[colorKey]) {
          shadowColor = this.CONFIG.colors[colorKey];
          
          if (colorKey === 'circle8') {
            shadowColor = 'rgba(255, 255, 255, 0.8)';
          } else if (colorKey === 'circle9') {
            shadowColor = 'rgba(255, 215, 0, 0.5)';
          }
          
          if (shadowColor.includes('gradient')) {
            shadowColor = 'rgba(255, 215, 0, 0.5)';
          }
        }
      }

      bg.style.boxShadow = `0 0 8px 3px ${shadowColor}, inset 0 0 3px 1px ${shadowColor}`;
      icon.style.zIndex = 10;
      icon.style.transform = 'scale(1.15)';
    } else {
      bg.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      icon.style.zIndex = 1;
      icon.style.transform = 'scale(1)';
    }
  }

  setNodesColor(colorType, getComfyUIAppInstance, getSelectedNodes, getSelectedGroups) {
    try {
      const appInstance = getComfyUIAppInstance();
      if (!appInstance) {
        return { success: false, message: "Failed to get ComfyUI app instance" };
      }

      const selectedNodes = getSelectedNodes(appInstance);
      const selectedGroups = getSelectedGroups(appInstance);
      
      if (selectedNodes.length === 0 && selectedGroups.length === 0) {
        return { success: false, message: "Please select node or group first" };
      }

      let color;
      const colorName = colorType.replace('Circle', '').toLowerCase();
      
      const colorKey = this.CONFIG.colorMap[colorName];
      
      if (!colorKey || !this.CONFIG.colors[colorKey]) {
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
        color = this.CONFIG.colors[colorKey];
        
        selectedNodes.forEach(node => {
          if (this.CONFIG.applyToHeader && this.CONFIG.applyToPanel) {
            node.color = getDeeperColor(color);
            node.bgcolor = color;
          } else {
            if (this.CONFIG.applyToHeader) {
              node.color = color;
            }
            if (this.CONFIG.applyToPanel) {
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
      console.error("Failed to set color:", error);
      return { success: false, message: `Operation failed: ${error.message}` };
    }
  }

  openNativeColorPicker(getComfyUIAppInstance, getSelectedNodes, getSelectedGroups, dom) {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      dom.showNotification("Failed to get ComfyUI app instance");
      return;
    }

    const selectedNodes = getSelectedNodes(appInstance);
    const selectedGroups = getSelectedGroups(appInstance);
    
    if (selectedNodes.length === 0 && selectedGroups.length === 0) {
      dom.showNotification("Please select nodes or groups to apply color");
      return;
    }

    try {
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = selectedNodes.length > 0 ? 
                         (selectedNodes[0].color?.startsWith('#') ? selectedNodes[0].color : '#3355aa') : 
                         (selectedGroups.length > 0 ? (selectedGroups[0].color || '#3355aa') : '#3355aa');

      colorInput.style.position = 'absolute';
      colorInput.style.visibility = 'hidden';
      document.body.appendChild(colorInput);

      const { applyToHeader, applyToPanel } = this.CONFIG;
      
      const handleColorChange = (e) => {
        const color = e.target.value;
        
        selectedNodes.forEach(node => {
          if (node.constructor.type && node.constructor.type.includes("StartingNodeType")) {
            return;
          }
          
          if (applyToHeader && applyToPanel) {
            node.color = getDeeperColor(color);
            node.bgcolor = color;
          } else {
            if (applyToHeader) {
              node.color = color;
            }
            if (applyToPanel) {
              node.bgcolor = color;
            }
          }
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
    } catch (error) {
      console.error("Failed to open color picker:", error);
      dom.showNotification("Failed to open color picker", true);
    }
  }
  
  removeStyles() {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
      this.styleElement = null;
    }
    
    if (this.toolBar) {
      this.toolBar.removeStyles();
    }
    
    if (this.arrowButton) {
      this.arrowButton.removeStyles();
    }
  }
  
  setHandleActionCallback(callback) {
    this.handleActionCallback = callback;
  }
}
