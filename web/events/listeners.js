import { trackMousePosition, handleOutsideClick } from './mouse.js';
import { handleKeyDown, handleShiftKey, handleAltKey } from './keyboard.js';

export function registerEventListeners() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousemove', trackMousePosition);
  document.addEventListener('click', handleOutsideClick);
  
  document.addEventListener('keydown', handleShiftKey);
  document.addEventListener('keyup', handleShiftKey);
  document.addEventListener('keydown', handleAltKey);
  document.addEventListener('keyup', handleAltKey);
}

export function removeEventListeners() {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('mousemove', trackMousePosition);
  document.removeEventListener('click', handleOutsideClick);
  
  document.removeEventListener('keydown', handleShiftKey);
  document.removeEventListener('keyup', handleShiftKey);
  document.removeEventListener('keydown', handleAltKey);
  document.removeEventListener('keyup', handleAltKey);
} 