import { getComfyUIAppInstance, getNodesInGroup } from './node-utils.js';

let groupNodeRelationships = {};

export function recordGroupNodeRelationships(groups) {
  const appInstance = getComfyUIAppInstance();
  if (!appInstance) {
    return;
  }

  groupNodeRelationships = {};

  groups.forEach(group => {
    if (!group.id) {
      return;
    }

    const nodesInGroup = getNodesInGroup(appInstance, group);

    const groupX = group.bounding ? group.bounding[0] : (group.pos ? group.pos[0] : group.x || 0);
    const groupY = group.bounding ? group.bounding[1] : (group.pos ? group.pos[1] : group.y || 0);
    const groupWidth = group.bounding ? group.bounding[2] : (group.size ? group.size[0] : group.width || 0);
    const groupHeight = group.bounding ? group.bounding[3] : (group.size ? group.size[1] : group.height || 0);

    const nodeInfos = nodesInGroup.map(node => {
      const relativeX = node.pos[0] - groupX;
      const relativeY = node.pos[1] - groupY;

      const relativePercentX = groupWidth > 0 ? relativeX / groupWidth : 0;
      const relativePercentY = groupHeight > 0 ? relativeY / groupHeight : 0;

      return {
        id: node.id,
        type: node.type,
        pos: [...node.pos],
        relativeX,
        relativeY,
        relativePercentX,
        relativePercentY
      };
    });

    groupNodeRelationships[group.id] = {
      id: group.id,
      title: group.title || 'Group',
      nodes: nodeInfos
    };
  });
}

export function getNodesInGroupFromRelationships(group, appInstance) {
  if (!group.id || !groupNodeRelationships[group.id]) {
    return getNodesInGroup(appInstance, group);
  }

  const relationship = groupNodeRelationships[group.id];
  const allNodes = appInstance.graph._nodes || [];

  const nodesInGroup = relationship.nodes
    .map(nodeInfo => {
      const node = allNodes.find(node => node.id === nodeInfo.id);
      return node;
    })
    .filter(node => node);

  return nodesInGroup;
}

