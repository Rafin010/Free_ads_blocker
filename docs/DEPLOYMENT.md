# Deployment Guide

## 1. Backend Deployment

The FastAPI backend can be deployed to any platform that supports Docker or Python applications (e.g., Render, Railway, Heroku, AWS).

### PostgreSQL Migration (Production)

For production, replace SQLite with PostgreSQL.

1. Set up a PostgreSQL database.
2. Update the `DATABASE_URL` environment variable:
   ```
   DATABASE_URL=postgresql://user:password@host:port/dbname
   ```
3. Update `backend/database.py` to remove `check_same_thread=False` which is SQLite specific.

### Environment Variables

Ensure the following environment variables are set in production:
- `ENVIRONMENT=production`
- `SECRET_KEY=your_secure_random_string`
- `DATABASE_URL=your_database_url`

## 2. Extension Publishing (Chrome Web Store)

Before publishing, follow these steps:

1. **Remove CDN Links (Optional but Recommended):**
   Currently, the extension uses Tailwind CSS via CDN. For maximum privacy and to comply with some strict Web Store policies, you may want to compile Tailwind locally and include the generated `.css` file in the extension folder instead of using the CDN.
   
2. **Pack the Extension:**
   - Go to `chrome://extensions/`
   - Click **Pack extension**
   - Select the `extension/` directory.

3. **Developer Dashboard:**
   - Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
   - Upload the packed `.zip` file of the `extension/` folder.
   
4. **Declarative Net Request Justification:**
   During the review process, Google will ask why you need the `declarativeNetRequest` permission. Provide a clear explanation that the extension is an ad and malware blocker that requires this API to block network requests matching malicious domains.
