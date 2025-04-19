import state from "../states/state.js";
import { CONFIG } from "../states/state.js";
import { calculateUIBoundingBox, keepInViewport } from "../utils/utils.js";

export function updateIconPositions(utils, dom) {
  const { iconSize, spacing } = CONFIG;
  const halfSize = iconSize / 2;
  const effectiveSpacing = spacing + halfSize;

  const boundingBox = calculateUIBoundingBox(state.lastX, state.lastY, iconSize, spacing);

  const [safeX, safeY] = keepInViewport(
    boundingBox.left,
    boundingBox.top,
    boundingBox.width,
    boundingBox.height + 10
  );

  const centerX = safeX + effectiveSpacing;
  const centerY = safeY + effectiveSpacing;

  const crossPanel = dom.getCrossPanel();
  if (crossPanel) {
    crossPanel.updatePositions(centerX, centerY);
  }
  
  const colorBar = dom.getColorBar();
  if (colorBar) {
    colorBar.updatePosition(centerX, centerY);
  }
} 