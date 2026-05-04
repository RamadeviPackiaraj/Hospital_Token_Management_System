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
  const { language } = useI18n();
  const copy = chatInputCopy[language];
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={disabled ? copy.disabledPlaceholder : copy.placeholder}
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
        {copy.send}
      </Button>
    </div>
  );
}

const chatInputCopy = {
  en: { placeholder: "Type a message", disabledPlaceholder: "Chat is available only for approved connections", send: "Send" },
  hi: { placeholder: "संदेश लिखें", disabledPlaceholder: "चैट केवल स्वीकृत कनेक्शन के लिए उपलब्ध है", send: "भेजें" },
  ml: { placeholder: "സന്ദേശം ടൈപ്പ് ചെയ്യുക", disabledPlaceholder: "അംഗീകരിച്ച കണക്ഷനുകൾക്കായി മാത്രമേ ചാറ്റ് ലഭ്യമാകൂ", send: "അയയ്ക്കുക" },
  ta: { placeholder: "செய்தியை தட்டச்சிடுங்கள்", disabledPlaceholder: "ஒப்புதல் பெற்ற இணைப்புகளுக்கு மட்டுமே அரட்டை கிடைக்கும்", send: "அனுப்பு" },
} as const;
