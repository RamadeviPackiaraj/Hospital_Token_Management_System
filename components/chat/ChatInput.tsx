"use client";

import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { Button, Input } from "@/components/ui";
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
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={disabled ? t("chat.inputDisabledPlaceholder") : t("chat.inputPlaceholder")}
        disabled={disabled}
        className="min-h-10"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <Button size="sm" className="h-10 px-4" onClick={onSend} disabled={disabled || !value.trim()} rightIcon={<SendHorizonal className="size-4" />}>
        {t("chat.sendButton")}
      </Button>
    </div>
  );
}
