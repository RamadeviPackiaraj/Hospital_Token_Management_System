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
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800"
};

export function Toast({
  message,
  type = "success",
  open,
  onClose,
  autoHideDuration = 3000
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
        className={cn(
          "rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-panel",
          toneMap[type]
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium">{message}</p>
          <button
            type="button"
            className="focus-ring rounded-md px-1 text-sm"
            onClick={onClose}
            aria-label="Close toast"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
