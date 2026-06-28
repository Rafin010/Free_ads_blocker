/**
 * Free Blocker — Main Content Script
 * Handles cosmetic ad hiding, popup blocking, and element observation.
 * Runs on all pages at document_start.
 */

(function () {
  'use strict';

  /* Prevent multiple injections */
  if (window.__freeBlockerContentLoaded) return;
  window.__freeBlockerContentLoaded = true;

  /** Feature state cache */
  let featureStates = {};

  /** Initialize by fetching current feature states */
  async function initialize() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_FEATURES' });
      if (response && response.features) {
        featureStates = response.features;
      }
    } catch {
      /* Extension context invalidated — fail silently */
    }

    if (featureStates.popupBlocker) {
      blockPopups();
    }
    if (featureStates.bannerAdsBlock || featureStates.allAdsBlock) {
      startAdObserver();
    }
    if (featureStates.cookieProtection) {
      hideCookieBanners();
    }
  }

  /* ===== Popup Blocker ===== */

  function blockPopups() {
    /* Override window.open */
    const originalOpen = window.open;
    window.open = function (...args) {
      notifyBlocked('popup');
      return null;
    };

    /* Block target="_blank" click hijacking */
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a[target="_blank"]');
      if (target) {
        const href = target.getAttribute('href');
        /* Allow legitimate navigation, block suspicious ones */
        if (href && isLikelySuspicious(href)) {
          e.preventDefault();
          e.stopPropagation();
          notifyBlocked('popup');
        }
      }
    }, true);
  }

  /**
   * Check if a URL is likely a suspicious popup
   * @param {string} url
   * @returns {boolean}
   */
  function isLikelySuspicious(url) {
    const suspicious = [
      'doubleclick', 'popads', 'popcash', 'popunder',
      'adserv', 'clicktrack', 'redirect', 'offer',
      'landing', 'promo', 'popup'
    ];
    const lowerUrl = url.toLowerCase();
    return suspicious.some(keyword => lowerUrl.includes(keyword));
  }

  /* ===== Ad Element Hiding ===== */

  /** Common ad-related selectors */
  const AD_SELECTORS = [
    /* Google ads */
    'ins.adsbygoogle',
    '[id^="google_ads"]',
    '[id^="div-gpt-ad"]',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication"]',

    /* Generic ad containers */
    '[class*="ad-container"]',
    '[class*="ad-wrapper"]',
    '[class*="ad-banner"]',
    '[class*="ad-slot"]',
    '[class*="advertisement"]',
    '[id*="ad-container"]',
    '[id*="ad-wrapper"]',
    '[id*="ad-banner"]',
    '[id*="advertisement"]',

    /* Common ad frameworks */
    '[data-ad]',
    '[data-ad-slot]',
    '[data-ad-client]',
    '[data-adunit]',
    '.adbox',
    '.ad-unit',
    '.sponsored-content',
    '.native-ad',

    /* Popup overlays */
    '[class*="popup-overlay"]',
    '[class*="modal-ad"]',
    '[id*="popup-ad"]'
  ];

  /** Cookie banner selectors */
  const COOKIE_SELECTORS = [
    '[class*="cookie-banner"]',
    '[class*="cookie-consent"]',
    '[class*="cookie-notice"]',
    '[id*="cookie-banner"]',
    '[id*="cookie-consent"]',
    '[id*="cookie-notice"]',
    '[class*="gdpr"]',
    '[id*="gdpr"]',
    '.cc-banner',
    '#CybotCookiebotDialog',
    '.osano-cm-window',
    '#onetrust-banner-sdk'
  ];

  /**
   * Start observing DOM for ad elements
   */
  function startAdObserver() {
    /* Initial sweep */
    hideAdElements();

    /* Watch for dynamically inserted ads */
    const observer = new MutationObserver(debounce(() => {
      hideAdElements();
    }, 200));

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      /* Body not ready yet — wait for it */
      document.addEventListener('DOMContentLoaded', () => {
        hideAdElements();
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    }
  }

  /**
   * Hide all matching ad elements on the page
   */
  function hideAdElements() {
    let count = 0;
    const selector = AD_SELECTORS.join(', ');

    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.dataset.fbHidden) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('height', '0', 'important');
          el.style.setProperty('overflow', 'hidden', 'important');
          el.dataset.fbHidden = 'true';
          count++;
        }
      });
    } catch {
      /* Selector query failed */
    }

    if (count > 0) {
      notifyBlocked('ads', count);
    }
  }

  /**
   * Hide cookie consent banners
   */
  function hideCookieBanners() {
    const hide = () => {
      const selector = COOKIE_SELECTORS.join(', ');
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el.dataset.fbHidden) {
            el.style.setProperty('display', 'none', 'important');
            el.dataset.fbHidden = 'true';
          }
        });
      } catch {
        /* Selector query failed */
      }
    };

    /* Try immediately and after DOM is loaded */
    hide();
    document.addEventListener('DOMContentLoaded', hide);
    setTimeout(hide, 2000);
  }

  /* ===== Communication ===== */

  /**
   * Notify background script about blocked content
   * @param {string} category
   * @param {number} count
   */
  function notifyBlocked(category, count = 1) {
    try {
      chrome.runtime.sendMessage({
        type: 'CONTENT_BLOCKED',
        data: { category, count }
      });
    } catch {
      /* Extension context invalidated */
    }
  }

  /** Listen for feature state changes from background */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'FEATURE_CHANGED') {
      featureStates[message.data.featureId] = message.data.enabled;
    }
  });

  /* ===== Utilities ===== */

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* ===== Start ===== */
  initialize();
})();
