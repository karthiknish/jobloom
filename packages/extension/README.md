# Jobloom Chrome Extension

A Chrome extension for highlighting sponsored job roles and tracking job applications.

## Environment Variables

The extension uses environment variables for configuration. Create a `.env` file in the root of the extension directory with the following variables:

```env
# Convex backend URL
CONVEX_URL=https://rare-chihuahua-615.convex.cloud

# Web application URL
WEB_APP_URL=http://localhost:3000
```

You can also set these environment variables directly when building:

```bash
# For development
CONVEX_URL=https://rare-chihuahua-615.convex.cloud WEB_APP_URL=http://localhost:3000 npm run build

# For production
CONVEX_URL=https://rare-chihuahua-615.convex.cloud WEB_APP_URL=https://jobloom.ai npm run build
```

## Build Scripts

- `npm run build` - Build for production using environment variables from `.env` file
- `npm run build:dev` - Build for development with default URLs
- `npm run build:prod` - Build for production with default URLs
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