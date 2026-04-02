"use client";

import { logger } from "@/lib/logger";
import { useLogStore } from "@/store/logStore";

export function useLogger() {
  const logs = useLogStore((state) => state.logs);
  const clearLogs = useLogStore((state) => state.clearLogs);
  const isOpen = useLogStore((state) => state.isOpen);
  const toggleOpen = useLogStore((state) => state.toggleOpen);
  const setOpen = useLogStore((state) => state.setOpen);
  const filter = useLogStore((state) => state.filter);
  const setFilter = useLogStore((state) => state.setFilter);

  return {
    logs,
    isOpen,
    filter,
    clearLogs,
    toggleOpen,
    setOpen,
    setFilter,
    info: logger.info,
    success: logger.success,
    warn: logger.warn,
    error: logger.error,
  };
}
