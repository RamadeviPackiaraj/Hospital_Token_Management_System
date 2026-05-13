"use client";

import * as React from "react";
import { formatDuration } from "@/lib/calls";

export function CallDuration({ startedAt }: { startedAt: number }) {
  const [duration, setDuration] = React.useState(() => formatDuration(Date.now() - startedAt));

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setDuration(formatDuration(Date.now() - startedAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [startedAt]);

  return <span>{duration}</span>;
}
