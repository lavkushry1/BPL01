import React from 'react';
import { useTranslation } from 'react-i18next';
import { SortAsc, SortDesc, CalendarRange, CreditCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SortOption = 
  | 'date-asc' 
  | 'date-desc' 
  | 'price-asc' 
  | 'price-desc' 
  | 'name-asc' 
  | 'name-desc' 
  | 'popularity';

interface EventSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
  showButtons?: boolean;
}

export const EventSort: React.FC<EventSortProps> = ({
  value,
  onChange,
  className,
  showButtons = false
}) => {
  const { t } = useTranslation();
  
  const sortOptions = [
    { 
      value: 'date-asc', 
      label: t('sort.dateAsc', 'Date (Nearest first)'),
      icon: <CalendarRange className="mr-2 h-4 w-4" />
    },
    { 
      value: 'date-desc', 
      label: t('sort.dateDesc', 'Date (Furthest first)'),
      icon: <CalendarRange className="mr-2 h-4 w-4" />
    },
    { 
      value: 'price-asc', 
      label: t('sort.priceAsc', 'Price (Low to high)'),
      icon: <CreditCard className="mr-2 h-4 w-4" /> 
    },
    { 
      value: 'price-desc', 
      label: t('sort.priceDesc', 'Price (High to low)'),
      icon: <CreditCard className="mr-2 h-4 w-4" /> 
    },
    { 
      value: 'name-asc', 
      label: t('sort.nameAsc', 'Name (A to Z)'),
      icon: <SortAsc className="mr-2 h-4 w-4" /> 
    },
    { 
      value: 'name-desc', 
      label: t('sort.nameDesc', 'Name (Z to A)'),
      icon: <SortDesc className="mr-2 h-4 w-4" /> 
    },
    { 
      value: 'popularity', 
      label: t('sort.popularity', 'Popularity'),
      icon: <SortDesc className="mr-2 h-4 w-4" /> 
    }
  ];
  
  // If showing as buttons, render button group
  if (showButtons) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {sortOptions.map(option => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value as SortOption)}
            className="flex items-center"
          >
            {option.icon}
            <span>{option.label}</span>
          </Button>
        ))}
      </div>
    );
  }
  
  // Otherwise show as dropdown
  return (
    <div className={cn("flex items-center", className)}>
      <span className="text-sm text-gray-600 mr-2">{t('sort.sortBy', 'Sort by')}:</span>
      <Select value={value} onValueChange={(val) => onChange(val as SortOption)}>
        <SelectTrigger className="w-[180px] h-9 border-gray-300">
          <SelectValue placeholder={t('sort.sortBy', 'Sort by')} />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 