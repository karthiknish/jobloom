# JobloomMonorepo Setup Guide

## Prerequisites

- Node.js 18+ and npm 9+
- Chrome browser for extension testing
- Clerk account for authentication
- Convex account for backend

## Quick Start

1. **Install dependencies**
   ```bash
   cd jobloom
   npm install
   ```

2. **Set up Convex Backend**
   ```bash
   cd packages/convex
   npx convex dev
   # Follow the prompts to create a new Convex project
   ```

3. **Set up Clerk Authentication**
   - Create a Clerk application at https://clerk.com
   - Copy your keys to `packages/web/.env.local`

4. **Configure Environment Variables**
   ```bash
   # packages/web/.env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Start Convex
   cd packages/convex && npm run dev
   
   # Terminal 2: Start Web App
   cd packages/web && npm run dev
   
   # Terminal 3: Build Extension
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
   - Sign up/Sign in with Clerk
   - View your job tracking dashboard
   - Access admin panel at `/admin` to manage sponsored job database

2. **Chrome Extension**: 
   - Visit job sites (LinkedIn, Indeed, etc.)
   - Click "🎯 Check Sponsored Jobs" button in the extension popup or floating button
   - Extension queries Convex database for sponsorship data
   - Sponsored jobs are highlighted based on database matches
   - Jobs are synced to your dashboard

3. **Sponsorship Management**:
   - Use the admin panel to add **sponsored companies** to the database
   - Configure company aliases for better matching (e.g., "Google" + "Alphabet Inc")
   - Configure extension settings with your Convex URL
   - Extension will highlight **all jobs from sponsored companies**

## Features

### Chrome Extension
- ✅ **On-demand sponsored job checking** (button click only)
- ✅ **Company-based sponsorship matching** via Convex database
- ✅ **Fuzzy company name matching** with aliases support
- ✅ Visual highlighting with color-coded badges
- ✅ Site-specific job element detection
- ✅ Support for major job sites (LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter)
- ✅ Real-time sync with backend
- ✅ Configurable Convex URL in extension settings

### Web Application
- ✅ User authentication with Clerk
- ✅ Job application tracking
- ✅ Status management (interested → applied → interviewing → offered/rejected)
- ✅ Statistics dashboard
- ✅ Real-time updates

### Backend (Convex)
- ✅ User management
- ✅ Job storage and retrieval
- ✅ Application status tracking
- ✅ **Sponsored companies database** with company name and alias matching
- ✅ **Fuzzy matching algorithm** for company name variations
- ✅ Admin API for managing sponsored companies
- ✅ Industry and sponsorship type categorization
- ✅ Real-time synchronization
- ✅ Data persistence

## Development

### Adding New Job Sites

1. Update `packages/extension/manifest.json` host_permissions
2. Add site-specific selectors in `packages/extension/src/content.ts`
3. Test the highlighting functionality

### Customizing Job Detection

Edit the `sponsoredKeywords` array in:
- `packages/extension/src/content.ts`
- `packages/extension/src/background.ts`

### Database Schema

The Convex schema includes:
- `users`: User profiles linked to Clerk
- `jobs`: Job postings with metadata
- `applications`: Application tracking with status
- `jobAlerts`: Future feature for job alerts

## Deployment

### Web Application
```bash
cd packages/web
npm run build
# Deploy to Vercel, Netlify, or your preferred platform
```

### Convex Backend
```bash
cd packages/convex
npm run build
# Automatically deployed via Convex CLI
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
- **Configure Convex URL in extension settings**
- Check browser console for errors
- **Ensure sponsored companies exist in the Convex database**
- Verify company names match between job sites and database (use aliases for variations)

### Web App Authentication Issues
- Verify Clerk environment variables
- Check Clerk dashboard for configuration

### Backend Connection Issues
- Ensure Convex is running (`npm run dev`)
- Verify CONVEX_URL in environment variables
- Check Convex dashboard for deployment status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review the Convex and Clerk documentation
- Open an issue in the repository