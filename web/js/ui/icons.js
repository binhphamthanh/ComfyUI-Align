import { SVG_PATHS } from '../utils/svg-paths.js';
import { createElement } from './dom-utils.js';

export function createSVG(id, size = 20, config) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute('viewBox', '0 0 1024 1024');
  svg.style.position = 'relative';
  svg.style.zIndex = '1';

  if (SVG_PATHS[id]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', SVG_PATHS[id]);
    path.style.fill = config.colors.icon;
    svg.appendChild(path);
  }

  return svg;
}

export function createIcon(iconInfo, index, colorCirclesFragment, utilCirclesFragment, mainFragment) {
  const { id, type } = iconInfo;
  const isCircle = id.includes('Circle');
  const config = window.alignerPlugin.getConfig();
  const size = isCircle ? config.iconSize / 2 : config.iconSize;

  const iconWrapper = createElement('div', `aligner-icon ${isCircle ? 'aligner-icon-circle' : ''}`);
  iconWrapper.dataset.id = id;
  iconWrapper.dataset.type = type;
  iconWrapper.style.width = `${size}px`;
  iconWrapper.style.height = `${size}px`;
  iconWrapper.style.pointerEvents = 'auto';

  const bg = createElement('div', 'aligner-icon-bg');

  if (isCircle) {
    if (id === 'moonCircle') {
        bg.style.background = 'transparent';

        const moonContainer = createElement('div', '', {
          style: 'position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%;'
        });

        const moonBase = createElement('div', '', {
          style: `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: ${config.colors.circle9};
            box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
          `
        });

        const moonMask = createElement('div', '', {
          style: `
            position: absolute;
            top: -25%;
            left: -25%;
            width: 95%;
            height: 95%;
            border-radius: 50%;
            background-color: ${config.colors.bg};
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.66);
          `
        });

        moonContainer.appendChild(moonBase);
        moonContainer.appendChild(moonMask);
        bg.appendChild(moonContainer);


    } else if (id === 'clearCircle') {
        bg.style.background = 'transparent';

        const checkerboardContainer = createElement('div', '', {
          style: `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 50%;
            background-color: rgba(12, 12, 12, 0.95);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          `
        });

        const checkerboard = createElement('div', '', {
          style: `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
              linear-gradient(45deg, #ffffff 25%, transparent 25%),
              linear-gradient(-45deg, #ffffff 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #ffffff 75%),
              linear-gradient(-45deg, transparent 75%, #ffffff 75%);
            background-size: 8px 8px;
            background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            border-radius: 50%;
            opacity: 0.8;
          `
        });

        checkerboardContainer.appendChild(checkerboard);
        bg.appendChild(checkerboardContainer);
    } else {
      const colorName = id.replace('Circle', '').toLowerCase();
      const colorKey = config.colorMap[colorName];
      if (colorKey && config.colors[colorKey]) {
        bg.style.backgroundColor = config.colors[colorKey];
      } else {
        console.warn(`Unknown color circle: ${id}`);
        bg.style.backgroundColor = '#555555';
      }
    }
  }

  iconWrapper.appendChild(bg);

  if (!isCircle) {
    const svg = createSVG(id, size, config);
    iconWrapper.appendChild(svg);
  }

  if (isCircle) {
    if (colorCirclesFragment) {
      colorCirclesFragment.appendChild(iconWrapper);
    }
  } else {
    if (mainFragment) {
      mainFragment.appendChild(iconWrapper);
    } else {
      state.container.appendChild(iconWrapper);
    }
  }

  return iconWrapper;
}
