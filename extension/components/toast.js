/**
 * Free Blocker — Toast Notification Component
 * Displays non-intrusive notifications with pure CSS.
 */

export class ToastManager {
  constructor() {
    this._container = null;
  }

  /**
   * Initialize the toast container
   */
  _initContainer() {
    if (this._container) return;

    this._container = document.createElement('div');
    this._container.id = 'fb-toast-container';
    this._container.className = 'fb-toast-container';
    document.body.appendChild(this._container);
  }

  /**
   * Show a toast message
   * @param {Object} options
   * @param {string} options.message - Text message
   * @param {string} options.type - 'success', 'error', 'info', 'warning'
   * @param {number} options.duration - Duration in ms (default 3000)
   */
  show({ message, type = 'info', duration = 3000 }) {
    this._initContainer();

    const toast = document.createElement('div');
    toast.className = `fb-toast fb-toast--${type}`;

    const icon = document.createElement('span');
    icon.className = 'fb-toast-icon';
    const icons = {
      success: '<i class="fa-solid fa-circle-check"></i>',
      error: '<i class="fa-solid fa-circle-xmark"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
      info: '<i class="fa-solid fa-circle-info"></i>'
    };
    icon.innerHTML = icons[type] || icons.info;

    const text = document.createElement('span');
    text.className = 'fb-toast-text';
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    this._container.appendChild(toast);

    /* Animate in */
    requestAnimationFrame(() => {
      toast.classList.add('fb-toast--visible');
    });

    /* Animate out and remove */
    setTimeout(() => {
      toast.classList.remove('fb-toast--visible');
      toast.classList.add('fb-toast--exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export const toast = new ToastManager();
