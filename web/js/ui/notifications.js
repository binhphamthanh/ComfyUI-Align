import { createElement } from './dom-utils.js';

export function showNotification(message, isError = true) {
  if (!message) return;

  const notification = createElement('div', 'aligner-notification');
  notification.textContent = message;

  if (isError) {
    notification.style.backgroundColor = 'rgba(220, 53, 69, 0.75)';
  } else {
    notification.style.backgroundColor = 'rgba(40, 167, 69, 0.75)'; 
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
