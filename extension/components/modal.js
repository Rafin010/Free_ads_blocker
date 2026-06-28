/**
 * Free Blocker — Modal Component
 * Reusable modal dialog for confirmations and inputs. Pure CSS.
 */

export class ModalManager {
  constructor() {
    this._modalElement = null;
    this._overlayElement = null;
    this._containerElement = null;
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
            className: 'fb-modal-btn fb-modal-btn--cancel',
            onClick: () => resolve(false)
          },
          {
            text: confirmText,
            className: danger ? 'fb-modal-btn fb-modal-btn--danger' : 'fb-modal-btn fb-modal-btn--confirm',
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

      const inputContainer = document.createElement('div');
      inputContainer.className = 'fb-modal-input-wrap';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'fb-modal-input';
      input.placeholder = placeholder;
      input.value = defaultValue;

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
            className: 'fb-modal-btn fb-modal-btn--cancel',
            onClick: () => resolve(null)
          },
          {
            text: confirmText,
            className: 'fb-modal-btn fb-modal-btn--confirm',
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
    this._overlayElement = document.createElement('div');
    this._overlayElement.className = 'fb-modal-overlay';
    this._overlayElement.id = 'fb-modal-overlay';

    /* Modal Container */
    this._containerElement = document.createElement('div');
    this._containerElement.className = 'fb-modal-container';

    /* Modal Box */
    this._modalElement = document.createElement('div');
    this._modalElement.className = 'fb-modal-box';

    /* Header */
    const header = document.createElement('div');
    header.className = 'fb-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'fb-modal-title';
    titleEl.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fb-modal-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    const handleClose = () => {
      this._close();
      if (typeof onClose === 'function') onClose();
    };

    closeBtn.addEventListener('click', handleClose);
    this._overlayElement.addEventListener('click', handleClose);

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    /* Body */
    const body = document.createElement('div');
    body.className = 'fb-modal-body';

    if (message) {
      const msgEl = document.createElement('p');
      msgEl.className = 'fb-modal-message';
      msgEl.textContent = message;
      body.appendChild(msgEl);
    }

    if (contentElement) {
      body.appendChild(contentElement);
    }

    /* Footer / Buttons */
    const footer = document.createElement('div');
    footer.className = 'fb-modal-footer';

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = btn.className;
      button.textContent = btn.text;

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
    this._containerElement.appendChild(this._modalElement);

    document.body.appendChild(this._overlayElement);
    document.body.appendChild(this._containerElement);

    /* Animate In */
    requestAnimationFrame(() => {
      this._overlayElement.classList.add('fb-modal-overlay--visible');
      this._modalElement.classList.add('fb-modal-box--visible');
      if (typeof onOpen === 'function') onOpen();
    });
  }

  /**
   * Close and remove modal
   */
  _close() {
    if (this._modalElement && this._overlayElement) {
      this._overlayElement.classList.remove('fb-modal-overlay--visible');
      this._modalElement.classList.remove('fb-modal-box--visible');

      const overlay = this._overlayElement;
      const container = this._containerElement;

      setTimeout(() => {
        overlay.remove();
        if (container) container.remove();
      }, 200);

      this._modalElement = null;
      this._overlayElement = null;
      this._containerElement = null;
    }
  }
}

export const modal = new ModalManager();
