/**
 * Free Blocker — Theme Manager
 * Handles dark/light mode switching and system preference detection.
 */

import { STORAGE_KEYS } from '../utils/constants.js';

export class ThemeManager {
  constructor() {
    this._currentTheme = 'system';
    this._listeners = [];
  }

  /**
   * Initialize theme manager
   */
  async initialize() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.THEME);
      this._currentTheme = result[STORAGE_KEYS.THEME] || 'system';
    } catch {
      this._currentTheme = 'system';
    }
    
    this._applyTheme();

    /* Listen for system theme changes */
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this._currentTheme === 'system') {
        this._applyTheme();
      }
    });
  }

  /**
   * Set a new theme
   * @param {string} theme - 'light', 'dark', or 'system'
   */
  async setTheme(theme) {
    if (!['light', 'dark', 'system'].includes(theme)) return;
    
    this._currentTheme = theme;
    this._applyTheme();
    
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: theme });
      this._notifyListeners();
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  }

  /**
   * Get current theme setting
   * @returns {string}
   */
  getTheme() {
    return this._currentTheme;
  }
  
  /**
   * Check if dark mode is currently active
   * @returns {boolean}
   */
  isDarkActive() {
    if (this._currentTheme === 'dark') return true;
    if (this._currentTheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Apply theme to document body
   * @private
   */
  _applyTheme() {
    if (this.isDarkActive()) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }

  /**
   * Add theme change listener
   * @param {Function} callback 
   */
  onChange(callback) {
    this._listeners.push(callback);
  }

  /**
   * Notify listeners of theme change
   * @private
   */
  _notifyListeners() {
    const isDark = this.isDarkActive();
    this._listeners.forEach(cb => cb(this._currentTheme, isDark));
  }
}

export const themeManager = new ThemeManager();
