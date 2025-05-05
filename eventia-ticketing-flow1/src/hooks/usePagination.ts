import { useState, useCallback, useMemo, useEffect } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems: number;
}

interface PaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  paginatedItems: <T>(items: T[]) => T[];
  pageNumbers: number[];
}

const usePagination = ({
  initialPage = 1,
  initialPageSize = 10,
  totalItems,
}: PaginationOptions): PaginationResult => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);

  // Ensure currentPage is within valid range when dependencies change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Calculate start and end indices
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
  const endIndex = useMemo(() => Math.min(startIndex + pageSize - 1, totalItems - 1), [startIndex, pageSize, totalItems]);

  // Memoize boolean flags for better performance
  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);

  // Page navigation methods
  const goToPage = useCallback((page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Handle page size change
  const handleSetPageSize = useCallback((size: number) => {
    const newSize = Math.max(1, size);
    
    // Don't do unnecessary work if the size is unchanged
    if (newSize === pageSize) return;
    
    setPageSize(newSize);
    
    // Adjust current page to maintain approximate position
    const currentItem = startIndex;
    const newPage = Math.floor(currentItem / newSize) + 1;
    const maxPage = Math.ceil(totalItems / newSize);
    setCurrentPage(Math.max(1, Math.min(newPage, maxPage)));
  }, [startIndex, totalItems, pageSize]);

  // Get paginated subset of items - heavily optimized with caching
  const cachedSlices = useMemo(() => new Map<string, any[]>(), []);
  
  const paginatedItems = useCallback(<T>(items: T[]): T[] => {
    if (!items || items.length === 0) return [];
    
    // Use a cache key based on the array identity, start, and end indices
    const cacheKey = `${items.length}-${startIndex}-${endIndex}`;
    
    // Check if we already calculated this slice
    if (cachedSlices.has(cacheKey)) {
      const cachedResult = cachedSlices.get(cacheKey);
      // Ensure we have a valid result before returning it
      if (cachedResult) {
        return cachedResult as T[];
      }
    }
    
    // Calculate and cache the result
    const result = items.slice(startIndex, endIndex + 1);
    cachedSlices.set(cacheKey, result);
    
    // Clear cache if it gets too large (keep last 10 slices)
    if (cachedSlices.size > 10) {
      const keysIterator = cachedSlices.keys();
      const firstKey = keysIterator.next().value;
      if (firstKey) {
        cachedSlices.delete(firstKey);
      }
    }
    
    return result;
  }, [startIndex, endIndex]);

  // Generate array of page numbers for rendering pagination controls
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages: number[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show subset of pages with current page in the middle if possible
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // Return memoized result object to prevent unnecessary rerenders
  return useMemo(() => ({
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    paginatedItems,
    pageNumbers,
  }), [
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    handleSetPageSize,
    paginatedItems,
    pageNumbers
  ]);
};

export default usePagination; 