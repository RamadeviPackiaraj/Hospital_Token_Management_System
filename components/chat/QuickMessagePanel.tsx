"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface QuickMessagePanelProps {
  messages: string[];
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function QuickMessagePanel({ messages, onSend, disabled = false }: QuickMessagePanelProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {messages.map((message) => (
        <button
          key={message}
          type="button"
          className={cn(
            "rounded-md border border-[#E2E8F0] bg-white px-3 py-1 text-[12px] font-medium text-[#0F172A] transition hover:border-[#0EA5A4] hover:bg-gray-50",
            disabled && "cursor-not-allowed opacity-60"
          )}
          onClick={() => onSend(message)}
          disabled={disabled}
        >
          {message}
        </button>
      ))}
    </div>
  );
}
