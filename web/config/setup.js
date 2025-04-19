import { CONFIG } from "../states/state.js";

export async function setupExtension(app, AlignerPlugin) {
  await app.extensionManager.setting.set("Align.Spacing.horizontalMin", CONFIG.horizontalMinSpacing);
  await app.extensionManager.setting.set("Align.Spacing.verticalMin", CONFIG.verticalMinSpacing);

  const panelSetting = app.extensionManager.setting.get("Align.Color.applyToPanel");
  if (panelSetting === undefined) {
    await app.extensionManager.setting.set("Align.Color.applyToPanel", CONFIG.applyToPanel);
  } else {
    AlignerPlugin.CONFIG.applyToPanel = panelSetting;
  }
  
  const headerSetting = app.extensionManager.setting.get("Align.Color.applyToHeader");
  if (headerSetting === undefined) {
    await app.extensionManager.setting.set("Align.Color.applyToHeader", CONFIG.applyToHeader);
  } else {
    AlignerPlugin.CONFIG.applyToHeader = headerSetting;
  }

  AlignerPlugin.CONFIG.horizontalMinSpacing = app.extensionManager.setting.get("Align.Spacing.horizontalMin") || CONFIG.horizontalMinSpacing;
  AlignerPlugin.CONFIG.verticalMinSpacing = app.extensionManager.setting.get("Align.Spacing.verticalMin") || CONFIG.verticalMinSpacing;

  const shortcutSetting = app.extensionManager.setting.get("Align.Shortcut");
  if (shortcutSetting !== undefined) {
    AlignerPlugin.CONFIG.shortcut = shortcutSetting;
  }
} 