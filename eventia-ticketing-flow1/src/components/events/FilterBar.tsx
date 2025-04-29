import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/styles/ThemeProvider';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  categories?: string[];
  isLoading?: boolean;
}

export interface FilterOptions {
  search: string;
  categories: string[];
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  useCurrentLocation: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  onFilterChange, 
  categories = [], 
  isLoading = false 
}) => {
  const theme = useTheme();
  
  // Default categories if none provided
  const defaultCategories = ['IPL', 'Cricket', 'Concerts', 'Theatre', 'Comedy', 'Festivals'];
  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    categories: [],
    startDate: null,
    endDate: null,
    location: null,
    useCurrentLocation: false
  });
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  // Loading states
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
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
  }, [debouncedSearch, filters.categories, filters.startDate, filters.endDate, filters.location, filters.useCurrentLocation]);
  
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
  
  // Handle date selection
  const handleDateChange = (type: 'start' | 'end', date: string) => {
    setFilters({
      ...filters,
      [type === 'start' ? 'startDate' : 'endDate']: date
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
      useCurrentLocation: false
    });
  };
  
  if (isLoading) {
    return (
      <div className="filter-bar-skeleton" style={{
        padding: 'var(--spacing-4)',
        backgroundColor: 'var(--color-neutral-50)',
        borderRadius: 'var(--border-radius-lg)',
        marginBottom: 'var(--spacing-6)'
      }}>
        <div style={{
          height: '40px',
          backgroundColor: 'var(--color-neutral-200)',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: 'var(--spacing-4)'
        }}></div>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-2)',
          marginBottom: 'var(--spacing-4)',
          flexWrap: 'wrap'
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: '80px',
              height: '32px',
              backgroundColor: 'var(--color-neutral-200)',
              borderRadius: 'var(--border-radius-full)'
            }}></div>
          ))}
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-4)',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: '160px',
            height: '40px',
            backgroundColor: 'var(--color-neutral-200)',
            borderRadius: 'var(--border-radius-md)'
          }}></div>
          <div style={{
            width: '160px',
            height: '40px',
            backgroundColor: 'var(--color-neutral-200)',
            borderRadius: 'var(--border-radius-md)'
          }}></div>
          <div style={{
            width: '160px',
            height: '40px',
            backgroundColor: 'var(--color-neutral-200)',
            borderRadius: 'var(--border-radius-md)'
          }}></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="filter-bar" style={{
      padding: 'var(--spacing-4)',
      backgroundColor: 'var(--color-neutral-50)',
      borderRadius: 'var(--border-radius-lg)',
      marginBottom: 'var(--spacing-6)'
    }}>
      {/* Search Bar */}
      <div style={{
        marginBottom: 'var(--spacing-4)'
      }}>
        <input
          type="text"
          placeholder="Search events, teams, venues..."
          value={filters.search}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: 'var(--spacing-3) var(--spacing-4)',
            fontSize: 'var(--font-size-md)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-neutral-300)',
            backgroundColor: 'var(--color-neutral-white)'
          }}
        />
      </div>
      
      {/* Category Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--spacing-2)',
        marginBottom: 'var(--spacing-4)'
      }}>
        {displayCategories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            style={{
              padding: 'var(--spacing-1) var(--spacing-3)',
              borderRadius: 'var(--border-radius-full)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              backgroundColor: filters.categories.includes(category)
                ? 'var(--color-primary-600)'
                : 'var(--color-neutral-200)',
              color: filters.categories.includes(category)
                ? 'var(--color-neutral-white)'
                : 'var(--color-neutral-700)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Date and Location Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--spacing-4)'
      }}>
        {/* Start Date */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--spacing-1)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-600)'
          }}>
            From
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleDateChange('start', e.target.value)}
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-neutral-300)',
              backgroundColor: 'var(--color-neutral-white)'
            }}
          />
        </div>
        
        {/* End Date */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--spacing-1)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-600)'
          }}>
            To
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleDateChange('end', e.target.value)}
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-neutral-300)',
              backgroundColor: 'var(--color-neutral-white)'
            }}
          />
        </div>
        
        {/* Location */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--spacing-1)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-600)'
          }}>
            Location
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}>
            <input
              type="text"
              placeholder="Enter location"
              value={filters.location || ''}
              onChange={(e) => setFilters({...filters, location: e.target.value, useCurrentLocation: false})}
              style={{
                padding: 'var(--spacing-2)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--color-neutral-300)',
                backgroundColor: 'var(--color-neutral-white)'
              }}
            />
            <Button
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? 'Detecting...' : '📍'}
            </Button>
          </div>
        </div>
        
        {/* Reset Filters */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <Button
            variant="secondary"
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
}; 