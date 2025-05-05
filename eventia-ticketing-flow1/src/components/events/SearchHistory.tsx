import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, X, Search, ExternalLink, Calendar, Tag, MapPin } from 'lucide-react';
import { SearchHistoryItem, useSearchHistory } from '@/hooks/useSearchHistory';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SearchHistoryProps {
    onSelectSearch: (filters: SearchHistoryItem) => void;
    className?: string;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
    onSelectSearch,
    className = ''
}) => {
    const { searchHistory, removeFromHistory, clearHistory } = useSearchHistory();
    const navigate = useNavigate();

    if (searchHistory.length === 0) {
        return (
            <Card className={`${className}`}>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <History size={18} className="mr-2 text-muted-foreground" />
                        Search History
                    </CardTitle>
                    <CardDescription>You haven't searched for any events yet.</CardDescription>
                </CardHeader>
            </Card>
        );
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

    // Group searches by date (today, yesterday, this week, earlier)
    const groupedSearches = searchHistory.reduce((acc, item) => {
        const date = new Date(item.timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        // Check if within the last 7 days but not today or yesterday
        const isThisWeek = date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000
            && !isToday && !isYesterday;

        const group = isToday
            ? 'Today'
            : isYesterday
                ? 'Yesterday'
                : isThisWeek
                    ? 'This Week'
                    : 'Earlier';

        if (!acc[group]) {
            acc[group] = [];
        }

        acc[group].push(item);
        return acc;
    }, {} as Record<string, SearchHistoryItem[]>);

    return (
        <Card className={`${className}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                        <History size={18} className="mr-2 text-muted-foreground" />
                        Search History
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Clear all
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <ScrollArea className="max-h-[600px]">
                    {Object.entries(groupedSearches).map(([group, items]) => (
                        <div key={group} className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">{group}</h3>
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-md border border-border hover:border-primary p-3 group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <button
                                                onClick={() => handleSearchClick(item)}
                                                className="flex items-center text-left"
                                            >
                                                <Search size={16} className="mr-2 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {item.filters.searchTerm ? item.filters.searchTerm : 'All events'}
                                                </span>
                                            </button>
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

                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {item.filters.category && (
                                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                    <Tag size={12} />
                                                    {item.filters.category}
                                                </Badge>
                                            )}

                                            {item.filters.location && (
                                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                    <MapPin size={12} />
                                                    {item.filters.location}
                                                </Badge>
                                            )}

                                            {item.filters.startDate && (
                                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                    <Calendar size={12} />
                                                    {format(new Date(item.filters.startDate), 'MMM d, yyyy')}
                                                    {item.filters.endDate && ` - ${format(new Date(item.filters.endDate), 'MMM d, yyyy')}`}
                                                </Badge>
                                            )}

                                            {(item.filters.minPrice > 0 || item.filters.maxPrice < 10000) && (
                                                <Badge variant="outline" className="text-xs">
                                                    ₹{item.filters.minPrice} - ₹{item.filters.maxPrice}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                            <span>{format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}</span>
                                            {item.resultCount !== undefined && (
                                                <span>{item.resultCount} results</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default SearchHistory; 