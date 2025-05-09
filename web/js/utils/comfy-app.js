const api_base = location.pathname.split("/").slice(0, -1).join("/");

export let app = null;
export let api = null;

export async function waitForApp() {
  try {
    await Promise.all([
      import(api_base + "/scripts/api.js").then((apiJs) => {
        api = apiJs?.api;
      }),

      import(api_base + "/scripts/app.js").then((appJs) => {
        app = appJs?.app;
      }),
    ]);

    console.log("ComfyUI app and api loaded successfully");
  } catch (e) {
    console.error("Failed to load ComfyUI app and api:", e);
  }
}

export function getComfyUIAppInstance() {
  if (app?.canvas && app?.graph) {
    return app;
  }

  if (window.app?.canvas && window.app?.graph) {
    return window.app;
  }

  if (window.LiteGraph?.LGraphCanvas?.active_canvas) {
    const canvas = window.LiteGraph.LGraphCanvas.active_canvas;
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

  console.warn("Unable to get ComfyUI application instance");
  return null;
}
