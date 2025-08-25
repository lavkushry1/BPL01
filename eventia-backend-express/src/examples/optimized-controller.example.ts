import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * Example controller showing best practices for using DataLoader and other optimizations
 * 
 * This is not a real controller, but a reference implementation showing how to use
 * the new database optimization features in your own controllers.
 */
export class OptimizedControllerExample {
  /**
   * Demonstrates cursor-based pagination for listing resources
   */
  static listWithCursorPagination = asyncHandler(async (req: Request, res: Response) => {
    // 1. Extract cursor from query params
    const { cursor, limit = '10' } = req.query;
    const limitValue = parseInt(limit as string);
    
    // 2. Build your filters
    const filters = {
      cursor: cursor as string | undefined,
      limit: limitValue,
      // Add other filters as needed
    };
    
    // 3. Call the repository/service with filters
    // const result = await someService.listItems(filters);
    
    // 4. Format the pagination response
    // Include a "nextCursor" in the response for the client to use in the next request
    const mockResult = {
      items: Array.from({ length: 10 }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}` })),
      pagination: {
        nextCursor: 'example-next-cursor-value',
        hasMore: true,
        limit: limitValue
      }
    };
    
    // 5. Return the response
    return ApiResponse.success(res, 200, 'Items fetched successfully', mockResult);
  });
  
  /**
   * Demonstrates using DataLoader for fetching a single resource
   */
  static getOneWithDataLoader = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fields, include } = req.query;
    
    // 1. Use the DataLoader from the request
    // This will batch similar requests together and cache the results
    const item = await req.loaders.eventLoader.load(id);
    
    if (!item) {
      return ApiResponse.error(res, 404, 'Item not found', 'NOT_FOUND');
    }
    
    // 2. Return the response
    return ApiResponse.success(res, 200, 'Item fetched successfully', item);
  });
  
  /**
   * Demonstrates using DataLoader for fetching multiple resources
   */
  static getManyWithDataLoader = asyncHandler(async (req: Request, res: Response) => {
    // 1. Extract IDs from query params
    const { ids } = req.query;
    
    if (!ids) {
      return ApiResponse.error(res, 400, 'IDs are required', 'BAD_REQUEST');
    }
    
    const idArray = (ids as string).split(',');
    
    // 2. Use the DataLoader from the request to load many items at once
    // This will be batched into a single database query
    const items = await req.loaders.eventLoader.loadMany(idArray);
    
    // 3. Return the response
    return ApiResponse.success(res, 200, 'Items fetched successfully', { items });
  });
  
  /**
   * Demonstrates using DataLoader with included relations
   */
  static getWithIncludedRelations = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const includeParams = req.query.include 
      ? (req.query.include as string).split(',')
      : ['defaultRelation'];
    
    // Use the specialized loader that accepts include parameters
    const item = await req.loaders.eventWithIncludeLoader.load({
      id,
      include: includeParams
    });
    
    if (!item) {
      return ApiResponse.error(res, 404, 'Item not found', 'NOT_FOUND');
    }
    
    // Return the response
    return ApiResponse.success(res, 200, 'Item fetched successfully', item);
  });
  
  /**
   * Demonstrates selective field loading
   */
  static getWithSelectiveFields = asyncHandler(async (req: Request, res: Response) => {
    // 1. Extract query parameters
    const { fields } = req.query;
    
    // 2. Call a service that supports selective fields
    // const result = await someService.findMany({
    //   fields: fields ? (fields as string).split(',') : undefined
    // });
    
    // 3. Return mock data
    const mockResult = {
      items: [
        { id: 'item-1', name: 'Item 1' }, 
        { id: 'item-2', name: 'Item 2' }
      ]
    };
    
    // 4. Return the response
    return ApiResponse.success(res, 200, 'Items fetched successfully', mockResult);
  });
  
  /**
   * Demonstrates batching related data queries
   */
  static getBatchedRelatedData = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // 1. Get the main resource
    const mainItem = await req.loaders.eventLoader.load(id);
    
    if (!mainItem) {
      return ApiResponse.error(res, 404, 'Item not found', 'NOT_FOUND');
    }
    
    // 2. Get all related ids that we need to fetch
    const relatedIds = ['related-1', 'related-2', 'related-3'];
    
    // 3. Batch fetch all related items in a single query
    // This avoids the N+1 query problem
    const relatedItems = await req.loaders.eventLoader.loadMany(relatedIds);
    
    // 4. Construct the response with both main and related items
    const response = {
      ...mainItem,
      relatedItems: relatedItems.filter(item => item !== null)
    };
    
    // 5. Return the response
    return ApiResponse.success(res, 200, 'Item with relations fetched', response);
  });
}