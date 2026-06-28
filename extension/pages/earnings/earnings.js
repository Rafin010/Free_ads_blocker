/**
 * Free Blocker — Earnings & Premium Script
 * Handles referral program, authentication UI, and premium features.
 */

import { themeManager } from '../../components/theme.js';
import { toast } from '../../components/toast.js';
import { modal } from '../../components/modal.js';
import { api } from '../../utils/api.js';
import { copyToClipboard } from '../../utils/helpers.js';
import { STORAGE_KEYS } from '../../utils/constants.js';

document.addEventListener('DOMContentLoaded', async () => {
  await themeManager.initialize();

  /* Elements */
  const authWarning = document.getElementById('auth-warning');
  const authContent = document.getElementById('auth-content');
  const userEmail = document.getElementById('user-email');
  const accountStatusBadge = document.getElementById('account-status-badge');
  const referralCode = document.getElementById('referral-code');
  const referralCount = document.getElementById('referral-count');
  const referralProgress = document.getElementById('referral-progress');
  const referralsNeeded = document.getElementById('referrals-needed');
  const premiumSection = document.getElementById('premium-section');

  /* Navigation */
  document.getElementById('btn-back-popup').addEventListener('click', () => {
    window.location.href = '../../popup/popup.html';
  });

  /* Init */
  await checkAuthStatus();

  /**
   * Check if user is logged in
   */
  async function checkAuthStatus() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
      const user = result[STORAGE_KEYS.USER];

      if (user && user.token) {
        /* Logged in */
        authWarning.classList.add('hidden');
        authContent.classList.remove('hidden');
        
        userEmail.textContent = user.email;
        api.setToken(user.token);
        
        if (user.isPremium) {
          accountStatusBadge.textContent = 'Premium';
          accountStatusBadge.className = 'px-2.5 py-0.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full';
          premiumSection.classList.add('hidden');
        } else {
          accountStatusBadge.textContent = 'Free Plan';
          accountStatusBadge.className = 'px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full';
          premiumSection.classList.remove('hidden');
        }

        /* Mock referral code if none exists yet */
        const code = user.referralCode || 'SHIELDX-8A9F22';
        referralCode.textContent = code;
        
        /* Load referral stats */
        loadReferralStats();

      } else {
        /* Not logged in */
        authWarning.classList.remove('hidden');
        authContent.classList.add('hidden');
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Load referral statistics from API
   */
  async function loadReferralStats() {
    try {
      /* Try to load from API (will fail if backend not running, use mock fallback) */
      let count = 0;
      try {
        const stats = await api.getReferralStatus();
        count = stats.count || 0;
      } catch {
        /* Fallback for local development without backend */
        const result = await chrome.storage.local.get('mock_referral_count');
        count = result['mock_referral_count'] || 0;
      }

      /* Update UI */
      animateValue(referralCount, 0, count, 1000);
      
      const target = 5;
      const progress = Math.min((count / target) * 100, 100);
      
      setTimeout(() => {
        referralProgress.style.width = `${progress}%`;
      }, 100);

      const needed = Math.max(target - count, 0);
      if (needed === 0) {
        referralsNeeded.textContent = 'Goal reached! Premium earned.';
        referralsNeeded.classList.add('text-emerald-500');
        referralProgress.classList.remove('bg-emerald-500');
        referralProgress.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-orange-500');
      } else {
        referralsNeeded.textContent = `${needed} more needed for Premium`;
      }

    } catch (e) {
      console.error('Failed to load referral stats', e);
    }
  }

  /* Actions */

  document.getElementById('btn-copy-code').addEventListener('click', async () => {
    const code = referralCode.textContent;
    const success = await copyToClipboard(code);
    if (success) {
      toast.show({ message: 'Referral code copied to clipboard!', type: 'success' });
    } else {
      toast.show({ message: 'Failed to copy code', type: 'error' });
    }
  });

  document.getElementById('btn-apply-code').addEventListener('click', async () => {
    const input = document.getElementById('apply-code-input');
    const code = input.value.trim();
    
    if (!code) {
      toast.show({ message: 'Please enter a code', type: 'warning' });
      return;
    }
    
    if (code === referralCode.textContent) {
      toast.show({ message: 'You cannot use your own code', type: 'error' });
      return;
    }

    /* Mock API call */
    try {
      toast.show({ message: 'Applying code...', type: 'info', duration: 1000 });
      
      /* In real impl, this calls api.applyReferralCode(code) */
      setTimeout(() => {
        toast.show({ message: 'Code applied successfully!', type: 'success' });
        input.value = '';
      }, 1000);
    } catch (e) {
      toast.show({ message: 'Invalid referral code', type: 'error' });
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    const confirmed = await modal.confirm({
      title: 'Log Out',
      message: 'Are you sure you want to log out? Your settings will no longer sync.',
      confirmText: 'Log Out',
      danger: true
    });

    if (confirmed) {
      await chrome.storage.local.remove(STORAGE_KEYS.USER);
      checkAuthStatus();
      toast.show({ message: 'Logged out successfully', type: 'info' });
    }
  });

  document.getElementById('btn-signup').addEventListener('click', async () => {
    const email = await modal.prompt({
      title: 'Sign In / Register',
      message: 'Enter your email address to get started.',
      placeholder: 'user@example.com',
      confirmText: 'Continue'
    });

    if (email) {
      /* Mock Auth */
      const mockUser = {
        email: email,
        token: 'mock_jwt_token_for_dev',
        referralCode: 'SHIELDX-' + Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0'),
        isPremium: false
      };
      
      await chrome.storage.local.set({ [STORAGE_KEYS.USER]: mockUser });
      checkAuthStatus();
      toast.show({ message: 'Successfully signed in!', type: 'success' });
    }
  });

  document.getElementById('btn-upgrade').addEventListener('click', () => {
    toast.show({ message: 'Premium checkout would open here', type: 'info' });
    // window.open('https://checkout.stripe.com/pay/...', '_blank');
  });

  document.getElementById('btn-donate').addEventListener('click', () => {
    toast.show({ message: 'Donation page would open here', type: 'info' });
    // window.open('https://ko-fi.com/...', '_blank');
  });

  /** Helper to animate number counting */
  function animateValue(obj, start, end, duration) {
    if (start === end) {
      obj.innerHTML = end;
      return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 5); 
      const current = Math.floor(easeProgress * (end - start) + start);
      obj.innerHTML = current;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end;
      }
    };
    window.requestAnimationFrame(step);
  }
});
