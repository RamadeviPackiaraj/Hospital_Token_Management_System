"use client";

import * as React from "react";
import { Search, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useI18n } from "@/components/i18n";
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
  const { language } = useI18n();
  const copy = chatHeaderCopy[language];
  const filters: Array<"all" | "read" | "unread"> = ["all", "read", "unread"];
  const socketLabel =
    socketStatus === "connected"
      ? copy.live
      : socketStatus === "connecting"
        ? copy.connecting
        : socketStatus === "error"
          ? copy.connectionIssue
          : copy.offline;
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
            <span className="text-[12px]">{copy.status}</span>
            <span className="ml-2 text-[14px] font-medium">{socketLabel}</span>
          </div>
          <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1">
            <span className="text-[12px] text-[#64748B]">{copy.unread}</span>
            <span className="ml-2 text-[14px] font-medium text-[#0F172A]">{unreadCount}</span>
          </div>
          <div className="rounded-md border border-[#E2E8F0] bg-white px-3 py-1">
            <span className="text-[12px] text-[#64748B]">{copy.visible}</span>
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
            placeholder={copy.searchMessages}
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
              {copy.clearChat}
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
              {item === "all" ? copy.all : item === "read" ? copy.read : copy.unreadFilter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const chatHeaderCopy = {
  en: {
    status: "Status",
    unread: "Unread",
    visible: "Visible",
    searchMessages: "Search messages",
    clearChat: "Clear chat",
    all: "All",
    read: "Read",
    unreadFilter: "Unread",
    live: "Live",
    connecting: "Connecting",
    connectionIssue: "Connection issue",
    offline: "Offline",
  },
  hi: {
    status: "स्थिति",
    unread: "अपठित",
    visible: "दिख रहे",
    searchMessages: "संदेश खोजें",
    clearChat: "चैट साफ़ करें",
    all: "सभी",
    read: "पढ़े गए",
    unreadFilter: "अपठित",
    live: "लाइव",
    connecting: "कनेक्ट हो रहा है",
    connectionIssue: "कनेक्शन समस्या",
    offline: "ऑफ़लाइन",
  },
  ml: {
    status: "സ്ഥിതി",
    unread: "വായിക്കാത്തത്",
    visible: "കാണുന്നത്",
    searchMessages: "സന്ദേശങ്ങൾ തിരയുക",
    clearChat: "ചാറ്റ് മായ്ക്കുക",
    all: "എല്ലാം",
    read: "വായിച്ചത്",
    unreadFilter: "വായിക്കാത്തത്",
    live: "ലൈവ്",
    connecting: "കണക്റ്റ് ചെയ്യുന്നു",
    connectionIssue: "കണക്ഷൻ പ്രശ്നം",
    offline: "ഓഫ്‌ലൈൻ",
  },
  ta: {
    status: "நிலை",
    unread: "படிக்காதவை",
    visible: "தெரியும்",
    searchMessages: "செய்திகளைத் தேடு",
    clearChat: "அரட்டையை அழி",
    all: "அனைத்தும்",
    read: "படித்தவை",
    unreadFilter: "படிக்காதவை",
    live: "நேரலை",
    connecting: "இணைக்கப்படுகிறது",
    connectionIssue: "இணைப்பு சிக்கல்",
    offline: "ஆஃப்லைன்",
  },
} as const;
