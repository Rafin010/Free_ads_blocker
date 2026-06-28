/**
 * Free Blocker — Toast Notification Component
 * Displays non-intrusive notifications.
 */

import { createElement } from '../utils/helpers.js';

export class ToastManager {
  constructor() {
    this._container = null;
  }

  /**
   * Initialize the toast container
   */
  _initContainer() {
    if (this._container) return;

    this._container = createElement('div', {
      id: 'fb-toast-container',
      className: 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none'
    });
    
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

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colors = {
      success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      error: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
      warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      info: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
    };

    const toast = createElement('div', {
      className: `
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md pointer-events-auto
        transform translate-y-8 opacity-0 transition-all duration-300 ease-out w-full
        ${colors[type] || colors.info}
      `
    });

    const icon = createElement('span', { className: 'text-lg' }, icons[type] || icons.info);
    const text = createElement('span', { className: 'text-[14px] font-medium flex-1' }, message);
    
    toast.appendChild(icon);
    toast.appendChild(text);

    this._container.appendChild(toast);

    /* Animate in */
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-8', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    /* Animate out and remove */
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export const toast = new ToastManager();
