/**
 * Free Blocker — Toggle Component
 * Creates an animated toggle switch with pure CSS.
 */

export class ToggleComponent {
  /**
   * Create a toggle switch
   * @param {Object} options
   * @param {string} options.id - Toggle ID
   * @param {boolean} options.checked - Initial state
   * @param {Function} options.onChange - Callback on change
   * @returns {HTMLElement} Toggle label element
   */
  static create({ id, checked = false, onChange }) {
    const label = document.createElement('label');
    label.className = 'fb-toggle';
    label.setAttribute('for', id);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.className = 'fb-toggle-input';
    input.checked = checked;

    const track = document.createElement('span');
    track.className = 'fb-toggle-track';

    const thumb = document.createElement('span');
    thumb.className = 'fb-toggle-thumb';

    track.appendChild(thumb);

    input.addEventListener('change', (e) => {
      if (typeof onChange === 'function') {
        onChange(e.target.checked);
      }
    });

    label.appendChild(input);
    label.appendChild(track);

    return label;
  }
}
