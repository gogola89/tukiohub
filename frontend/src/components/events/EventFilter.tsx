'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { EventCategory } from '@/types/event';

interface EventFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  showMobileFilter?: boolean;
  onCloseMobileFilter?: () => void;
}

export interface FilterValues {
  category?: EventCategory;
  city?: string;
  start_date?: string;
  end_date?: string;
}

const categories: { value: EventCategory; label: string }[] = [
  { value: 'MUSIC', label: 'Music' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'CHARITY', label: 'Charity' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'OTHER', label: 'Other' },
];

const cities = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Kakamega',
];

export default function EventFilter({
  onFilterChange,
  showMobileFilter = false,
  onCloseMobileFilter,
}: EventFilterProps) {
  const [filters, setFilters] = useState<FilterValues>({});

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined);

  const filterContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {showMobileFilter && (
          <Button variant="ghost" size="icon" onClick={onCloseMobileFilter}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Filter */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Select
          value={filters.city}
          onValueChange={(value) => handleFilterChange('city', value)}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label htmlFor="start_date">Start Date</Label>
        <Input
          id="start_date"
          type="date"
          value={filters.start_date || ''}
          onChange={(e) => handleFilterChange('start_date', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="end_date">End Date</Label>
        <Input
          id="end_date"
          type="date"
          value={filters.end_date || ''}
          onChange={(e) => handleFilterChange('end_date', e.target.value)}
          min={filters.start_date}
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  if (showMobileFilter) {
    return (
      <div className="fixed inset-0 z-50 bg-background p-4 overflow-y-auto lg:hidden">
        {filterContent}
      </div>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardContent className="pt-6">{filterContent}</CardContent>
    </Card>
  );
}
