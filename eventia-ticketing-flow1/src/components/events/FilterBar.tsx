import React, { useState, useEffect } from 'react';
import { useTheme } from '@/styles/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Search, MapPin, X, Filter } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  categories?: string[];
  isLoading?: boolean;
  minPrice?: number;
  maxPrice?: number;
  initialFilters?: Partial<FilterOptions>;
}

export interface FilterOptions {
  search: string;
  categories: string[];
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  useCurrentLocation: boolean;
  priceRange?: [number, number] | null;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  onFilterChange, 
  categories = [], 
  isLoading = false,
  minPrice = 0,
  maxPrice = 10000,
  initialFilters = {}
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Default categories if none provided
  const defaultCategories = ['IPL', 'Cricket', 'Concerts', 'Theatre', 'Comedy', 'Festivals'];
  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: initialFilters.search || '',
    categories: initialFilters.categories || [],
    startDate: initialFilters.startDate || null,
    endDate: initialFilters.endDate || null,
    location: initialFilters.location || null,
    useCurrentLocation: initialFilters.useCurrentLocation || false,
    priceRange: initialFilters.priceRange || [minPrice, maxPrice]
  });
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  // UI states
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: filters.startDate ? parseISO(filters.startDate) : undefined,
    to: filters.endDate ? parseISO(filters.endDate) : undefined
  });
  
  // Count active filters
  const activeFilterCount = (
    (filters.search ? 1 : 0) + 
    filters.categories.length + 
    (filters.startDate ? 1 : 0) + 
    (filters.endDate ? 1 : 0) + 
    (filters.location ? 1 : 0) +
    (filters.priceRange && 
     (filters.priceRange[0] > minPrice || 
      filters.priceRange[1] < maxPrice) ? 1 : 0)
  );
  
  // Apply filters with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters.search]);
  
  // Send filter changes to parent
  useEffect(() => {
    onFilterChange({
      ...filters,
      search: debouncedSearch
    });
  }, [
    debouncedSearch, 
    filters.categories, 
    filters.startDate, 
    filters.endDate, 
    filters.location, 
    filters.useCurrentLocation,
    filters.priceRange,
    onFilterChange
  ]);
  
  // Handle text search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };
  
  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setFilters(prev => {
      const isSelected = prev.categories.includes(category);
      
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter(cat => cat !== category)
          : [...prev.categories, category]
      };
    });
  };
  
  // Handle date range selection
  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    // Update the date range state
    setDateRange({
      from: range.from,
      to: range.to
    });
    
    // Update the filters with formatted date strings or null
    setFilters({
      ...filters,
      startDate: range.from && isValid(range.from) ? format(range.from, 'yyyy-MM-dd') : null,
      endDate: range.to && isValid(range.to) ? format(range.to, 'yyyy-MM-dd') : null
    });
  };
  
  // Handle price range change
  const handlePriceRangeChange = (values: number[]) => {
    setFilters({
      ...filters,
      priceRange: [values[0], values[1]] as [number, number]
    });
  };
  
  // Handle location detection
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would call a reverse geocoding service
          // to convert coordinates to a human-readable address
          setFilters({
            ...filters,
            location: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`,
            useCurrentLocation: true
          });
          setIsDetectingLocation(false);
        },
        (error) => {
          console.error('Error detecting location:', error);
          setIsDetectingLocation(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setIsDetectingLocation(false);
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      startDate: null,
      endDate: null,
      location: null,
      useCurrentLocation: false,
      priceRange: [minPrice, maxPrice]
    });
    
    // Reset date range state
    setDateRange({
      from: undefined,
      to: undefined
    });
  };
  
  // Remove single filter
  const handleRemoveFilter = (type: string, value?: string) => {
    if (type === 'search') {
      setFilters({ ...filters, search: '' });
    } else if (type === 'category' && value) {
      setFilters({
        ...filters,
        categories: filters.categories.filter(cat => cat !== value)
      });
    } else if (type === 'date') {
      setFilters({ ...filters, startDate: null, endDate: null });
      setDateRange({ from: undefined, to: undefined });
    } else if (type === 'location') {
      setFilters({ ...filters, location: null, useCurrentLocation: false });
    } else if (type === 'price') {
      setFilters({ ...filters, priceRange: [minPrice, maxPrice] });
    }
  };
  
  if (isLoading) {
    return (
      <div className="filter-bar-skeleton bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-4"></div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-20 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="w-40 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
          <div className="w-40 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
          <div className="w-40 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="filter-bar bg-card shadow-sm dark:shadow-none rounded-lg mb-6">
      {/* Search and mobile filter toggle */}
      <div className="flex gap-2 p-4 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={t('events.searchPlaceholder')}
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 w-full"
          />
          {filters.search && (
            <button 
              onClick={() => setFilters({...filters, search: ''})}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden flex items-center justify-center relative"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
      
      {/* Category filters */}
      <div className={`p-4 border-b ${!showMobileFilters ? 'hidden md:block' : ''}`}>
        <div className="flex flex-wrap gap-2">
          {displayCategories.map(category => (
            <Button
              key={category}
              variant={filters.categories.includes(category) ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Advanced filters */}
      <div className={`p-4 ${!showMobileFilters ? 'hidden md:flex' : 'flex'} flex-wrap gap-4`}>
        {/* Date Range Picker */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {filters.startDate && filters.endDate ? (
                <span>
                  {format(new Date(filters.startDate), 'MMM d')} - {format(new Date(filters.endDate), 'MMM d')}
                </span>
              ) : filters.startDate ? (
                <span>From {format(new Date(filters.startDate), 'MMM d')}</span>
              ) : filters.endDate ? (
                <span>Until {format(new Date(filters.endDate), 'MMM d')}</span>
              ) : (
                <span>{t('events.selectDate')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
        
        {/* Price Range Slider */}
        <Popover open={isPriceFilterOpen} onOpenChange={setIsPriceFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <span>₹</span>
              {filters.priceRange && filters.priceRange[0] === minPrice && filters.priceRange[1] === maxPrice ? (
                <span>{t('events.anyPrice')}</span>
              ) : (
                <span>
                  ₹{filters.priceRange?.[0]} - ₹{filters.priceRange?.[1]}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="px-4 py-2 space-y-4">
              <div className="font-medium">{t('events.priceRange')}</div>
              <div className="pt-4">
                <Slider
                  defaultValue={[
                    filters.priceRange?.[0] || minPrice,
                    filters.priceRange?.[1] || maxPrice
                  ]}
                  min={minPrice}
                  max={maxPrice}
                  step={100}
                  onValueChange={handlePriceRangeChange}
                />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <div>₹{filters.priceRange?.[0]}</div>
                  <div>₹{filters.priceRange?.[1]}</div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  size="sm"
                  onClick={() => setIsPriceFilterOpen(false)}
                >
                  {t('common.apply')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Location Filter */}
        <Button
          variant="outline"
          disabled={isDetectingLocation}
          onClick={handleDetectLocation}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          {isDetectingLocation ? t('common.detecting') : (
            filters.location ? filters.location : t('events.nearMe')
          )}
        </Button>
        
        {/* Reset filters button only shows when filters are active */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="ml-auto"
            size="sm"
          >
            {t('common.clearFilters')}
          </Button>
        )}
      </div>
      
      {/* Active Filters Display */}
      {activeFilterCount > 0 &&
        <div className="px-4 py-2 flex flex-wrap gap-2 items-center border-t">
          <span className="text-sm text-muted-foreground mr-2">{t('common.activeFilters')}:</span>
          
          {filters.search && (
            <div className="flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
              <span>{filters.search}</span>
              <X 
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveFilter('search')}
              />
            </div>
          )}
          
          {filters.categories.map(category => (
            <div key={category} className="flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
              <span>{category}</span>
              <X 
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveFilter('category', category)}
              />
            </div>
          ))}
          
          {(filters.startDate || filters.endDate) && (
            <div className="flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {filters.startDate && filters.endDate 
                  ? `${format(new Date(filters.startDate), 'MMM d')} - ${format(new Date(filters.endDate), 'MMM d')}` 
                  : filters.startDate 
                    ? `From ${format(new Date(filters.startDate), 'MMM d')}` 
                    : filters.endDate
                      ? `Until ${format(new Date(filters.endDate), 'MMM d')}`
                      : ''
                }
              </span>
              <X 
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveFilter('date')}
              />
            </div>
          )}
          
          {filters.location && (
            <div className="flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
              <MapPin className="h-3 w-3" />
              <span>{filters.location}</span>
              <X 
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveFilter('location')}
              />
            </div>
          )}
          
          {filters.priceRange && (filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice) && (
            <div className="flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
              <span>₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}</span>
              <X 
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveFilter('price')}
              />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-muted-foreground hover:text-foreground ml-auto text-xs"
          >
            {t('common.clearAll')}
          </Button>
        </div>
      }
    </div>
  );
}; 