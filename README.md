# HireAll Monorepo (Firebase)

A comprehensive job tracking solution consisting of:

## Packages

- **Extension** (`packages/extension`) - Chrome extension for highlighting sponsored job roles
- **Web** (`packages/web`) - Job board web application with Firebase authentication & Firestore

## Features

- **Smart Job Detection**: Chrome extension highlights sponsored roles on job sites
- **Job Board**: Track your job applications with status updates
- **Authentication**: Secure user accounts for personalized tracking
- **Sync**: Firestore backend ensures data consistency across devices

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
3. **Firebase Backend**: Authentication (Firebase Auth) and data (Firestore)

## Development

Each package has its own development environment. See individual package READMEs for specific setup instructions.

### Chrome Extension Configuration

The Chrome extension calls the web app’s API. Set the base URL via `WEB_APP_URL` at build time. See `packages/extension/README.md`.

## Stripe Payment Integration

HireAll includes premium features with subscription-based pricing. To enable payments:

### 1. Stripe Account Setup
1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe dashboard

### 2. Environment Variables
Add these to your environment configuration:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_or_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_your_stripe_publishable_key
```

### 3. Webhook Configuration
1. In Stripe Dashboard → Webhooks, add endpoint: `https://yourdomain.com/api/stripe/webhook`
2. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment.*`
3. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Pricing Plans
- **Free**: 3 CV analyses/month, 50 applications, basic features
- **Premium**: $9.99/month - Unlimited usage, advanced analytics, priority support

## Deployment

### Vercel Deployment

This monorepo is configured for deployment to Vercel. The web application (`packages/web`) will be automatically built and deployed.

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure the project with these settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Root Directory: `packages/web`

The `vercel.json` file in the root handles the routing for the Next.js application.