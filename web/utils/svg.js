export function createSVG(id, ICONS, ICONS_LIST = [], size = 20) {
  if (ICONS[id]) {
    const div = document.createElement('div');
    div.innerHTML = ICONS[id];
    const svg = div.firstChild;
    
    const iconInfo = ICONS_LIST.find(icon => icon.id === id);
    const isColorIcon = iconInfo && iconInfo.type === 'color';
    
    const adjustedSize = isColorIcon ? size : Math.floor(size * 0.85);
    
    svg.setAttribute('width', adjustedSize);
    svg.setAttribute('height', adjustedSize);
    
    svg.style.position = 'relative';
    svg.style.zIndex = '2';
    
    if (isColorIcon) {
      svg.style.filter = 'drop-shadow(0px 0px 2px rgba(200, 200, 200, 0.3))';
    } else {
      svg.style.filter = 'brightness(1) contrast(1)';
    }
    
    return svg;
  }
  
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.style.position = 'relative';
  svg.style.zIndex = '2';
  
  return svg;
} 