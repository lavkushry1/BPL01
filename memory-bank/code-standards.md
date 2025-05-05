# Eventia Code Standards & Best Practices

## Core Principles

Our codebase follows these foundational principles:

### KISS (Keep It Simple, Stupid)
Write code that is straightforward and easy to understand. Avoid unnecessary complexity and over-engineering. The simplest solution that meets the requirements is often the best one.

### DRY (Don't Repeat Yourself)
Avoid duplicating code, logic, or data. Extract reusable patterns into functions, components, or modules. When you find yourself writing similar code in multiple places, it's a sign to refactor.

> **Desi Version:**  
> "Write code like you're teaching a beginner. Follow KISS and DRY principles — no extra drama, just simple, reusable code. If something is being repeated, turn it into a function or module. Keep logic clean, no overthinking, aur agar koi jagah bekaar complex ho rahi ho toh use refactor karke simple bana do."

## Practical Guidelines

### Code Structure

1. **Create focused components/functions**
   - Each component or function should do one thing well
   - Keep functions under 30 lines where possible
   - Split large components into smaller, reusable ones

2. **Extract common patterns**
   - Move duplicate code into utility functions
   - Create shared hooks for common React patterns
   - Use higher-order components or render props for shared behavior

3. **Simplify complex logic**
   - Break complex conditions into named variables
   - Use early returns to reduce nesting
   - Consider splitting complex functions into smaller ones

### Naming Conventions

1. **Use clear, descriptive names**
   - Variables: `camelCase` that clearly describe the contents
   - Components: `PascalCase` that describes functionality
   - Files: Match the main export name

2. **Keep names meaningful but concise**
   - Good: `getUserData()`, `isLoading`, `handleSubmit`
   - Avoid: `getData()`, `flag1`, `doStuff()`

3. **Be consistent with prefixes**
   - React handlers: `handle` prefix (e.g., `handleClick`)
   - Boolean values: `is`, `has`, `should` prefixes
   - Async functions: Consider `fetchX`, `loadX`, or async suffix

## Examples

### KISS Example - Before:
```typescript
function calculateTotalPrice(items, user, promotions, seasonalDiscounts) {
  let basePrice = 0;
  let discountFactor = 1;
  
  // Calculate base price
  for (const item of items) {
    if (item.category === 'premium') {
      basePrice += item.price * 1.2;
    } else if (item.category === 'standard') {
      basePrice += item.price;
    } else {
      basePrice += item.price * 0.9;
    }
  }
  
  // Apply promotions
  for (const promo of promotions) {
    if (promo.type === 'percentage' && promo.isValid(user)) {
      discountFactor *= (1 - promo.value / 100);
    } else if (promo.type === 'fixed' && promo.isValid(user)) {
      basePrice -= promo.value;
    }
  }
  
  // Apply seasonal discounts
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 10 && currentMonth <= 11 && user.tierLevel > 1) {
    discountFactor *= 0.9; // 10% holiday discount for premium users
  }
  
  return Math.max(0, basePrice * discountFactor);
}
```

### KISS Example - After:
```typescript
function calculateItemPrice(item) {
  const categoryMultipliers = {
    premium: 1.2,
    standard: 1.0,
    basic: 0.9
  };
  const multiplier = categoryMultipliers[item.category] || 1.0;
  return item.price * multiplier;
}

function applyPromotions(basePrice, user, promotions) {
  let finalPrice = basePrice;
  let discountFactor = 1.0;
  
  for (const promo of promotions) {
    if (!promo.isValid(user)) continue;
    
    if (promo.type === 'percentage') {
      discountFactor *= (1 - promo.value / 100);
    } else if (promo.type === 'fixed') {
      finalPrice -= promo.value;
    }
  }
  
  return Math.max(0, finalPrice * discountFactor);
}

function calculateTotalPrice(items, user, promotions) {
  // Calculate base price
  const basePrice = items.reduce((total, item) => 
    total + calculateItemPrice(item), 0);
  
  // Apply all discounts
  return applyPromotions(basePrice, user, promotions);
}
```

### DRY Example - Before:
```jsx
// In BookingDetails.jsx
function BookingDetails({ bookingId }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await axios.get(`/api/bookings/${bookingId}`);
        setBooking(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [bookingId]);
  
  if (loading) return <Spinner size="large" />;
  if (error) return <ErrorMessage message={error} />;
  if (!booking) return <EmptyState text="Booking not found" />;
  
  return (/* Component JSX */);
}

// In EventDetails.jsx
function EventDetails({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await axios.get(`/api/events/${eventId}`);
        setEvent(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [eventId]);
  
  if (loading) return <Spinner size="large" />;
  if (error) return <ErrorMessage message={error} />;
  if (!event) return <EmptyState text="Event not found" />;
  
  return (/* Component JSX */);
}
```

### DRY Example - After:
```jsx
// In hooks/useFetch.js
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await axios.get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (url) fetchData();
  }, [url]);
  
  return { data, loading, error };
}

// In components/DataFetchWrapper.jsx
function DataFetchWrapper({ loading, error, data, emptyText, children }) {
  if (loading) return <Spinner size="large" />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState text={emptyText} />;
  
  return children(data);
}

// In BookingDetails.jsx
function BookingDetails({ bookingId }) {
  const { data, loading, error } = useFetch(`/api/bookings/${bookingId}`);
  
  return (
    <DataFetchWrapper
      loading={loading}
      error={error}
      data={data}
      emptyText="Booking not found"
    >
      {(booking) => (/* Component JSX using booking */)}
    </DataFetchWrapper>
  );
}

// In EventDetails.jsx
function EventDetails({ eventId }) {
  const { data, loading, error } = useFetch(`/api/events/${eventId}`);
  
  return (
    <DataFetchWrapper
      loading={loading}
      error={error}
      data={data}
      emptyText="Event not found"
    >
      {(event) => (/* Component JSX using event */)}
    </DataFetchWrapper>
  );
}
```

## Refactoring Tips

1. **Identify code smells**
   - Duplicated code blocks
   - Long functions (>30 lines)
   - Deeply nested conditionals (>3 levels)
   - Large components with many responsibilities

2. **Refactor incrementally**
   - Make small, focused changes
   - Test after each refactoring step
   - Use TypeScript to catch errors during refactoring

3. **Common refactoring patterns**
   - Extract method/component
   - Replace conditional with polymorphism
   - Move business logic out of components
   - Convert imperative code to declarative

## Benefits of Clean Code

1. **Easier maintenance**
   - New team members can understand the code faster
   - Bugs are easier to find and fix
   - Changes can be made more confidently

2. **Better performance**
   - Simpler code often leads to better performance
   - Reusable components reduce bundle size
   - Easier to optimize isolated functions

3. **Faster development**
   - Less time spent figuring out complex code
   - Reusable components speed up implementation
   - Fewer bugs to fix means more time for features

## Final Note

Remember: the goal isn't to write the cleverest code, but to write code that clearly communicates its intent and can be easily maintained by you and others in the future. 