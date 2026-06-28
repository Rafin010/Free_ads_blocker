/**
 * Free Blocker — Application Constants
 * Central configuration for all feature IDs, defaults, and settings.
 */

/** Feature identifiers used across the extension */
export const FEATURES = {
  ALL_ADS_BLOCK: 'allAdsBlock',
  YOUTUBE_ADS_BLOCK: 'youtubeAdsBlock',
  POPUP_BLOCKER: 'popupBlocker',
  BANNER_ADS_BLOCK: 'bannerAdsBlock',
  VIDEO_ADS_BLOCK: 'videoAdsBlock',
  TRACKING_PROTECTION: 'trackingProtection',
  COOKIE_PROTECTION: 'cookieProtection',
  MALWARE_PROTECTION: 'malwareProtection',
  PHISHING_PROTECTION: 'phishingProtection',
  ADULT_VIDEO_BLOCK: 'adultVideoBlock',
  ADULT_WEBSITE_BLOCK: 'adultWebsiteBlock',
  SCAM_WEBSITE_DETECTION: 'scamWebsiteDetection',
  CRYPTO_SCAM_PROTECTION: 'cryptoScamProtection',
  SOCIAL_MEDIA_ADS_BLOCK: 'socialMediaAdsBlock',
  AUTO_FILTER_UPDATE: 'autoFilterUpdate',
  WHITELIST_MANAGER: 'whitelistManager',
  BLACKLIST_MANAGER: 'blacklistManager',
  STATISTICS_DASHBOARD: 'statisticsDashboard',
  PERFORMANCE_MONITOR: 'performanceMonitor',
  NOTIFICATION_MANAGER: 'notificationManager'
};

/* SVG Icons mapped for UI - using Heroicons outline strings */
const ICONS = {
  SHIELD: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />',
  PLAY: '<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />',
  WINDOW: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />',
  EYE: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />',
  BUG: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />',
  LOCK: '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />',
  WARNING: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />',
  NO_SYMBOL: '<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />'
};

/** Feature metadata for UI rendering */
export const FEATURE_META = {
  [FEATURES.ALL_ADS_BLOCK]: {
    name: 'All Ads Block',
    description: 'Block advertisements from websites',
    icon: ICONS.SHIELD,
    category: 'blocking',
    rulesetId: 'ads_rules'
  },
  [FEATURES.YOUTUBE_ADS_BLOCK]: {
    name: 'YouTube Ads Block',
    description: 'Remove YouTube advertisements',
    icon: ICONS.PLAY,
    category: 'blocking',
    rulesetId: null
  },
  [FEATURES.POPUP_BLOCKER]: {
    name: 'Popup Blocker',
    description: 'Block popup windows and overlays',
    icon: ICONS.WINDOW,
    category: 'blocking',
    rulesetId: null
  },
  [FEATURES.BANNER_ADS_BLOCK]: {
    name: 'Banner Ads Block',
    description: 'Remove banner advertisements',
    icon: ICONS.SHIELD,
    category: 'blocking',
    rulesetId: null
  },
  [FEATURES.VIDEO_ADS_BLOCK]: {
    name: 'Video Ads Block',
    description: 'Block video advertisements',
    icon: ICONS.PLAY,
    category: 'blocking',
    rulesetId: null
  },
  [FEATURES.TRACKING_PROTECTION]: {
    name: 'Tracking Protection',
    description: 'Prevent online tracking',
    icon: ICONS.EYE,
    category: 'privacy',
    rulesetId: 'tracker_rules'
  },
  [FEATURES.COOKIE_PROTECTION]: {
    name: 'Cookie Protection',
    description: 'Manage and block tracking cookies',
    icon: ICONS.EYE,
    category: 'privacy',
    rulesetId: null
  },
  [FEATURES.MALWARE_PROTECTION]: {
    name: 'Malware Protection',
    description: 'Block known malware domains',
    icon: ICONS.BUG,
    category: 'security',
    rulesetId: 'malware_rules'
  },
  [FEATURES.PHISHING_PROTECTION]: {
    name: 'Phishing Protection',
    description: 'Detect phishing websites',
    icon: ICONS.LOCK,
    category: 'security',
    rulesetId: 'phishing_rules'
  },
  [FEATURES.ADULT_VIDEO_BLOCK]: {
    name: 'Adult Video Block',
    description: 'Prevent adult video content',
    icon: ICONS.NO_SYMBOL,
    category: 'content',
    rulesetId: null
  },
  [FEATURES.ADULT_WEBSITE_BLOCK]: {
    name: 'Adult Website Block',
    description: 'Block adult websites',
    icon: ICONS.NO_SYMBOL,
    category: 'content',
    rulesetId: 'adult_rules'
  },
  [FEATURES.SCAM_WEBSITE_DETECTION]: {
    name: 'Scam Website Detection',
    description: 'Identify and block scam websites',
    icon: ICONS.WARNING,
    category: 'security',
    rulesetId: 'scam_rules'
  },
  [FEATURES.CRYPTO_SCAM_PROTECTION]: {
    name: 'Crypto Scam Protection',
    description: 'Block cryptocurrency scam sites',
    icon: ICONS.WARNING,
    category: 'security',
    rulesetId: 'scam_rules'
  },
  [FEATURES.SOCIAL_MEDIA_ADS_BLOCK]: {
    name: 'Social Media Ads Block',
    description: 'Remove social media advertisements',
    icon: ICONS.SHIELD,
    category: 'blocking',
    rulesetId: 'social_ads_rules'
  },
  [FEATURES.AUTO_FILTER_UPDATE]: {
    name: 'Auto Filter Update',
    description: 'Automatically update filter lists',
    icon: ICONS.SHIELD,
    category: 'system',
    rulesetId: null
  },
  [FEATURES.WHITELIST_MANAGER]: {
    name: 'Whitelist Manager',
    description: 'Manage allowed websites',
    icon: ICONS.SHIELD,
    category: 'management',
    rulesetId: null
  },
  [FEATURES.BLACKLIST_MANAGER]: {
    name: 'Blacklist Manager',
    description: 'Manage blocked websites',
    icon: ICONS.SHIELD,
    category: 'management',
    rulesetId: null
  },
  [FEATURES.STATISTICS_DASHBOARD]: {
    name: 'Statistics Dashboard',
    description: 'View blocking statistics',
    icon: ICONS.SHIELD,
    category: 'system',
    rulesetId: null
  },
  [FEATURES.PERFORMANCE_MONITOR]: {
    name: 'Performance Monitor',
    description: 'Monitor extension performance',
    icon: ICONS.SHIELD,
    category: 'system',
    rulesetId: null
  },
  [FEATURES.NOTIFICATION_MANAGER]: {
    name: 'Notification Manager',
    description: 'Control notification settings',
    icon: ICONS.SHIELD,
    category: 'system',
    rulesetId: null
  }
};

