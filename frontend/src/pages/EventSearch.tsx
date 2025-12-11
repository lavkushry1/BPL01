import SearchEventCard from '@/components/events/SearchEventCard';
import SearchHistory from '@/components/events/SearchHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { SearchHistoryItem, useSearchHistory } from '@/hooks/useSearchHistory';
import { defaultApiClient } from '@/services/api/apiUtils';
import { Category as ApiCategory, Event as ApiEvent, EventListResponse, getEventCategories, IPLMatch } from '@/services/api/eventApi';
import { Loader2, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import FilterBar, { FilterOptions } from '../components/events/FilterBar';

// Location type
interface Location {
  id: string;
  name: string;
}

// Sort type
type SortOption = 'date' | 'price-asc' | 'price-desc' | 'name';

// Define a type for the events we display in the list
type DisplayEvent = ApiEvent | IPLMatch;

const EventSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const eventsPerPage = 8;

  const { addSearch } = useSearchHistory();

  const [filters, setFilters] = useState<FilterOptions>(() => ({
    searchTerm: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 10000,
    location: searchParams.get('location') || '',
  }));

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesResponse, locationsResponse] = await Promise.all([
          getEventCategories(),
          defaultApiClient.get<{ data: Location[] }>(`/locations`)
        ]);
        setCategories(categoriesResponse || []);
        if (locationsResponse.data && locationsResponse.data.data) {
          setLocations(locationsResponse.data.data);
        } else {
          console.warn('No locations data found');
          setLocations([]);
        }
      } catch (error) {
        console.error('Error fetching initial filter data:', error);
        toast({
          title: t('common.error'),
          description: t('search.errorFetchingFilters'),
          variant: 'destructive'
        });
        setCategories([]);
        setLocations([]);
      }
    };
    fetchInitialData();
  }, [toast, t]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters: any = {
        search: filters.searchTerm || undefined,
        category: filters.category || undefined,
        startDate: filters.startDate?.toISOString().split('T')[0] || undefined,
        endDate: filters.endDate?.toISOString().split('T')[0] || undefined,
        minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice < 10000 ? filters.maxPrice : undefined,
        location: filters.location || undefined,
        sortBy: sortBy === 'date' ? 'start_date' : sortBy === 'name' ? 'title' : sortBy === 'price-asc' ? 'price:asc' : sortBy === 'price-desc' ? 'price:desc' : undefined,
        page: currentPage,
        limit: eventsPerPage,
      };

      Object.keys(apiFilters).forEach(key => apiFilters[key] === undefined && delete apiFilters[key]);

      // Update to handle EventListResponse properly
      const apiResponse = await defaultApiClient.get(`/events`, { params: apiFilters });

      if (!apiResponse.data || !apiResponse.data.data) {
        throw new Error('Invalid API response format');
      }

      const response: EventListResponse = apiResponse.data.data;
      setEvents(response.events || []);
      setTotalPages(response.pagination?.totalPages || 1);

      if (filters.searchTerm || filters.category || filters.location) {
        addSearch(filters, response.pagination?.total || 0);
      }

    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: t('common.error'),
        description: t('search.errorFetchingEvents'),
        variant: 'destructive'
      });
      setEvents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, eventsPerPage, sortBy, addSearch, toast, t]);

  useEffect(() => {
    fetchEvents();
    const newParams = new URLSearchParams();
    if (filters.searchTerm) newParams.set('search', filters.searchTerm);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.location) newParams.set('location', filters.location);
    setSearchParams(newParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, sortBy]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setIsFilterSheetOpen(false);
  };

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setCurrentPage(1);
  };

  const handleSelectSearch = (searchItem: SearchHistoryItem) => {
    setFilters(searchItem.filters);
    setShowSearchHistory(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      searchTerm: '',
      category: '',
      startDate: null,
      endDate: null,
      minPrice: 0,
      maxPrice: 10000,
      location: '',
    };
    setFilters(defaultFilters);
    setSortBy('date');
    setCurrentPage(1);
    setIsFilterSheetOpen(false);
  };

  // Convert categories and locations for the FilterBar component
  const categoryNames = categories.map(c => c.name);
  const locationNames = locations.map(l => l.name);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder={t('search.placeholder')}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-lg"
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            onFocus={() => setShowSearchHistory(true)}
            onBlur={() => setTimeout(() => setShowSearchHistory(false), 150)}
          />
          {showSearchHistory && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
              <SearchHistory onSelectSearch={handleSelectSearch} />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="hidden md:block w-1/4">
            <h3 className="font-semibold mb-2">Filters</h3>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mb-4 w-full">
              <X className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
            <FilterBar
              categories={categoryNames}
              locations={locationNames}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className="md:hidden">
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {t('common.filters')}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>{t('common.filters')}</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <FilterBar
                    categories={categoryNames}
                    locations={locationNames}
                    onFilterChange={handleFilterChange}
                  />
                  <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4 w-full">
                    <X className="mr-2 h-4" /> Reset Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden md:inline">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Sort events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-asc">Price (Low-High)</SelectItem>
                <SelectItem value="price-desc">Price (High-Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          <div className="hidden md:block space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Filters</h3>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm">
                Reset
              </Button>
            </div>
            <FilterBar
              categories={categoryNames}
              locations={locationNames}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  // Map the event data to SearchEventCardProps format
                  const eventDate = event.start_date ? new Date(event.start_date) : new Date();
                  let lowestPrice = 0;
                  let location = '';
                  let imageUrl = '';

                  // Type guard for IPLMatch
                  const isIPLMatch = (e: any): e is IPLMatch => 'teams' in e && 'ticketTypes' in e;

                  if (isIPLMatch(event)) {
                    lowestPrice = Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0
                      ? Math.min(...event.ticketTypes.map(tt => tt.price))
                      : 0;
                    location = event.venue || '';
                    imageUrl = event.posterImage || event.images?.[0]?.url || '';
                  } else {
                    // Assume ApiEvent
                    lowestPrice = Array.isArray(event.ticket_types) && event.ticket_types.length > 0
                      ? Math.min(...event.ticket_types.map(tt => tt.price))
                      : 0;
                    location = event.location || event.venue || '';
                    imageUrl = event.images?.[0]?.url || event.poster_image || '';
                  }

                  return (
                    <SearchEventCard
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      description={event.description || ''}
                      date={eventDate}
                      location={location}
                      price={lowestPrice}
                      imageUrl={imageUrl}
                      category={event.category || ''}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                <p className="text-xl text-gray-500">{t('search.noResults')}</p>
                <Button variant="link" onClick={resetFilters} className="mt-2">
                  {t('search.tryClearingFilters')}
                </Button>
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSearch;
