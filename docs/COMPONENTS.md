# Vitordo Component Documentation

## Overview
This document provides detailed information about all components in the Vitordo application.

## Layout Components

### MainContainer
The root container component that orchestrates the entire application layout.

**Location:** `src/components/layout/main-container.tsx`

**Props:**
```typescript
interface MainContainerProps {
  className?: string;
  animated?: boolean;
}
```

### LeftPanel
The input panel containing task creation interface and quick actions.

**Location:** `src/components/layout/left-panel.tsx`

### RightPanel
The timeline panel displaying tasks and providing management interface.

**Location:** `src/components/layout/right-panel.tsx`

## Feature Components

### StatusRing
Animated status indicator for tasks with three states.

**Location:** `src/components/features/status-ring.tsx`

**Status Types:**
- `UPCOMING`: Gray-white ring
- `RECENTLY_COMPLETED`: Green ring with checkmark
- `COMPLETED`: Black ring

### TimelineEvent
Individual task item in the timeline with actions and status.

**Location:** `src/components/features/timeline-event.tsx`

### Timeline
Container component for timeline events with filtering and grouping.

**Location:** `src/components/features/timeline.tsx`

## UI Components

### Button
Versatile button component with multiple variants and sizes.

**Location:** `src/components/ui/button.tsx`

### Card
Container component for content sections with consistent styling.

**Location:** `src/components/ui/card.tsx`

### LoadingSpinner
Animated loading indicator with size variants.

**Location:** `src/components/ui/loading-spinner.tsx`

## Provider Components

### ThemeProvider
Provides theme context and management throughout the application.

**Location:** `src/components/providers/theme-provider.tsx`

### ErrorProvider
Provides global error handling and management.

**Location:** `src/components/providers/error-provider.tsx`

## Best Practices

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition patterns
3. **Props Interface**: Always define TypeScript interfaces for props
4. **Error Boundaries**: Wrap components that might fail
5. **Performance**: Use React.memo for components that re-render frequently