import { getComfyUIAppInstance, getSelectedNodes, getSelectedGroups } from '../utils/node-utils.js';
import { getGroupBounding } from '../utils/group-utils.js';
import { state } from '../core/state.js';

export function checkGroupAndNodesSelection() {
  const appInstance = getComfyUIAppInstance();
  if (!appInstance) return null;

  const selectedGroups = getSelectedGroups(appInstance);
  const selectedNodes = getSelectedNodes(appInstance);

  if (selectedGroups.length === 1 && selectedNodes.length > 0) {
    return {
      group: selectedGroups[0],
      nodes: selectedNodes
    };
  }

  return null;
}

export function alignNodesToGroupLeft() {
  try {
    const selection = checkGroupAndNodesSelection();
    if (!selection) {
      return { success: false, message: "Please select one node group and nodes inside it" };
    }

    const { group, nodes } = selection;
    const [groupX] = getGroupBounding(group);

    nodes.forEach(node => {
      node.pos[0] = groupX + 7;
    });

    const appInstance = getComfyUIAppInstance();
    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error("Failed to align nodes to group left edge:", error);
    return { success: false, message: `Alignment failed: ${error.message}` };
  }
}

export function alignNodesToGroupRight() {
  try {
    const selection = checkGroupAndNodesSelection();
    if (!selection) {
      return { success: false, message: "Please select one node group and nodes inside it" };
    }

    const { group, nodes } = selection;
    const [groupX, , groupWidth] = getGroupBounding(group);
    const groupRightEdge = groupX + groupWidth;

    nodes.forEach(node => {
      node.pos[0] = groupRightEdge - node.size[0] - 6;
    });

    const appInstance = getComfyUIAppInstance();
    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error("Failed to align nodes to group right edge:", error);
    return { success: false, message: `Alignment failed: ${error.message}` };
  }
}

export function alignNodesToGroupTop() {
  try {
    const selection = checkGroupAndNodesSelection();
    if (!selection) {
      return { success: false, message: "Please select one node group and nodes inside it" };
    }

    const { group, nodes } = selection;
    const [, groupY] = getGroupBounding(group);

    nodes.forEach(node => {
      node.pos[1] = groupY + 70;
    });

    const appInstance = getComfyUIAppInstance();
    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error("Failed to align nodes to group top edge:", error);
    return { success: false, message: `Alignment failed: ${error.message}` };
  }
}

export function alignNodesToGroupBottom() {
  try {
    const selection = checkGroupAndNodesSelection();
    if (!selection) {
      return { success: false, message: "Please select one node group and nodes inside it" };
    }

    const { group, nodes } = selection;
    const [, groupY, , groupHeight] = getGroupBounding(group);
    const groupBottomEdge = groupY + groupHeight;

    nodes.forEach(node => {
      node.pos[1] = groupBottomEdge - node.size[1] - 6;
    });

    const appInstance = getComfyUIAppInstance();
    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error("Failed to align nodes to group bottom edge:", error);
    return { success: false, message: `Alignment failed: ${error.message}` };
  }
}

function smartSortNodes(nodes, isHorizontal) {
  const originalPositions = {};
  nodes.forEach(node => {
    originalPositions[node.id] = {
      x: node.pos[0],
      y: node.pos[1]
    };
  });

  const primaryCoord = isHorizontal ? 'x' : 'y';
  const secondaryCoord = isHorizontal ? 'y' : 'x';

  const primaryValues = nodes.map(node => originalPositions[node.id][primaryCoord]);
  const allSamePrimary = primaryValues.every(val => Math.abs(val - primaryValues[0]) < 1);

  const sortedNodes = [...nodes].sort((a, b) => {
    const aPos = originalPositions[a.id];
    const bPos = originalPositions[b.id];

    if (allSamePrimary) {
      return aPos[secondaryCoord] - bPos[secondaryCoord];
    } else {
      return aPos[primaryCoord] - bPos[primaryCoord];
    }
  });

  return {
    sortedNodes,
    originalPositions
  };
}

