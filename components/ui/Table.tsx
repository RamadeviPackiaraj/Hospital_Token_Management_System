"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  rowKey?: keyof T | ((row: T, index: number) => React.Key);
  className?: string;
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
  className
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [currentPage, data, pageSize]);

  const showPagination = !loading && data.length > pageSize;
  const showEmptyState = !loading && data.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left">
            <thead className="bg-[#F8FAFC]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-[#64748B]",
                      column.headerClassName
                    )}
                  >
                    {column.header}
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
                      className="transition-colors duration-200 hover:bg-[#F9FAFB]"
                    >
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={cn("px-4 py-3 text-sm text-[#0F172A]", column.className)}
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
            <p className="text-sm font-medium text-[#64748B]">{emptyMessage}</p>
          </div>
        ) : null}
      </div>

      {showPagination ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#64748B]">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, data.length)} of {data.length}
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
            <span className="min-w-20 text-center text-sm font-medium text-[#64748B]">
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
