"use client";

import * as React from "react";
import { MessageRow } from "@/components/chat/MessageRow";
import { formatChatDateLabel, type ChatMessage, type ChatSender } from "@/lib/chat";

interface MessageListProps {
  messages: ChatMessage[];
  currentSender: ChatSender;
  onDelete: (messageId: string) => void;
  onSaveEdit: (messageId: string, value: string) => void;
}

export function MessageList({
  messages,
  currentSender,
  onDelete,
  onSaveEdit,
}: MessageListProps) {
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  let lastDateLabel = "";

  return (
    <div className="flex max-h-[440px] flex-col overflow-y-auto rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
      {messages.length ? (
        messages.map((message) => {
          const dateLabel = formatChatDateLabel(message.createdAt);
          const showDateLabel = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          return (
            <div key={message.id} className="mb-2 last:mb-0">
              {showDateLabel ? (
                <div className="mb-1 px-1">
                  <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#64748B]">{dateLabel}</p>
                </div>
              ) : null}
              <MessageRow
                message={message}
                canEdit={message.sender === currentSender}
                currentSender={currentSender}
                onDelete={onDelete}
                onSaveEdit={onSaveEdit}
              />
            </div>
          );
        })
      ) : (
        <div className="flex min-h-[180px] items-center justify-center text-center">
          <p className="ui-body-secondary">Start the conversation using a quick message or manual message.</p>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
