/**
 * Free Blocker — Background Service Worker
 * Main orchestrator: handles lifecycle, message routing, alarms, and badge updates.
 */

import { ruleEngine } from './rule-engine.js';
import { filterManager } from './filter-manager.js';
import { statsTracker } from './stats-tracker.js';
import { storage } from '../utils/storage.js';
import { FEATURES, STORAGE_KEYS, FEATURE_META, VERSION } from '../utils/constants.js';

/* ===== Initialization ===== */

/**
 * Initialize extension on install or startup
 */
async function initializeExtension() {
  try {
    await statsTracker.initialize();
    await ruleEngine.initialize();
    await filterManager.initialize();
    await updateBadge();
    console.log(`[Free Blocker] v${VERSION} initialized successfully`);
  } catch (error) {
    console.error('[Free Blocker] Initialization failed:', error);
  }
}

/* ===== Event Listeners ===== */

/** Extension installed or updated */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    /* First install — set defaults */
    await storage.initialize();
    console.log('[Free Blocker] First install — defaults applied');
  } else if (details.reason === 'update') {
    console.log(`[Free Blocker] Updated to v${VERSION}`);
  }

  await initializeExtension();
});

/** Browser startup */
chrome.runtime.onStartup.addListener(async () => {
  await initializeExtension();
});

/** Alarm handler (filter updates) */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  await filterManager.handleAlarm(alarm.name);
});

/** Track blocked requests for statistics */
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
  const rulesetId = info.rule.rulesetId;

  if (rulesetId === 'ads_rules') {
    statsTracker.recordBlocked('ads');
  } else if (rulesetId === 'tracker_rules') {
    statsTracker.recordBlocked('tracker');
  } else if (rulesetId === 'malware_rules') {
    statsTracker.recordBlocked('malware');
  } else if (rulesetId === 'adult_rules') {
    statsTracker.recordBlocked('adult');
  } else if (rulesetId === 'phishing_rules') {
    statsTracker.recordBlocked('phishing');
  } else if (rulesetId === 'scam_rules') {
    statsTracker.recordBlocked('scam');
  } else if (rulesetId === 'social_ads_rules') {
    statsTracker.recordBlocked('ads');
  }

  updateBadge();
});

/* ===== Message Router ===== */

/**
 * Handle messages from popup, content scripts, and pages
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(error => {
    console.error('[Free Blocker] Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  });
  return true; /* Keep channel open for async response */
});

/**
 * Route incoming messages to appropriate handlers
 * @param {Object} message
 * @param {Object} sender
 * @returns {Promise<Object>}
 */
async function handleMessage(message, sender) {
  const { type, data } = message;

  switch (type) {
    /* Feature toggle */
    case 'TOGGLE_FEATURE':
      return await handleToggleFeature(data.featureId, data.enabled);

    /* Get all feature states */
    case 'GET_FEATURES':
      return await handleGetFeatures();

    /* Get statistics */
    case 'GET_STATS':
      return await handleGetStats();

    /* Reset statistics */
    case 'RESET_STATS':
      await statsTracker.resetStats();
      return { success: true };

    /* Get settings */
    case 'GET_SETTINGS':
      return await handleGetSettings();

    /* Update settings */
    case 'UPDATE_SETTINGS':
      return await handleUpdateSettings(data);

    /* Whitelist operations */
    case 'ADD_WHITELIST':
      return await handleAddWhitelist(data.domain);

    case 'REMOVE_WHITELIST':
      return await handleRemoveWhitelist(data.domain);

    case 'GET_WHITELIST':
      return await handleGetWhitelist();

    /* Blacklist operations */
    case 'ADD_BLACKLIST':
      return await handleAddBlacklist(data.domain);

    case 'REMOVE_BLACKLIST':
      return await handleRemoveBlacklist(data.domain);

    case 'GET_BLACKLIST':
      return await handleGetBlacklist();

    /* Export/Import */
    case 'EXPORT_SETTINGS':
      return await handleExportSettings();

    case 'IMPORT_SETTINGS':
      return await handleImportSettings(data);

    case 'RESET_ALL':
      return await handleResetAll();

    /* Rule count */
    case 'GET_RULE_COUNT':
      return await ruleEngine.getRuleCount();

    /* Filter update */
    case 'CHECK_UPDATES':
      return await filterManager.checkForUpdates();

    case 'GET_UPDATE_STATUS':
      return await filterManager.getUpdateStatus();

    /* Current tab info */
    case 'GET_CURRENT_TAB':
      return await handleGetCurrentTab();

    /* Content script notifications */
    case 'CONTENT_BLOCKED':
      statsTracker.recordBlocked(data.category);
      await updateBadge();
      return { success: true };

    default:
      return { success: false, error: `Unknown message type: ${type}` };
  }
}

/* ===== Message Handlers ===== */

