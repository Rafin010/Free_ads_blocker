import { createElement } from '../utils/helpers.js';

export class CardComponent {
  static create({ id, name, description, icon, enabled = false, color = 'blue', onToggle }) {
    /* Main Card Container */
    const card = createElement('div', { className: 'feature-card' });
    card.dataset.featureId = id;

    /* Icon Box */
    const iconBox = createElement('div', { className: `icon-box bg-${color}` });
    iconBox.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg>`;

    /* Feature Info (Title & Description) */
    const info = createElement('div', { className: 'feature-info' });
    const title = createElement('h3', {}, name);
    const desc = createElement('p', {}, description);
    info.appendChild(title);
    info.appendChild(desc);

    /* iOS Style Toggle Switch */
    const toggleLabel = createElement('label', { className: 'toggle-switch' });
    const toggleInput = createElement('input', { type: 'checkbox', checked: enabled });
    const toggleSlider = createElement('span', { className: 'slider' });
    
    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(toggleSlider);

    /* Handle Toggle Change */
    toggleInput.addEventListener('change', (e) => {
      if (typeof onToggle === 'function') {
        onToggle(id, e.target.checked);
      }
    });

    card.appendChild(iconBox);
    card.appendChild(info);
    card.appendChild(toggleLabel);

    return card;
  }
}
