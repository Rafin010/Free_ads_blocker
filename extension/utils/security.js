/**
 * Free Blocker — Security Utilities
 * Input sanitization, validation, and security helpers.
 */

/**
 * Sanitize HTML string to prevent XSS
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;'
  };
  return str.replace(/[&<>"'/`]/g, char => map[char]);
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidURL(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate domain format
 * @param {string} domain - Domain to validate
 * @returns {boolean}
 */
export function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const pattern = /^(?:\*\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return pattern.test(domain.trim());
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

/**
 * Validate referral code format
 * @param {string} code - Referral code
 * @returns {boolean}
 */
export function isValidReferralCode(code) {
  if (!code || typeof code !== 'string') return false;
  return /^FREEBLOCKER-[A-F0-9]{6}$/.test(code.trim());
}

/**
 * Sanitize domain input (normalize and validate)
 * @param {string} domain - Domain input
 * @returns {string|null} Sanitized domain or null if invalid
 */
export function sanitizeDomain(domain) {
  if (!domain || typeof domain !== 'string') return null;
  const cleaned = domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
  return isValidDomain(cleaned) ? cleaned : null;
}

/**
 * Validate backup data structure
 * @param {Object} data - Backup data to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateBackupData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }
  if (!data.version) {
    return { valid: false, error: 'Missing version field' };
  }
  if (!data.data || typeof data.data !== 'object') {
    return { valid: false, error: 'Missing or invalid data field' };
  }
  if (!data.exportDate) {
    return { valid: false, error: 'Missing export date' };
  }
  return { valid: true, error: null };
}

/**
 * Hash a string using SHA-256
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hex hash
 */
export async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a cryptographically secure token
 * @param {number} bytes - Number of bytes
 * @returns {string} Hex token
 */
export function generateSecureToken(bytes = 32) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  /**
   * @param {number} maxRequests - Maximum requests in the window
   * @param {number} windowMs - Time window in milliseconds
   */
  constructor(maxRequests = 10, windowMs = 60000) {
    this._maxRequests = maxRequests;
    this._windowMs = windowMs;
    this._requests = [];
  }

  /**
   * Check if a request is allowed
   * @returns {boolean}
   */
  canRequest() {
    const now = Date.now();
    this._requests = this._requests.filter(t => now - t < this._windowMs);
    return this._requests.length < this._maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest() {
    this._requests.push(Date.now());
  }

  /**
   * Check and record, throw if rate limited
   * @throws {Error} If rate limited
   */
  checkAndRecord() {
    if (!this.canRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    this.recordRequest();
  }
}
