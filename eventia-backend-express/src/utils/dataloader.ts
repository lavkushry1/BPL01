import DataLoader from 'dataloader';
import { EventRepository } from '../repositories/event.repository';
import { Event, EventLoaderKey } from '../types/event.types';
import { logger } from './logger';

/**
 * DataLoader factory for creating optimized data loaders
 * Implements batching and caching for database queries
 */
export class DataLoaderFactory {
  private eventRepository: EventRepository;

  constructor(eventRepository: EventRepository) {
    this.eventRepository = eventRepository;
  }

  /**
   * Creates a new event loader that batches and caches event lookups by ID
   * 
   * @returns DataLoader for Event entities
   */
  createEventLoader(): DataLoader<string, Event | null> {
    return new DataLoader<string, Event | null>(
      async (ids: readonly string[]) => {
        try {
          // Batch load events by IDs
          const events = await this.eventRepository.findByIds([...ids]);
          
          // Make sure we return events in the same order as the ids
          const eventsMap = new Map<string, Event>();
          events.forEach(event => {
            eventsMap.set(event.id, event as Event);
          });
          
          // Map ids to events, preserving order and returning null for not found
          return ids.map(id => eventsMap.get(id) || null);
        } catch (error) {
          logger.error('Error in eventLoader:', error);
          throw error;
        }
      },
      {
        // Cache options
        cache: true, // Enable caching
        maxBatchSize: 100, // Maximum batch size
        batchScheduleFn: (callback: () => void) => setTimeout(callback, 5) // Small delay to group requests
      }
    );
  }

  /**
   * Creates a new event loader that batches and caches event lookups by ID
   * with support for different include options
   * 
   * @returns DataLoader for Event entities with included relations
   */
  createEventWithIncludeLoader(): DataLoader<EventLoaderKey, Event | null> {
    return new DataLoader<EventLoaderKey, Event | null>(
      async (keys: readonly EventLoaderKey[]) => {
        try {
          // Group keys by include configuration to efficiently batch similar requests
          const groupedKeys = this.groupKeysByInclude(keys);
          
          // Process each group separately
          const results: Map<string, Event> = new Map();
          
          for (const [includeKey, ids] of Object.entries(groupedKeys)) {
            const includeOptions = includeKey === 'DEFAULT' ? undefined : JSON.parse(includeKey);
            const events = await this.eventRepository.findByIds(ids, includeOptions);
            
            // Add events to results map with proper type casting
            events.forEach(event => {
              results.set(event.id, event as Event);
            });
          }
          
          // Map original keys to events, preserving order
          return keys.map(key => results.get(key.id) || null);
        } catch (error) {
          logger.error('Error in eventWithIncludeLoader:', error);
          throw error;
        }
      },
      {
        // Cache options
        cache: true,
        maxBatchSize: 50,
        batchScheduleFn: (callback: () => void) => setTimeout(callback, 5),
        // Custom cache key function
        cacheKeyFn: (key: EventLoaderKey) => {
          // We're just using the cache key for internal purposes, so string is fine
          return key;
        }
      }
    );
  }

  /**
   * Groups loader keys by include configuration for efficient batching
   */
  private groupKeysByInclude(keys: readonly EventLoaderKey[]): Record<string, string[]> {
    const groupedKeys: Record<string, string[]> = {};
    
    keys.forEach(key => {
      // Convert include array to string for grouping
      const includeKey = key.include ? JSON.stringify(key.include.sort()) : 'DEFAULT';
      
      if (!groupedKeys[includeKey]) {
        groupedKeys[includeKey] = [];
      }
      
      groupedKeys[includeKey].push(key.id);
    });
    
    return groupedKeys;
  }
}

// Create and export singleton instance
import { eventRepository } from '../repositories/event.repository';
export const dataLoaderFactory = new DataLoaderFactory(eventRepository);

/**
 * Creates fresh instances of all data loaders
 * Call this for each request to avoid caching issues
 */
export function createLoaders() {
  return {
    eventLoader: dataLoaderFactory.createEventLoader(),
    eventWithIncludeLoader: dataLoaderFactory.createEventWithIncludeLoader(),
    // Add more loaders as needed
  };
}

// Export loader types
export type Loaders = ReturnType<typeof createLoaders>; 