async function handleToggleFeature(featureId, enabled) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.FEATURES);
  const features = result[STORAGE_KEYS.FEATURES] || {};
  features[featureId] = enabled;
  await chrome.storage.local.set({ [STORAGE_KEYS.FEATURES]: features });

  /* Update DNR rules */
  await ruleEngine.toggleFeature(featureId, enabled);

  /* Handle special features */
  if (featureId === FEATURES.AUTO_FILTER_UPDATE) {
    if (enabled) {
      await filterManager.startAutoUpdate();
    } else {
      await filterManager.stopAutoUpdate();
    }
  }

  /* Notify content scripts about YouTube blocker toggle */
  if (featureId === FEATURES.YOUTUBE_ADS_BLOCK ||
      featureId === FEATURES.ADULT_VIDEO_BLOCK ||
      featureId === FEATURES.POPUP_BLOCKER) {
    await notifyContentScripts({ type: 'FEATURE_CHANGED', data: { featureId, enabled } });
  }

  await updateBadge();
  return { success: true, features };
}

async function handleGetFeatures() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.FEATURES);
  return { success: true, features: result[STORAGE_KEYS.FEATURES] || {} };
}

async function handleGetStats() {
  const stats = statsTracker.getStats();
  return { success: true, stats };
}

async function handleGetSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return { success: true, settings: result[STORAGE_KEYS.SETTINGS] || {} };
}

async function handleUpdateSettings(updates) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const settings = result[STORAGE_KEYS.SETTINGS] || {};
  Object.assign(settings, updates);
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  return { success: true, settings };
}

async function handleAddWhitelist(domain) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  const whitelist = result[STORAGE_KEYS.WHITELIST] || [];
  const normalized = domain.toLowerCase().trim();
  if (!whitelist.includes(normalized)) {
    whitelist.push(normalized);
    await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: whitelist });
    await ruleEngine.addWhitelistDomain(normalized);
  }
  return { success: true, whitelist };
}

async function handleRemoveWhitelist(domain) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  const whitelist = (result[STORAGE_KEYS.WHITELIST] || []).filter(d => d !== domain.toLowerCase().trim());
  await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: whitelist });
  await ruleEngine.removeWhitelistDomain(domain);
  return { success: true, whitelist };
}

async function handleGetWhitelist() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  return { success: true, whitelist: result[STORAGE_KEYS.WHITELIST] || [] };
}

async function handleAddBlacklist(domain) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BLACKLIST);
  const blacklist = result[STORAGE_KEYS.BLACKLIST] || [];
  const normalized = domain.toLowerCase().trim();
  if (!blacklist.includes(normalized)) {
    blacklist.push(normalized);
    await chrome.storage.local.set({ [STORAGE_KEYS.BLACKLIST]: blacklist });
    await ruleEngine.applyBlacklistRules();
  }
  return { success: true, blacklist };
}

async function handleRemoveBlacklist(domain) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BLACKLIST);
  const blacklist = (result[STORAGE_KEYS.BLACKLIST] || []).filter(d => d !== domain.toLowerCase().trim());
  await chrome.storage.local.set({ [STORAGE_KEYS.BLACKLIST]: blacklist });
  await ruleEngine.applyBlacklistRules();
  return { success: true, blacklist };
}

async function handleGetBlacklist() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BLACKLIST);
  return { success: true, blacklist: result[STORAGE_KEYS.BLACKLIST] || [] };
}

async function handleExportSettings() {
  const keys = Object.values(STORAGE_KEYS);
  const data = await chrome.storage.local.get(keys);
  return {
    success: true,
    backup: {
      version: VERSION,
      exportDate: new Date().toISOString(),
      data
    }
  };
}

async function handleImportSettings(backup) {
  if (!backup || !backup.data || !backup.version) {
    return { success: false, error: 'Invalid backup format' };
  }
  await chrome.storage.local.set(backup.data);
  await initializeExtension();
  return { success: true };
}

async function handleResetAll() {
  await chrome.storage.local.clear();
  await storage.setDefaults();
  await chrome.storage.local.set({ [STORAGE_KEYS.FIRST_RUN]: false });
  await initializeExtension();
  return { success: true };
}

async function handleGetCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      return {
        success: true,
        tab: {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          domain: tab.url ? new URL(tab.url).hostname.replace(/^www\./, '') : ''
        }
      };
    }
  } catch {
    /* Tab query failed */
  }
  return { success: false };
}

/* ===== Utilities ===== */

/**
 * Update the extension badge with blocked count
 */
async function updateBadge() {
  try {
    const stats = statsTracker.getStats();
    const count = stats.adsBlockedToday || 0;
    let text = '';

    if (count > 0) {
      text = count > 999 ? `${Math.floor(count / 1000)}K` : count.toString();
    }

    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } catch {
    /* Badge update failed — not critical */
  }
}

/**
 * Send a message to all content scripts in active tabs
 * @param {Object} message
 */
async function notifyContentScripts(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch {
          /* Tab might not have content script loaded */
        }
      }
    }
  } catch {
    /* Query failed */
  }
}
