import { state } from '../core/state.js';
import { executeGroupOperation, executeSingleGroupOperation } from './operations.js';
import { getGroupBounding, setGroupBounding } from '../utils/group-utils.js';
import { getComfyUIAppInstance } from '../utils/comfy-app.js';

const TITLE_BAR_PADDING = 64;
const DEFAULT_PADDING = 6;
const HORIZONTAL_OFFSET = 1;
const VERTICAL_OFFSET = 1;

export async function stretchGroupsToLeft() {
  return await executeGroupOperation(groups => {
    const leftmostX = Math.min(...groups.map(group => {
      const [x] = getGroupBounding(group);
      return x;
    }));

    const isLeftAligned = groups.every(group => {
      const [x] = getGroupBounding(group);
      return Math.abs(x - leftmostX) < 1;
    });

    if (isLeftAligned) {
      const minWidth = Math.min(...groups.map(group => {
        const [,, width] = getGroupBounding(group);
        return width;
      }));

      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);
        if (width > minWidth) {
          setGroupBounding(group, x, y, minWidth, height, true, false);
        }
      });
    } else {
      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);

        if (x > leftmostX) {
          const rightEdge = x + width;
          const config = window.alignerPlugin.getConfig();
          const minWidth = config.minNodeSize?.width || 50;
          const newWidth = Math.max(rightEdge - leftmostX, minWidth);

          setGroupBounding(group, leftmostX, y, newWidth, height, true, false);
        }
      });
    }
  });
}

export async function stretchGroupsToRight() {
  return await executeGroupOperation(groups => {
    const rightmostEdge = Math.max(...groups.map(group => {
      const [x,, width] = getGroupBounding(group);
      return x + width;
    }));

    const isRightAligned = groups.every(group => {
      const [x,, width] = getGroupBounding(group);
      return Math.abs((x + width) - rightmostEdge) < 1;
    });

    if (isRightAligned) {
      const minWidth = Math.min(...groups.map(group => {
        const [,, width] = getGroupBounding(group);
        return width;
      }));

      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);
        if (width > minWidth) {
          const rightEdge = x + width;
          setGroupBounding(group, rightEdge - minWidth, y, minWidth, height, true, false);
        }
      });
    } else {
      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);

        if (x + width < rightmostEdge) {
          const config = window.alignerPlugin.getConfig();
          const minWidth = config.minNodeSize?.width || 50;
          const newWidth = Math.max(rightmostEdge - x, minWidth);

          setGroupBounding(group, x, y, newWidth, height, true, false);
        }
      });
    }
  });
}

export async function stretchGroupsToTop() {
  return await executeGroupOperation(groups => {
    const topmostY = Math.min(...groups.map(group => {
      const [, y] = getGroupBounding(group);
      return y;
    }));

    const isTopAligned = groups.every(group => {
      const [, y] = getGroupBounding(group);
      return Math.abs(y - topmostY) < 1;
    });

    if (isTopAligned) {
      const minHeight = Math.min(...groups.map(group => {
        const [,,, height] = getGroupBounding(group);
        return height;
      }));

      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);
        if (height > minHeight) {
          setGroupBounding(group, x, y, width, minHeight, true, false);
        }
      });
    } else {
      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);

        if (y > topmostY) {
          const bottomEdge = y + height;
          const config = window.alignerPlugin.getConfig();
          const minHeight = config.minNodeSize?.height || 50;
          const newHeight = Math.max(bottomEdge - topmostY, minHeight);

          setGroupBounding(group, x, topmostY, width, newHeight, true, false);
        }
      });
    }
  });
}

export async function stretchGroupsToBottom() {
  return await executeGroupOperation(groups => {
    const bottommostEdge = Math.max(...groups.map(group => {
      const [, y,, height] = getGroupBounding(group);
      return y + height;
    }));

    const isBottomAligned = groups.every(group => {
      const [, y,, height] = getGroupBounding(group);
      return Math.abs((y + height) - bottommostEdge) < 1;
    });

    if (isBottomAligned) {
      const minHeight = Math.min(...groups.map(group => {
        const [,,, height] = getGroupBounding(group);
        return height;
      }));

      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);
        if (height > minHeight) {
          const bottomEdge = y + height;
          setGroupBounding(group, x, bottomEdge - minHeight, width, minHeight, true, false);
        }
      });
    } else {
      groups.forEach(group => {
        const [x, y, width, height] = getGroupBounding(group);

        if (y + height < bottommostEdge) {
          const config = window.alignerPlugin.getConfig();
          const minHeight = config.minNodeSize?.height || 50;
          const newHeight = Math.max(bottommostEdge - y, minHeight);

          setGroupBounding(group, x, y, width, newHeight, true, false);
        }
      });
    }
  });
}

