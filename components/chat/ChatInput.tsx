"use client";

import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { useI18n } from "@/components/i18n";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled = false }: ChatInputProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-end gap-2">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={disabled ? t("chat.inputDisabledPlaceholder") : t("chat.inputPlaceholder")}
        disabled={disabled}
        rows={2}
        className="max-h-32 min-h-[60px] resize-none px-4 py-3"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <Button
        size="sm"
        className="h-[44px] px-4"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        rightIcon={<SendHorizonal className="size-4" />}
      >
        {t("chat.sendButton")}
      </Button>
    </div>
  );
}
