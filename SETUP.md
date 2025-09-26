# HireallMonorepo Setup Guide

## Prerequisites

- Node.js 18+ and npm 9+
- Chrome browser for extension testing
- Firebase project (Auth + Firestore)

## Quick Start

1. **Install dependencies**
   ```bash
   cd hireall
   npm install
   ```

2. **Set up Firebase**
   - Create a Firebase project
   - Enable Authentication (Email/Password, Google, etc. as desired)
   - Create a Firestore database
   - Create a service account and download JSON credentials

3. **Configure Environment Variables**
   ```bash
   # packages/web/.env.local
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # One of the following for Admin SDK initialization:
   # Option A: Base64-encoded service account JSON
   FIREBASE_SERVICE_ACCOUNT_BASE64=base64_of_json
   # Option B: Inline service account JSON
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Start Web App
   cd packages/web && npm run dev
   
   # Terminal 2: Build Extension
   cd packages/extension && npm run dev
   ```

## Chrome Extension Installation

1. Build the extension:
   ```bash
   cd packages/extension
   npm install
   npm run build
   ```

2. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `packages/extension/dist` folder

## Usage

1. **Web Application**: Visit http://localhost:3000
   - Sign up/Sign in (Firebase)
   - View your job tracking dashboard
   - Access admin panel at `/admin` to manage sponsored job database

2. **Chrome Extension**:
   - Visit job sites (LinkedIn, Indeed, etc.)
   - Click "🎯 Check Sponsored Jobs" button in the extension popup or floating button
   - Extension queries the web app API (Firestore-backed) for sponsorship data
   - Sponsored jobs are highlighted based on database matches
   - Jobs are synced to your dashboard

3. **Sponsorship Management**:
   - Use the admin panel to add **sponsored companies** to the database
   - Configure company aliases for better matching (e.g., "Google" + "Alphabet Inc")
   - Configure extension settings with your Web App URL (default http://localhost:3000)
   - Extension will highlight **all jobs from sponsored companies**

## Features

### Chrome Extension
- ✅ **On-demand sponsored job checking** (button click only)
- ✅ **Company-based sponsorship matching** via Firestore database
- ✅ **Fuzzy company name matching** with aliases support
- ✅ Visual highlighting with color-coded badges
- ✅ Site-specific job element detection
- ✅ Support for major job sites (LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter)
- ✅ Real-time sync with backend
- ✅ Configurable Web App URL in extension settings

### Web Application
- ✅ User authentication with Firebase Auth
- ✅ Job application tracking
- ✅ Status management (interested → applied → interviewing → offered/rejected)
- ✅ Statistics dashboard
- ✅ Real-time updates

### Backend (Firebase + Firestore)
- ✅ User management
- ✅ Job storage and retrieval
- ✅ Application status tracking
- ✅ **Sponsored companies database** with company name and alias matching
- ✅ **Fuzzy matching algorithm** for company name variations
- ✅ Admin API for managing sponsored companies
- ✅ Industry and sponsorship type categorization
- ✅ Data persistence in Firestore

## Development

### Adding New Job Sites

1. Update `packages/extension/manifest.json` host_permissions
2. Add site-specific selectors in `packages/extension/src/content.ts`
3. Test the highlighting functionality

### Customizing Job Detection

Edit the `sponsoredKeywords` array in:
- `packages/extension/src/content.ts`
- `packages/extension/src/background.ts`

### Database Collections (Firestore)

We use Firestore collections:
- `users`: User profiles keyed by Firebase UID
- `jobs`: Job postings with metadata and userId
- `applications`: Application tracking with status and userId
- `sponsoredCompanies`: Company names and optional aliases/types

## Deployment

### Web Application
```bash
cd packages/web
npm run build
# Deploy to Vercel, Netlify, or your preferred platform
```

### Chrome Extension
```bash
cd packages/extension
npm run build
# Submit to Chrome Web Store
```

## Troubleshooting

### Extension Not Working
- Check if the extension is enabled in Chrome
- Verify the manifest.json permissions
- Check browser console for errors
- Ensure sponsored companies exist in the database
- Verify company names match between job sites and database (use aliases for variations)

### Web App Authentication Issues
- Verify Firebase environment variables
- Check Firebase console for configuration

### Backend Connection Issues
- Verify Firestore access and service account credentials
- Ensure the web app API routes are reachable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review Firebase Auth and Firestore documentation
- Open an issue in the repository