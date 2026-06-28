/**
 * Free Blocker — Settings Script
 * Handles settings page logic, navigation, import/export, whitelist.
 */

import { themeManager } from '../../components/theme.js';
import { ToggleComponent } from '../../components/toggle.js';
import { toast } from '../../components/toast.js';
import { modal } from '../../components/modal.js';
import { FEATURES, FEATURE_META, STORAGE_KEYS } from '../../utils/constants.js';

document.addEventListener('DOMContentLoaded', async () => {
  await themeManager.initialize();

  /* State */
  let currentSettings = {};
  let currentFeatures = {};
  
  /* Elements */
  const themeSelect = document.getElementById('theme-select');
  const languageSelect = document.getElementById('language-select');
  const uiOptionsContainer = document.getElementById('ui-options-container');
  const advancedFiltersContainer = document.getElementById('advanced-filters-container');
  const privacyOptionsContainer = document.getElementById('privacy-options-container');
  const whitelistInput = document.getElementById('whitelist-input');
  const whitelistList = document.getElementById('whitelist-list');
  const ruleCountText = document.getElementById('rule-count-text');

  /* Initialize */
  await loadData();
  setupNavigation();
  setupEventListeners();
  renderToggles();
  renderWhitelist();
  updateRuleCount();

  /**
   * Load data from background
   */
  async function loadData() {
    try {
      const [settingsRes, featuresRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
        chrome.runtime.sendMessage({ type: 'GET_FEATURES' })
      ]);
      
      currentSettings = settingsRes?.settings || {};
      currentFeatures = featuresRes?.features || {};
      
      themeSelect.value = themeManager.getTheme();
      if (currentSettings.language) {
        languageSelect.value = currentSettings.language;
      }
    } catch (e) {
      console.error('Failed to load data:', e);
      toast.show({ message: 'Failed to load settings data', type: 'error' });
    }
  }

  /**
   * Set up sidebar navigation
   */
  function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.settings-section');

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        /* Update active link styles */
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        /* Show active section */
        const targetId = link.getAttribute('href').substring(1);
        sections.forEach(sec => {
          if (sec.id === targetId) {
            sec.classList.add('active');
            sec.classList.remove('hidden');
          } else {
            sec.classList.remove('active');
            sec.classList.add('hidden');
          }
        });
        
        /* Update hash without scrolling */
        history.replaceState(null, null, 'settings.html' + link.getAttribute('href'));
      });
    });

    /* Handle initial hash */
    if (window.location.hash) {
      const targetLink = document.querySelector(`.nav-link[href="${window.location.hash}"]`);
      if (targetLink) targetLink.click();
    }
  }

  /**
   * Set up general event listeners
   */
  function setupEventListeners() {
    /* Theme Change */
    themeSelect.addEventListener('change', async (e) => {
      await themeManager.setTheme(e.target.value);
    });

    /* Back Button */
    document.getElementById('btn-back-popup').addEventListener('click', () => {
      window.location.href = '../../popup/popup.html';
    });

    /* Whitelist Add */
    document.getElementById('btn-add-whitelist').addEventListener('click', async () => {
      const domain = whitelistInput.value.trim();
      if (!domain) return;
      
      const isValid = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);
      if (!isValid) {
        toast.show({ message: 'Please enter a valid domain (e.g. example.com)', type: 'warning' });
        return;
      }
      
      try {
        await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', data: { domain } });
        whitelistInput.value = '';
        toast.show({ message: `${domain} added to whitelist`, type: 'success' });
        renderWhitelist();
      } catch (e) {
        toast.show({ message: 'Failed to add domain', type: 'error' });
      }
    });

    whitelistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-add-whitelist').click();
      }
    });

    /* Backup Export/Import */
    document.getElementById('btn-export').addEventListener('click', async () => {
      try {
        const res = await chrome.runtime.sendMessage({ type: 'EXPORT_SETTINGS' });
        if (res && res.success) {
          const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `free-blocker-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.show({ message: 'Backup exported successfully', type: 'success' });
        }
      } catch (e) {
        toast.show({ message: 'Failed to export backup', type: 'error' });
      }
    });

    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backup = JSON.parse(event.target.result);
          
          const confirmed = await modal.confirm({
            title: 'Import Backup',
            message: 'Are you sure you want to restore from this backup? Your current settings will be overwritten.',
            confirmText: 'Restore Data'
          });

          if (confirmed) {
            const res = await chrome.runtime.sendMessage({ 
              type: 'IMPORT_SETTINGS', 
              data: backup 
            });
            
            if (res && res.success) {
              toast.show({ message: 'Backup imported successfully. Reloading...', type: 'success' });
              setTimeout(() => window.location.reload(), 1500);
            } else {
              throw new Error(res?.error || 'Import failed');
            }
          }
        } catch (error) {
          console.error(error);
          toast.show({ message: 'Invalid backup file format', type: 'error' });
        }
        
        /* Reset file input */
        e.target.value = '';
      };
      reader.readAsText(file);
    });

    /* Reset All */
    document.getElementById('btn-reset').addEventListener('click', async () => {
      const confirmed = await modal.confirm({
        title: 'Reset Extension',
        message: 'Are you sure you want to completely reset Free Blocker? All statistics, custom rules, and settings will be wiped.',
        confirmText: 'Yes, Reset Everything',
        danger: true
      });

      if (confirmed) {
        try {
          await chrome.runtime.sendMessage({ type: 'RESET_ALL' });
          toast.show({ message: 'Extension reset successfully', type: 'success' });
          setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
          toast.show({ message: 'Failed to reset extension', type: 'error' });
        }
      }
    });

    /* Update Filters */
    const updateBtn = document.getElementById('btn-update-filters');
    const updateSpinner = document.getElementById('update-spinner');
    
    updateBtn.addEventListener('click', async () => {
      updateSpinner.classList.remove('hidden');
      updateBtn.disabled = true;
      
      try {
        const res = await chrome.runtime.sendMessage({ type: 'CHECK_UPDATES' });
        if (res && res.updated) {
          toast.show({ message: 'Filters updated successfully', type: 'success' });
          updateRuleCount();
        } else {
          toast.show({ message: 'Filters are already up to date', type: 'info' });
        }
      } catch (e) {
        toast.show({ message: 'Failed to check for updates', type: 'error' });
      } finally {
        updateSpinner.classList.add('hidden');
        updateBtn.disabled = false;
      }
    });
  }

  /**
   * Render setting toggle items
   */
  function renderToggles() {
    /* Helper to create setting row */
    const createRow = (id, title, description, checked, onChange, iconClass = null) => {
      const row = document.createElement('div');
      row.className = 'settings-row py-2';
      
      const leftContent = document.createElement('div');
      leftContent.style.display = 'flex';
      leftContent.style.alignItems = 'center';
      leftContent.style.gap = '16px';
      leftContent.style.flex = '1';

      if (iconClass) {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'text-indigo bg-indigo-light';
        iconWrapper.style.width = '36px';
        iconWrapper.style.height = '36px';
        iconWrapper.style.display = 'flex';
        iconWrapper.style.alignItems = 'center';
        iconWrapper.style.justifyContent = 'center';
        iconWrapper.style.borderRadius = '10px';
        iconWrapper.style.flexShrink = '0';
        
        if (iconClass === '18+') {
          const textEl = document.createElement('span');
          textEl.textContent = '18+';
          textEl.style.fontWeight = '800';
          textEl.style.fontSize = '14px';
          iconWrapper.appendChild(textEl);
        } else {
          const iconEl = document.createElement('i');
          iconEl.className = iconClass;
          iconEl.style.fontSize = '16px';
          iconWrapper.appendChild(iconEl);
        }
        
        leftContent.appendChild(iconWrapper);
      }
      
      const textContainer = document.createElement('div');
      textContainer.className = 'row-info';
      const titleEl = document.createElement('div');
      titleEl.className = 'row-title';
      titleEl.textContent = title;
      
      const descEl = document.createElement('div');
      descEl.className = 'row-desc';
      descEl.textContent = description;
      
      textContainer.appendChild(titleEl);
      textContainer.appendChild(descEl);
      
      leftContent.appendChild(textContainer);
      
      const toggle = ToggleComponent.create({ id, checked, onChange });
      
      row.appendChild(leftContent);
      row.appendChild(toggle);
      return row;
    };

    /* UI Options */
    uiOptionsContainer.innerHTML = '';
    uiOptionsContainer.appendChild(createRow(
      'setting-badge', 'Show Badge Count', 'Display number of blocked items on the extension icon',
      currentSettings.showBadge,
      async (val) => {
        await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', data: { showBadge: val } });
      },
      'fa-solid fa-certificate'
    ));
    uiOptionsContainer.appendChild(createRow(
      'setting-notifications', 'Show Notifications', 'Show toast notifications for background updates',
      currentSettings.notifications,
      async (val) => {
        await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', data: { notifications: val } });
      },
      'fa-solid fa-bell'
    ));

    /* Advanced Filters */
    advancedFiltersContainer.innerHTML = '';
    
    /* Helper to render feature toggles */
    const renderFeatureToggle = (featureId, container) => {
      const meta = FEATURE_META[featureId];
      if (!meta) return;
      
      const faIcons = {
        [FEATURES.AUTO_FILTER_UPDATE]: 'fa-solid fa-rotate',
        [FEATURES.YOUTUBE_ADS_BLOCK]: 'fa-brands fa-youtube',
        [FEATURES.ADULT_WEBSITE_BLOCK]: '18+',
        [FEATURES.ADULT_VIDEO_BLOCK]: '18+',
        [FEATURES.SCAM_WEBSITE_DETECTION]: 'fa-solid fa-bug',
        [FEATURES.TRACKING_PROTECTION]: 'fa-solid fa-eye-slash',
        [FEATURES.COOKIE_PROTECTION]: 'fa-solid fa-cookie-bite'
      };
      const iconClass = faIcons[featureId] || 'fa-solid fa-shield-halved';
      
      container.appendChild(createRow(
        `feature-${featureId}`, meta.name, meta.description,
        currentFeatures[featureId] === true,
        async (val) => {
          await chrome.runtime.sendMessage({ 
            type: 'TOGGLE_FEATURE', 
            data: { featureId, enabled: val } 
          });
          if (featureId === FEATURES.AUTO_FILTER_UPDATE) {
            toast.show({ message: val ? 'Auto-updates enabled' : 'Auto-updates disabled', type: 'info' });
          }
        },
        iconClass
      ));
    };

    renderFeatureToggle(FEATURES.AUTO_FILTER_UPDATE, advancedFiltersContainer);
    renderFeatureToggle(FEATURES.YOUTUBE_ADS_BLOCK, advancedFiltersContainer);
    renderFeatureToggle(FEATURES.ADULT_WEBSITE_BLOCK, advancedFiltersContainer);
    renderFeatureToggle(FEATURES.ADULT_VIDEO_BLOCK, advancedFiltersContainer);
    renderFeatureToggle(FEATURES.SCAM_WEBSITE_DETECTION, advancedFiltersContainer);

    /* Privacy Options */
    privacyOptionsContainer.innerHTML = '';
    renderFeatureToggle(FEATURES.TRACKING_PROTECTION, privacyOptionsContainer);
    renderFeatureToggle(FEATURES.COOKIE_PROTECTION, privacyOptionsContainer);
    renderFeatureToggle(FEATURES.SOCIAL_MEDIA_ADS_BLOCK, privacyOptionsContainer);
  }

  /**
   * Render whitelist items
   */
  async function renderWhitelist() {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_WHITELIST' });
      const whitelist = res?.whitelist || [];
      
      whitelistList.innerHTML = '';
      
      if (whitelist.length === 0) {
        whitelistList.innerHTML = '<li class="empty-state">No domains whitelisted.</li>';
        return;
      }
      
      whitelist.forEach(domain => {
        const li = document.createElement('li');
        li.className = 'whitelist-item';
        
        const text = document.createElement('span');
        text.className = 'whitelist-domain';
        text.textContent = domain;
        
        const btn = document.createElement('button');
        btn.className = 'whitelist-remove-btn';
        btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        
        btn.addEventListener('click', async () => {
          await chrome.runtime.sendMessage({ type: 'REMOVE_WHITELIST', data: { domain } });
          toast.show({ message: `${domain} removed from whitelist`, type: 'info' });
          renderWhitelist();
        });
        
        li.appendChild(text);
        li.appendChild(btn);
        whitelistList.appendChild(li);
      });
    } catch (e) {
      console.error('Failed to render whitelist', e);
    }
  }

  /**
   * Update rule count display
   */
  async function updateRuleCount() {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_RULE_COUNT' });
      if (res) {
        const total = (res.total || 0).toLocaleString();
        ruleCountText.textContent = `${total} active blocking rules applied`;
      }
    } catch {
      ruleCountText.textContent = 'Rule engine active';
    }
  }
});