export function alignNodesToGroupHorizontalCenter() {
  try {
    const selection = checkGroupAndNodesSelection();
    if (!selection) {
      return { success: false, message: "Please select one node group and nodes inside it" };
    }

    const { group, nodes } = selection;
    const [groupX, , groupWidth] = getGroupBounding(group);
    const appInstance = getComfyUIAppInstance();

    const { sortedNodes } = smartSortNodes(nodes, true);

    let referenceNode;
    if (state.altKeyPressed) {
      referenceNode = [...nodes].sort((a, b) => (b.pos[0] + b.size[0]) - (a.pos[0] + a.size[0]))[0];
    } else {
      referenceNode = [...nodes].sort((a, b) => a.pos[0] - b.pos[0])[0];
    }

    const referenceNodeY = referenceNode.pos[1];

    const config = window.alignerPlugin.getConfig();
    const spacing = config.horizontalSpacing;
    const safetyMargin = config.safetyMargin?.horizontal || 0;
    const effectiveSpacing = spacing + safetyMargin;

    if (state.altKeyPressed) {
      const rightEdge = groupX + groupWidth - 7;

      let currentX = rightEdge - sortedNodes[sortedNodes.length - 1].size[0];

      for (let i = sortedNodes.length - 1; i >= 0; i--) {
        const node = sortedNodes[i];
        node.pos[0] = currentX;
        node.pos[1] = referenceNodeY;

        if (i > 0) {
          currentX -= (effectiveSpacing + sortedNodes[i-1].size[0]);
        }
      }
    } else {
      let currentX = groupX + 7;

      sortedNodes.forEach((node, index) => {
        node.pos[0] = currentX;
        node.pos[1] = referenceNodeY;

        if (index < sortedNodes.length - 1) {
          currentX += node.size[0] + effectiveSpacing;
        }
      });
    }

    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error("Failed to align nodes to group horizontal center:", error);
    return { success: false, message: `Alignment failed: ${error.message}` };
  }
}

export function alignNodesToGroupVerticalCenter() {
  try {
    const selection = checkGroupAndNodesSelection();
    if (!selection) {
      return { success: false, message: "Please select one node group and nodes inside it" };
    }

    const { group, nodes } = selection;
    const [, groupY, , groupHeight] = getGroupBounding(group);
    const appInstance = getComfyUIAppInstance();

    const { sortedNodes } = smartSortNodes(nodes, false);

    let referenceNode;
    if (state.altKeyPressed) {
      referenceNode = [...nodes].sort((a, b) => (b.pos[1] + b.size[1]) - (a.pos[1] + a.size[1]))[0];
    } else {
      referenceNode = [...nodes].sort((a, b) => a.pos[1] - b.pos[1])[0];
    }

    const referenceNodeX = referenceNode.pos[0];

    const config = window.alignerPlugin.getConfig();
    const spacing = config.verticalSpacing;
    const safetyMargin = config.safetyMargin?.vertical || 0;
    const effectiveSpacing = spacing + safetyMargin;

    const topPadding = 70;
    const bottomPadding = 6;

    if (state.altKeyPressed) {
      const bottomEdge = groupY + groupHeight - bottomPadding;

      let currentY = bottomEdge - sortedNodes[sortedNodes.length - 1].size[1];

      for (let i = sortedNodes.length - 1; i >= 0; i--) {
        const node = sortedNodes[i];
        node.pos[1] = currentY;

        const nodeWidth = node.size[0];
        const referenceNodeWidth = referenceNode.size[0];
        const referenceNodeCenter = referenceNodeX + referenceNodeWidth / 2;
        node.pos[0] = referenceNodeCenter - nodeWidth / 2;

        if (i > 0) {
          currentY -= (effectiveSpacing + sortedNodes[i-1].size[1]);
        }
      }
    } else {
      let currentY = groupY + topPadding;

      sortedNodes.forEach((node, index) => {
        node.pos[1] = currentY;

        const nodeWidth = node.size[0];
        const referenceNodeWidth = referenceNode.size[0];
        const referenceNodeCenter = referenceNodeX + referenceNodeWidth / 2;
        node.pos[0] = referenceNodeCenter - nodeWidth / 2;

        if (index < sortedNodes.length - 1) {
          currentY += node.size[1] + effectiveSpacing;
        }
      });
    }

    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error("Failed to align nodes to group vertical center:", error);
    return { success: false, message: `Alignment failed: ${error.message}` };
  }
}
