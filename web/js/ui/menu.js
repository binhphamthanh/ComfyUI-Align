import { state } from '../core/state.js';
import { updateIconPositions } from './dom-utils.js';
import { handleAlignAction } from '../actions/index.js';
import { setHoveredIconId, isShortcutKeyPressed } from '../events/event-handlers.js';

export function setupMenuInteractions() {
  const container = state.container;
  if (!container) return;

  container.querySelectorAll('.aligner-icon').forEach(icon => {
    icon.addEventListener('click', async (e) => {
      e.stopPropagation();

      const id = icon.dataset.id;
      await handleAlignAction(id);

      const config = window.alignerPlugin.getConfig();

      if (config.shortcutHoldMode && isShortcutKeyPressed()) {
        return;
      }

      if (!state.shiftKeyPressed) {
        container.style.display = 'none';
        state.visible = false;
        state.positionLocked = false;
      }
    });

    icon.addEventListener('mouseenter', () => {
      const bg = icon.querySelector('.aligner-icon-bg');
      if (bg && !icon.dataset.id.includes('Circle')) {
        bg.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
      }

      setHoveredIconId(icon.dataset.id);
    });

    icon.addEventListener('mouseleave', () => {
      const bg = icon.querySelector('.aligner-icon-bg');
      if (bg && !icon.dataset.id.includes('Circle')) {
        bg.style.backgroundColor = 'rgba(12, 12, 12, 0.95)';
      }

      setHoveredIconId(null);
    });
  });

  document.addEventListener('click', (e) => {
    if (state.visible && !container.contains(e.target)) {
      container.style.display = 'none';
      state.visible = false;
      state.positionLocked = false;
    }
  });
}
