"use client";

import * as React from "react";
import { MessageRow } from "@/components/chat/MessageRow";
import { useI18n } from "@/components/i18n";
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
  const { language } = useI18n();
  const copy = messageListCopy[language];
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
          const localizedDateLabel = dateLabel === "Today" ? copy.today : dateLabel;
          const showDateLabel = localizedDateLabel !== lastDateLabel;
          lastDateLabel = localizedDateLabel;

          return (
            <div key={message.id} className="mb-2 last:mb-0">
              {showDateLabel ? (
                <div className="mb-1 px-1">
                  <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#64748B]">{localizedDateLabel}</p>
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
          <p className="ui-body-secondary">{copy.empty}</p>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}

const messageListCopy = {
  en: { today: "Today", empty: "Start the conversation using a quick message or manual message." },
  hi: { today: "आज", empty: "त्वरित संदेश या मैनुअल संदेश से वार्तालाप शुरू करें।" },
  ml: { today: "ഇന്ന്", empty: "വേഗത്തിലുള്ള സന്ദേശമോ മാനുവൽ സന്ദേശമോ ഉപയോഗിച്ച് സംഭാഷണം ആരംഭിക്കുക." },
  ta: { today: "இன்று", empty: "விரைவு செய்தி அல்லது கைமுறை செய்தியால் உரையாடலை தொடங்குங்கள்." },
} as const;
