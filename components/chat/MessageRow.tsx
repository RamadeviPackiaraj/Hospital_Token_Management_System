"use client";

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, Mail, MailOpen, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useI18n } from "@/components/i18n";
import { cn } from "@/lib/utils";
import { formatChatTime, type ChatMessage, type ChatSender } from "@/lib/chat";

interface MessageRowProps {
  message: ChatMessage;
  canEdit: boolean;
  currentSender: ChatSender;
  onDelete: (messageId: string) => void;
  onSaveEdit: (messageId: string, value: string) => void;
}

export function MessageRow({
  message,
  canEdit,
  currentSender,
  onDelete,
  onSaveEdit,
}: MessageRowProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(message.message);
  const isOutgoing = message.sender === currentSender;

  React.useEffect(() => {
    setDraft(message.message);
  }, [message.message]);

  return (
    <div
      className={cn(
        "rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[14px]",
        isOutgoing ? "bg-[#F0FDFA]" : "bg-white",
        message.isRead ? "border-l-4 border-l-green-500" : "border-l-4 border-l-orange-400"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md border",
            isOutgoing
              ? "border-[#99F6E4] bg-[#CCFBF1] text-[#0EA5A4]"
              : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
          )}
        >
          {isOutgoing ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
        </div>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (!draft.trim()) return;
                    onSaveEdit(message.id, draft.trim());
                    setIsEditing(false);
                  }
                  if (event.key === "Escape") {
                    setDraft(message.message);
                    setIsEditing(false);
                  }
                }}
              />
              <Button
                size="sm"
                className="h-9 px-3"
                onClick={() => {
                  if (!draft.trim()) return;
                  onSaveEdit(message.id, draft.trim());
                  setIsEditing(false);
                }}
                disabled={!draft.trim()}
              >
                {t("chat.messageSave")}
              </Button>
            </div>
          ) : (
            <p className="truncate text-[14px] font-medium leading-5 text-[#0F172A]">{message.message}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-[12px] text-[#64748B]">{formatChatTime(message.createdAt)}</div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-md p-1 transition",
                message.isRead
                  ? "text-green-500 bg-[#F0FDF4]"
                  : "text-orange-400 bg-[#FFF7ED]"
              )}
              aria-label={message.isRead ? t("chat.messageSeen") : t("chat.messageWaiting")}
              title={message.isRead ? t("chat.messageSeen") : t("chat.messageWaiting")}
            >
              {message.isRead ? <MailOpen className="size-4" /> : <Mail className="size-4" />}
            </span>
            {canEdit ? (
              <button
                type="button"
                className="rounded-md p-1 text-[#0EA5A4] transition hover:bg-[#F0FDFA] hover:text-[#0B8B8B]"
                onClick={() => setIsEditing((current) => !current)}
                aria-label={t("chat.messageEdit")}
              >
                <Pencil className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-md p-1 text-[#EF4444] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              onClick={() => onDelete(message.id)}
              aria-label={t("chat.messageDelete")}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
