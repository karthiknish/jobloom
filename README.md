# JobloomMonorepo

A comprehensive job tracking solution consisting of:

## Packages

- **Extension** (`packages/extension`) - Chrome extension for highlighting sponsored job roles
- **Web** (`packages/web`) - Job board web application with authentication
- **Convex** (`packages/convex`) - Backend data management and API

## Features

- 🎯 **Smart Job Detection**: Chrome extension highlights sponsored roles on job sites
- 📋 **Job Board**: Track your job applications with status updates
- 🔐 **Authentication**: Secure user accounts for personalized tracking
- ☁️ **Real-time Sync**: Convex backend ensures data consistency across devices

## Getting Started

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build all packages
npm run build
```

## Architecture

The monorepo uses npm workspaces to manage multiple packages:

1. **Chrome Extension**: Content scripts detect and highlight sponsored job postings
2. **Web Application**: React-based job board for application tracking
3. **Convex Backend**: Real-time database and authentication

## Development

Each package has its own development environment. See individual package READMEs for specific setup instructions.