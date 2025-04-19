export function getComfyUIAppInstance() {
  if (window.app?.canvas && window.app?.graph) {
    return window.app;
  }

  if (window.LiteGraph?.LGraphCanvas?.active_canvas) {
    const canvas = LiteGraph.LGraphCanvas.active_canvas;
    if (canvas?.graph) {
      return { canvas, graph: canvas.graph };
    }
  }

  const canvasElement = document.querySelector(".litegraph.litegraph-canvas");
  if (canvasElement?.lgraphcanvas) {
    const canvas = canvasElement.lgraphcanvas;
    if (canvas?.graph) {
      return { canvas, graph: canvas.graph };
    }
  }
  
  return null;
}

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