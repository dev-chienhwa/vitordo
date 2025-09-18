'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { TimelineStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Filter, 
  X,
  ChevronDown,
  Star
} from 'lucide-react';

export interface TimelineFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  status: TimelineStatus[];
  priority: number[];
  dateRange: 'today' | 'week' | 'month' | 'all';
  sortBy: 'time' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: FilterState = {
  status: [TimelineStatus.UPCOMING, TimelineStatus.RECENTLY_COMPLETED, TimelineStatus.COMPLETED],
  priority: [1, 2, 3, 4, 5],
  dateRange: 'all',
  sortBy: 'time',
  sortOrder: 'asc',
};

const statusOptions = [
  {
    value: TimelineStatus.RECENTLY_COMPLETED,
    label: 'Recently Completed',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    value: TimelineStatus.UPCOMING,
    label: 'Upcoming',
    icon: Clock,
    color: 'text-blue-600',
  },
  {
    value: TimelineStatus.COMPLETED,
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-gray-500',
  },
];

const priorityOptions = [
  { value: 5, label: 'Critical', color: 'text-red-600' },
  { value: 4, label: 'High', color: 'text-orange-600' },
  { value: 3, label: 'Medium', color: 'text-yellow-600' },
  { value: 2, label: 'Low', color: 'text-green-600' },
  { value: 1, label: 'Lowest', color: 'text-gray-600' },
];

const dateRangeOptions = [
  { value: 'today' as const, label: 'Today' },
  { value: 'week' as const, label: 'This Week' },
  { value: 'month' as const, label: 'This Month' },
  { value: 'all' as const, label: 'All Time' },
];

const sortOptions = [
  { value: 'time' as const, label: 'Time' },
  { value: 'priority' as const, label: 'Priority' },
  { value: 'status' as const, label: 'Status' },
];

export function TimelineFilters({
  isOpen,
  onClose,
  onFiltersChange,
  className,
}: TimelineFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    priority: false,
    dateRange: false,
    sort: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleStatus = (status: TimelineStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatus });
  };

  const togglePriority = (priority: number) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    updateFilters({ priority: newPriority });
  };

  if (!isOpen) return null;

  return (
    <AnimatedContainer direction="down" duration={0.3}>
      <Card className={cn('absolute top-full left-0 right-0 mt-2 z-50', className)}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Filter Timeline</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <button
                onClick={() => toggleSection('status')}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-medium text-gray-700">Status</span>
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform',
                  expandedSections.status && 'rotate-180'
                )} />
              </button>
              
              {expandedSections.status && (
                <div className="mt-2 space-y-2">
                  {statusOptions.map(option => {
                    const Icon = option.icon;
                    const isSelected = filters.status.includes(option.value);
                    
                    return (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStatus(option.value)}
                          className="rounded border-gray-300"
                        />
                        <Icon className={cn('w-4 h-4', option.color)} />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Filter */}
            <div>
              <button
                onClick={() => toggleSection('priority')}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-medium text-gray-700">Priority</span>
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform',
                  expandedSections.priority && 'rotate-180'
                )} />
              </button>
              
              {expandedSections.priority && (
                <div className="mt-2 space-y-2">
                  {priorityOptions.map(option => {
                    const isSelected = filters.priority.includes(option.value);
                    
                    return (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePriority(option.value)}
                          className="rounded border-gray-300"
                        />
                        <Star className={cn('w-4 h-4', option.color)} />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div>
              <button
                onClick={() => toggleSection('dateRange')}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-medium text-gray-700">Date Range</span>
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform',
                  expandedSections.dateRange && 'rotate-180'
                )} />
              </button>
              
              {expandedSections.dateRange && (
                <div className="mt-2 space-y-2">
                  {dateRangeOptions.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="dateRange"
                        value={option.value}
                        checked={filters.dateRange === option.value}
                        onChange={() => updateFilters({ dateRange: option.value })}
                        className="border-gray-300"
                      />
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div>
              <button
                onClick={() => toggleSection('sort')}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-medium text-gray-700">Sort By</span>
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform',
                  expandedSections.sort && 'rotate-180'
                )} />
              </button>
              
              {expandedSections.sort && (
                <div className="mt-2 space-y-2">
                  {sortOptions.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="sortBy"
                        value={option.value}
                        checked={filters.sortBy === option.value}
                        onChange={() => updateFilters({ sortBy: option.value })}
                        className="border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                  
                  <div className="ml-6 flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sortOrder"
                        value="asc"
                        checked={filters.sortOrder === 'asc'}
                        onChange={() => updateFilters({ sortOrder: 'asc' })}
                        className="border-gray-300"
                      />
                      <span className="text-sm text-gray-600">Ascending</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sortOrder"
                        value="desc"
                        checked={filters.sortOrder === 'desc'}
                        onChange={() => updateFilters({ sortOrder: 'desc' })}
                        className="border-gray-300"
                      />
                      <span className="text-sm text-gray-600">Descending</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}