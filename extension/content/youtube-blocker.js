/**
 * Free Blocker — YouTube Ad Blocker
 * Removes YouTube pre-roll, mid-roll, overlay, and sidebar ads.
 * Runs only on youtube.com domains.
 */

(function () {
  'use strict';

  if (window.__freeBlockerYouTubeLoaded) return;
  window.__freeBlockerYouTubeLoaded = true;

  let isEnabled = true;

  /** Initialize by checking feature state */
  async function initialize() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_FEATURES' });
      if (response && response.features) {
        isEnabled = response.features.youtubeAdsBlock !== false;
      }
    } catch {
      /* Default to enabled */
    }

    if (isEnabled) {
      startBlocking();
    }
  }

  /** Listen for toggle changes */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'FEATURE_CHANGED' && message.data.featureId === 'youtubeAdsBlock') {
      isEnabled = message.data.enabled;
      if (!isEnabled) {
        stopBlocking();
      } else {
        startBlocking();
      }
    }
  });

  let observer = null;
  let adCheckInterval = null;

  function startBlocking() {
    /* Initial cleanup */
    removeAds();

    /* Periodic ad check */
    adCheckInterval = setInterval(removeAds, 1000);

    /* DOM observer for dynamic content */
    observer = new MutationObserver(debounce(removeAds, 300));

    const startObserving = () => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style']
        });
      }
    };

    if (document.body) {
      startObserving();
    } else {
      document.addEventListener('DOMContentLoaded', startObserving);
    }
  }

  function stopBlocking() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (adCheckInterval) {
      clearInterval(adCheckInterval);
      adCheckInterval = null;
    }
  }

  /**
   * Remove YouTube ads from the page
   */
  function removeAds() {
    if (!isEnabled) return;

    skipVideoAd();
    hideAdOverlays();
    hideAdContainers();
    hideSidebarAds();
    hideMastheadAds();
  }

  /**
   * Skip video ads by clicking the skip button or fast-forwarding
   */
  function skipVideoAd() {
    /* Click skip button if available */
    const skipButtons = document.querySelectorAll(
      '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, ' +
      '[class*="skip-button"], .videoAdUiSkipButton, ' +
      'button.ytp-ad-skip-button-slot'
    );

    skipButtons.forEach(btn => {
      if (btn.offsetParent !== null) {
        btn.click();
        notifyBlocked();
      }
    });

    /* Check if an ad is currently playing */
    const adPlaying = document.querySelector('.ad-showing, .ad-interrupting');
    if (adPlaying) {
      const video = document.querySelector('video');
      if (video && video.duration && isFinite(video.duration)) {
        /* Fast-forward to end of ad */
        video.currentTime = video.duration;
        video.playbackRate = 16;
        notifyBlocked();
      }
    }

    /* Close ad overlay panels */
    const closeButtons = document.querySelectorAll(
      '.ytp-ad-overlay-close-button, .ytp-ad-overlay-close-container, ' +
      '[class*="ad-overlay-close"]'
    );
    closeButtons.forEach(btn => btn.click());
  }

  /**
   * Hide ad overlay elements
   */
  function hideAdOverlays() {
    const selectors = [
      '.ytp-ad-overlay-container',
      '.ytp-ad-overlay-slot',
      '.ytp-ad-text-overlay',
      '.ytp-ad-image-overlay',
      '.ytp-ad-player-overlay',
      '.ytp-ad-overlay-ad-info-button-container',
      '#player-ads',
      '.video-ads',
      '.ytp-ad-module'
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (el.offsetParent !== null && !el.dataset.fbHidden) {
          el.style.setProperty('display', 'none', 'important');
          el.dataset.fbHidden = 'true';
        }
      });
    });
  }

  /**
   * Hide ad containers in the feed and page
   */
  function hideAdContainers() {
    const selectors = [
      'ytd-promoted-video-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-display-ad-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-ad-slot-renderer',
      'ytd-banner-promo-renderer',
      'ytd-statement-banner-renderer',
      'ytd-video-masthead-ad-v3-renderer',
      'ytd-primetime-promo-renderer',
      '#masthead-ad',
      'ytd-mealbar-promo-renderer',
      'ytd-action-companion-ad-renderer',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]'
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.dataset.fbHidden) {
          el.style.setProperty('display', 'none', 'important');
          el.dataset.fbHidden = 'true';
          notifyBlocked();
        }
      });
    });
  }

  /**
   * Hide sidebar/companion ads
   */
  function hideSidebarAds() {
    const selectors = [
      'ytd-companion-slot-renderer',
      '#related ytd-promoted-video-renderer',
      '.ytd-merch-shelf-renderer',
      'ytd-merchandise-shelf-renderer'
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.dataset.fbHidden) {
          el.style.setProperty('display', 'none', 'important');
          el.dataset.fbHidden = 'true';
        }
      });
    });
  }

  /**
   * Hide masthead / top-of-page ads
   */
  function hideMastheadAds() {
    const masthead = document.querySelector('#masthead-ad');
    if (masthead && !masthead.dataset.fbHidden) {
      masthead.style.setProperty('display', 'none', 'important');
      masthead.dataset.fbHidden = 'true';
    }
  }

  /**
   * Notify background about blocked YouTube ad
   */
  function notifyBlocked() {
    try {
      chrome.runtime.sendMessage({
        type: 'CONTENT_BLOCKED',
        data: { category: 'ads', count: 1 }
      });
    } catch {
      /* Extension context invalidated */
    }
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* Start */
  initialize();
})();
