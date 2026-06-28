/**
 * Free Blocker — Toggle Component
 * Creates an animated toggle switch with ripple effect.
 */

import { createElement, addRippleEffect } from '../utils/helpers.js';

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
    /* 
     * Tailwind classes for toggle wrapper:
     * relative inline-flex items-center cursor-pointer
     */
    const label = createElement('label', { 
      className: 'relative inline-flex items-center cursor-pointer fb-toggle-wrapper',
      htmlFor: id
    });

    /* Hide default checkbox */
    const input = createElement('input', {
      type: 'checkbox',
      id: id,
      className: 'sr-only peer',
      checked: checked
    });

    /* 
     * Tailwind classes for toggle track and thumb:
     * - Track: w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600
     */
    const track = createElement('div', {
      className: `
        w-11 h-6 bg-slate-300 rounded-full peer 
        dark:bg-slate-700 
        peer-checked:after:translate-x-full peer-checked:after:border-white 
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
        after:bg-white after:border-slate-300 after:border after:rounded-full 
        after:h-5 after:w-5 after:transition-all 
        dark:border-slate-600 
        peer-checked:bg-indigo-500 hover:peer-checked:bg-indigo-600
        transition-colors duration-300 ease-in-out
        shadow-inner
      `
    });

    input.addEventListener('change', (e) => {
      if (typeof onChange === 'function') {
        onChange(e.target.checked);
      }
    });

    label.appendChild(input);
    label.appendChild(track);
    
    /* Add ripple on click */
    label.addEventListener('mousedown', (e) => {
       /* Custom ripple implementation for toggle */
       const ripple = createElement('span', {
         className: 'absolute w-10 h-10 bg-indigo-400/30 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping duration-300',
         style: {
           left: input.checked ? '100%' : '0%',
           top: '50%'
         }
       });
       label.appendChild(ripple);
       setTimeout(() => ripple.remove(), 300);
    });

    return label;
  }
}
