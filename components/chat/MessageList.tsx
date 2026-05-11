"use client";

import * as React from "react";
import { MessageRow } from "@/components/chat/MessageRow";
import { useI18n } from "@/components/i18n";
import { formatChatDateLabel, type ChatMessage, type ChatSender } from "@/lib/chat";

interface MessageListProps {
  messages: ChatMessage[];
  currentSender: ChatSender;
}

export function MessageList({ messages, currentSender }: MessageListProps) {
  const { language } = useI18n();
  const copy = messageListCopy[language];
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const previousMessageIdRef = React.useRef<string | null>(null);
  const previousConversationIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const latestMessage = messages[messages.length - 1];
    const currentConversationId = latestMessage?.conversationId ?? null;
    const previousConversationId = previousConversationIdRef.current;
    const previousMessageId = previousMessageIdRef.current;
    const hasConversationChanged = previousConversationId !== currentConversationId;
    const hasNewLatestMessage = previousMessageId !== latestMessage?.id;

    if (!scrollContainer || !latestMessage) {
      previousConversationIdRef.current = currentConversationId;
      previousMessageIdRef.current = latestMessage?.id ?? null;
      return;
    }

    const distanceFromBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
    const isNearBottom = distanceFromBottom < 80;

    if (hasConversationChanged || (hasNewLatestMessage && isNearBottom)) {
      endRef.current?.scrollIntoView({
        behavior: hasConversationChanged ? "auto" : "smooth",
        block: "end",
      });
    }

    previousConversationIdRef.current = currentConversationId;
    previousMessageIdRef.current = latestMessage.id;
  }, [messages]);

  let lastDateLabel = "";

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
      <div ref={scrollContainerRef} className="flex h-full min-h-[360px] flex-col overflow-y-auto px-4 py-4">
      {messages.length ? (
        messages.map((message) => {
          const dateLabel = formatChatDateLabel(message.createdAt);
          const localizedDateLabel = dateLabel === "Today" ? copy.today : dateLabel;
          const showDateLabel = localizedDateLabel !== lastDateLabel;
          lastDateLabel = localizedDateLabel;

          return (
            <div key={message.id} className="mb-2 last:mb-0">
              {showDateLabel ? (
                <div className="mb-3 mt-1 flex items-center gap-3 px-1">
                  <div className="h-px flex-1 bg-[#D7E3ED]" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    {localizedDateLabel}
                  </p>
                  <div className="h-px flex-1 bg-[#D7E3ED]" />
                </div>
              ) : null}
              <MessageRow
                message={message}
                currentSender={currentSender}
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
    </div>
  );
}

const messageListCopy = {
  en: { today: "Today", empty: "Start the conversation using a quick message or manual message." },
  hi: { today: "आज", empty: "त्वरित संदेश या मैनुअल संदेश से वार्तालाप शुरू करें।" },
  ml: { today: "ഇന്ന്", empty: "വേഗത്തിലുള്ള സന്ദേശമോ മാനുവൽ സന്ദേശമോ ഉപയോഗിച്ച് സംഭാഷണം ആരംഭിക്കുക." },
  ta: { today: "இன்று", empty: "விரைவு செய்தி அல்லது கைமுறை செய்தியால் உரையாடலை தொடங்குங்கள்." },
} as const;
