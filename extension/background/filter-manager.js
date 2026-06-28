/**
 * Free Blocker — Filter Manager
 * Handles auto-updating filter lists from remote sources via alarms.
 */

import { STORAGE_KEYS, FEATURES } from '../utils/constants.js';

/** Filter list manager with auto-update capability */
class FilterManager {
  constructor() {
    this._ALARM_NAME = 'fb_filter_update';
    this._UPDATE_KEY = 'fb_filter_last_update';
    this._DEFAULT_INTERVAL_HOURS = 24;
  }

  /**
   * Initialize filter manager and set up auto-update alarm
   * @returns {Promise<void>}
   */
  async initialize() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.FEATURES);
    const features = result[STORAGE_KEYS.FEATURES] || {};

    if (features[FEATURES.AUTO_FILTER_UPDATE]) {
      await this.startAutoUpdate();
    }
  }

  /**
   * Start the auto-update alarm
   * @param {number} intervalHours - Update interval in hours
   * @returns {Promise<void>}
   */
  async startAutoUpdate(intervalHours = this._DEFAULT_INTERVAL_HOURS) {
    /* Clear existing alarm */
    await chrome.alarms.clear(this._ALARM_NAME);

    /* Create new periodic alarm */
    chrome.alarms.create(this._ALARM_NAME, {
      delayInMinutes: 1, /* First check after 1 minute */
      periodInMinutes: intervalHours * 60
    });
  }

  /**
   * Stop the auto-update alarm
   * @returns {Promise<void>}
   */
  async stopAutoUpdate() {
    await chrome.alarms.clear(this._ALARM_NAME);
  }

  /**
   * Handle alarm trigger — check and update filters
   * @param {string} alarmName
   * @returns {Promise<void>}
   */
  async handleAlarm(alarmName) {
    if (alarmName !== this._ALARM_NAME) return;

    try {
      await this.checkForUpdates();
    } catch (error) {
      console.error('[Free Blocker] Filter update failed:', error);
    }
  }

  /**
   * Check for filter updates from the backend
   * @returns {Promise<Object>} Update result
   */
  async checkForUpdates() {
    const lastUpdate = await this._getLastUpdateTime();
    const result = {
      checked: true,
      updated: false,
      timestamp: new Date().toISOString()
    };

    try {
      /* Attempt to fetch updated rules from backend */
      const response = await fetch('http://localhost:8000/api/v1/rules/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_update: lastUpdate })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.has_updates) {
          /* Process rule updates */
          await this._applyUpdates(data.rules);
          result.updated = true;
        }
      }
    } catch {
      /* Backend unavailable — skip this cycle silently */
    }

    /* Record update check time */
    await chrome.storage.local.set({
      [this._UPDATE_KEY]: result.timestamp
    });

    return result;
  }

  /**
   * Apply rule updates from the backend
   * @param {Object} rules - Updated rules per ruleset
   * @private
   */
  async _applyUpdates(rules) {
    if (!rules || typeof rules !== 'object') return;

    /* Dynamic rules can be updated at runtime */
    for (const [rulesetId, ruleData] of Object.entries(rules)) {
      if (Array.isArray(ruleData) && ruleData.length > 0) {
        try {
          /* Add as dynamic rules since static rulesets can't be updated at runtime */
          const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
          const existingIds = existingRules
            .filter(r => r.id >= 300000 + this._getRulesetOffset(rulesetId))
            .map(r => r.id);

          /* Remove old dynamic rules for this ruleset */
          if (existingIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: existingIds
            });
          }

          /* Add new rules */
          const offset = 300000 + this._getRulesetOffset(rulesetId);
          const newRules = ruleData.map((rule, i) => ({
            ...rule,
            id: offset + i + 1
          }));

          await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: newRules
          });
        } catch (error) {
          console.error(`[Free Blocker] Failed to apply updates for ${rulesetId}:`, error);
        }
      }
    }
  }

  /**
   * Get numeric offset for a ruleset
   * @param {string} rulesetId
   * @returns {number}
   * @private
   */
  _getRulesetOffset(rulesetId) {
    const offsets = {
      'ads_rules': 0,
      'tracker_rules': 10000,
      'malware_rules': 20000,
      'adult_rules': 30000,
      'phishing_rules': 40000,
      'scam_rules': 50000,
      'social_ads_rules': 60000
    };
    return offsets[rulesetId] || 0;
  }

  /**
   * Get last update timestamp
   * @returns {Promise<string|null>}
   * @private
   */
  async _getLastUpdateTime() {
    const result = await chrome.storage.local.get(this._UPDATE_KEY);
    return result[this._UPDATE_KEY] || null;
  }

  /**
   * Get update status for UI display
   * @returns {Promise<Object>}
   */
  async getUpdateStatus() {
    const lastUpdate = await this._getLastUpdateTime();
    return {
      lastUpdate,
      autoUpdateEnabled: !!(await chrome.alarms.get(this._ALARM_NAME))
    };
  }
}

export const filterManager = new FilterManager();
