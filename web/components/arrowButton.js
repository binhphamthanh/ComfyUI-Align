import { ICONS } from "../assets/icons.js";

export class ArrowButton {
  constructor(config, dom) {
    this.CONFIG = config;
    this.dom = dom;
    this.isRotated = false;
    this.element = null;
    this.arrowElement = null;
    this.callback = null;
    this.styleElement = null;
    this.injectStyles();
  }
  
  injectStyles() {
    if (this.styleElement) return;
    
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .aligner-icon-circle[data-id="arrowButton"] {
        margin: 0 4px !important;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  create(size) {
    const buttonWrapper = this.dom.createElement('div', 'aligner-icon aligner-icon-circle');
    buttonWrapper.dataset.id = 'arrowButton';
    buttonWrapper.dataset.type = 'action';
    buttonWrapper.style.width = `${size}px`;
    buttonWrapper.style.height = `${size}px`;
    buttonWrapper.style.pointerEvents = 'auto';
    buttonWrapper.style.cursor = 'pointer';
    buttonWrapper.style.display = 'flex';
    buttonWrapper.style.alignItems = 'center';
    buttonWrapper.style.justifyContent = 'center';

    const bg = this.dom.createElement('div', 'aligner-icon-bg');
    bg.style.backgroundColor = 'rgba(39, 39, 39, 0.7)';
    bg.style.width = '100%';
    bg.style.height = '100%';
    bg.style.display = 'flex';
    bg.style.alignItems = 'center';
    bg.style.justifyContent = 'center';
    
    const arrowContainer = this.dom.createElement('div');
    arrowContainer.style.width = '60%';
    arrowContainer.style.height = '60%';
    arrowContainer.style.display = 'flex';
    arrowContainer.style.alignItems = 'center';
    arrowContainer.style.justifyContent = 'center';
    arrowContainer.innerHTML = ICONS.arrow;
    
    const svg = arrowContainer.querySelector('svg');
    if (svg) {
      svg.style.width = '90%';
      svg.style.height = '90%';
      svg.style.transition = 'transform 0.3s ease';

      const path = svg.querySelector('path');
      if (path) {
        path.setAttribute('fill', '#FFFFFF');
      }
    }

    bg.appendChild(arrowContainer);
    buttonWrapper.appendChild(bg);
    this.element = buttonWrapper;
    this.arrowElement = svg;

    buttonWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
      
      if (this.callback) {
        this.callback(this.isRotated);
      }
    });

    return buttonWrapper;
  }

  toggle() {
    this.isRotated = !this.isRotated;
    if (this.arrowElement) {
      this.arrowElement.style.transform = this.isRotated ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  }

  setCallback(callback) {
    this.callback = callback;
  }
  
  removeStyles() {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }
} 