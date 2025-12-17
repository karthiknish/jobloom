# Chrome Web Store Listing

## Short Description (132 chars max)
Track job applications, detect sponsored LinkedIn listings, analyze UK visa eligibility, and sync your job search across devices.

## Detailed Description

**HireAll - Your Intelligent Job Search Companion**

HireAll helps job seekers navigate the job market more effectively by providing powerful tracking and analysis tools right in your browser.

### Key Features

**Sponsored Job Detection**
Automatically identifies and highlights sponsored job listings on LinkedIn, helping you understand which positions are promoted.

**Application Tracking**
Keep track of all your job applications in one place. Monitor status, add notes, and never lose track of where you've applied.

**UK Visa Sponsorship Analysis**
For international job seekers, instantly check if a company is on the UK's licensed sponsor list and verify salary thresholds for Skilled Worker visas.

**Cloud Sync**
Sign in to sync your job tracking data across all your devices. Your job search follows you everywhere.

**Weekly Statistics**
See at a glance how many jobs you've tracked and applied to each week.

---

## Permission Justifications

| Permission | Justification |
|------------|---------------|
| `activeTab` | Required to read job listing content on LinkedIn pages to detect sponsored listings and extract job details |
| `storage` | Required to save user preferences, tracked jobs, and sync authentication state locally |
| `tabs` | Required to detect when user navigates to LinkedIn job pages to activate extension features |
| `identity` | Required for Google Sign-In authentication to enable cloud sync functionality |

### Host Permissions

| Host | Justification |
|------|---------------|
| `https://*.linkedin.com/*` | Core functionality - detecting sponsored jobs and extracting job listing data |
| `https://*.hireall.app/*` | Required for communication with HireAll web app for authentication and data sync |

---

## Data Usage Disclosure

- **User Data**: Email address and display name (for account identification)
- **Job Data**: Job listings you interact with or save (titles, companies, URLs, notes)
- **No Selling of Data**: We never sell personal data
- **No Third-Party Analytics on Browsing**: We don't track general browsing behavior

For complete details, see our Privacy Policy: https://hireall.app/privacy

---

## Category
Productivity

## Language
English

## Website
https://hireall.app
