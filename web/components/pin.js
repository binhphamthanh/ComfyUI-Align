import { ICONS } from "../assets/icons.js";
import { getComfyUIAppInstance, getSelectedNodes } from "../actions/selection.js";

export class Pin {
  constructor(config, dom) {
    this.CONFIG = config;
    this.dom = dom;
    this.element = null;
    this.callback = null;
  }

  create(size) {
    const buttonWrapper = this.dom.createElement('div', 'aligner-icon aligner-icon-circle');
    buttonWrapper.dataset.id = 'pinButton';
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
    
    const iconContainer = this.dom.createElement('div');
    iconContainer.style.width = '80%';
    iconContainer.style.height = '80%';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.innerHTML = ICONS.pin;
    
    const svg = iconContainer.querySelector('svg');
    if (svg) {
      svg.style.width = '90%';
      svg.style.height = '90%';
    }

    bg.appendChild(iconContainer);
    buttonWrapper.appendChild(bg);
    this.element = buttonWrapper;

    buttonWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (this.callback) {
        this.callback();
      }
    });

    return buttonWrapper;
  }

  setCallback(callback) {
    this.callback = callback;
  }
  
  togglePin = () => {
    return this.toggleNodesPin(getComfyUIAppInstance, getSelectedNodes);
  }
  
  toggleNodesPin(getComfyUIAppInstance, getSelectedNodes) {
    try {
      const appInstance = getComfyUIAppInstance();
      if (!appInstance) {
        return { success: false, message: "Failed to get ComfyUI app instance" };
      }

      const selectedNodes = getSelectedNodes(appInstance);
      if (selectedNodes.length === 0) {
        return { success: false, message: "Please select nodes to toggle pinned status" };
      }

      const anyUnpinned = selectedNodes.some(node => !(node.flags?.pinned));
      
      if (anyUnpinned) {
        selectedNodes.forEach(node => {
          if (!node.flags) {
            node.flags = {};
          }
          if (!node.flags.pinned) {
            node.flags.pinned = true;
          }
        });
      } else {
        selectedNodes.forEach(node => {
          if (node.flags) {
            node.flags.pinned = false;
          }
        });
      }

      appInstance.graph.setDirtyCanvas(true, true);
      
      return { success: true };
    } catch (error) {
      return { success: false, message: `Operation failed: ${error.message}` };
    }
  }
} 