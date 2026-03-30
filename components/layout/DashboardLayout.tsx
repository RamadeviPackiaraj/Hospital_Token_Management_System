"use client";

import * as React from "react";
import { Header, HeaderProps } from "@/components/layout/Header";
import { Sidebar, SidebarProps } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { useToggle } from "@/components/hooks/useToggle";

export interface DashboardLayoutProps {
  sidebar: Omit<SidebarProps, "mobileOpen" | "onMobileClose">;
  header: HeaderProps;
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  sidebar,
  header,
  children,
  className
}: DashboardLayoutProps) {
  const [collapsed, toggleCollapsed] = useToggle(false);
  const [mobileOpen, toggleMobileOpen] = useToggle(false);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        {...sidebar}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={toggleMobileOpen}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header {...header} onMenuClick={toggleMobileOpen} />
        <main
          className={cn(
            "flex-1 bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8",
            className
          )}
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
