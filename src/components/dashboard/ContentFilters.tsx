"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Image as ImageIcon, 
  FileText, 
  Play, 
  Filter,
  X,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ContentType } from './ContentGrid';

export type ContentStatus = 'ALL' | 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'PROCESSING' | 'PENDING';
export type SortOption = 'newest' | 'oldest' | 'title' | 'status';

interface ContentFiltersProps {
  selectedTypes: ContentType[];
  selectedStatus: ContentStatus;
  sortBy: SortOption;
  onTypeChange: (types: ContentType[]) => void;
  onStatusChange: (status: ContentStatus) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

const contentTypes = [
  { type: 'video' as ContentType, label: 'Videos', icon: Video, color: 'bg-red-100 text-red-700 border-red-200' },
  { type: 'image' as ContentType, label: 'Images', icon: ImageIcon, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { type: 'text' as ContentType, label: 'Text Posts', icon: FileText, color: 'bg-green-100 text-green-700 border-green-200' },
  { type: 'reel' as ContentType, label: 'Reels', icon: Play, color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

const statusOptions = [
  { status: 'ALL' as ContentStatus, label: 'All', icon: Filter },
  { status: 'DRAFT' as ContentStatus, label: 'Draft', icon: FileText },
  { status: 'SCHEDULED' as ContentStatus, label: 'Scheduled', icon: Calendar },
  { status: 'PUBLISHED' as ContentStatus, label: 'Published', icon: CheckCircle },
  { status: 'PROCESSING' as ContentStatus, label: 'Processing', icon: Loader2 },
  { status: 'PENDING' as ContentStatus, label: 'Pending', icon: Clock },
];

const sortOptions = [
  { value: 'newest' as SortOption, label: 'Newest First' },
  { value: 'oldest' as SortOption, label: 'Oldest First' },
  { value: 'title' as SortOption, label: 'Title A-Z' },
  { value: 'status' as SortOption, label: 'Status' },
];

export const ContentFilters: React.FC<ContentFiltersProps> = ({
  selectedTypes,
  selectedStatus,
  sortBy,
  onTypeChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount
}) => {
  const handleTypeToggle = (type: ContentType) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const hasActiveFilters = selectedTypes.length < 4 || selectedStatus !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header with counts */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            All Content
          </h2>
          <p className="text-sm text-gray-600">
            {filteredCount} of {totalCount} items
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600">
                (filtered)
              </span>
            )}
          </p>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Content Type Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Content Type</h3>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              variant={selectedTypes.includes(type) ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeToggle(type)}
              className={`gap-2 ${
                selectedTypes.includes(type) 
                  ? color 
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Status and Sort Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(({ status, label, icon: Icon }) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange(status)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="sm:w-48">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Sort By</h3>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {selectedTypes.length < 4 && (
            <Badge variant="secondary" className="gap-1">
              Types: {selectedTypes.join(', ')}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onTypeChange(['video', 'image', 'text', 'reel'])}
              />
            </Badge>
          )}
          {selectedStatus !== 'ALL' && (
            <Badge variant="secondary" className="gap-1">
              Status: {selectedStatus}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onStatusChange('ALL')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentFilters;
