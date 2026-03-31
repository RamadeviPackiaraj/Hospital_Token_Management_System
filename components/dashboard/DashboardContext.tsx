"use client";

import * as React from "react";
import type { MockSession, MockUser } from "@/lib/auth-flow";

export interface DashboardContextValue {
  session: MockSession;
  currentUser: MockUser;
  refreshSession: () => Promise<void>;
  signOut: () => void;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children
}: {
  value: DashboardContextValue;
  children: React.ReactNode;
}) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = React.useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardProvider.");
  }

  return context;
}
