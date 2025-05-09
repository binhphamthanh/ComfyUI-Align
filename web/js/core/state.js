export const ICONS = [
  { id: 'left', type: 'align' },
  { id: 'horizontalCenter', type: 'align' },
  { id: 'leftStretch', type: 'stretch' },
  { id: 'top', type: 'align' },
  { id: 'verticalCenter', type: 'align' },
  { id: 'topStretch', type: 'stretch' },
  { id: 'right', type: 'align' },
  { id: 'horizontalStretch', type: 'stretch' },
  { id: 'rightStretch', type: 'stretch' },
  { id: 'bottom', type: 'align' },
  { id: 'verticalStretch', type: 'stretch' },
  { id: 'bottomStretch', type: 'stretch' },
  { id: 'redCircle', type: 'color' },
  { id: 'orangeCircle', type: 'color' },
  { id: 'yellowCircle', type: 'color' },
  { id: 'greenCircle', type: 'color' },
  { id: 'cyanCircle', type: 'color' },
  { id: 'blueCircle', type: 'color' },
  { id: 'purpleCircle', type: 'color' },
  { id: 'moonCircle', type: 'color' },
  { id: 'clearCircle', type: 'color' }
];

export const THROTTLE_FPS = 60;
export const THROTTLE_MS = Math.floor(1000 / THROTTLE_FPS);

export const state = {
  container: null,
  visible: false,
  lastX: 0,
  lastY: 0,
  icons: {},
  styleElement: null,
  initialized: false,
  shiftKeyPressed: false,
  altKeyPressed: false,
  animationFrameId: null,
  colorPickerUsed: false,
  groupNotificationShown: false,
  positionLocked: false
};
