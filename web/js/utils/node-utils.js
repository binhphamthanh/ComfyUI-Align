import { getComfyUIAppInstance } from './comfy-app.js';

export { getComfyUIAppInstance };

export function getSelectedNodes(appInstance) {
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

export function getSelectedGroups(appInstance) {
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

export function getSelectedNonPinnedNodes(appInstance) {
  const selectedNodes = getSelectedNodes(appInstance);
  return selectedNodes.filter(node => !(node.flags?.pinned));
}

export function getNodesInGroup(appInstance, group) {
  if (!appInstance || !group) {
    return [];
  }

  const allNodes = appInstance.graph._nodes || [];

  const [groupX, groupY, groupWidth, groupHeight] = Array.isArray(group.bounding) && group.bounding.length >= 4
    ? group.bounding
    : [group.pos?.[0] || 0, group.pos?.[1] || 0, group.size?.[0] || 0, group.size?.[1] || 0];

  const nodesInGroup = allNodes.filter(node => {
    if (!node.pos || !node.size) {
      return false;
    }

    const nodeX = node.pos[0];
    const nodeY = node.pos[1];
    const nodeWidth = node.size[0];
    const nodeHeight = node.size[1];

    const isInside = (
      nodeX >= groupX &&
      nodeY >= groupY &&
      nodeX + nodeWidth <= groupX + groupWidth &&
      nodeY + nodeHeight <= groupY + groupHeight
    );

    return isInside;
  });

  return nodesInGroup;
}
