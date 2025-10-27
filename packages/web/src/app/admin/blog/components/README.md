# Blog Management Components

This directory contains the modularized components for the admin blog management page.

## Structure

```
components/
├── BlogManagement.tsx      # Main container component
├── BlogStats.tsx           # Statistics cards component
├── BlogFilters.tsx         # Search and filter controls
├── BlogTable.tsx           # Posts table with selection
├── BlogPagination.tsx      # Pagination controls
├── BulkActions.tsx         # Bulk action controls
├── CreatePostDialog.tsx    # Create/edit post dialog
├── index.ts                # Component exports
└── README.md               # This documentation
```

## Components

### BlogManagement
The main container component that orchestrates all blog management functionality.

**Features:**
- Admin access verification
- Data fetching and state management
- CRUD operations for blog posts
- Bulk actions support
- Pagination and filtering

### BlogStats
Displays blog statistics in a grid of cards.

**Props:**
- `stats: BlogStats | null` - Blog statistics data

**Shows:**
- Total posts count
- Total views
- Total likes
- Number of categories

### BlogFilters
Search and filter controls for the blog posts list.

**Props:**
- `searchTerm: string` - Current search term
- `onSearchChange: (value: string) => void` - Search change handler
- `statusFilter: string` - Current status filter
- `onStatusFilterChange: (value: string) => void` - Status filter change handler
- `onCreatePost: () => void` - Create post handler
- `selectedCount: number` - Number of selected posts
- `onClearSelection: () => void` - Clear selection handler

### BlogTable
Table component displaying blog posts with selection capabilities.

**Props:**
- `posts: BlogPost[]` - Array of blog posts to display
- `selectedPosts: string[]` - Array of selected post IDs
- `onSelectionChange: (selectedPosts: string[]) => void` - Selection change handler
- `onEditPost: (post: BlogPost) => void` - Edit post handler
- `onDeletePost: (postId: string) => void` - Delete post handler
- `onViewPost: (post: BlogPost) => void` - View post handler

**Features:**
- Checkbox selection for individual posts
- Select all functionality
- Status badges
- Action dropdown menu
- Responsive design

### BlogPagination
Pagination controls for the blog posts list.

**Props:**
- `currentPage: number` - Current page number
- `totalPages: number` - Total number of pages
- `totalItems: number` - Total number of items
- `pageSize: number` - Number of items per page
- `onPageChange: (page: number) => void` - Page change handler

**Features:**
- Previous/Next buttons
- Page number buttons with ellipsis
- Items count display
- Smart page range display

### BulkActions
Bulk action controls for selected posts.

**Props:**
- `selectedCount: number` - Number of selected posts
- `onBulkDelete: () => void` - Bulk delete handler
- `onBulkArchive: () => void` - Bulk archive handler
- `onBulkPublish: () => void` - Bulk publish handler
- `onBulkDraft: () => void` - Bulk draft handler

**Features:**
- Dropdown menu with bulk actions
- Publish/Archive/Delete operations
- Only shows when posts are selected

### CreatePostDialog
Dialog component for creating new blog posts.

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Open state change handler
- `onSubmit: (data: CreatePostData) => void` - Form submit handler
- `isSubmitting: boolean` - Loading state

**Features:**
- Form validation
- Rich text editor (Tiptap)
- Image selection
- Category and status selection
- Tag management

## Usage

```typescript
import { BlogManagement } from "@/app/admin/blog/components";

export default function AdminBlogPage() {
  return <BlogManagement />;
}
```

Or import individual components:

```typescript
import { 
  BlogStats, 
  BlogTable, 
  BlogFilters,
  BlogPagination 
} from "@/app/admin/blog/components";
```

## Data Types

```typescript
interface CreatePostData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  featuredImage?: string;
}
```

## Styling

All components use Tailwind CSS classes and shadcn/ui components for consistent styling. The components are responsive and work well on both desktop and mobile devices.

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader friendly

## Performance

- Optimized re-renders with proper dependency arrays
- Efficient pagination to handle large datasets
- Debounced search functionality
- Lazy loading for images
