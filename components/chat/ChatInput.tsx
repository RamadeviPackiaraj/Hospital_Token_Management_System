"use client";

import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled = false }: ChatInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={disabled ? "Chat is available only for approved hospitals" : "Type a message"}
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
        Send
      </Button>
    </div>
  );
}
