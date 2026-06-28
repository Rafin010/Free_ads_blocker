/**
 * Free Blocker — API Client
 * Fetch-based HTTP client for backend communication with JWT auth and retry logic.
 */

import { API_CONFIG, STORAGE_KEYS } from './constants.js';
import { RateLimiter } from './security.js';

/** API client for communicating with the Free Blocker backend */
class APIClient {
  constructor() {
    this._baseURL = API_CONFIG.BASE_URL;
    this._timeout = API_CONFIG.TIMEOUT;
    this._retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this._retryDelay = API_CONFIG.RETRY_DELAY;
    this._rateLimiter = new RateLimiter(30, 60000);
    this._token = null;
  }

  /**
   * Set the authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this._token = token;
  }

  /**
   * Load token from storage
   * @returns {Promise<string|null>}
   */
  async loadToken() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
      const user = result[STORAGE_KEYS.USER];
      if (user && user.token) {
        this._token = user.token;
        return this._token;
      }
    } catch {
      /* Storage unavailable */
    }
    return null;
  }

  /**
   * Build request headers
   * @param {Object} extraHeaders - Additional headers
   * @returns {Object}
   */
  _buildHeaders(extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders
    };

    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }

    return headers;
  }

  /**
   * Execute a fetch request with timeout, retry, and error handling
   * @param {string} endpoint - API endpoint (relative)
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async _request(endpoint, options = {}) {
    this._rateLimiter.checkAndRecord();

    const url = `${this._baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this._buildHeaders(options.headers)
    };

    let lastError;

    for (let attempt = 0; attempt < this._retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this._timeout);
        config.signal = controller.signal;

        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        /* Handle token refresh on 401 */
        if (response.status === 401 && this._token) {
          const refreshed = await this._refreshToken();
          if (refreshed) {
            config.headers = this._buildHeaders(options.headers);
            const retryResponse = await fetch(url, config);
            return await this._handleResponse(retryResponse);
          }
        }

        return await this._handleResponse(response);
      } catch (error) {
        lastError = error;
        if (error.name === 'AbortError') {
          lastError = new Error('Request timed out');
        }

        /* Don't retry on client errors */
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        /* Wait before retry */
        if (attempt < this._retryAttempts - 1) {
          await new Promise(r => setTimeout(r, this._retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Process response and handle errors
   * @param {Response} response
   * @returns {Promise<Object>}
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.detail || data.message || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * Attempt token refresh
   * @returns {Promise<boolean>}
   */
  async _refreshToken() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
      const user = result[STORAGE_KEYS.USER];

      if (!user || !user.refreshToken) return false;

      const response = await fetch(`${this._baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: user.refreshToken })
      });

      if (!response.ok) return false;

      const data = await response.json();
      this._token = data.access_token;

      /* Update stored token */
      user.token = data.access_token;
      if (data.refresh_token) {
        user.refreshToken = data.refresh_token;
      }
      await chrome.storage.local.set({ [STORAGE_KEYS.USER]: user });

      return true;
    } catch {
      return false;
    }
  }

  /* ===== Auth Endpoints ===== */

  /**
   * Register a new user
   * @param {string} email
   * @param {string} password
   * @param {string} [referralCode]
   * @returns {Promise<Object>}
   */
  async register(email, password, referralCode = null) {
    const body = { email, password };
    if (referralCode) body.referral_code = referralCode;

    const data = await this._request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (data.access_token) {
      this.setToken(data.access_token);
      await chrome.storage.local.set({
        [STORAGE_KEYS.USER]: {
          email,
          token: data.access_token,
          refreshToken: data.refresh_token,
          referralCode: data.referral_code,
          isPremium: false
        }
      });
    }

    return data;
  }

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    const data = await this._request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.access_token) {
      this.setToken(data.access_token);
      await chrome.storage.local.set({
        [STORAGE_KEYS.USER]: {
          email,
          token: data.access_token,
          refreshToken: data.refresh_token,
          referralCode: data.referral_code,
          isPremium: data.is_premium || false
        }
      });
    }

    return data;
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await this._request('/auth/logout', { method: 'POST' });
    } catch {
      /* Ignore errors on logout */
    }
    this._token = null;
    await chrome.storage.local.remove(STORAGE_KEYS.USER);
  }

  /* ===== Sync Endpoints ===== */

  /**
   * Sync settings to cloud
   * @param {Object} settings - Extension settings
   * @returns {Promise<Object>}
   */
  async syncSettings(settings) {
    return this._request('/sync/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
  }

  /**
   * Get settings from cloud
   * @returns {Promise<Object>}
   */
  async getSyncedSettings() {
    return this._request('/sync/settings');
  }

  /**
   * Register device for sync
   * @param {Object} deviceInfo
   * @returns {Promise<Object>}
   */
  async registerDevice(deviceInfo) {
    return this._request('/sync/devices', {
      method: 'POST',
      body: JSON.stringify(deviceInfo)
    });
  }

  /* ===== License Endpoints ===== */

  /**
   * Verify license/premium status
   * @returns {Promise<Object>}
   */
  async verifyLicense() {
    return this._request('/license/verify');
  }

  /**
   * Activate premium
   * @param {string} licenseKey
   * @returns {Promise<Object>}
   */
  async activatePremium(licenseKey) {
    return this._request('/license/activate', {
      method: 'POST',
      body: JSON.stringify({ license_key: licenseKey })
    });
  }

  /* ===== Referral Endpoints ===== */

  /**
   * Get referral status
   * @returns {Promise<Object>}
   */
  async getReferralStatus() {
    return this._request('/referral/status');
  }

  /**
   * Apply referral code
   * @param {string} code
   * @returns {Promise<Object>}
   */
  async applyReferralCode(code) {
    return this._request('/referral/apply', {
      method: 'POST',
      body: JSON.stringify({ referral_code: code })
    });
  }

  /* ===== Analytics Endpoints ===== */

  /**
   * Send analytics data
   * @param {Object} data - Analytics data
   * @returns {Promise<Object>}
   */
  async sendAnalytics(data) {
    return this._request('/analytics/report', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /* ===== Version & Config ===== */

  /**
   * Check for updates
   * @param {string} currentVersion
   * @returns {Promise<Object>}
   */
  async checkVersion(currentVersion) {
    return this._request(`/version/check?version=${currentVersion}`);
  }

  /**
   * Get remote configuration
   * @returns {Promise<Object>}
   */
  async getRemoteConfig() {
    return this._request('/config/remote');
  }

  /* ===== Rules Endpoints ===== */

  /**
   * Get updated filter rules
   * @param {string} rulesetId
   * @param {string} lastUpdate - ISO date string
   * @returns {Promise<Object>}
   */
  async getFilterRules(rulesetId, lastUpdate = null) {
    let url = `/rules/${rulesetId}`;
    if (lastUpdate) url += `?since=${lastUpdate}`;
    return this._request(url);
  }
}

/** Singleton instance */
export const api = new APIClient();
