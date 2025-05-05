# Database Query Optimization Guide

This guide outlines the database optimization techniques implemented in the Eventia backend to improve performance, scalability, and efficiency of database operations.

## Key Optimizations

### 1. Selective Data Loading

The system now supports conditional relation inclusion:

```typescript
// Load an event with only specific relations
const event = await eventRepository.findById(id, ['ticketCategories', 'organizer']);
```

This helps avoid loading unnecessary related data when it's not needed for a specific operation.

### 2. Cursor-Based Pagination

Cursor-based pagination has been implemented for better performance with large datasets:

```typescript
// First page
const firstPage = await eventRepository.findMany({
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Next page using cursor from previous page
const nextPage = await eventRepository.findMany({
  limit: 10,
  cursor: firstPage.pagination.nextCursor,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

Benefits over offset-based pagination:
- Consistent performance regardless of offset size
- No issues with new items being inserted during pagination
- Better performance with large datasets

### 3. Enhanced Transaction Management

Improved transaction handling with isolation levels and timeout options:

```typescript
await transactionService.executeInTransaction(async (tx) => {
  // Perform database operations within transaction
}, {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: IsolationLevel.ReadCommitted
});
```

Support for transaction retries with automatic backoff:

```typescript
await transactionService.executeWithRetry(async () => {
  // Operation that might face concurrency issues
});
```

### 4. DataLoader Pattern Implementation

The DataLoader pattern has been implemented to batch and cache database queries:

```typescript
// Get multiple events in a single query
const events = await req.loaders.eventLoader.loadMany(['event1', 'event2', 'event3']);

// Get an event with specific relations
const event = await req.loaders.eventWithIncludeLoader.load({
  id: 'event-id',
  include: ['ticketCategories', 'organizer']
});
```

Benefits:
- Eliminates N+1 query problems
- Caches results for the duration of a request
- Batches multiple queries into a single database operation

### 5. Field Selection

Supports querying only specific fields when full entities aren't needed:

```typescript
// Only fetch needed fields
const events = await eventRepository.findMany({
  fields: ['id', 'title', 'startDate', 'location']
});
```

This reduces data transfer between database and application.

### 6. Query Filtering Optimizations

Improved filtering for more efficient database queries:

```typescript
// Filter by multiple event IDs
const events = await eventRepository.findMany({
  ids: ['id1', 'id2', 'id3']
});

// Filter by date range
const events = await eventRepository.findMany({
  startDate: '2023-01-01',
  endDate: '2023-12-31'
});
```

## Usage in Controllers

To use these optimizations in your controllers, the dataloader middleware must be applied:

```typescript
app.use(dataloaderMiddleware);

// Then in your controller:
const event = await req.loaders.eventLoader.load(eventId);
```

## Performance Considerations

1. Use cursor-based pagination for listing large collections
2. Use DataLoader for accessing individual items or batches
3. Only include relations that are actually needed
4. Select only required fields for summary views
5. Use optimized filter combinations that leverage indexes
6. Apply proper transaction isolation levels based on operation needs

## Database Indexes

The database schema has been optimized with the following indexes:

- `events(organizer_id)` - For searching events by organizer
- `events(status)` - For filtering events by status
- `events(start_date, end_date)` - For date range queries
- `events(is_deleted)` - For excluding deleted events

Make sure to maintain these indexes when modifying the schema. 