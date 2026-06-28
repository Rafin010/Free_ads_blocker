/**
 * Free Blocker — Storage Utility
 * Async wrapper around Chrome Storage API with defaults and batch operations.
 */

import { STORAGE_KEYS, DEFAULT_FEATURE_STATES, DEFAULT_STATS, DEFAULT_SETTINGS } from './constants.js';

/** Storage abstraction for Chrome storage.local and storage.sync */
class StorageManager {
  constructor() {
    this._cache = new Map();
    this._initialized = false;
  }

  /**
   * Initialize storage with default values if first run
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) return;

    const result = await chrome.storage.local.get(STORAGE_KEYS.FIRST_RUN);

    if (!result[STORAGE_KEYS.FIRST_RUN]) {
      await this.setDefaults();
      await chrome.storage.local.set({ [STORAGE_KEYS.FIRST_RUN]: false });
      await chrome.storage.local.set({ [STORAGE_KEYS.INSTALL_DATE]: new Date().toISOString() });
    }

    /* Warm cache with frequently accessed data */
    await this._warmCache();
    this._initialized = true;
  }

  /**
   * Set all default values in storage
   * @returns {Promise<void>}
   */
  async setDefaults() {
    const defaults = {
      [STORAGE_KEYS.FEATURES]: DEFAULT_FEATURE_STATES,
      [STORAGE_KEYS.STATS]: DEFAULT_STATS,
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
      [STORAGE_KEYS.WHITELIST]: [],
      [STORAGE_KEYS.BLACKLIST]: [],
      [STORAGE_KEYS.USER]: null,
      [STORAGE_KEYS.REFERRAL]: null,
      [STORAGE_KEYS.THEME]: 'system'
    };

    await chrome.storage.local.set(defaults);

    /* Update cache */
    for (const [key, value] of Object.entries(defaults)) {
      this._cache.set(key, value);
    }
  }

  /**
   * Get a value from storage
   * @param {string} key - Storage key
   * @param {*} fallback - Default value if key doesn't exist
   * @returns {Promise<*>}
   */
  async get(key, fallback = null) {
    /* Check cache first */
    if (this._cache.has(key)) {
      return this._cache.get(key);
    }

    const result = await chrome.storage.local.get(key);
    const value = result[key] !== undefined ? result[key] : fallback;

    /* Update cache */
    this._cache.set(key, value);
    return value;
  }

  /**
   * Set a value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<void>}
   */
  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
    this._cache.set(key, value);
  }

  /**
   * Get multiple values at once
   * @param {string[]} keys - Storage keys
   * @returns {Promise<Object>}
   */
  async getMultiple(keys) {
    const result = await chrome.storage.local.get(keys);
    for (const [key, value] of Object.entries(result)) {
      this._cache.set(key, value);
    }
    return result;
  }

  /**
   * Set multiple values at once
   * @param {Object} items - Key-value pairs
   * @returns {Promise<void>}
   */
  async setMultiple(items) {
    await chrome.storage.local.set(items);
    for (const [key, value] of Object.entries(items)) {
      this._cache.set(key, value);
    }
  }

  /**
   * Remove a key from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    await chrome.storage.local.remove(key);
    this._cache.delete(key);
  }

  /**
   * Get all feature states
   * @returns {Promise<Object>}
   */
  async getFeatures() {
    return await this.get(STORAGE_KEYS.FEATURES, DEFAULT_FEATURE_STATES);
  }

  /**
   * Set a single feature state
   * @param {string} featureId - Feature identifier
   * @param {boolean} enabled - Enabled state
   * @returns {Promise<Object>} Updated features
   */
  async setFeature(featureId, enabled) {
    const features = await this.getFeatures();
    features[featureId] = enabled;
    await this.set(STORAGE_KEYS.FEATURES, features);
    return features;
  }

  /**
   * Get blocking statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    const stats = await this.get(STORAGE_KEYS.STATS, DEFAULT_STATS);

    /* Auto-reset daily counters */
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastResetDate !== today) {
      stats.adsBlockedToday = 0;
      stats.lastResetDate = today;
      await this.set(STORAGE_KEYS.STATS, stats);
    }

    return stats;
  }

  /**
   * Increment a statistic counter
   * @param {string} statKey - Stat key to increment
   * @param {number} amount - Amount to increment by
   * @returns {Promise<Object>} Updated stats
   */
  async incrementStat(statKey, amount = 1) {
    const stats = await this.getStats();
    if (stats[statKey] !== undefined) {
      stats[statKey] += amount;
    }
    /* Also increment daily ads counter when total changes */
    if (statKey === 'adsBlockedTotal') {
      stats.adsBlockedToday += amount;
    }
    await this.set(STORAGE_KEYS.STATS, stats);
    return stats;
  }

  /**
   * Get extension settings
   * @returns {Promise<Object>}
   */
  async getSettings() {
    return await this.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  /**
   * Update settings partially
   * @param {Object} updates - Settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(updates) {
    const settings = await this.getSettings();
    Object.assign(settings, updates);
    await this.set(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }

  /**
   * Get whitelist
   * @returns {Promise<string[]>}
   */
  async getWhitelist() {
    return await this.get(STORAGE_KEYS.WHITELIST, []);
  }

  /**
   * Add domain to whitelist
   * @param {string} domain
   * @returns {Promise<string[]>}
   */
  async addToWhitelist(domain) {
    const whitelist = await this.getWhitelist();
    const normalized = domain.toLowerCase().trim();
    if (!whitelist.includes(normalized)) {
      whitelist.push(normalized);
      await this.set(STORAGE_KEYS.WHITELIST, whitelist);
    }
    return whitelist;
  }

  /**
   * Remove domain from whitelist
   * @param {string} domain
   * @returns {Promise<string[]>}
   */
  async removeFromWhitelist(domain) {
    const whitelist = await this.getWhitelist();
    const normalized = domain.toLowerCase().trim();
    const filtered = whitelist.filter(d => d !== normalized);
    await this.set(STORAGE_KEYS.WHITELIST, filtered);
    return filtered;
  }

  /**
   * Get blacklist
   * @returns {Promise<string[]>}
   */
  async getBlacklist() {
    return await this.get(STORAGE_KEYS.BLACKLIST, []);
  }

  /**
   * Add domain to blacklist
   * @param {string} domain
   * @returns {Promise<string[]>}
   */
  async addToBlacklist(domain) {
    const blacklist = await this.getBlacklist();
    const normalized = domain.toLowerCase().trim();
    if (!blacklist.includes(normalized)) {
      blacklist.push(normalized);
      await this.set(STORAGE_KEYS.BLACKLIST, blacklist);
    }
    return blacklist;
  }

  /**
   * Remove domain from blacklist
   * @param {string} domain
   * @returns {Promise<string[]>}
   */
  async removeFromBlacklist(domain) {
    const blacklist = await this.getBlacklist();
    const normalized = domain.toLowerCase().trim();
    const filtered = blacklist.filter(d => d !== normalized);
    await this.set(STORAGE_KEYS.BLACKLIST, filtered);
    return filtered;
  }

  /**
   * Export all settings and data for backup
   * @returns {Promise<Object>}
   */
  async exportAll() {
    const keys = Object.values(STORAGE_KEYS);
    const data = await chrome.storage.local.get(keys);
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data
    };
  }

  /**
   * Import settings and data from backup
   * @param {Object} backup - Backup data
   * @returns {Promise<boolean>}
   */
  async importAll(backup) {
    if (!backup || !backup.data || !backup.version) {
      throw new Error('Invalid backup file format');
    }

    await chrome.storage.local.set(backup.data);

    /* Refresh cache */
    this._cache.clear();
    await this._warmCache();

    return true;
  }

  /**
   * Reset all data to defaults
   * @returns {Promise<void>}
   */
  async resetAll() {
    await chrome.storage.local.clear();
    this._cache.clear();
    await this.setDefaults();
    await chrome.storage.local.set({ [STORAGE_KEYS.FIRST_RUN]: false });
  }

  /**
   * Warm cache with frequently used data
   * @private
   */
  async _warmCache() {
    const keys = [STORAGE_KEYS.FEATURES, STORAGE_KEYS.STATS, STORAGE_KEYS.SETTINGS, STORAGE_KEYS.THEME];
    const data = await chrome.storage.local.get(keys);
    for (const [key, value] of Object.entries(data)) {
      this._cache.set(key, value);
    }
  }

  /**
   * Get cache size for debugging
   * @returns {number}
   */
  getCacheSize() {
    return this._cache.size;
  }

  /** Clear the in-memory cache */
  clearCache() {
    this._cache.clear();
  }
}

/** Singleton instance */
export const storage = new StorageManager();
