# HireAll Chrome Extension

A Chrome extension for highlighting sponsored job roles and tracking job applications.

## Environment Variables

The extension needs several environment variables for proper functionality:

### Required Variables

```env
WEB_APP_URL=http://localhost:3000
OAUTH_CLIENT_ID=your_google_oauth_client_id
OAUTH_CLIENT_SECRET_BASE64=your_base64_encoded_oauth_client_secret
```

### OAuth Setup

The extension supports Google sign-in via two different Chrome Identity paths:

1) `chrome.identity.getAuthToken()` (uses the Chrome Extension OAuth client in `manifest.json`)
2) `chrome.identity.launchWebAuthFlow()` (uses a **Web application** OAuth client + an explicit redirect URI)

If you see `Error 400: redirect_uri_mismatch (flowName=GeneralOAuthFlow)`, it means you are using
`launchWebAuthFlow()` with a client_id that does not allow the redirect URI returned by
`chrome.identity.getRedirectURL()`.

To set it up correctly:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google+ API and Google OAuth2 API
4. Create **two** OAuth 2.0 credentials:

   A) **Chrome Extension** client (used by `getAuthToken`)
   - Application type: Chrome Extension
   - Extension ID: Get this from `chrome://extensions` after loading the unpacked extension
   - Put this client ID into `oauth2.client_id` in `manifest.json`

   B) **Web application** client (used by `launchWebAuthFlow`)
   - Application type: Web application
   - Add an **Authorized redirect URI** exactly equal to the value logged by the extension:
     - `chrome.identity.getRedirectURL()` typically returns: `https://<EXTENSION_ID>.chromiumapp.org/`
   - Put this client ID into `GOOGLE_WEB_APP_CLIENT_ID` (recommended)

5. If you use any server-side OAuth flows (not required for the extension sign-in), you may also download the client secret JSON.
6. Base64 encoding is only needed for server-side OAuth credentials (not required for the extension sign-in path shown above).

```bash
# On macOS/Linux
cat client_secret.json | base64

# Or use an online base64 encoder
```

7. Set the base64 encoded string as `OAUTH_CLIENT_SECRET_BASE64` in your `.env` file

### Additional Variables

You can also set this directly when building:

```bash
# For development
WEB_APP_URL=http://localhost:3000 OAUTH_CLIENT_ID=your_client_id OAUTH_CLIENT_SECRET_BASE64=your_base64_secret npm run build

# For production
WEB_APP_URL=https://hireall.app OAUTH_CLIENT_ID=your_client_id OAUTH_CLIENT_SECRET_BASE64=your_base64_secret npm run build
```

If you also load Firebase client SDK in content scripts or future features, you can provide the public Firebase config via `.env` as well (optional):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

These values are injected at build-time by `dotenv-webpack` and `DefinePlugin` in `webpack.config.js`.

## Chrome Web Store Publishing

The extension includes automated publishing to the Chrome Web Store via GitHub Actions.

### Setup GitHub Secrets

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

```bash
# Chrome Web Store API Credentials
CHROME_CLIENT_ID=your_chrome_web_store_client_id
CHROME_CLIENT_SECRET=your_chrome_web_store_client_secret
CHROME_REFRESH_TOKEN=your_chrome_web_store_refresh_token
CHROME_EXTENSION_ID=your_extension_id_from_chrome_web_store

# OAuth Configuration (same as .env)
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET_BASE64=your_base64_encoded_oauth_client_secret
```

### How to Get Chrome Web Store API Credentials

Run the setup helper script for step-by-step instructions:

```bash
npm run setup:chrome-store
```

Or follow these manual steps:

1. Go to [Chrome Web Store Developer Dashboard](https://chromewebstore.google.com/developer/dashboard)
2. Create a new project or select existing one
3. Go to API access and create OAuth 2.0 credentials
4. Generate a refresh token using the OAuth 2.0 Playground:
   - Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Select "Chrome Web Store API v1.1"
   - Click "Authorize APIs"
   - Exchange authorization code for tokens
   - Use the refresh token

### Publishing Workflow

The workflow automatically triggers on:
- Push to `main` or `release` branches when extension files change
- Manual trigger via GitHub Actions UI

#### Manual Publishing Options

You can manually trigger publishing from the GitHub Actions tab:

1. Go to Actions > "Publish Chrome Extension"
2. Click "Run workflow"
3. Choose publish target:
   - `store`: Publish to production Chrome Web Store
   - `test`: Publish to trusted testers only

#### Build Scripts

- `npm run build` - Development build with local URLs
- `npm run build:prod` - Production build for Chrome Web Store
- `npm run build:test` - Test build with test environment
- `npm run publish:store` - Build and package for production store
- `npm run publish:test` - Build and package for test deployment
- `npm run setup:chrome-store` - Interactive setup guide for Chrome Web Store publishing

The production build automatically:
- Sets `WEB_APP_URL` to `https://hireall.app`
- Includes OAuth configuration from environment variables
- Packages the extension for upload

## Build Scripts

- `npm run build` - Build for production using environment variables from `.env` file
- `npm run build:dev` - Build for development with default URL
- `npm run build:prod` - Build for production with default URL
- `npm run dev` - Build in development mode with watch

## Features

1. **Job Highlighting** - Automatically detects and highlights sponsored jobs
2. **Application Autofill** - Fills job applications with your profile data
3. **People Search** - Finds relevant people on LinkedIn
4. **Job Board** - Tracks your job applications and statuses
5. **Authentication** - Integrates with the web app for user authentication

## Installation

1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder