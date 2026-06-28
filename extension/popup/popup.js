/**
 * Free Blocker — Popup Script
 * Manages the popup UI, feature toggles, and statistics display.
 */

import { FEATURE_META, FEATURES } from '../utils/constants.js';
import { CardComponent } from '../components/card.js';
import { formatNumber } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  /* Elements */
  const featuresContainer = document.getElementById('features-container');
  const statBlockedToday = document.getElementById('stat-blocked-today');
  const statBlockedTotal = document.getElementById('stat-blocked-total');
  const globalStatusIndicator = document.getElementById('global-status-indicator');
  const globalStatusText = document.getElementById('global-status-text');

  /* Navigation Buttons */
  document.getElementById('btn-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'pages/dashboard/dashboard.html' });
  });

  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  document.getElementById('btn-earnings').addEventListener('click', () => {
    chrome.tabs.create({ url: 'pages/earnings/earnings.html' });
  });

  /* Render */
  await renderPopup();

  /**
   * Only show blocking features as requested by user
   */
  const BLOCKING_FEATURES = [
    { id: FEATURES.ALL_ADS_BLOCK, color: 'purple' },
    { id: FEATURES.AUTO_FILTER_UPDATE, color: 'blue' },
    { id: FEATURES.ADULT_WEBSITE_BLOCK, color: 'red' },
    { id: FEATURES.ADULT_VIDEO_BLOCK, color: 'pink' },
    { id: FEATURES.SCAM_WEBSITE_DETECTION, color: 'orange' },
    { id: FEATURES.YOUTUBE_ADS_BLOCK, color: 'cyan' },
    { id: FEATURES.TRACKING_PROTECTION, color: 'emerald' },
    { id: FEATURES.SOCIAL_MEDIA_ADS_BLOCK, color: 'indigo' }
  ];

  /**
   * Render the entire popup UI
   */
  async function renderPopup() {
    let features = {};
    let stats = { adsBlockedToday: 1204, adsBlockedTotal: 45892 }; // Fallback stats for UI preview

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const [featuresRes, statsRes] = await Promise.all([
          chrome.runtime.sendMessage({ type: 'GET_FEATURES' }),
          chrome.runtime.sendMessage({ type: 'GET_STATS' })
        ]);
        features = featuresRes?.features || {};
        if (statsRes?.stats) stats = statsRes.stats;
      } else {
        throw new Error('Chrome runtime not available');
      }
    } catch (error) {
      console.warn('Using UI preview mode (opened outside extension popup context):', error);
      // Fallback features for preview
      features = {
        [FEATURES.ALL_ADS_BLOCK]: true,
        [FEATURES.AUTO_FILTER_UPDATE]: true,
        [FEATURES.ADULT_WEBSITE_BLOCK]: true,
        [FEATURES.SCAM_WEBSITE_DETECTION]: true
      };
    }

    updateStatsBanner(stats);
    updateGlobalStatus(features);

    featuresContainer.innerHTML = '';

    /* Add purely blocker features as a flat list */
    for (const item of BLOCKING_FEATURES) {
      const meta = FEATURE_META[item.id];
      if (!meta) continue;

      const isEnabled = features[item.id] === true;
      const row = CardComponent.create({
        id: item.id,
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        color: item.color,
        enabled: isEnabled,
        onToggle: handleToggle
      });
      
      featuresContainer.appendChild(row);
    }
  }

  /**
   * Handle feature toggle
   */
  async function handleToggle(featureId, enabled) {
    try {
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_FEATURE',
        data: { featureId, enabled }
      });

      const res = await chrome.runtime.sendMessage({ type: 'GET_FEATURES' });
      if (res && res.features) {
        updateGlobalStatus(res.features);
      }
    } catch (error) {
      console.error(`Failed to toggle ${featureId}:`, error);
    }
  }

  /**
   * Update stats banner numbers with animation
   */
  function updateStatsBanner(stats) {
    if (statBlockedToday) animateValue(statBlockedToday, 0, stats.adsBlockedToday || 0, 1500);
    if (statBlockedTotal) animateValue(statBlockedTotal, 0, stats.adsBlockedTotal || 0, 1500);
  }

  /**
   * Helper to animate number counting
   */
  function animateValue(obj, start, end, duration) {
    if (end === 0) {
      obj.innerHTML = "0";
      return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      /* Easing out quint */
      const easeProgress = 1 - Math.pow(1 - progress, 5); 
      const current = Math.floor(easeProgress * (end - start) + start);
      obj.innerHTML = current.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = formatNumber(end);
      }
    };
    window.requestAnimationFrame(step);
  }

  /**
   * Update global protection status indicator
   */
  function updateGlobalStatus(features) {
    const isProtected = features[FEATURES.ALL_ADS_BLOCK] || features[FEATURES.TRACKING_PROTECTION];

    if (isProtected) {
      globalStatusIndicator.className = 'status-dot active';
      globalStatusText.className = 'status-label active';
      globalStatusText.innerHTML = '<span class="pulse-dot"></span> Protection Active';
    } else {
      globalStatusIndicator.className = 'status-dot inactive';
      globalStatusText.className = 'status-label inactive';
      globalStatusText.innerHTML = '<span class="pulse-dot" style="background:var(--danger);animation:none;"></span> Protection Disabled';
    }
  }
});
