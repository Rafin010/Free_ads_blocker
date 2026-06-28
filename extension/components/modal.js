/**
 * Free Blocker — Modal Component
 * Reusable modal dialog for confirmations and inputs.
 */

import { createElement } from '../utils/helpers.js';

export class ModalManager {
  constructor() {
    this._modalElement = null;
    this._overlayElement = null;
  }

  /**
   * Show a confirmation modal
   * @param {Object} options
   * @param {string} options.title - Modal title
   * @param {string} options.message - Modal message
   * @param {string} options.confirmText - Confirm button text
   * @param {string} options.cancelText - Cancel button text
   * @param {boolean} options.danger - If true, confirm button is red
   * @returns {Promise<boolean>} Resolves true on confirm, false on cancel
   */
  confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      this._buildModal({
        title,
        message,
        buttons: [
          {
            text: cancelText,
            className: 'px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors',
            onClick: () => resolve(false)
          },
          {
            text: confirmText,
            className: `px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              danger 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30'
            } shadow-md`,
            onClick: () => resolve(true)
          }
        ],
        onClose: () => resolve(false)
      });
    });
  }

  /**
   * Show a prompt modal (input field)
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} options.placeholder
   * @param {string} options.defaultValue
   * @param {string} options.confirmText
   * @returns {Promise<string|null>} Resolves with input value or null on cancel
   */
  prompt({ title, message, placeholder = '', defaultValue = '', confirmText = 'OK' }) {
    return new Promise((resolve) => {
      let inputValue = defaultValue;

      const inputContainer = createElement('div', { className: 'mt-4' });
      const input = createElement('input', {
        type: 'text',
        className: 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
        placeholder,
        value: defaultValue
      });

      input.addEventListener('input', (e) => {
        inputValue = e.target.value;
      });

      inputContainer.appendChild(input);

      this._buildModal({
        title,
        message,
        contentElement: inputContainer,
        buttons: [
          {
            text: 'Cancel',
            className: 'px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors',
            onClick: () => resolve(null)
          },
          {
            text: confirmText,
            className: 'px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/30 rounded-lg transition-colors',
            onClick: () => resolve(inputValue)
          }
        ],
        onClose: () => resolve(null),
        onOpen: () => input.focus()
      });
    });
  }

  /**
   * Internal method to build and show modal
   */
  _buildModal({ title, message, contentElement = null, buttons = [], onClose, onOpen }) {
    this._close(); // Ensure any existing is closed

    /* Overlay */
    this._overlayElement = createElement('div', {
      className: 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity opacity-0',
      id: 'fb-modal-overlay'
    });

    /* Modal Container */
    const modalContainer = createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none'
    });

    /* Modal Box */
    this._modalElement = createElement('div', {
      className: 'bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform scale-95 opacity-0 transition-all pointer-events-auto border border-slate-200 dark:border-slate-700'
    });

    /* Header */
    const header = createElement('div', {
      className: 'px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center'
    });
    
    const titleEl = createElement('h3', {
      className: 'text-lg font-semibold text-slate-900 dark:text-slate-100'
    }, title);

    const closeBtn = createElement('button', {
      className: 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none'
    });
    closeBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    
    const handleClose = () => {
      this._close();
      if (typeof onClose === 'function') onClose();
    };
    
    closeBtn.addEventListener('click', handleClose);
    this._overlayElement.addEventListener('click', handleClose);

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    /* Body */
    const body = createElement('div', { className: 'px-6 py-4' });
    
    if (message) {
      const msgEl = createElement('p', {
        className: 'text-sm text-slate-600 dark:text-slate-300'
      }, message);
      body.appendChild(msgEl);
    }
    
    if (contentElement) {
      body.appendChild(contentElement);
    }

    /* Footer / Buttons */
    const footer = createElement('div', {
      className: 'px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3'
    });

    buttons.forEach(btn => {
      const button = createElement('button', {
        className: btn.className
      }, btn.text);
      
      button.addEventListener('click', () => {
        this._close();
        btn.onClick();
      });
      
      footer.appendChild(button);
    });

    /* Assemble */
    this._modalElement.appendChild(header);
    this._modalElement.appendChild(body);
    this._modalElement.appendChild(footer);
    modalContainer.appendChild(this._modalElement);

    document.body.appendChild(this._overlayElement);
    document.body.appendChild(modalContainer);

    /* Animate In */
    requestAnimationFrame(() => {
      this._overlayElement.classList.remove('opacity-0');
      this._modalElement.classList.remove('scale-95', 'opacity-0');
      this._modalElement.classList.add('scale-100', 'opacity-100');
      if (typeof onOpen === 'function') onOpen();
    });
  }

  /**
   * Close and remove modal
   */
  _close() {
    if (this._modalElement && this._overlayElement) {
      this._overlayElement.classList.add('opacity-0');
      this._modalElement.classList.remove('scale-100', 'opacity-100');
      this._modalElement.classList.add('scale-95', 'opacity-0');
      
      const overlay = this._overlayElement;
      const modalParent = this._modalElement.parentElement;
      
      setTimeout(() => {
        overlay.remove();
        if (modalParent) modalParent.remove();
      }, 200);

      this._modalElement = null;
      this._overlayElement = null;
    }
  }
}

export const modal = new ModalManager();
