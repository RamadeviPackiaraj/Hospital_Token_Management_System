"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const endPage = Math.min(totalPages, startPage + 4);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  return (
    <nav
      className="flex flex-wrap items-center gap-3"
      aria-label="Pagination navigation"
    >
      <Button
        variant="outline"
        size="md"
        className="h-12 rounded-[14px] border-[#23B5B5] px-6 text-[#23B5B5] hover:bg-[#F0FDFA]"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        leftIcon={<ChevronLeft className="size-4" />}
      >
        Previous
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={cn(
              "inline-flex h-12 min-w-12 items-center justify-center rounded-[14px] border px-4 text-base font-semibold transition-colors",
              page === currentPage
                ? "border-[#23B5B5] bg-[#23B5B5] text-white"
                : "border-[#23B5B5] bg-white text-[#23B5B5] hover:bg-[#F0FDFA]"
            )}
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="md"
        className="h-12 rounded-[14px] border-[#23B5B5] px-6 text-[#23B5B5] hover:bg-[#F0FDFA]"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        rightIcon={<ChevronRight className="size-4" />}
      >
        Next
      </Button>
    </nav>
  );
}
