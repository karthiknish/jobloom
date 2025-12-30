# Hireall Design System

This document provides guidelines for maintaining visual and behavioral consistency across the Hireall application.

---

## Table of Contents

1. [Loading States](#loading-states)
2. [Error Handling](#error-handling)
3. [Animation Timing](#animation-timing)
4. [Colors & Theming](#colors--theming)
5. [Typography](#typography)
6. [Spacing](#spacing)

---

## Loading States

### Decision Tree

Use this to decide which loading pattern to use:

```
┌─ Full page loading? 
│  └─ YES → LoadingPage
│  └─ NO ↓
│
├─ Content shape is known? (list, card, table)
│  └─ YES → Skeleton
│  └─ NO ↓
│
├─ Inline button/action?
│  └─ YES → Loader2 spinner inside button
│  └─ NO ↓
│
├─ Modal/overlay content?
│  └─ YES → LoadingOverlay
│  └─ NO → LoadingSpinner with label
```

### Components

#### 1. LoadingPage
Full-page loading state for initial data fetch.

```tsx
import { LoadingPage } from "@/components/ui/loading";

// Usage
if (loading) {
  return <LoadingPage label="Loading settings..." />;
}
```

#### 2. Skeleton
For content with predictable shape (lists, cards, tables).

```tsx
import { 
  SkeletonCard, 
  SkeletonList, 
  SkeletonTable,
  SkeletonJobCard 
} from "@/components/ui/loading-skeleton";

// Card loading
<SkeletonCard />

// List with N items
<SkeletonList items={5} />

// Table with rows/columns
<SkeletonTable rows={10} columns={4} />

// Job-specific card
<SkeletonJobCard />
```

#### 3. Inline Spinner (Buttons/Actions)
Use `Loader2` from lucide-react inside buttons.

```tsx
import { Loader2 } from "lucide-react";

<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    "Save"
  )}
</Button>
```

#### 4. LoadingOverlay
For blocking operations in modals/dialogs.

```tsx
import { LoadingOverlay } from "@/components/ui/loading";

<div className="relative">
  {isLoading && <LoadingOverlay label="Processing..." />}
  {/* Content */}
</div>
```

---

## Error Handling

### Decision Tree

```
┌─ Form validation error?
│  └─ YES → Inline error below field (no toast)
│  └─ NO ↓
│
├─ API/network error?
│  └─ YES → Toast notification
│  └─ NO ↓
│
├─ Authentication error?
│  └─ YES → Toast + redirect if session expired
│  └─ NO ↓
│
├─ Critical/unrecoverable error?
│  └─ YES → Error boundary with recovery UI
│  └─ NO → Toast notification
```

### Toast Notifications

**Preferred: useToast hook**
```tsx
import { useToast } from "@/hooks/use-toast";

const toast = useToast();

// Success
toast.success("Settings saved!");

// Error
toast.error("Failed to save", "Please try again");

// Info
toast.info("Update available");

// Warning
toast.warning("Session expiring soon");
```

**Alternative: Direct imports**
```tsx
import { showError, showSuccess, showWarning } from "@/components/ui/Toast";

showSuccess("Done!");
showError("Something went wrong");
```

### Inline Validation Errors

For form fields, show errors directly below the input:

```tsx
<Input
  className={error ? "border-destructive" : ""}
  {...field}
/>
{error && (
  <motion.p
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="text-sm text-destructive mt-1"
  >
    {error}
  </motion.p>
)}
```

### Error Messages

Use human-friendly messages. The `humanizeError` utility helps:

```tsx
import { humanizeError } from "@/utils/errorMessages";

// Converts technical errors to user-friendly text
const message = humanizeError(error.message);
```

---

## Animation Timing

### Duration Constants

Always import from the centralized configuration:

```tsx
import { animations } from "@/styles/animations";

// Available durations (in seconds)
animations.duration.fast     // 0.18s - micro-interactions
animations.duration.normal   // 0.26s - standard transitions
animations.duration.slow     // 0.36s - page transitions
animations.duration.slower   // 0.50s - emphasis animations
animations.duration.slowest  // 0.75s - dramatic effects
```

### Using with Framer Motion

```tsx
import { animations, fadeIn, slideInUp } from "@/styles/animations";

// With duration constant
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: animations.duration.normal }}
/>

// With pre-built variant
<motion.div {...fadeIn} />
<motion.div {...slideInUp} />
```

### Tailwind Duration Classes

```tsx
import { DURATION_CLASSES } from "@/styles/animations";

// Available classes
DURATION_CLASSES.fast    // "duration-150"
DURATION_CLASSES.normal  // "duration-200"
DURATION_CLASSES.slow    // "duration-300"
DURATION_CLASSES.slower  // "duration-500"

// Usage
<div className={`transition-all ${DURATION_CLASSES.normal}`} />
```

---

## Colors & Theming

### ⚠️ Never Use Hardcoded Colors

**Bad:**
```tsx
<div style={{ color: "#10B77F" }} />
<div className="text-[#ef4444]" />
```

**Good:**
```tsx
<div className="text-primary" />
<div className="text-destructive" />
```

### Color Token Reference

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `primary` | `--primary` | Brand color, CTAs, links |
| `primary-foreground` | `--primary-foreground` | Text on primary |
| `secondary` | `--secondary` | Secondary actions |
| `muted` | `--muted` | Subtle backgrounds |
| `muted-foreground` | `--muted-foreground` | Subtle text |
| `accent` | `--accent` | Highlights |
| `destructive` | `--destructive` | Errors, delete actions |
| `warning` | `--warning` | Caution states |
| `success` | `--success` | Success states |
| `foreground` | `--foreground` | Main text |
| `background` | `--background` | Page background |
| `surface` | `--surface` | Card backgrounds |
| `border` | `--border` | Borders |

### Semantic Color Usage

| Meaning | Token | Example |
|---------|-------|---------|
| Error state | `destructive` | Form errors, delete buttons |
| Warning state | `warning` | Alerts, caution dialogs |
| Success state | `primary` or `success` | Success messages |
| Info state | `blue-500/600` | Info banners |
| Neutral | `muted-foreground` | Helper text |

### Opacity Variants

Use Tailwind opacity utilities with theme colors:

```tsx
// 10% opacity
<div className="bg-primary/10" />

// 50% opacity
<div className="bg-destructive/50" />
```

---

## Typography

### Font Sizes

Use Tailwind's predefined scale:

```tsx
text-xs      // 12px
text-sm      // 14px
text-base    // 16px
text-lg      // 18px
text-xl      // 20px
text-2xl     // 24px
text-3xl     // 30px
```

### Font Weights

```tsx
font-normal     // 400
font-medium     // 500
font-semibold   // 600
font-bold       // 700
```

### Common Patterns

```tsx
// Page title
<h1 className="text-3xl font-bold text-foreground">

// Section title
<h2 className="text-xl font-semibold text-foreground">

// Card title
<h3 className="text-lg font-semibold text-foreground">

// Body text
<p className="text-base text-foreground">

// Helper text
<span className="text-sm text-muted-foreground">

// Small label
<label className="text-sm font-medium text-foreground">
```

---

## Spacing

Use Tailwind's spacing scale consistently:

| Size | Value | Use Case |
|------|-------|----------|
| 1 | 4px | Tight gaps |
| 2 | 8px | Icon-text gaps |
| 3 | 12px | Tight sections |
| 4 | 16px | Standard padding |
| 6 | 24px | Section gaps |
| 8 | 32px | Large sections |

### Common Patterns

```tsx
// Card padding
<Card className="p-4 sm:p-6">

// Form spacing
<form className="space-y-6">

// Button icon gap
<Button><Icon className="mr-2 h-4 w-4" />Text</Button>

// Section gap
<div className="space-y-8">
```

---

## Component Variants Reference

### Buttons

```tsx
// Primary action
<Button variant="premium">Save</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost/subtle
<Button variant="ghost">More options</Button>
```

### Cards

```tsx
// Standard card
<Card>

// Elevated card
<Card variant="premium">

// Premium elevated
<Card variant="premium-elevated">
```

---

## Quick Checklist

Before submitting code, verify:

- [ ] No hardcoded colors (#xxx, rgb(), rgba())
- [ ] Loading states use appropriate pattern
- [ ] Errors use toast for API, inline for validation
- [ ] Animations use centralized duration constants
- [ ] Typography uses Tailwind classes, not custom sizes
- [ ] Spacing is consistent with the scale
