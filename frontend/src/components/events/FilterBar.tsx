import { Button } from '@/components/ui/button';
import { Datepicker } from '@/components/ui/datepicker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/hooks/use-theme';
import { Calendar as CalendarIcon, MapPin, Search, Tag, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
  locations: string[];
  minPrice?: number;
  maxPrice?: number;
}

// Rename and export this interface for other components
export interface FilterOptions {
  searchTerm: string;
  category: string;
  startDate: Date | null;
  endDate: Date | null;
  minPrice: number;
  maxPrice: number;
  location: string;
}

// Keep using FilterState internally for backward compatibility
type FilterState = FilterOptions;

export const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  categories = [],
  locations = [],
  minPrice = 0,
  maxPrice = 10000,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Add debounce timer ref
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state from URL search params or defaults
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
    minPrice: Number(searchParams.get('minPrice')) || minPrice,
    maxPrice: Number(searchParams.get('maxPrice')) || maxPrice,
    location: searchParams.get('location') || '',
  });

  // Update URL when filters change with debouncing
  useEffect(() => {
    // Immediately call the filter change callback
    onFilterChange(filters);

    // Clear previous timeout if it exists
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set a new timeout to update URL params (debouncing)
    updateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      if (filters.searchTerm) params.set('search', filters.searchTerm);
      if (filters.category) params.set('category', filters.category);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString().split('T')[0]);
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString().split('T')[0]);
      if (filters.minPrice !== minPrice) params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== maxPrice) params.set('maxPrice', filters.maxPrice.toString());
      if (filters.location) params.set('location', filters.location);

      setSearchParams(params);
    }, 500); // 500ms debounce time

    // Cleanup timeout on component unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [filters, onFilterChange, minPrice, maxPrice]);

  // Handle input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({ ...prev, category: value }));
  };

  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setFilters(prev => ({
      ...prev,
      startDate: range.from || null,
      endDate: range.to || null,
    }));
  };

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, minPrice: value[0], maxPrice: value[1] }));
  };

  const handleLocationChange = (value: string) => {
    setFilters(prev => ({ ...prev, location: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      category: '',
      startDate: null,
      endDate: null,
      minPrice,
      maxPrice,
      location: '',
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm !== '' ||
    filters.category !== '' ||
    filters.startDate !== null ||
    filters.endDate !== null ||
    filters.minPrice !== minPrice ||
    filters.maxPrice !== maxPrice ||
    filters.location !== '';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search for events..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 flex items-center">
              <Tag size={16} className="mr-1" />
              Category
            </label>
            <Select value={filters.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 flex items-center">
              <CalendarIcon size={16} className="mr-1" />
              Date range
            </label>
            <Datepicker
              date={{
                from: filters.startDate || undefined,
                to: filters.endDate || undefined,
              }}
              onSelect={handleDateChange}
              placeholder="Select date range"
            />
          </div>

          {/* Price range filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              Price range: ₹{filters.minPrice} - ₹{filters.maxPrice}
            </label>
            <Slider
              defaultValue={[filters.minPrice, filters.maxPrice]}
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={handlePriceChange}
              min={minPrice}
              max={maxPrice}
              step={100}
              className="mt-2"
            />
          </div>

          {/* Location filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 flex items-center">
              <MapPin size={16} className="mr-1" />
              Location
            </label>
            <Select value={filters.location} onValueChange={handleLocationChange}>
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset filters button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center text-sm"
            >
              <X size={14} className="mr-1" />
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
