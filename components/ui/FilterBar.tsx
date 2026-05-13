"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  statusValue,
  onStatusChange,
  statusOptions,
  sortValue,
  onSortChange,
  sortOptions,
  dateValue,
  onDateChange,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: SelectOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SelectOption[];
  dateValue?: string;
  onDateChange?: (value: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {typeof onSearchChange === "function" ? (
          <label className="grid gap-2 xl:col-span-2">
            <span className="ui-field-label">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
              <Input
                value={searchValue || ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10"
              />
            </div>
          </label>
        ) : null}

        {statusOptions && typeof onStatusChange === "function" ? (
          <label className="grid gap-2">
            <span className="ui-field-label">Status</span>
            <Select value={statusValue} onChange={(event) => onStatusChange(event.target.value)} options={statusOptions} />
          </label>
        ) : null}

        {sortOptions && typeof onSortChange === "function" ? (
          <label className="grid gap-2">
            <span className="ui-field-label">Sort</span>
            <Select value={sortValue} onChange={(event) => onSortChange(event.target.value)} options={sortOptions} />
          </label>
        ) : null}

        {typeof onDateChange === "function" ? (
          <label className="grid gap-2">
            <span className="ui-field-label">Date</span>
            <Input type="date" value={dateValue || ""} onChange={(event) => onDateChange(event.target.value)} />
          </label>
        ) : null}
      </div>
    </Card>
  );
}
