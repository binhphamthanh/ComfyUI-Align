import { ByPass } from "../components/byPass.js";
import { Mute } from "../components/mute.js";
import { Pin } from "../components/pin.js";
import state from "../states/state.js";

export class ToolBar {
  constructor(config, utils, dom) {
    this.CONFIG = config;
    this.utils = utils;
    this.container = null;
    this.tools = {};
    this.styleElement = null;
    this.visible = false;
    this.handleToolActionCallback = null;
    this.dom = dom;
  }

  injectStyles() {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .tool-bar-container {
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
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease;
      }
      
      .tool-bar-container.visible {
        opacity: 1;
        visibility: visible;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  createContainer(parentContainer) {
    this.injectStyles();
    this.container = document.createElement('div');
    this.container.className = 'tool-bar-container';
    parentContainer.appendChild(this.container);
    
    return this.container;
  }

  createTools(icons, dom) {
    this.ICONS = icons;

    const bypassTool = new ByPass(this.CONFIG, dom);
    const bypassElement = bypassTool.create(this.CONFIG.iconSize / 2);
    
    const bypassBg = bypassElement.querySelector('.aligner-icon-bg');
    bypassElement.addEventListener('mouseover', () => this.handleHover(bypassElement, bypassBg, true));
    bypassElement.addEventListener('mouseout', () => this.handleHover(bypassElement, bypassBg, false));
    
    bypassTool.setCallback(() => {
      if (this.handleToolActionCallback) {
        this.handleToolActionCallback('bypass');
        this.handleToolFinished();
      }
    });
    
    this.tools['bypass'] = bypassTool;
    this.container.appendChild(bypassElement);

    const muteTool = new Mute(this.CONFIG, dom);
    const muteElement = muteTool.create(this.CONFIG.iconSize / 2);
    
    const muteBg = muteElement.querySelector('.aligner-icon-bg');
    muteElement.addEventListener('mouseover', () => this.handleHover(muteElement, muteBg, true));
    muteElement.addEventListener('mouseout', () => this.handleHover(muteElement, muteBg, false));
    
    muteTool.setCallback(() => {
      muteTool.toggleMute();
      this.handleToolFinished();
    });
    
    this.tools['mute'] = muteTool;
    this.container.appendChild(muteElement);

    const pinTool = new Pin(this.CONFIG, dom);
    const pinElement = pinTool.create(this.CONFIG.iconSize / 2);
    
    const pinBg = pinElement.querySelector('.aligner-icon-bg');
    pinElement.addEventListener('mouseover', () => this.handleHover(pinElement, pinBg, true));
    pinElement.addEventListener('mouseout', () => this.handleHover(pinElement, pinBg, false));
    
    pinTool.setCallback(() => {
      pinTool.togglePin();
      this.handleToolFinished();
    });
    
    this.tools['pin'] = pinTool;
    this.container.appendChild(pinElement);
  }

  handleToolFinished() {
    if (!state.shiftKeyPressed) {
      if (this.dom) {
        this.dom.hideUI();
      } else {
        this.hide();
      }
    }
  }

  handleHover(icon, bg, isHovering) {
    const id = icon.dataset.id;
    const type = icon.dataset.type;
    if (!id) return;
    
    if (isHovering) {
      let shadowColor = 'rgba(255, 255, 255, 0.7)';
      
      if (type === 'action') {
        shadowColor = 'rgba(255, 255, 255, 0.7)';
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

  updatePosition(centerX, y) {
    if (!this.container) return;

    const x = centerX - this.container.offsetWidth / 2;

    this.container.style.transform = `translate(${x}px, ${y}px)`;

    this.lastCenterX = centerX;
    this.lastY = y;
  }
  
  show() {
    if (!this.container) return;

    if (this.lastCenterX && this.lastY) {
      this.updatePosition(this.lastCenterX, this.lastY);
    }
    
    this.container.classList.add('visible');
    this.visible = true;
  }
  
  hide() {
    if (!this.container) return;
    this.container.classList.remove('visible');
    this.visible = false;
  }
  
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
    return this.visible;
  }
  
  removeStyles() {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }
  
  setHandleToolActionCallback(callback) {
    this.handleToolActionCallback = callback;
  }
} 