"use client";

import { create } from "zustand";

export type LogLevel = "info" | "success" | "warn" | "error";

export interface LogEntry {
  id: string;
  type: LogLevel;
  message: string;
  timestamp: string;
  source?: string;
  data?: unknown;
}

interface LogStoreState {
  logs: LogEntry[];
  isOpen: boolean;
  filter: LogLevel | "all";
  addLog: (entry: Omit<LogEntry, "id" | "timestamp"> & { timestamp?: string }) => void;
  clearLogs: () => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setFilter: (filter: LogLevel | "all") => void;
}

const MAX_LOGS = 50;

export const useLogStore = create<LogStoreState>((set) => ({
  logs: [],
  isOpen: false,
  filter: "all",
  addLog: (entry) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: entry.timestamp || new Date().toISOString(),
          ...entry,
        },
      ].slice(-MAX_LOGS),
    })),
  clearLogs: () => set({ logs: [] }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setFilter: (filter) => set({ filter }),
}));
