import { trackMousePosition, handleOutsideClick } from "./mouse.js";
import { handleKeyDown, handleShiftKey, handleAltKey } from "./keyboard.js";

export function registerEventListeners() {
  // Use capture phase for keyboard events to intercept them early
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("mousemove", trackMousePosition);
  document.addEventListener("click", handleOutsideClick);

  document.addEventListener("keydown", handleShiftKey, true);
  document.addEventListener("keyup", handleShiftKey, true);
  document.addEventListener("keydown", handleAltKey, true);
  document.addEventListener("keyup", handleAltKey, true);
}

export function removeEventListeners() {
  document.removeEventListener("keydown", handleKeyDown, true);
  document.removeEventListener("mousemove", trackMousePosition);
  document.removeEventListener("click", handleOutsideClick);

  document.removeEventListener("keydown", handleShiftKey, true);
  document.removeEventListener("keyup", handleShiftKey, true);
  document.removeEventListener("keydown", handleAltKey, true);
  document.removeEventListener("keyup", handleAltKey, true);
}
