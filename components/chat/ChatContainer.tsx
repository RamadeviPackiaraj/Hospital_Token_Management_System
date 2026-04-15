"use client";

import * as React from "react";
import { Card } from "@/components/ui";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { QuickMessagePanel } from "@/components/chat/QuickMessagePanel";
import type { ChatMessage, ChatSender } from "@/lib/chat";
import type { ChatSocketStatus } from "@/lib/chat-realtime";

interface ChatContainerProps {
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  quickMessages: string[];
  currentSender: ChatSender;
  draft: string;
  onDraftChange: (value: string) => void;
  onSendManual: () => void;
  onSendQuick: (message: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filter: "all" | "read" | "unread";
  onFilterChange: (value: "all" | "read" | "unread") => void;
  onDelete: (messageId: string) => void;
  onSaveEdit: (messageId: string, value: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
  unreadCount: number;
  socketStatus?: ChatSocketStatus;
  onClear?: () => void;
  clearDisabled?: boolean;
}

export function ChatContainer({
  title,
  subtitle,
  messages,
  quickMessages,
  currentSender,
  draft,
  onDraftChange,
  onSendManual,
  onSendQuick,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onDelete,
  onSaveEdit,
  disabled = false,
  disabledMessage,
  unreadCount,
  socketStatus = "idle",
  onClear,
  clearDisabled = false,
}: ChatContainerProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <ChatHeader
          title={title}
          subtitle={subtitle}
          search={search}
          onSearchChange={onSearchChange}
          filter={filter}
          onFilterChange={onFilterChange}
          resultCount={messages.length}
          unreadCount={unreadCount}
          socketStatus={socketStatus}
          onClear={onClear}
          clearDisabled={clearDisabled}
        />

        <MessageList
          messages={messages}
          currentSender={currentSender}
          onDelete={onDelete}
          onSaveEdit={onSaveEdit}
        />

        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[16px] font-medium text-[#0F172A]">Quick Actions</p>
            <p className="text-[12px] text-[#64748B]">Tap to send instantly</p>
          </div>
          <QuickMessagePanel messages={quickMessages} onSend={onSendQuick} disabled={disabled} />
          {disabledMessage ? <p className="text-[12px] text-[#64748B]">{disabledMessage}</p> : null}
          <div className="mt-2">
            <ChatInput value={draft} onChange={onDraftChange} onSend={onSendManual} disabled={disabled} />
          </div>
        </div>
      </div>
    </Card>
  );
}
