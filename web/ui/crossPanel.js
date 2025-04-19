export class CrossPanel {
  constructor(config, utils, container, handleActionCallback) {
    this.CONFIG = config;
    this.utils = utils;
    this.container = container;
    this.handleActionCallback = handleActionCallback;
    this.styleElement = null;
    this.icons = {};
    
    this.ICONS_LIST = [
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
      { id: 'bottomStretch', type: 'stretch' }
    ];
    
    this.injectStyles();
  }

  injectStyles() {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .aligner-icon {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: ${this.CONFIG.transition};
        cursor: pointer;
        border-radius: 6px;
        pointer-events: auto;
      }
      
      .aligner-icon-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 6px;
        background-color: ${this.CONFIG.colors.bg};
        transition: background-color 0.2s ease;
        box-shadow: 0 0 4px rgba(180, 180, 180, 0.2);
      }
      
      .aligner-icon:hover .aligner-icon-bg {
        background-color: rgba(35, 35, 35, 0.95);
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
    document.head.appendChild(this.styleElement);
  }
  
  createElement(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }

  createIcon(iconInfo, index) {
    const { id, type } = iconInfo;
    const size = this.CONFIG.iconSize;

    const iconWrapper = this.createElement('div', 'aligner-icon');
    iconWrapper.dataset.id = id;
    iconWrapper.dataset.type = type;
    iconWrapper.style.width = `${size}px`;
    iconWrapper.style.height = `${size}px`;
    iconWrapper.style.pointerEvents = 'auto';

    const bg = this.createElement('div', 'aligner-icon-bg');
    bg.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    bg.style.boxShadow = '0 0 6px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(255, 255, 255, 0.15)';

    iconWrapper.appendChild(bg);

    const svg = this.utils.createSVG(id);
    svg.style.position = 'absolute';
    svg.style.top = '50%';
    svg.style.left = '50%';
    svg.style.transform = 'translate(-50%, -50%)';
    iconWrapper.appendChild(svg);
    
    return iconWrapper;
  }
  
  createIcons() {
    const fragment = document.createDocumentFragment();
    
    this.ICONS_LIST.forEach((iconInfo, index) => {
      const icon = this.createIcon(iconInfo, index);
      this.icons[iconInfo.id] = icon;
      fragment.appendChild(icon);
    });
    
    this.container.appendChild(fragment);
    this.setupEventListeners();
    
    return this.icons;
  }
  
  updatePositions(centerX, centerY) {
    Object.entries(this.icons).forEach(([id, icon], index) => {
      const relativePos = this.utils.calculatePosition(index, 0, 0);
      if (relativePos) {
        const [relX, relY] = relativePos;
        icon.style.transform = `translate(${centerX + relX}px, ${centerY + relY}px)`;
      }
    });
  }
  
  handleIconHover(icon, bg, isHovering) {
    bg.style.backgroundColor = isHovering ? this.CONFIG.colors.hover : this.CONFIG.colors.bg;
  }
  
  setupEventListeners() {
    Object.values(this.icons).forEach(icon => {
      const bg = icon.querySelector('.aligner-icon-bg');
      
      icon.addEventListener('mouseover', () => {
        this.handleIconHover(icon, bg, true);
      });
      
      icon.addEventListener('mouseout', () => {
        this.handleIconHover(icon, bg, false);
      });
      
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = icon.dataset.id;
        if (action && this.handleActionCallback) {
          this.handleActionCallback(action);
        }
      });
    });
  }
  
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
  }
  
  getIcons() {
    return this.icons;
  }

  removeStyles() {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }

  executeNodeOperation(operationType, operationFn, getComfyUIAppInstance, getSelectedNodes) {
    try {
      const appInstance = getComfyUIAppInstance();
      if (!appInstance) {
        return { success: false, message: "Failed to get ComfyUI app instance" };
      }

      const selectedNodes = getSelectedNodes(appInstance);
      const pinnedNodes = selectedNodes.filter(node => node.flags?.pinned);
      const nonPinnedNodes = selectedNodes.filter(node => !(node.flags?.pinned));

      if (pinnedNodes.length > 0 || nonPinnedNodes.length <= 1) {
        let errorMessage = "Cannot perform operation.";
        
        if (pinnedNodes.length > 0) {
          if (operationType === "alignment") {
            errorMessage = "Cannot perform alignment. Some nodes are pinned.";
          } else if (operationType === "resizing") {
            errorMessage = "Cannot perform resizing. Some nodes are pinned.";
          } else {
            errorMessage = "Cannot perform operation. Some nodes are pinned.";
          }
        } else {
          errorMessage = "At least two nodes must be selected.";
        }
        
        return { success: false, message: errorMessage };
      }

      operationFn(nonPinnedNodes);
      appInstance.graph.setDirtyCanvas(true, true);
      
      return { success: true };
    } catch (error) {
      return { success: false, message: `Operation failed: ${error.message}` };
    }
  }

  alignNodesToLeft(getComfyUIAppInstance, getSelectedNodes) {
    return this.executeNodeOperation("alignment", nodes => {
      const leftmostX = Math.min(...nodes.map(node => node.pos[0]));
      nodes.forEach(node => {
        node.pos[0] = leftmostX;
      });
    }, getComfyUIAppInstance, getSelectedNodes);
  }
  
  alignNodesToRight(getComfyUIAppInstance, getSelectedNodes) {
    return this.executeNodeOperation("alignment", nodes => {
      const rightmostEdge = Math.max(...nodes.map(node => node.pos[0] + node.size[0]));
      nodes.forEach(node => {
        node.pos[0] = rightmostEdge - node.size[0];
      });
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  alignNodesToTop(getComfyUIAppInstance, getSelectedNodes) {
    return this.executeNodeOperation("alignment", nodes => {
      const topmostY = Math.min(...nodes.map(node => node.pos[1]));
      nodes.forEach(node => {
        node.pos[1] = topmostY;
      });
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  alignNodesToBottom(getComfyUIAppInstance, getSelectedNodes) {
    return this.executeNodeOperation("alignment", nodes => {
      const bottommostEdge = Math.max(...nodes.map(node => node.pos[1] + node.size[1]));
      nodes.forEach(node => {
        node.pos[1] = bottommostEdge - node.size[1];
      });
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  alignNodesToHorizontalCenter(getComfyUIAppInstance, getSelectedNodes, altKeyPressed) {
    return this.executeNodeOperation("alignment", nodes => {
      this.alignNodesToHorizontalCenterInternal(nodes, altKeyPressed);
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  alignNodesToVerticalCenter(getComfyUIAppInstance, getSelectedNodes, altKeyPressed) {
    return this.executeNodeOperation("alignment", nodes => {
      this.alignNodesToVerticalCenterInternal(nodes, altKeyPressed);
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  stretchNodesToLeft(getComfyUIAppInstance, getSelectedNodes) {
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
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  stretchNodesToRight(getComfyUIAppInstance, getSelectedNodes) {
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
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  stretchNodesToTop(getComfyUIAppInstance, getSelectedNodes) {
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
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  stretchNodesToBottom(getComfyUIAppInstance, getSelectedNodes) {
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
    }, getComfyUIAppInstance, getSelectedNodes);
  }
  
  stretchNodesHorizontally(getComfyUIAppInstance, getSelectedNodes, altKeyPressed) {
    return this.executeNodeOperation("resizing", nodes => {
      let targetWidth;
      if (altKeyPressed) {
        targetWidth = Math.min(...nodes.map(node => node.size[0]));
      } else {
        targetWidth = Math.max(...nodes.map(node => node.size[0]));
      }

      targetWidth = Math.max(targetWidth, this.CONFIG.minNodeSize.width);

      nodes.forEach(node => {
        if (node.size[0] !== targetWidth) {
          const centerX = node.pos[0] + (node.size[0] / 2);
          node.size[0] = targetWidth;
          node.pos[0] = centerX - (targetWidth / 2);
        }
      });
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  stretchNodesVertically(getComfyUIAppInstance, getSelectedNodes, altKeyPressed) {
    return this.executeNodeOperation("resizing", nodes => {
      let targetHeight;
      if (altKeyPressed) {
        targetHeight = Math.min(...nodes.map(node => node.size[1]));
      } else {
        targetHeight = Math.max(...nodes.map(node => node.size[1]));
      }

      targetHeight = Math.max(targetHeight, this.CONFIG.minNodeSize.height);

      nodes.forEach(node => {
        if (node.size[1] !== targetHeight) {
          const centerY = node.pos[1] + (node.size[1] / 2);
          node.size[1] = targetHeight;
          node.pos[1] = centerY - (targetHeight / 2);
        }
      });
    }, getComfyUIAppInstance, getSelectedNodes);
  }

  alignNodesToHorizontalCenterInternal(nodes, altKeyPressed) {
    const sortedNodes = [...nodes].sort((a, b) => a.pos[0] - b.pos[0]);
    
    const leftmostX = Math.min(...nodes.map(node => node.pos[0]));
    
    const referenceNode = altKeyPressed 
      ? sortedNodes[sortedNodes.length - 1]
      : sortedNodes[0];
    
    const referenceNodeTopY = referenceNode.pos[1];
    
    nodes.forEach(node => {
      node.pos[1] = referenceNodeTopY;
    });
    
    const effectiveMinSpacing = this.CONFIG.horizontalMinSpacing + this.CONFIG.safetyMargin.horizontal;
    
    if (altKeyPressed) {
      const rightNodeRightEdge = referenceNode.pos[0] + referenceNode.size[0];
      
      let currentX = rightNodeRightEdge;
      
      for (let i = sortedNodes.length - 1; i >= 0; i--) {
        const node = sortedNodes[i];
        currentX -= node.size[0];
        node.pos[0] = currentX;
        
        if (i > 0) {
          currentX -= effectiveMinSpacing;
        }
      }
    } else {
      let currentX = leftmostX;
      sortedNodes.forEach((node, index) => {
        node.pos[0] = currentX;
        
        if (index < sortedNodes.length - 1) {
          currentX += node.size[0] + effectiveMinSpacing;
        }
      });
    }
  }

  alignNodesToVerticalCenterInternal(nodes, altKeyPressed) {
    const sortedNodes = [...nodes].sort((a, b) => a.pos[1] - b.pos[1]);
    
    const topmostY = Math.min(...nodes.map(node => node.pos[1]));
    
    const referenceNode = altKeyPressed 
      ? sortedNodes[sortedNodes.length - 1]
      : sortedNodes[0];
    
    const referenceNodeCenterX = referenceNode.pos[0] + (referenceNode.size[0] / 2);

    nodes.forEach(node => {
      const nodeCenterX = node.pos[0] + (node.size[0] / 2);
      const offsetX = referenceNodeCenterX - nodeCenterX;
      node.pos[0] += offsetX;
    });

    const effectiveMinSpacing = this.CONFIG.verticalMinSpacing + this.CONFIG.safetyMargin.vertical;
    
    if (altKeyPressed) {
      const bottomNodeBottomEdge = referenceNode.pos[1] + referenceNode.size[1];
      
      let currentY = bottomNodeBottomEdge;
      
      for (let i = sortedNodes.length - 1; i >= 0; i--) {
        const node = sortedNodes[i];
        currentY -= node.size[1];
        node.pos[1] = currentY;
        
        if (i > 0) {
          currentY -= effectiveMinSpacing;
        }
      }
    } else {
      let currentY = topmostY;
      sortedNodes.forEach((node, index) => {
        node.pos[1] = currentY;
        
        if (index < sortedNodes.length - 1) {
          currentY += node.size[1] + effectiveMinSpacing;
        }
      });
    }
  }
}
