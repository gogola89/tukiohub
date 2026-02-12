'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  totalCount?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrevious,
  totalCount,
  pageSize,
}: PaginationProps) {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    let prev: number | null = null;
    for (const i of range) {
      if (prev && i - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-between px-2">
      {totalCount && pageSize && (
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * pageSize) + 1} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={!hasPrevious}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-1">
          {getPageNumbers().map((pageNum, idx) => (
            pageNum === '...' ? (
              <span key={`dots-${idx}`} className="px-2 py-1">...</span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum as number)}
              >
                {pageNum}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
