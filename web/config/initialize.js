export function safeGetApp() {
  if (typeof app === 'undefined' || !app) {
    console.warn('ComfyUI-Align: app is not available');
    return null;
  }
  return app;
}

export function initializePlugin(AlignerPlugin) {
  if (safeGetApp()) {
    AlignerPlugin.init();
  } else {
    console.error('ComfyUI-Align: Cannot initialize in this environment');
  }
}

export function delayedInitialization(AlignerPlugin, delay = 1500) {
  setTimeout(() => initializePlugin(AlignerPlugin), delay);
} 