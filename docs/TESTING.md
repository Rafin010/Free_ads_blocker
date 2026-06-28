# Testing Guide

## Extension Testing

Chrome extensions cannot easily be tested using traditional unit test frameworks due to the specific browser environment APIs (`chrome.*`).

### Manual Testing Checklist

1. **UI & Theming**
   - [ ] Open the popup. Check for responsive rendering (width 400px).
   - [ ] Toggle Dark/Light mode in OS or Extension settings and verify UI adapts.
   - [ ] Open Dashboard and verify charts load correctly.
   - [ ] Open Settings and test navigation between tabs.

2. **Feature Toggling**
   - [ ] Toggle "All Ads Block". Verify the badge updates.
   - [ ] Verify `chrome.declarativeNetRequest` rules are enabled/disabled accordingly.
   
3. **Ad Blocking (DNR)**
   - [ ] Visit a site with known trackers (e.g., a news site).
   - [ ] Open Developer Tools -> Network tab. Verify requests to `doubleclick.net` or `google-analytics.com` are blocked (status `(blocked:other)` or `(failed)`).

4. **YouTube Ad Blocking**
   - [ ] Visit YouTube. Play a video.
   - [ ] Ensure pre-roll ads are skipped instantly.
   - [ ] Ensure side-bar ad banners are hidden.

5. **Cosmetic Filtering**
   - [ ] Inspect elements that usually contain ads. Verify `display: none !important` is applied via the injected stylesheet.

6. **Adult Content Blocking**
   - [ ] Visit a site matching `adult-rules.json`. Verify network request is blocked.
   - [ ] (If enabled) Visit a site with adult keywords in meta tags. Verify the full-page block overlay appears.

## Backend Testing

The backend can be tested using standard Python tools.

1. Ensure backend is running.
2. Navigate to `http://localhost:8000/docs`.
3. Test the `/auth/register` endpoint by creating a user.
4. Test the `/auth/login` endpoint to receive a JWT.
5. Use the JWT in the "Authorize" button to test protected endpoints.
