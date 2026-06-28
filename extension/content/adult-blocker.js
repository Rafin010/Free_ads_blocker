/**
 * Free Blocker — Adult Content Blocker
 * Detects and blocks adult video content and adult-related pages.
 */

(function () {
  'use strict';

  if (window.__freeBlockerAdultLoaded) return;
  window.__freeBlockerAdultLoaded = true;

  let adultVideoBlock = false;
  let adultWebsiteBlock = false;

  /** Known adult video platform domains */
  const ADULT_VIDEO_DOMAINS = [
    'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com',
    'redtube.com', 'youporn.com', 'tube8.com', 'spankbang.com',
    'eporner.com', 'tnaflix.com', 'drtuber.com', 'nuvid.com',
    'hclips.com', 'beeg.com', 'txxx.com', 'porntrex.com',
    'thumbzilla.com', 'fuq.com', 'porn.com', 'youjizz.com',
    'motherless.com', 'ixxx.com', 'pornone.com', 'hqporner.com',
    'vporn.com', 'lobstertube.com', 'porndig.com', 'fux.com',
    'xxxbunker.com', 'pornmd.com', 'alohatube.com'
  ];

  /** Keywords that indicate adult content in page metadata */
  const ADULT_KEYWORDS = [
    'porn', 'xxx', 'adult video', 'nude', 'naked',
    'sex video', 'hentai', 'erotic video', 'nsfw video',
    'adult film', 'adult content'
  ];

  async function initialize() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_FEATURES' });
      if (response && response.features) {
        adultVideoBlock = response.features.adultVideoBlock === true;
        adultWebsiteBlock = response.features.adultWebsiteBlock === true;
      }
    } catch {
      return;
    }

    if (adultVideoBlock || adultWebsiteBlock) {
      checkCurrentPage();
    }
  }

  /** Listen for feature state changes */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'FEATURE_CHANGED') {
      if (message.data.featureId === 'adultVideoBlock') {
        adultVideoBlock = message.data.enabled;
      }
      if (message.data.featureId === 'adultWebsiteBlock') {
        adultWebsiteBlock = message.data.enabled;
      }
      if (adultVideoBlock || adultWebsiteBlock) {
        checkCurrentPage();
      }
    }
  });

  /**
   * Check if the current page should be blocked
   */
  function checkCurrentPage() {
    const hostname = window.location.hostname.replace(/^www\./, '').toLowerCase();

    /* Check if domain is a known adult site */
    if (adultWebsiteBlock || adultVideoBlock) {
      const isAdultDomain = ADULT_VIDEO_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
      );

      if (isAdultDomain) {
        blockPage();
        notifyBlocked();
        return;
      }
    }

    /* Check page content for adult indicators */
    if (adultVideoBlock) {
      document.addEventListener('DOMContentLoaded', () => {
        if (detectAdultContent()) {
          hideAdultVideoElements();
        }
      });
    }
  }

  /**
   * Detect adult content from page metadata
   * @returns {boolean}
   */
  function detectAdultContent() {
    /* Check meta tags */
    const metaTags = document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property="og:title"]');
    for (const meta of metaTags) {
      const content = (meta.getAttribute('content') || '').toLowerCase();
      if (ADULT_KEYWORDS.some(kw => content.includes(kw))) {
        return true;
      }
    }

    /* Check page title */
    const title = document.title.toLowerCase();
    if (ADULT_KEYWORDS.some(kw => title.includes(kw))) {
      return true;
    }

    /* Check rating meta tag */
    const rating = document.querySelector('meta[name="rating"]');
    if (rating) {
      const value = (rating.getAttribute('content') || '').toLowerCase();
      if (value === 'adult' || value === 'rta-5042-1996-1400-1577-0') {
        return true;
      }
    }

    return false;
  }

  /**
   * Block the entire page with a warning overlay
   */
  function blockPage() {
    /* Wait for body to exist */
    const apply = () => {
      if (!document.body) return;

      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f23;font-family:Inter,system-ui,sans-serif;';

      const container = document.createElement('div');
      container.style.cssText = 'text-align:center;padding:3rem;max-width:480px;';

      container.innerHTML = `
        <div style="font-size:4rem;margin-bottom:1.5rem;">🛡️</div>
        <h1 style="color:#f43f5e;font-size:1.75rem;font-weight:700;margin:0 0 1rem;">Content Blocked</h1>
        <p style="color:#94a3b8;font-size:1rem;line-height:1.6;margin:0 0 2rem;">
          This website has been blocked by Free Blocker's adult content protection.
        </p>
        <div style="background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.2);border-radius:12px;padding:1rem;margin-bottom:1.5rem;">
          <p style="color:#f87171;font-size:0.875rem;margin:0;">
            🔒 Adult content protection is enabled
          </p>
        </div>
        <button id="fb-go-back" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;padding:0.75rem 2rem;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
          ← Go Back to Safety
        </button>
      `;

      document.body.appendChild(container);

      const btn = document.getElementById('fb-go-back');
      if (btn) {
        btn.addEventListener('click', () => {
          if (history.length > 1) {
            history.back();
          } else {
            window.location.href = 'about:blank';
          }
        });
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateY(-2px)';
          btn.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translateY(0)';
          btn.style.boxShadow = '0 4px 15px rgba(99,102,241,0.4)';
        });
      }
    };

    if (document.body) {
      apply();
    } else {
      document.addEventListener('DOMContentLoaded', apply);
    }
  }

  /**
   * Hide adult video elements without blocking the whole page
   */
  function hideAdultVideoElements() {
    const selectors = [
      'video[src*="adult"]',
      'video[src*="porn"]',
      'video[src*="xxx"]',
      'iframe[src*="pornhub"]',
      'iframe[src*="xvideos"]',
      'iframe[src*="xhamster"]',
      'iframe[src*="redtube"]',
      '[class*="adult-video"]',
      '[class*="nsfw"]'
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.dataset.fbHidden = 'true';
      });
    });
  }

  function notifyBlocked() {
    try {
      chrome.runtime.sendMessage({
        type: 'CONTENT_BLOCKED',
        data: { category: 'adult', count: 1 }
      });
    } catch { /* */ }
  }

  initialize();
})();
