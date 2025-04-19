import { DEFAULT_CONFIG } from "../config/defaultConfig.js";
import { validateConfig } from "../config/validation.js";

const state = {
  container: null,
  visible: false,
  lastX: 0,
  lastY: 0,
  icons: {},
  styleElement: null,
  initialized: false,
  shiftKeyPressed: false,
  altKeyPressed: false,
  isUtilsExpanded: false,
  animationFrameId: null,
  colorPickerUsed: false,
  dom: null
};

const CONFIG = validateConfig({...DEFAULT_CONFIG});

export default state;
export { CONFIG };
