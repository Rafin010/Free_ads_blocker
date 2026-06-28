/**
 * Free Blocker — Rule Engine
 * Manages declarativeNetRequest rules: enable/disable rule sets per feature toggle.
 */

import { FEATURES, RULESET_FEATURE_MAP, STORAGE_KEYS } from '../utils/constants.js';

/** DNR Rule Engine for managing blocking rules */
class RuleEngine {
  constructor() {
    this._dynamicRuleOffset = 100000;
    this._whitelistRuleOffset = 200000;
  }

  /**
   * Initialize the rule engine based on stored feature states
   * @returns {Promise<void>}
   */
  async initialize() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.FEATURES);
    const features = result[STORAGE_KEYS.FEATURES] || {};
    await this.syncRuleSets(features);
    await this._applyWhitelistRules();
  }

  /**
   * Sync enabled rule sets with feature states
   * @param {Object} features - Feature states map
   * @returns {Promise<void>}
   */
  async syncRuleSets(features) {
    const enableRulesetIds = [];
    const disableRulesetIds = [];

    for (const [rulesetId, featureIds] of Object.entries(RULESET_FEATURE_MAP)) {
      /* Enable ruleset if any associated feature is enabled */
      const shouldEnable = featureIds.some(fId => features[fId] === true);

      if (shouldEnable) {
        enableRulesetIds.push(rulesetId);
      } else {
        disableRulesetIds.push(rulesetId);
      }
    }

    try {
      const currentRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();

      /* Filter to only include changes */
      const toEnable = enableRulesetIds.filter(id => !currentRulesets.includes(id));
      const toDisable = disableRulesetIds.filter(id => currentRulesets.includes(id));

      if (toEnable.length > 0 || toDisable.length > 0) {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          enableRulesetIds: toEnable,
          disableRulesetIds: toDisable
        });
      }
    } catch (error) {
      console.error('[Free Blocker] Failed to update rulesets:', error);
    }
  }

  /**
   * Toggle a specific feature's rules
   * @param {string} featureId - Feature identifier
   * @param {boolean} enabled - New state
   * @returns {Promise<void>}
   */
  async toggleFeature(featureId, enabled) {
    /* Find the associated ruleset */
    for (const [rulesetId, featureIds] of Object.entries(RULESET_FEATURE_MAP)) {
      if (featureIds.includes(featureId)) {
        /* Check if other features sharing this ruleset are still enabled */
        const result = await chrome.storage.local.get(STORAGE_KEYS.FEATURES);
        const features = result[STORAGE_KEYS.FEATURES] || {};
        features[featureId] = enabled;

        const otherFeaturesEnabled = featureIds
          .filter(id => id !== featureId)
          .some(id => features[id] === true);

        const shouldEnable = enabled || otherFeaturesEnabled;

        try {
          await chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: shouldEnable ? [rulesetId] : [],
            disableRulesetIds: shouldEnable ? [] : [rulesetId]
          });
        } catch (error) {
          console.error(`[Free Blocker] Failed to toggle ${rulesetId}:`, error);
        }

        break;
      }
    }
  }

  /**
   * Apply whitelist rules (allow rules for whitelisted domains)
   * @private
   * @returns {Promise<void>}
   */
  async _applyWhitelistRules() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
      const whitelist = result[STORAGE_KEYS.WHITELIST] || [];

      /* Remove existing whitelist dynamic rules */
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const whitelistRuleIds = existingRules
        .filter(r => r.id >= this._whitelistRuleOffset)
        .map(r => r.id);

      if (whitelistRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: whitelistRuleIds
        });
      }

      /* Add new whitelist rules */
      if (whitelist.length > 0) {
        const rules = whitelist.map((domain, index) => ({
          id: this._whitelistRuleOffset + index + 1,
          priority: 1000,
          action: { type: 'allow' },
          condition: {
            requestDomains: [domain],
            resourceTypes: [
              'main_frame', 'sub_frame', 'stylesheet', 'script',
              'image', 'font', 'object', 'xmlhttprequest', 'ping',
              'media', 'websocket', 'other'
            ]
          }
        }));

        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: rules
        });
      }
    } catch (error) {
      console.error('[Free Blocker] Failed to apply whitelist rules:', error);
    }
  }

  /**
   * Add domain to whitelist (allow all requests)
   * @param {string} domain
   * @returns {Promise<void>}
   */
  async addWhitelistDomain(domain) {
    await this._applyWhitelistRules();
  }

  /**
   * Remove domain from whitelist
   * @param {string} domain
   * @returns {Promise<void>}
   */
  async removeWhitelistDomain(domain) {
    await this._applyWhitelistRules();
  }

  /**
   * Apply blacklist rules (block rules for blacklisted domains)
   * @returns {Promise<void>}
   */
  async applyBlacklistRules() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.BLACKLIST);
      const blacklist = result[STORAGE_KEYS.BLACKLIST] || [];

      /* Remove existing blacklist dynamic rules */
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const blacklistRuleIds = existingRules
        .filter(r => r.id >= this._dynamicRuleOffset && r.id < this._whitelistRuleOffset)
        .map(r => r.id);

      if (blacklistRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: blacklistRuleIds
        });
      }

      /* Add new blacklist rules */
      if (blacklist.length > 0) {
        const rules = blacklist.map((domain, index) => ({
          id: this._dynamicRuleOffset + index + 1,
          priority: 500,
          action: { type: 'block' },
          condition: {
            requestDomains: [domain],
            resourceTypes: [
              'main_frame', 'sub_frame', 'stylesheet', 'script',
              'image', 'font', 'object', 'xmlhttprequest', 'ping',
              'media', 'websocket', 'other'
            ]
          }
        }));

        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: rules
        });
      }
    } catch (error) {
      console.error('[Free Blocker] Failed to apply blacklist rules:', error);
    }
  }

  /**
   * Get current rule count
   * @returns {Promise<Object>}
   */
  async getRuleCount() {
    try {
      const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
      const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();

      return {
        enabledRulesets: enabledRulesets.length,
        dynamicRules: dynamicRules.length,
        total: dynamicRules.length
      };
    } catch (error) {
      console.error('[Free Blocker] Failed to get rule count:', error);
      return { enabledRulesets: 0, dynamicRules: 0, total: 0 };
    }
  }
}

export const ruleEngine = new RuleEngine();
