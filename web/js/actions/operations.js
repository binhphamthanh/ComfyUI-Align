import { getComfyUIAppInstance, getSelectedNodes, getSelectedGroups } from '../utils/node-utils.js';
import { recordGroupNodeRelationships } from '../utils/group-utils.js';

export function executeNodeOperation(operationType, operationFn) {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      return { success: false, message: "Unable to get ComfyUI application instance" };
    }

    const selectedNodes = getSelectedNodes(appInstance);
    const pinnedNodes = selectedNodes.filter(node => node.flags?.pinned);
    const nonPinnedNodes = selectedNodes.filter(node => !(node.flags?.pinned));

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

    operationFn(nonPinnedNodes);
    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error(`Operation failed:`, error);
    return { success: false, message: `Operation failed: ${error.message}` };
  }
}

export async function executeGroupOperation(operationFn) {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      return { success: false, message: "Unable to get ComfyUI application instance" };
    }

    const selectedGroups = getSelectedGroups(appInstance);

    if (selectedGroups.length === 0) {
      let errorMessage = "No groups selected.";
      return { success: false, message: errorMessage };
    }

    recordGroupNodeRelationships(selectedGroups);

    operationFn(selectedGroups);
    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error(`Group operation failed:`, error);
    return { success: false, message: `Group operation failed: ${error.message}` };
  }
}

export async function executeSingleGroupOperation(operationFn) {
  try {
    const appInstance = getComfyUIAppInstance();
    if (!appInstance) {
      return { success: false, message: "Unable to get ComfyUI application instance" };
    }

    const selectedGroups = getSelectedGroups(appInstance);

    if (selectedGroups.length !== 1) {
      return { success: false, message: "Please select exactly one group" };
    }

    const group = selectedGroups[0];
    const nodesInGroup = appInstance.graph._nodes.filter(node => {
      if (!node.pos || !node.size) return false;

      const [groupX, groupY, groupWidth, groupHeight] = Array.isArray(group.bounding) && group.bounding.length >= 4
        ? group.bounding
        : [group.pos?.[0] || 0, group.pos?.[1] || 0, group.size?.[0] || 0, group.size?.[1] || 0];

      const nodeX = node.pos[0];
      const nodeY = node.pos[1];
      const nodeWidth = node.size[0];
      const nodeHeight = node.size[1];

      return (
        nodeX >= groupX &&
        nodeY >= groupY &&
        nodeX + nodeWidth <= groupX + groupWidth &&
        nodeY + nodeHeight <= groupY + groupHeight
      );
    });

    operationFn(group, nodesInGroup);
    appInstance.graph.setDirtyCanvas(true, true);

    return { success: true };
  } catch (error) {
    console.error(`Single group operation failed:`, error);
    return { success: false, message: `Single group operation failed: ${error.message}` };
  }
}
