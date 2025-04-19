export function calculatePosition(index, iconSize, spacing) {
  const halfSize = iconSize / 2;
  const effectiveSpacing = spacing + halfSize;

  if (index >= 12) {
    return null;
  }

  const positions = [
    [-effectiveSpacing, -halfSize - iconSize - 5],
    [-effectiveSpacing, -halfSize],
    [-effectiveSpacing, halfSize + 5],
    [-halfSize - iconSize - 5, -effectiveSpacing],
    [-halfSize, -effectiveSpacing],
    [halfSize + 5, -effectiveSpacing],
    [effectiveSpacing - iconSize, -halfSize - iconSize - 5],
    [effectiveSpacing - iconSize, -halfSize],
    [effectiveSpacing - iconSize, halfSize + 5],
    [-halfSize - iconSize - 5, effectiveSpacing - iconSize],
    [-halfSize, effectiveSpacing - iconSize],
    [halfSize + 5, effectiveSpacing - iconSize],
  ];

  return positions[index] || [0, 0];
}

export function keepInViewport(x, y, entireWidth, entireHeight) {
  const margin = 20;
  return [
    Math.max(margin, Math.min(x, window.innerWidth - entireWidth - margin)),
    Math.max(margin, Math.min(y, window.innerHeight - entireHeight - margin))
  ];
}

export function calculateUIBoundingBox(centerX, centerY, iconSize, spacing) {
  const effectiveSpacing = spacing + iconSize / 2;

  const width = effectiveSpacing * 2;
  const height = effectiveSpacing * 2;

  const colorPickerHeight = 50;
  const totalHeight = height + colorPickerHeight + 15;

  const left = centerX - effectiveSpacing;
  const top = centerY - effectiveSpacing;
  
  return {
    width,
    height: totalHeight,
    left,
    top
  };
} 