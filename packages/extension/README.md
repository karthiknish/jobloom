# Jobloom Chrome Extension

A Chrome extension for highlighting sponsored job roles and tracking job applications.

## Environment Variables

The extension primarily needs the web application URL (Firebase-backed) to call APIs:

```env
WEB_APP_URL=http://localhost:3000
```

You can also set this directly when building:

```bash
# For development
WEB_APP_URL=http://localhost:3000 npm run build

# For production
WEB_APP_URL=https://jobloom.ai npm run build
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