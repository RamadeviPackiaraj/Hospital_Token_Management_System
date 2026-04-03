"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  type?: "success" | "error";
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const toneMap = {
  success: "text-[#0F172A]",
  error: "text-[#0F172A]",
};

export function Toast({
  message,
  type = "success",
  open,
  onClose,
  autoHideDuration = 3000,
}: ToastProps) {
  React.useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(onClose, autoHideDuration);
    return () => window.clearTimeout(timeoutId);
  }, [autoHideDuration, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div
        role="status"
        aria-live="polite"
        className={cn("ui-card px-4 py-3", toneMap[type])}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="ui-body">{message}</p>
          <button
            type="button"
            className="focus-ring rounded-md px-1 text-sm text-[#64748B]"
            onClick={onClose}
            aria-label="Close toast"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
