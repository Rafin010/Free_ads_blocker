/**
 * Free Blocker — YouTube Video Ad Blocker (2025/2026 Edition)
 * Advanced blocker that handles pre-roll, mid-roll, shorts, and anti-adblock walls.
 */

(function () {
  'use strict';

  if (window.__freeBlockerYTLoaded) return;
  window.__freeBlockerYTLoaded = true;

  let isEnabled = false;
  let adSkipObserver = null;
  let playerObserver = null;
  let antiAdblockObserver = null;

  /* Current YouTube AD elements & 2025 Selectors */
  const AD_SELECTORS = {
    skipButtons: [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      'button[class*="skip-ad"]',
      '[id^="skip-button"]'
    ],
    videoAds: [
      '.video-ads',
      '.ytp-ad-module',
      '.ytp-ad-player-overlay',
      '.ytp-ad-overlay-container'
    ],
    promotedContent: [
      'ytd-promoted-sparkles-web-renderer',
      'ytd-promoted-video-renderer',
      'ytd-display-ad-renderer',
      'ytd-banner-promo-renderer',
      'ytd-action-companion-ad-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-ad-slot-renderer',
      '#masthead-ad'
    ],
    shortsAds: [
      'ytd-reel-video-renderer[is-ad]',
      'ytd-ad-slot-renderer[is-shorts-ad]',
      '[is-ad="true"]'
    ],
    antiAdblockWall: [
      'ytd-enforcement-message-view-model',
      '.ytd-enforcement-message-view-model',
      'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)'
    ]
  };

  /** Check feature state */
  async function initialize() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_FEATURES' });
      if (response && response.features) {
        isEnabled = response.features.youtubeAdsBlock === true;
        
        // Ensure YouTube ad blocking feature exists in config
        if (response.features.youtubeAdsBlock === undefined) {
           isEnabled = true; // Default to true if not configured yet
        }
      } else {
        isEnabled = true;
      }
    } catch {
      isEnabled = true; // Default on failure
    }

    if (isEnabled) {
      startBlocking();
    }
  }

  /** Listen for feature toggle */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'FEATURE_CHANGED' && message.data.featureId === 'youtubeAdsBlock') {
      isEnabled = message.data.enabled;
      if (isEnabled) {
        startBlocking();
      } else {
        stopBlocking();
      }
    }
  });

  function startBlocking() {
    hideStaticAds();
    observeVideoPlayer();
    observeAntiAdblock();
    observeDOM(); // Fallback for dynamic content
  }

  function stopBlocking() {
    if (adSkipObserver) adSkipObserver.disconnect();
    if (playerObserver) playerObserver.disconnect();
    if (antiAdblockObserver) antiAdblockObserver.disconnect();
    
    document.querySelectorAll('[data-fb-hidden="true"]').forEach(el => {
      el.style.display = '';
      delete el.dataset.fbHidden;
    });
  }

  /**
   * Hide static promoted content using CSS injection to avoid reflows
   */
  function hideStaticAds() {
    const styleId = 'fb-yt-static-hider';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    
    // Combine selectors
    const selectors = [
      ...AD_SELECTORS.promotedContent,
      ...AD_SELECTORS.videoAds
    ].join(', ');

    style.textContent = `${selectors} { display: none !important; opacity: 0 !important; pointer-events: none !important; }`;
    
    (document.head || document.documentElement).appendChild(style);
  }

  /**
   * Bypass YouTube Anti-Adblock Wall
   */
  function bypassAntiAdblockWall(node) {
    if (!node) return;
    
    const isWall = AD_SELECTORS.antiAdblockWall.some(sel => 
      node.matches && (node.matches(sel) || node.querySelector(sel))
    );

    if (isWall) {
      // Find the dialog wrapper and hide it
      const dialog = node.closest ? node.closest('tp-yt-paper-dialog') : null;
      if (dialog) {
        dialog.style.display = 'none';
        
        // Also need to unpause video and remove backdrop
        const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
        if (backdrop) backdrop.style.display = 'none';
        
        // Re-enable scrolling
        document.body.style.overflow = 'auto';
        
        // Play video
        const video = document.querySelector('video');
        if (video && video.paused) {
          video.play().catch(e => console.log('Autoplay prevented', e));
        }
        
        notifyBlocked('anti_adblock');
      }
    }
  }

  /**
   * Observe for anti-adblock popups globally
   */
  function observeAntiAdblock() {
    if (antiAdblockObserver) return;
    
    antiAdblockObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            bypassAntiAdblockWall(node);
          }
        }
      }
    });

    antiAdblockObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Fast ad skipper for video ads
   */
  function handleVideoAd(video) {
    if (!video || isNaN(video.duration)) return;
    
    // Check if player is in ad state
    const player = video.closest('#movie_player');
    const isAdShowing = player && (
      player.classList.contains('ad-showing') || 
      player.classList.contains('ad-interrupting')
    );

    if (isAdShowing) {
      // 2025 approach: Instead of high playback rate which gets flagged,
      // mute and immediately seek to end of ad
      video.muted = true;
      if (video.currentTime < video.duration - 0.1) {
         video.currentTime = video.duration - 0.1;
      }
      
      // Auto-click skip button if present
      AD_SELECTORS.skipButtons.forEach(selector => {
        const btn = document.querySelector(selector);
        if (btn && btn.offsetParent !== null) {
          btn.click();
        }
      });
      
      notifyBlocked('video_ad');
    }
  }

  /**
   * Handle Shorts Ads
   */
  function handleShortsAd(node) {
    if (!node || !node.matches) return;
    
    AD_SELECTORS.shortsAds.forEach(sel => {
      if (node.matches(sel)) {
        // Shorts ads need to be skipped by scrolling to next short
        const nextBtn = document.querySelector('#navigation-button-down button');
        if (nextBtn) {
          nextBtn.click();
          notifyBlocked('shorts_ad');
        }
      }
    });
  }

  /**
   * Observe the video player specifically for faster reaction
   */
  function observeVideoPlayer() {
    const startObserving = () => {
      const video = document.querySelector('video');
      if (video) {
         // Attach timeupdate for frame-perfect ad skipping
         video.addEventListener('timeupdate', () => {
           if (isEnabled) handleVideoAd(video);
         });
         
         // Observe player class changes for ad state
         const player = video.closest('#movie_player');
         if (player) {
           playerObserver = new MutationObserver(() => {
             if (isEnabled) handleVideoAd(video);
           });
           playerObserver.observe(player, { attributes: true, attributeFilter: ['class'] });
         }
      } else {
        setTimeout(startObserving, 500); // Retry if video not loaded
      }
    };
    
    startObserving();
  }

  /**
   * General DOM observer for dynamic content (Shorts, new feeds)
   */
  function observeDOM() {
    adSkipObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
               // Check for shorts
               if (window.location.pathname.includes('/shorts/')) {
                 handleShortsAd(node);
               }
               // Check for standard promoted content
               AD_SELECTORS.promotedContent.forEach(sel => {
                 if (node.matches && node.matches(sel)) {
                   node.style.display = 'none';
                   node.dataset.fbHidden = 'true';
                 }
               });
            }
          }
        }
      }
    });

    adSkipObserver.observe(document.body, { childList: true, subtree: true });
  }

  function notifyBlocked(category = 'youtube') {
    try {
      chrome.runtime.sendMessage({
        type: 'CONTENT_BLOCKED',
        data: { category, count: 1 }
      });
    } catch { /* Ignore */ }
  }

  initialize();
})();
