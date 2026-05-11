"use client";

import { Check, CheckCheck, Building2, Stethoscope } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { cn } from "@/lib/utils";
import { formatChatTime, type ChatMessage, type ChatSender } from "@/lib/chat";

interface MessageRowProps {
  message: ChatMessage;
  currentSender: ChatSender;
}

export function MessageRow({ message, currentSender }: MessageRowProps) {
  const { t } = useI18n();
  const isOutgoing = message.sender === currentSender;
  const senderLabel = isOutgoing
    ? currentSender === "doctor"
      ? "Doctor"
      : "Hospital"
    : currentSender === "doctor"
      ? "Hospital"
      : "Doctor";
  const deliveryState = message.isRead ? "Read" : "Delivered";

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[88%] sm:max-w-[76%]", isOutgoing ? "items-end" : "items-start")}>
        <div className={cn("mb-1 flex items-center gap-2 px-1", isOutgoing ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full border",
              isOutgoing
                ? "border-[#99F6E4] bg-[#CCFBF1] text-[#0F766E]"
                : "border-[#D8E2EC] bg-white text-[#64748B]"
            )}
          >
            {isOutgoing ? <Stethoscope className="size-3.5" /> : <Building2 className="size-3.5" />}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">{senderLabel}</p>
        </div>

        <div
          className={cn(
            "rounded-2xl border px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
            isOutgoing
              ? "rounded-tr-md border-[#A7F3D0] bg-[#F0FDFA]"
              : "rounded-tl-md border-[#E2E8F0] bg-white"
          )}
        >
          <p className="whitespace-pre-wrap break-words text-[14px] leading-6 text-[#0F172A]">{message.message}</p>

          <div
            className={cn(
              "mt-2 flex items-center gap-2 text-[11px] text-[#64748B]",
              isOutgoing ? "justify-end" : "justify-start"
            )}
          >
            <span>{formatChatTime(message.createdAt)}</span>
            {message.editedAt ? <span>Edited</span> : null}
            {isOutgoing ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                  message.isRead ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-[#ECFEFF] text-[#0F766E]"
                )}
              >
                {message.isRead ? <CheckCheck className="size-3.5" /> : <Check className="size-3.5" />}
                <span>{deliveryState}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
