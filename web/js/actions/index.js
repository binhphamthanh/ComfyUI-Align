
import { getComfyUIAppInstance, getSelectedGroups } from '../utils/node-utils.js';
import { showNotification } from '../ui/notifications.js';
import * as alignActions from './align.js';
import * as stretchActions from './stretch.js';
import * as colorActions from './color.js';
import * as alignGroupOperations from './align-groups.js';
import * as stretchGroupOperations from './stretch-groups.js';
import * as alignNodesToGroupOperations from './align-nodes-to-group.js';

export async function handleAlignAction(action) {
  let result;

  const appInstance = getComfyUIAppInstance();
  const selectedGroups = getSelectedGroups(appInstance);
  const isGroupOperation = selectedGroups.length >= 2;
  const isSingleGroupOperation = selectedGroups.length === 1;

  const isGroupAndNodesOperation = alignNodesToGroupOperations.checkGroupAndNodesSelection() !== null;

  switch(action) {
    case 'left':
      if (isGroupOperation) {
        result = await alignGroupOperations.alignGroupsToLeft();
      } else if (isGroupAndNodesOperation) {
        result = alignNodesToGroupOperations.alignNodesToGroupLeft();
      } else {
        result = alignActions.alignNodesToLeft();
      }
      break;
    case 'right':
      if (isGroupOperation) {
        result = await alignGroupOperations.alignGroupsToRight();
      } else if (isGroupAndNodesOperation) {
        result = alignNodesToGroupOperations.alignNodesToGroupRight();
      } else {
        result = alignActions.alignNodesToRight();
      }
      break;
    case 'top':
      if (isGroupOperation) {
        result = await alignGroupOperations.alignGroupsToTop();
      } else if (isGroupAndNodesOperation) {
        result = alignNodesToGroupOperations.alignNodesToGroupTop();
      } else {
        result = alignActions.alignNodesToTop();
      }
      break;
    case 'bottom':
      if (isGroupOperation) {
        result = await alignGroupOperations.alignGroupsToBottom();
      } else if (isGroupAndNodesOperation) {
        result = alignNodesToGroupOperations.alignNodesToGroupBottom();
      } else {
        result = alignActions.alignNodesToBottom();
      }
      break;
    case 'horizontalCenter':
      if (isGroupOperation) {
        result = await alignGroupOperations.alignGroupsToHorizontalCenter();
      } else if (isGroupAndNodesOperation) {
        result = alignNodesToGroupOperations.alignNodesToGroupHorizontalCenter();
      } else {
        result = alignActions.alignNodesToHorizontalCenter();
      }
      break;
    case 'verticalCenter':
      if (isGroupOperation) {
        result = await alignGroupOperations.alignGroupsToVerticalCenter();
      } else if (isGroupAndNodesOperation) {
        result = alignNodesToGroupOperations.alignNodesToGroupVerticalCenter();
      } else {
        result = alignActions.alignNodesToVerticalCenter();
      }
      break;
    case 'leftStretch':
      if (isGroupOperation) {
        result = await stretchGroupOperations.stretchGroupsToLeft();
      } else if (isSingleGroupOperation) {
        result = await stretchGroupOperations.stretchSingleGroupToLeft();
      } else {
        result = stretchActions.stretchNodesToLeft();
      }
      break;
    case 'rightStretch':
      if (isGroupOperation) {
        result = await stretchGroupOperations.stretchGroupsToRight();
      } else if (isSingleGroupOperation) {
        result = await stretchGroupOperations.stretchSingleGroupToRight();
      } else {
        result = stretchActions.stretchNodesToRight();
      }
      break;
    case 'topStretch':
      if (isGroupOperation) {
        result = await stretchGroupOperations.stretchGroupsToTop();
      } else if (isSingleGroupOperation) {
        result = await stretchGroupOperations.stretchSingleGroupToTop();
      } else {
        result = stretchActions.stretchNodesToTop();
      }
      break;
    case 'bottomStretch':
      if (isGroupOperation) {
        result = await stretchGroupOperations.stretchGroupsToBottom();
      } else if (isSingleGroupOperation) {
        result = await stretchGroupOperations.stretchSingleGroupToBottom();
      } else {
        result = stretchActions.stretchNodesToBottom();
      }
      break;
    case 'horizontalStretch':
      if (isGroupOperation) {
        result = await stretchGroupOperations.stretchGroupsHorizontally();
      } else if (isSingleGroupOperation) {
        result = await stretchGroupOperations.stretchSingleGroupHorizontally();
      } else {
        result = stretchActions.stretchNodesHorizontally();
      }
      break;
    case 'verticalStretch':
      if (isGroupOperation) {
        result = await stretchGroupOperations.stretchGroupsVertically();
      } else if (isSingleGroupOperation) {
        result = await stretchGroupOperations.stretchSingleGroupVertically();
      } else {
        result = stretchActions.stretchNodesVertically();
      }
      break;
    case 'redCircle':
    case 'orangeCircle':
    case 'yellowCircle':
    case 'greenCircle':
    case 'cyanCircle':
    case 'blueCircle':
    case 'purpleCircle':
      result = colorActions.setNodesColor(action);
      break;

    case 'clearCircle':
      result = colorActions.setNodesColor(action);
      break;
    case 'moonCircle':
      result = colorActions.openNativeColorPicker();
      break;
    default:
      return;
  }

  if (result && !result.success) {
    showNotification(result.message, true);
  }
}
