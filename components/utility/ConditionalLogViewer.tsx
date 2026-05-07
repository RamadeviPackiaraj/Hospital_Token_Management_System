"use client";

import { LogViewer } from "@/components/ui";

type ConditionalLogViewerProps = {
  enabled: boolean;
};

export function ConditionalLogViewer({ enabled }: ConditionalLogViewerProps) {
  // Enable local frontend logs by setting `VITE_ENABLE_LOGS=true` in your env.
  // Leave it unset or set to `false` to keep the production UI free of the debug panel.
  if (!enabled) {
    return null;
  }

  return <LogViewer />;
}
