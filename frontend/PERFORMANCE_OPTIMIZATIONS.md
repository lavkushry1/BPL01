# Performance Optimizations for State Management

This document outlines the performance optimizations implemented in the Eventia Ticketing application to improve state management and rendering performance.

## 1. Context Optimizations

### 1.1 Granular Context Selectors

We've implemented specialized selector hooks that extract only the necessary parts of global state:

```tsx
// Instead of consuming the entire context
const { showLoader, hideLoader, addNotification } = useAppState();

// Use specialized selectors for better performance
const { showLoader, hideLoader } = useLoading();
const { addNotification } = useNotifications();
```

This prevents unnecessary re-renders when unrelated state changes.

### 1.2 Memoized Context Values

All context providers now use `useMemo` to memoize their context values:

```tsx
const value = useMemo(() => ({
  state,
  dispatch,
  showLoader,
  hideLoader,
  addNotification,
  updatePreferences,
}), [state, showLoader, hideLoader, addNotification, updatePreferences]);
```

This prevents unnecessary re-renders when the provider component re-renders but the context value hasn't changed.

### 1.3 Combined Providers

We created a `CombinedProviders` component that encapsulates all provider nesting in one place, improving maintainability and performance by reducing the component tree depth.

## 2. Component Optimizations

### 2.1 Component Extraction

We've extracted individual UI elements into separate components and memoized them:

```tsx
const EventCard = memo<EventCardProps>(({ event }) => (
  // Component implementation
));
```

This prevents re-rendering of individual cards when only one card needs to change.

### 2.2 Custom Memoization Utilities

We've created utilities to make memoization more type-safe and easier to use:

- `memo<P>` - Type-safe wrapper around React.memo
- `createPropsComparator` - Creates a comparator function that only checks specific props
- `deepPropsAreEqual` - Helper for deep comparison of props
- `memoize` - Utility for memoizing expensive calculations

### 2.3 Callback Memoization

All event handlers are memoized with `useCallback` to prevent unnecessary re-creations:

```tsx
const handleCategoryChange = useCallback((e) => {
  // Handler implementation
}, []);
```

## 3. Data Handling Optimizations

### 3.1 Pagination Caching

The `usePagination` hook implements a caching system to avoid recalculating the same data slices:

```tsx
const cachedSlices = useMemo(() => new Map<string, any[]>(), []);

const paginatedItems = useCallback(<T>(items: T[]): T[] => {
  // Check cache before recalculating
  const cacheKey = `${items.length}-${startIndex}-${endIndex}`;
  if (cachedSlices.has(cacheKey)) {
    const cachedResult = cachedSlices.get(cacheKey);
    if (cachedResult) {
      return cachedResult as T[];
    }
  }
  
  // Calculate and cache result
  const result = items.slice(startIndex, endIndex + 1);
  cachedSlices.set(cacheKey, result);
  
  return result;
}, [startIndex, endIndex]);
```

### 3.2 Async State Updates

State updates that trigger side effects (like localStorage updates) are now performed asynchronously:

```tsx
setTimeout(() => {
  try {
    const updatedPrefs = { ...state.preferences, ...preferences };
    localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}, 0);
```

## 4. Query Optimizations

React Query is configured with optimal settings for caching and stale time:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

## Best Practices

1. **Component Memoization**: Always memoize components that don't need to re-render on every parent update.
2. **Granular State Access**: Only access the specific parts of state you need.
3. **Memoize Calculations**: Use useMemo for expensive calculations.
4. **Memoize Callbacks**: Use useCallback for functions passed as props.
5. **Optimize Lists**: Always memoize list items to prevent unnecessary re-renders.
6. **Avoid Prop Drilling**: Use context selectors for deeply nested components.

## Future Improvements

1. Virtual scrolling for long lists
2. Implement windowing with react-window or react-virtualized
3. Code splitting with React.lazy and Suspense
4. Consider implementing state normalization for complex relational data 