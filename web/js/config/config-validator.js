import { DEFAULT_CONFIG } from './default-config.js';

export function validateConfig(config) {
  const required = [
    'iconSize', 'spacing', 'horizontalSpacing', 'verticalSpacing',
    'groupHorizontalSpacing', 'groupVerticalSpacing',
    'colors', 'colorMap', 'transition', 'shortcut'
  ];

  const missing = required.filter(prop => !(prop in config));
  if (missing.length > 0) {
    console.warn(`ComfyUI-Align plugin: Missing required configuration properties: ${missing.join(', ')}`);
    console.warn('Using default values for missing properties');

    missing.forEach(prop => {
      if (prop in DEFAULT_CONFIG) {
        config[prop] = DEFAULT_CONFIG[prop];
      }
    });
  }

  if (!config.colors) config.colors = {...DEFAULT_CONFIG.colors};
  if (!config.colorMap) config.colorMap = {...DEFAULT_CONFIG.colorMap};
  if (!config.safetyMargin) config.safetyMargin = {...DEFAULT_CONFIG.safetyMargin};
  if (!config.minNodeSize) config.minNodeSize = {...DEFAULT_CONFIG.minNodeSize};

  return config;
}
