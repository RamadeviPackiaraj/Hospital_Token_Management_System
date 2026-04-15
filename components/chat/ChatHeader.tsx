"use client";

import * as React from "react";
import { Search, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { ChatSocketStatus } from "@/lib/chat-realtime";

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  filter: "all" | "read" | "unread";
  onFilterChange: (value: "all" | "read" | "unread") => void;
  resultCount: number;
  unreadCount: number;
  socketStatus?: ChatSocketStatus;
  onClear?: () => void;
  clearDisabled?: boolean;
}

export function ChatHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  resultCount,
  unreadCount,
  socketStatus = "idle",
  onClear,
  clearDisabled = false,
}: ChatHeaderProps) {
  const filters: Array<"all" | "read" | "unread"> = ["all", "read", "unread"];
  const socketLabel =
    socketStatus === "connected"
      ? "Live"
      : socketStatus === "connecting"
        ? "Connecting"
        : socketStatus === "error"
          ? "Connection issue"
          : "Offline";
  const socketClasses =
    socketStatus === "connected"
      ? "border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E]"
      : socketStatus === "connecting"
        ? "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
        : "border-[#E2E8F0] bg-white text-[#64748B]";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] font-medium text-[#0F172A]">{title}</h2>
          <p className="text-[12px] text-[#64748B]">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`rounded-md border px-3 py-1 ${socketClasses}`}>
            <span className="text-[12px]">Status</span>
            <span className="ml-2 text-[14px] font-medium">{socketLabel}</span>
          </div>
          <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1">
            <span className="text-[12px] text-[#64748B]">Unread</span>
            <span className="ml-2 text-[14px] font-medium text-[#0F172A]">{unreadCount}</span>
          </div>
          <div className="rounded-md border border-[#E2E8F0] bg-white px-3 py-1">
            <span className="text-[12px] text-[#64748B]">Visible</span>
            <span className="ml-2 text-[14px] font-medium text-[#0F172A]">{resultCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search messages"
            className="min-h-10 pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onClear ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 px-3"
              onClick={onClear}
              disabled={clearDisabled}
              leftIcon={<Trash2 className="size-4" />}
            >
              Clear chat
            </Button>
          ) : null}
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-md border px-3 py-1 text-[12px] font-medium transition ${
                filter === item
                  ? "border-[#0EA5A4] bg-[#F0FDFA] text-[#0EA5A4]"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-gray-50"
              }`}
              onClick={() => onFilterChange(item)}
            >
              {item === "all" ? "All" : item === "read" ? "Read" : "Unread"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
