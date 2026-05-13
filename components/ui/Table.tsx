"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | boolean | null | undefined;
}

export interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  rowKey?: keyof T | ((row: T, index: number) => React.Key);
  className?: string;
  stickyHeader?: boolean;
  initialSort?: {
    key: string;
    direction: "asc" | "desc";
  };
}

const SKELETON_ROWS = 5;

function resolveRowKey<T extends Record<string, unknown>>(
  row: T,
  index: number,
  rowKey?: TableProps<T>["rowKey"]
) {
  if (typeof rowKey === "function") {
    return rowKey(row, index);
  }

  if (rowKey) {
    return row[rowKey] as React.Key;
  }

  const fallbackKey = row.id ?? row.key;
  return typeof fallbackKey === "string" || typeof fallbackKey === "number"
    ? fallbackKey
    : index;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  pageSize = 10,
  rowKey,
  className,
  stickyHeader = false,
  initialSort
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortState, setSortState] = React.useState<{ key: string; direction: "asc" | "desc" } | null>(initialSort || null);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const sortedData = React.useMemo(() => {
    if (!sortState) {
      return data;
    }

    const column = columns.find((item) => String(item.key) === sortState.key);
    if (!column) {
      return data;
    }

    const sorted = [...data].sort((left, right) => {
      const leftValue = column.sortValue ? column.sortValue(left) : (left[column.key as keyof T] as string | number | boolean | null | undefined);
      const rightValue = column.sortValue ? column.sortValue(right) : (right[column.key as keyof T] as string | number | boolean | null | undefined);

      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortState.direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      return sortState.direction === "asc" ? leftText.localeCompare(rightText) : rightText.localeCompare(leftText);
    });

    return sorted;
  }, [columns, data, sortState]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [currentPage, sortedData, pageSize]);

  const showPagination = !loading && sortedData.length > pageSize;
  const showEmptyState = !loading && sortedData.length === 0;

  function toggleSort(column: TableColumn<T>) {
    if (!column.sortable) return;
    setCurrentPage(1);
    setSortState((current) => {
      const key = String(column.key);
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      return { key, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left">
            <thead className={cn("bg-[#F8FAFC]", stickyHeader && "sticky top-0 z-10")}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    scope="col"
                    className={cn(
                      "px-4 py-3 ui-table-header",
                      column.headerClassName
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left transition hover:text-[#0F172A]"
                        onClick={() => toggleSort(column)}
                      >
                        <span>{column.header}</span>
                        {sortState?.key === String(column.key) ? (
                          sortState.direction === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-60" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {loading
                ? Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                    <tr key={`skeleton-${rowIndex}`}>
                      {columns.map((column) => (
                        <td
                          key={`${String(column.key)}-${rowIndex}`}
                          className="px-4 py-3 align-middle"
                        >
                          <div className="h-4 w-full max-w-[10rem] animate-pulse rounded-full bg-slate-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : paginatedData.map((row, index) => (
                    <tr
                      key={resolveRowKey(row, index, rowKey)}
                      className="transition-colors duration-200 hover:bg-[#F8FAFC]"
                    >
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={cn("px-4 py-2.5 ui-body", column.className)}
                        >
                          {column.render
                            ? column.render(row)
                            : String(row[column.key as keyof T] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {showEmptyState ? (
          <div className="flex min-h-48 items-center justify-center px-4 py-8 text-center">
            <p className="ui-body-secondary">{emptyMessage}</p>
          </div>
        ) : null}
      </div>

      {showPagination ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="ui-body-secondary">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="min-w-20 text-center ui-body-secondary">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
