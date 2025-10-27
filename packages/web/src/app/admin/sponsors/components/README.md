# Sponsor Management Components

This directory contains the modularized components for the admin sponsor management page.

## Structure

```
components/
├── SponsorManagement.tsx      # Main container component
├── SponsorStats.tsx           # Statistics cards component
├── SponsorFilters.tsx         # Search and filter controls
├── SponsorTable.tsx           # Sponsors table with selection
├── SponsorCharts.tsx          # Analytics charts
├── CreateSponsorDialog.tsx    # Create/edit sponsor dialog
├── index.ts                   # Component exports
└── README.md                  # This documentation
```

## Components

### SponsorManagement
The main container component that orchestrates all sponsor management functionality.

**Features:**
- Admin access verification
- Data fetching and state management
- CRUD operations for sponsors
- Export functionality
- Analytics integration

### SponsorStats
Displays sponsor statistics in a grid of cards.

**Props:**
- `stats: any` - Sponsor statistics data

**Shows:**
- Total sponsors count
- Top industry
- Sponsorship types
- Active sponsors

### SponsorFilters
Search and filter controls for the sponsors list.

**Props:**
- `searchTerm: string` - Current search term
- `onSearchChange: (value: string) => void` - Search change handler
- `industryFilter: string` - Current industry filter
- `onIndustryFilterChange: (value: string) => void` - Industry filter change handler
- `typeFilter: string` - Current type filter
- `onTypeFilterChange: (value: string) => void` - Type filter change handler
- `statusFilter: string` - Current status filter
- `onStatusFilterChange: (value: string) => void` - Status filter change handler
- `onCreateSponsor: () => void` - Create sponsor handler
- `onRefresh: () => void` - Refresh handler
- `onExport: () => void` - Export handler
- `isExporting: boolean` - Export loading state
- `industries: string[]` - Available industries
- `types: string[]` - Available sponsorship types

### SponsorTable
Table component displaying sponsors with selection capabilities.

**Props:**
- `sponsors: Sponsor[]` - Array of sponsors to display
- `selectedSponsors: string[]` - Array of selected sponsor IDs
- `onSelectionChange: (selectedSponsors: string[]) => void` - Selection change handler
- `onEditSponsor: (sponsor: Sponsor) => void` - Edit sponsor handler
- `onDeleteSponsor: (sponsorId: string) => void` - Delete sponsor handler
- `onViewSponsor: (sponsor: Sponsor) => void` - View sponsor handler

**Features:**
- Checkbox selection for individual sponsors
- Select all functionality
- Sponsorship type badges
- Status indicators
- Action dropdown menu
- Avatar display

### SponsorCharts
Analytics charts showing sponsor distribution and breakdown.

**Props:**
- `stats: any` - Sponsor statistics data

**Shows:**
- Sponsorship type distribution with progress bars
- Industry breakdown with visual indicators
- Top 5 industries by sponsor count

### CreateSponsorDialog
Dialog component for creating new sponsors.

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Open state change handler
- `onSubmit: (data: CreateSponsorData) => void` - Form submit handler
- `isSubmitting: boolean` - Loading state

**Features:**
- Form validation
- Company details input
- Sponsorship type selection
- Industry selection
- Alias management
- Active status toggle

## Usage

```typescript
import { SponsorManagement } from "@/app/admin/sponsors/components";

export default function AdminSponsorsPage() {
  return <SponsorManagement />;
}
```

Or import individual components:

```typescript
import { 
  SponsorStats, 
  SponsorTable, 
  SponsorFilters,
  SponsorCharts 
} from "@/app/admin/sponsors/components";
```

## Data Types

```typescript
interface Sponsor {
  _id: string;
  name: string;
  sponsorshipType: string;
  industry?: string;
  website?: string;
  description?: string;
  logo?: string;
  status: string;
  isActive?: boolean;
  aliases: string[];
  createdAt: number;
  updatedAt?: number;
}

interface CreateSponsorData {
  name: string;
  aliases: string[];
  sponsorshipType: string;
  description?: string;
  website?: string;
  industry?: string;
  logo?: string;
  isActive: boolean;
}
```

## Features

### Search and Filtering
- Real-time search by company name
- Filter by industry
- Filter by sponsorship type
- Filter by active/inactive status

### Bulk Operations
- Select multiple sponsors
- Bulk actions (future enhancement)
- Export filtered results

### Analytics
- Visual statistics cards
- Sponsorship type distribution
- Industry breakdown charts
- Real-time data updates

### Export Functionality
- Export to CSV format
- Include all sponsor details
- Respect current filters
- Automatic filename generation

## Styling

All components use Tailwind CSS classes and shadcn/ui components for consistent styling. The components are responsive and work well on both desktop and mobile devices.

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader friendly

## Performance

- Optimized re-renders with proper dependency arrays
- Efficient filtering and search
- Lazy loading for large datasets
- Debounced search functionality
