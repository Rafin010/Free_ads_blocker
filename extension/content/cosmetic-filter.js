/**
 * Free Blocker — Cosmetic Filter
 * CSS-based element hiding for ads using style injection.
 * Lighter than DOM manipulation — hides via CSS rules.
 */

(function () {
  'use strict';

  if (window.__freeBlockerCosmeticLoaded) return;
  window.__freeBlockerCosmeticLoaded = true;

  /** Cosmetic filter CSS rules — hides ad elements purely via CSS */
  const COSMETIC_RULES = `
    /* Google Ads */
    ins.adsbygoogle,
    #google_ads_frame1,
    #google_ads_frame2,
    #google_ads_frame3,
    [id^="google_ads_iframe"],
    [id^="aswift_"],
    .google-auto-placed {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }

    /* Generic Ad Selectors */
    [class*="-ad-"],
    [class*="_ad_"],
    [class$="-ad"],
    [class^="ad-"],
    [id*="-ad-"],
    [id*="_ad_"],
    [id$="-ad"],
    [id^="ad-"],
    .ad,
    .ads,
    .advert,
    .ad-wrapper,
    .ad-container,
    .ad-banner,
    .ad-slot,
    .ad-unit,
    .ad-block,
    .ad-panel,
    .ad-placeholder,
    .ad-footer,
    .ad-header,
    .ad-sidebar,
    .advertisement,
    .advertisment,
    .ad-space,
    #ad-container,
    #ad-wrapper,
    #ad-banner,
    #ad-header,
    #ad-footer,
    #ad-sidebar,
    div[aria-label="advertisement"],
    div[aria-label="Advertisement"],
    aside[aria-label="advertisement"],
    section[aria-label="advertisement"] {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }

    /* Sponsored Content */
    .sponsored,
    .sponsored-content,
    .promoted-content,
    .native-ad,
    .outbrain,
    .taboola,
    .mgid,
    [class*="sponsored"],
    [class*="promoted"],
    [data-component="Taboola"],
    [data-testid="taboola"],
    #taboola-below-article,
    .ob-widget,
    .OUTBRAIN {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }

    /* Social Media Ad Containers */
    [data-testid="placementTracking"],
    [data-ad-preview],
    [data-ad-comet-preview],
    article[data-testid="tweet"][class*="promoted"],
    div[data-testid="promoteContainer"] {
      display: none !important;
    }

    /* Popup / Overlay Ads */
    .popup-ad,
    .modal-ad,
    .interstitial-ad,
    .overlay-ad,
    [class*="popup-ad"],
    [class*="modal-ad"],
    [class*="interstitial"],
    [id*="popup-ad"],
    [id*="interstitial"] {
      display: none !important;
    }

    /* Video Ad Overlays */
    .video-ad-overlay,
    .video-ad-companion,
    [class*="video-ad"],
    [class*="preroll"],
    [class*="midroll"] {
      display: none !important;
    }

    /* Anti-adblock Warnings */
    [class*="adblock-warning"],
    [class*="adblocker-warning"],
    [class*="ad-blocker-warning"],
    [id*="adblock-warning"],
    [id*="adblocker-warning"] {
      display: none !important;
    }

    /* Sticky / Fixed Position Ads */
    div[style*="position: fixed"][class*="ad"],
    div[style*="position: sticky"][class*="ad"],
    div[style*="position:fixed"][class*="ad"],
    div[style*="position:sticky"][class*="ad"] {
      display: none !important;
    }

    /* Common Ad iframes */
    iframe[src*="doubleclick"],
    iframe[src*="googlesyndication"],
    iframe[src*="amazon-adsystem"],
    iframe[src*="facebook.com/plugins/ad"],
    iframe[src*="adservice"],
    iframe[src*="adnxs"],
    iframe[src*="rubiconproject"],
    iframe[src*="pubmatic"],
    iframe[src*="openx"],
    iframe[src*="criteo"] {
      display: none !important;
      height: 0 !important;
      width: 0 !important;
    }

    /* Ripple animation for Free Blocker UI */
    @keyframes fb-ripple {
      0% { transform: scale(0); opacity: 0.5; }
      100% { transform: scale(2.5); opacity: 0; }
    }
  `;

  /**
   * Inject cosmetic filter stylesheet into the page
   */
  function injectCosmetics() {
    const style = document.createElement('style');
    style.id = 'free-blocker-cosmetic-filters';
    style.textContent = COSMETIC_RULES;

    /* Inject as early as possible */
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    } else {
      /* Head not ready — wait */
      document.addEventListener('DOMContentLoaded', () => {
        (document.head || document.documentElement).appendChild(style);
      });
    }
  }

  /** Check feature state before injecting */
  async function initialize() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_FEATURES' });
      if (response && response.features) {
        if (response.features.allAdsBlock || response.features.bannerAdsBlock) {
          injectCosmetics();
        }
      } else {
        /* Default to injecting */
        injectCosmetics();
      }
    } catch {
      /* Can't communicate — inject by default */
      injectCosmetics();
    }
  }

  initialize();
})();