/** Default feature states */
export const DEFAULT_FEATURE_STATES = {
  [FEATURES.ALL_ADS_BLOCK]: true,
  [FEATURES.YOUTUBE_ADS_BLOCK]: true,
  [FEATURES.POPUP_BLOCKER]: true,
  [FEATURES.BANNER_ADS_BLOCK]: true,
  [FEATURES.VIDEO_ADS_BLOCK]: true,
  [FEATURES.TRACKING_PROTECTION]: true,
  [FEATURES.COOKIE_PROTECTION]: false,
  [FEATURES.MALWARE_PROTECTION]: true,
  [FEATURES.PHISHING_PROTECTION]: true,
  [FEATURES.ADULT_VIDEO_BLOCK]: false,
  [FEATURES.ADULT_WEBSITE_BLOCK]: false,
  [FEATURES.SCAM_WEBSITE_DETECTION]: true,
  [FEATURES.CRYPTO_SCAM_PROTECTION]: true,
  [FEATURES.SOCIAL_MEDIA_ADS_BLOCK]: false,
  [FEATURES.AUTO_FILTER_UPDATE]: true,
  [FEATURES.WHITELIST_MANAGER]: true,
  [FEATURES.BLACKLIST_MANAGER]: true,
  [FEATURES.STATISTICS_DASHBOARD]: true,
  [FEATURES.PERFORMANCE_MONITOR]: true,
  [FEATURES.NOTIFICATION_MANAGER]: true
};

/** Default statistics */
export const DEFAULT_STATS = {
  adsBlockedToday: 0,
  adsBlockedTotal: 0,
  trackersBlocked: 0,
  adultSitesBlocked: 0,
  malwareBlocked: 0,
  phishingBlocked: 0,
  scamsBlocked: 0,
  popupsBlocked: 0,
  cookiesBlocked: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  performanceScore: 100
};

/** Default settings */
export const DEFAULT_SETTINGS = {
  theme: 'system',
  language: 'en',
  notifications: true,
  showBadge: true,
  contextMenu: true,
  autoUpdate: true,
  updateInterval: 24,
  syncEnabled: false,
  analyticsEnabled: false
};

/** Storage keys */
export const STORAGE_KEYS = {
  FEATURES: 'fb_features',
  STATS: 'fb_stats',
  SETTINGS: 'fb_settings',
  WHITELIST: 'fb_whitelist',
  BLACKLIST: 'fb_blacklist',
  USER: 'fb_user',
  REFERRAL: 'fb_referral',
  THEME: 'fb_theme',
  FIRST_RUN: 'fb_first_run',
  INSTALL_DATE: 'fb_install_date'
};

/** API configuration */
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/v1',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

/** Rule set IDs mapped to feature IDs */
export const RULESET_FEATURE_MAP = {
  'ads_rules': [FEATURES.ALL_ADS_BLOCK, FEATURES.BANNER_ADS_BLOCK, FEATURES.VIDEO_ADS_BLOCK],
  'tracker_rules': [FEATURES.TRACKING_PROTECTION],
  'malware_rules': [FEATURES.MALWARE_PROTECTION],
  'adult_rules': [FEATURES.ADULT_WEBSITE_BLOCK, FEATURES.ADULT_VIDEO_BLOCK],
  'phishing_rules': [FEATURES.PHISHING_PROTECTION],
  'scam_rules': [FEATURES.SCAM_WEBSITE_DETECTION, FEATURES.CRYPTO_SCAM_PROTECTION],
  'social_ads_rules': [FEATURES.SOCIAL_MEDIA_ADS_BLOCK]
};

/** Extension version */
export const VERSION = '1.0.0';

/** Extension name */
export const APP_NAME = 'Free Blocker';