export async function stretchGroupsHorizontally() {
  return await executeGroupOperation(groups => {
    const isAltPressed = state.altKeyPressed;
    const widthSelector = isAltPressed ? Math.min : Math.max;
    const targetWidth = Math.max(
      widthSelector(...groups.map(group => getGroupBounding(group)[2])),
      window.alignerPlugin.getConfig().minNodeSize?.width || 50
    );

    const appInstance = getComfyUIAppInstance();

    groups.forEach(group => {
      const [x, y, width, height] = getGroupBounding(group);

      if (width === targetWidth) return;

      const centerX = x + (width / 2);
      const defaultLeftX = centerX - (targetWidth / 2);

      if (!isAltPressed || !appInstance) {
        setGroupBounding(group, defaultLeftX, y, targetWidth, height, true, false);
        return;
      }

      const nodesInGroup = appInstance.graph._nodes.filter(node =>
        node.pos && node.size &&
        node.pos[0] >= x &&
        node.pos[1] >= y &&
        node.pos[0] + node.size[0] <= x + width &&
        node.pos[1] + node.size[1] <= y + height
      );

      if (nodesInGroup.length === 0) {
        setGroupBounding(group, defaultLeftX, y, targetWidth, height, true, false);
        return;
      }

      const bounds = calculateNodeBounds(nodesInGroup);
      if (!bounds) {
        setGroupBounding(group, defaultLeftX, y, targetWidth, height, true, false);
        return;
      }

      const { minX, maxX } = bounds;
      const paddedMinX = minX - DEFAULT_PADDING - HORIZONTAL_OFFSET;
      const paddedMaxX = maxX + DEFAULT_PADDING;
      const nodeWidth = paddedMaxX - paddedMinX;

      const finalWidth = Math.max(targetWidth, nodeWidth);
      setGroupBounding(group, paddedMinX, y, finalWidth, height, false, false);
    });
  });
}

export async function stretchGroupsVertically() {
  return await executeGroupOperation(groups => {
    const isAltPressed = state.altKeyPressed;
    const heightSelector = isAltPressed ? Math.min : Math.max;
    const targetHeight = Math.max(
      heightSelector(...groups.map(group => getGroupBounding(group)[3])),
      window.alignerPlugin.getConfig().minNodeSize?.height || 50
    );

    const appInstance = getComfyUIAppInstance();

    groups.forEach(group => {
      const [x, y, width, height] = getGroupBounding(group);

      if (height === targetHeight) return;

      const centerY = y + (height / 2);
      const defaultTopY = centerY - (targetHeight / 2);

      if (!isAltPressed || !appInstance) {
        setGroupBounding(group, x, defaultTopY, width, targetHeight, true, false);
        return;
      }

      const nodesInGroup = appInstance.graph._nodes.filter(node =>
        node.pos && node.size &&
        node.pos[0] >= x &&
        node.pos[1] >= y &&
        node.pos[0] + node.size[0] <= x + width &&
        node.pos[1] + node.size[1] <= y + height
      );

      if (nodesInGroup.length === 0) {
        setGroupBounding(group, x, defaultTopY, width, targetHeight, true, false);
        return;
      }

      const bounds = calculateNodeBounds(nodesInGroup);
      if (!bounds) {
        setGroupBounding(group, x, defaultTopY, width, targetHeight, true, false);
        return;
      }

      const { minY, maxY } = bounds;
      const paddedMinY = minY - (DEFAULT_PADDING + TITLE_BAR_PADDING) - VERTICAL_OFFSET;
      const paddedMaxY = maxY + DEFAULT_PADDING;
      const nodeHeight = paddedMaxY - paddedMinY;

      const finalHeight = Math.max(targetHeight, nodeHeight);
      setGroupBounding(group, x, paddedMinY, width, finalHeight, false, false);
    });
  });
}