export function calculateMinimumBoundingBox(appInstance, group, padding = 10) {
  const nodesInGroup = getNodesInGroup(appInstance, group);

  if (nodesInGroup.length === 0) {
    const currentBounding = getGroupBounding(group);
    return currentBounding;
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

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const result = [minX, minY, maxX - minX, maxY - minY];
  return result;
}

export function getGroupBounding(group) {
  if (Array.isArray(group.bounding) && group.bounding.length >= 4) {
    return group.bounding;
  }

  if (typeof group.pos !== 'undefined' && typeof group.size !== 'undefined') {
    return [group.pos[0], group.pos[1], group.size[0], group.size[1]];
  }

  if (typeof group.x !== 'undefined' && typeof group.y !== 'undefined' &&
      typeof group.width !== 'undefined' && typeof group.height !== 'undefined') {
    return [group.x, group.y, group.width, group.height];
  }

  const x = group.x || group.pos_x || 0;
  const y = group.y || group.pos_y || 0;
  const width = group.width || group.size_x || 100;
  const height = group.height || group.size_y || 100;

  return [x, y, width, height];
}

export function setGroupBounding(group, x, y, width, height, ensureNodesEnclosed = false, moveNodes = true) {
  const appInstance = getComfyUIAppInstance();
  if (!appInstance) {
    return;
  }

  const [oldX, oldY] = getGroupBounding(group);
  const nodesInGroup = getNodesInGroupFromRelationships(group, appInstance);

  const nodeRelativePositions = nodesInGroup.map(node => {
    if (group.id && groupNodeRelationships[group.id]) {
      const nodeInfo = groupNodeRelationships[group.id].nodes.find(n => n.id === node.id);
      if (nodeInfo) {
        if (nodeInfo.relativePercentX !== undefined && nodeInfo.relativePercentY !== undefined) {
          const relativeX = nodeInfo.relativePercentX * width;
          const relativeY = nodeInfo.relativePercentY * height;

          return {
            node,
            relativeX,
            relativeY
          };
        }

        return {
          node,
          relativeX: nodeInfo.relativeX,
          relativeY: nodeInfo.relativeY
        };
      }
    }

    return {
      node,
      relativeX: node.pos[0] - oldX,
      relativeY: node.pos[1] - oldY
    };
  });

  if (ensureNodesEnclosed && nodesInGroup.length > 0) {
    const [minX, minY, minWidth, minHeight] = calculateMinimumBoundingBox(appInstance, group);

    const adjustedX = Math.min(x, minX);
    const adjustedY = Math.min(y, minY);

    const adjustedWidth = Math.max(width, (minX + minWidth) - adjustedX);
    const adjustedHeight = Math.max(height, (minY + minHeight) - adjustedY);

    x = adjustedX;
    y = adjustedY;
    width = adjustedWidth;
    height = adjustedHeight;
  }

  if (Array.isArray(group.bounding) && group.bounding.length >= 4) {
    group.bounding[0] = x;
    group.bounding[1] = y;
    group.bounding[2] = width;
    group.bounding[3] = height;
  }
  else if (typeof group.pos !== 'undefined' && typeof group.size !== 'undefined') {
    group.pos[0] = x;
    group.pos[1] = y;
    group.size[0] = width;
    group.size[1] = height;
  }
  else if (typeof group.x !== 'undefined' && typeof group.y !== 'undefined' &&
      typeof group.width !== 'undefined' && typeof group.height !== 'undefined') {
    group.x = x;
    group.y = y;
    group.width = width;
    group.height = height;
  }
  else {
    group.x = x;
    group.y = y;
    group.width = width;
    group.height = height;

    if (group.pos) {
      group.pos[0] = x;
      group.pos[1] = y;
    }

    if (group.size) {
      group.size[0] = width;
      group.size[1] = height;
    }
  }

  if (moveNodes) {
    nodeRelativePositions.forEach(({ node, relativeX, relativeY }) => {
      const newX = x + relativeX;
      const newY = y + relativeY;

      const deltaX = Math.abs(node.pos[0] - newX);
      const deltaY = Math.abs(node.pos[1] - newY);

      if (deltaX > 0.1 || deltaY > 0.1) {
        node.pos[0] = newX;
        node.pos[1] = newY;
      }
    });
  }
}

export function moveGroupTo(group, newX, newY, moveNodes = true) {
  const appInstance = getComfyUIAppInstance();

  const [oldX, oldY] = getGroupBounding(group);

  const deltaX = newX - oldX;
  const deltaY = newY - oldY;

  if (deltaX === 0 && deltaY === 0) {
    return;
  }

  const nodesInGroup = getNodesInGroupFromRelationships(group, appInstance);

  const nodeRelativePositions = nodesInGroup.map(node => {
    if (group.id && groupNodeRelationships[group.id]) {
      const nodeInfo = groupNodeRelationships[group.id].nodes.find(n => n.id === node.id);
      if (nodeInfo) {
        return {
          node,
          relativeX: nodeInfo.relativeX,
          relativeY: nodeInfo.relativeY
        };
      }
    }

    return {
      node,
      relativeX: node.pos[0] - oldX,
      relativeY: node.pos[1] - oldY
    };
  });

  if (Array.isArray(group.bounding) && group.bounding.length >= 4) {
    group.bounding[0] = newX;
    group.bounding[1] = newY;
  }
  else if (typeof group.pos !== 'undefined') {
    group.pos[0] = newX;
    group.pos[1] = newY;
  }
  else if (typeof group.x !== 'undefined' && typeof group.y !== 'undefined') {
    group.x = newX;
    group.y = newY;
  }
  else {
    group.x = newX;
    group.y = newY;

    if (group.pos) {
      group.pos[0] = newX;
      group.pos[1] = newY;
    }
  }

  if (moveNodes) {
    nodeRelativePositions.forEach(({ node, relativeX, relativeY }) => {
      node.pos[0] = newX + relativeX;
      node.pos[1] = newY + relativeY;
    });
  }
}
