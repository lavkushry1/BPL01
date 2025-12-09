import { useState, useEffect } from 'react';
import { FilterOptions } from '@/components/events/FilterBar';

// Define constants
const SEARCH_HISTORY_KEY = 'eventia_search_history';
const RECENT_SEARCHES_KEY = 'eventia_recent_searches';
const MAX_SEARCH_HISTORY = 20;
const MAX_RECENT_SEARCHES = 5;

// Interface for search history item
export interface SearchHistoryItem {
    id: string;
    filters: FilterOptions;
    timestamp: number;
    resultCount?: number;
}

export const useSearchHistory = () => {
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);

    // Load search history and recent searches from localStorage on initial render
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (storedHistory) {
                setSearchHistory(JSON.parse(storedHistory));
            }

            const storedRecent = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (storedRecent) {
                setRecentSearches(JSON.parse(storedRecent));
            }
        } catch (error) {
            console.error('Failed to load search history from localStorage:', error);
            // Reset if there's an error
            localStorage.removeItem(SEARCH_HISTORY_KEY);
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        }
    }, []);

    // Save search history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    }, [searchHistory]);

    // Save recent searches to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    }, [recentSearches]);

    // Add a search to history and recent searches
    const addSearch = (filters: FilterOptions, resultCount?: number) => {
        // Only add meaningful searches (with at least one filter applied)
        const hasActiveFilters =
            filters.searchTerm !== '' ||
            filters.category !== '' ||
            filters.startDate !== null ||
            filters.endDate !== null ||
            filters.minPrice !== 0 ||
            filters.maxPrice !== 10000 ||
            filters.location !== '';

        if (!hasActiveFilters) return;

        const newSearchItem: SearchHistoryItem = {
            id: Date.now().toString(),
            filters,
            timestamp: Date.now(),
            resultCount
        };

        // Update search history
        setSearchHistory(prev => {
            const updated = [newSearchItem, ...prev.filter(item =>
                // Remove duplicates by comparing essential filter properties
                JSON.stringify(item.filters) !== JSON.stringify(filters)
            )].slice(0, MAX_SEARCH_HISTORY);

            return updated;
        });

        // Update recent searches
        setRecentSearches(prev => {
            const updated = [newSearchItem, ...prev.filter(item =>
                JSON.stringify(item.filters) !== JSON.stringify(filters)
            )].slice(0, MAX_RECENT_SEARCHES);

            return updated;
        });
    };

    // Clear all search history
    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    };

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    // Remove a specific search from history
    const removeFromHistory = (id: string) => {
        setSearchHistory(prev => prev.filter(item => item.id !== id));
        setRecentSearches(prev => prev.filter(item => item.id !== id));
    };

    // Get a descriptive label for a search item
    const getSearchLabel = (item: SearchHistoryItem): string => {
        const parts: string[] = [];

        if (item.filters.searchTerm) {
            parts.push(`"${item.filters.searchTerm}"`);
        }

        if (item.filters.category) {
            parts.push(item.filters.category);
        }

        if (item.filters.location) {
            parts.push(item.filters.location);
        }

        if (item.filters.startDate) {
            const dateStr = new Date(item.filters.startDate).toLocaleDateString();
            parts.push(`from ${dateStr}`);
        }

        if (item.filters.minPrice > 0 || item.filters.maxPrice < 10000) {
            parts.push(`₹${item.filters.minPrice}-₹${item.filters.maxPrice}`);
        }

        return parts.length > 0 ? parts.join(', ') : 'All events';
    };

    return {
        searchHistory,
        recentSearches,
        addSearch,
        clearHistory,
        clearRecentSearches,
        removeFromHistory,
        getSearchLabel
    };
};

export default useSearchHistory; 