function calculateNodeBounds(nodesInGroup) {
  if (!nodesInGroup || nodesInGroup.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodesInGroup.forEach(node => {
    const nodeX = node.pos[0];
    const nodeY = node.pos[1];
    const nodeWidth = node.size[0];
    const nodeHeight = node.size[1];

    minX = Math.min(minX, nodeX);
    minY = Math.min(minY, nodeY);
    maxX = Math.max(maxX, nodeX + nodeWidth);
    maxY = Math.max(maxY, nodeY + nodeHeight);
  });

  return { minX, minY, maxX, maxY };
}

function fitGroupToNodes(group, nodesInGroup, padding = DEFAULT_PADDING) {
  const bounds = calculateNodeBounds(nodesInGroup);
  if (!bounds) {
    console.log("fitGroupToNodes: No nodes in group, skipping");
    return;
  }

  const { minX, minY, maxX, maxY } = bounds;

  const paddedMinX = minX - padding - HORIZONTAL_OFFSET;
  const paddedMinY = minY - padding - VERTICAL_OFFSET;
  const paddedMaxX = maxX + padding + HORIZONTAL_OFFSET;
  const paddedMaxY = maxY + padding + VERTICAL_OFFSET;

  const width = paddedMaxX - paddedMinX;
  const height = paddedMaxY - paddedMinY;

  setGroupBounding(group, paddedMinX, paddedMinY, width, height, false, false);
}

export async function stretchSingleGroupToFitNodes() {
  return await executeSingleGroupOperation((group, nodesInGroup) => {
    if (!validateNodesInGroup(nodesInGroup, "stretchSingleGroupToFitNodes")) return;
    fitGroupToNodes(group, nodesInGroup);
  });
}

function validateNodesInGroup(nodesInGroup, operationName) {
  if (!nodesInGroup || nodesInGroup.length === 0) {
    console.log(`${operationName}: No nodes in group, skipping`);
    return false;
  }
  return true;
}

export async function stretchSingleGroupToLeft() {
  return await executeSingleGroupOperation((group, nodesInGroup) => {
    if (!validateNodesInGroup(nodesInGroup, "stretchSingleGroupToLeft")) return;

    const bounds = calculateNodeBounds(nodesInGroup);
    if (!bounds) return;

    const { minX } = bounds;
    const paddedMinX = minX - DEFAULT_PADDING - HORIZONTAL_OFFSET;

    const [x, y, width, height] = getGroupBounding(group);
    const rightEdge = x + width;
    const newWidth = rightEdge - paddedMinX;

    setGroupBounding(group, paddedMinX, y, newWidth, height, false, false);
  });
}

export async function stretchSingleGroupToRight() {
  return await executeSingleGroupOperation((group, nodesInGroup) => {
    if (!validateNodesInGroup(nodesInGroup, "stretchSingleGroupToRight")) return;

    const bounds = calculateNodeBounds(nodesInGroup);
    if (!bounds) return;

    const { maxX } = bounds;
    const paddedMaxX = maxX + DEFAULT_PADDING;

    const [x, y, , height] = getGroupBounding(group);
    const newWidth = paddedMaxX - x;

    setGroupBounding(group, x, y, newWidth, height, false, false);
  });
}

export async function stretchSingleGroupToTop() {
  return await executeSingleGroupOperation((group, nodesInGroup) => {
    if (!validateNodesInGroup(nodesInGroup, "stretchSingleGroupToTop")) return;

    const bounds = calculateNodeBounds(nodesInGroup);
    if (!bounds) return;

    const { minY } = bounds;
    const paddedMinY = minY - (DEFAULT_PADDING + TITLE_BAR_PADDING) - VERTICAL_OFFSET;

    const [x, y, width, height] = getGroupBounding(group);
    const bottomEdge = y + height;
    const newHeight = bottomEdge - paddedMinY;

    setGroupBounding(group, x, paddedMinY, width, newHeight, false, false);
  });
}

export async function stretchSingleGroupToBottom() {
  return await executeSingleGroupOperation((group, nodesInGroup) => {
    if (!validateNodesInGroup(nodesInGroup, "stretchSingleGroupToBottom")) return;

    const bounds = calculateNodeBounds(nodesInGroup);
    if (!bounds) return;

    const { maxY } = bounds;
    const paddedMaxY = maxY + DEFAULT_PADDING;

    const [x, y, width, ] = getGroupBounding(group);
    const newHeight = paddedMaxY - y;

    setGroupBounding(group, x, y, width, newHeight, false, false);
  });
}

export async function stretchSingleGroupHorizontally() {
  return await executeSingleGroupOperation((group, nodesInGroup) => {
    if (!validateNodesInGroup(nodesInGroup, "stretchSingleGroupHorizontally")) return;

    const bounds = calculateNodeBounds(nodesInGroup);
    if (!bounds) return;

    const { minX, maxX } = bounds;
    const paddedMinX = minX - DEFAULT_PADDING - HORIZONTAL_OFFSET;
    const paddedMaxX = maxX + DEFAULT_PADDING;

    const [, y, , height] = getGroupBounding(group);
    const newWidth = paddedMaxX - paddedMinX;

    setGroupBounding(group, paddedMinX, y, newWidth, height, false, false);
  });
}

export async function stretchSingleGroupVertically() {
  return await executeSingleGroupOperation((group, nodesInGroup) => {
    if (!validateNodesInGroup(nodesInGroup, "stretchSingleGroupVertically")) return;

    const bounds = calculateNodeBounds(nodesInGroup);
    if (!bounds) return;

    const { minY, maxY } = bounds;
    const paddedMinY = minY - (DEFAULT_PADDING + TITLE_BAR_PADDING) - VERTICAL_OFFSET;
    const paddedMaxY = maxY + DEFAULT_PADDING;

    const [x, , width, ] = getGroupBounding(group);
    const newHeight = paddedMaxY - paddedMinY;

    setGroupBounding(group, x, paddedMinY, width, newHeight, false, false);
  });
}

