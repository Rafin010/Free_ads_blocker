/**
 * Free Blocker — Stats Tracker
 * Tracks blocking statistics per category with daily and total counters.
 */

import { STORAGE_KEYS, DEFAULT_STATS } from '../utils/constants.js';

/** Statistics tracking engine */
class StatsTracker {
  constructor() {
    this._stats = null;
    this._pendingWrites = {};
    this._flushTimer = null;
    this._FLUSH_INTERVAL = 5000; /* Batch writes every 5 seconds */
  }

  /**
   * Initialize the stats tracker
   * @returns {Promise<void>}
   */
  async initialize() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
    this._stats = result[STORAGE_KEYS.STATS] || { ...DEFAULT_STATS };

    /* Reset daily counters if needed */
    const today = new Date().toISOString().split('T')[0];
    if (this._stats.lastResetDate !== today) {
      this._stats.adsBlockedToday = 0;
      this._stats.lastResetDate = today;
      await this._save();
    }

    /* Start periodic flush */
    this._startFlushTimer();
  }

  /**
   * Record a blocked request
   * @param {string} category - Category of the blocked request
   */
  recordBlocked(category) {
    if (!this._stats) return;

    switch (category) {
      case 'ads':
        this._stats.adsBlockedToday++;
        this._stats.adsBlockedTotal++;
        break;
      case 'tracker':
        this._stats.trackersBlocked++;
        break;
      case 'adult':
        this._stats.adultSitesBlocked++;
        break;
      case 'malware':
        this._stats.malwareBlocked++;
        break;
      case 'phishing':
        this._stats.phishingBlocked++;
        break;
      case 'scam':
        this._stats.scamsBlocked++;
        break;
      case 'popup':
        this._stats.popupsBlocked++;
        break;
      case 'cookie':
        this._stats.cookiesBlocked++;
        break;
    }

    /* Mark dirty for batched write */
    this._markDirty();
  }

  /**
   * Get current statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * Get stats for the current day
   * @returns {Object}
   */
  getDailyStats() {
    return {
      adsBlocked: this._stats.adsBlockedToday,
      date: this._stats.lastResetDate
    };
  }

  /**
   * Reset all statistics
   * @returns {Promise<void>}
   */
  async resetStats() {
    this._stats = {
      ...DEFAULT_STATS,
      lastResetDate: new Date().toISOString().split('T')[0]
    };
    await this._save();
  }

  /**
   * Calculate performance score
   * @returns {number} Score 0-100
   */
  getPerformanceScore() {
    const totalBlocked = this._stats.adsBlockedTotal +
      this._stats.trackersBlocked +
      this._stats.malwareBlocked;

    if (totalBlocked === 0) return 100;
    return Math.min(100, 85 + Math.floor(Math.log10(totalBlocked + 1) * 5));
  }

  /**
   * Mark stats as dirty (needs write)
   * @private
   */
  _markDirty() {
    this._pendingWrites.stats = true;
  }

  /**
   * Start the periodic flush timer
   * @private
   */
  _startFlushTimer() {
    if (this._flushTimer) return;
    this._flushTimer = setInterval(() => this._flush(), this._FLUSH_INTERVAL);
  }

  /**
   * Flush pending writes to storage
   * @private
   */
  async _flush() {
    if (this._pendingWrites.stats) {
      await this._save();
      this._pendingWrites.stats = false;
    }
  }

  /**
   * Save stats to storage
   * @private
   */
  async _save() {
    try {
      this._stats.performanceScore = this.getPerformanceScore();
      await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: this._stats });
    } catch (error) {
      console.error('[Free Blocker] Failed to save stats:', error);
    }
  }

  /** Stop the flush timer */
  destroy() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    /* Final flush */
    this._flush();
  }
}

export const statsTracker = new StatsTracker();
