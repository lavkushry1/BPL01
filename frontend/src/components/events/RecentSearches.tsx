import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, Search, ExternalLink } from 'lucide-react';
import { SearchHistoryItem, useSearchHistory } from '@/hooks/useSearchHistory';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentSearchesProps {
    onSelectSearch: (filters: SearchHistoryItem) => void;
    className?: string;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
    onSelectSearch,
    className = ''
}) => {
    const { recentSearches, removeFromHistory, getSearchLabel, clearRecentSearches } = useSearchHistory();
    const navigate = useNavigate();

    if (recentSearches.length === 0) {
        return null;
    }

    // Function to build query parameters from filters
    const buildSearchUrl = (item: SearchHistoryItem) => {
        const params = new URLSearchParams();
        const { filters } = item;

        if (filters.searchTerm) params.set('search', filters.searchTerm);
        if (filters.category) params.set('category', filters.category);
        if (filters.startDate) params.set('startDate', new Date(filters.startDate).toISOString().split('T')[0]);
        if (filters.endDate) params.set('endDate', new Date(filters.endDate).toISOString().split('T')[0]);
        if (filters.minPrice !== 0) params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice !== 10000) params.set('maxPrice', filters.maxPrice.toString());
        if (filters.location) params.set('location', filters.location);

        return `/search?${params.toString()}`;
    };

    const handleSearchClick = (item: SearchHistoryItem) => {
        onSelectSearch(item);
    };

    const handleViewResults = (item: SearchHistoryItem) => {
        navigate(buildSearchUrl(item));
    };

    // Format timestamp to relative time
    const getRelativeTime = (timestamp: number) => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - timestamp) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <Card className={`${className}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                        <Clock size={18} className="mr-2 text-muted-foreground" />
                        Recent Searches
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Clear all
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                        {recentSearches.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center p-2 rounded-md hover:bg-muted group"
                            >
                                <div className="flex-1">
                                    <button
                                        onClick={() => handleSearchClick(item)}
                                        className="flex items-start text-left w-full"
                                    >
                                        <Search size={16} className="mr-2 mt-1 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-medium line-clamp-1">{getSearchLabel(item)}</p>
                                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <span>{getRelativeTime(item.timestamp)}</span>
                                                {item.resultCount !== undefined && (
                                                    <span className="ml-2">{item.resultCount} results</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleViewResults(item)}
                                        title="View results"
                                    >
                                        <ExternalLink size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => removeFromHistory(item.id)}
                                        title="Remove from history"
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default RecentSearches; 