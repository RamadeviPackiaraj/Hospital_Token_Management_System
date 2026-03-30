"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export interface SidebarProps {
  brand: React.ReactNode;
  items: SidebarItem[];
  footer?: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarPanel({
  brand,
  items,
  footer,
  collapsed,
  onToggle
}: Omit<SidebarProps, "mobileOpen" | "onMobileClose">) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-[#E2E8F0] bg-white",
        collapsed ? "w-[88px]" : "w-full max-w-xs"
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-4">
        <div className={cn("min-w-0", collapsed && "sr-only")}>{brand}</div>
        <Button
          variant="ghost"
          className="h-10 min-h-10 px-3"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
          leftIcon={collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        />
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3" aria-label="Sidebar navigation">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "focus-ring flex min-h-11 items-center gap-3 rounded-xl border-r-2 px-3 py-3 text-sm font-medium transition-all duration-200",
              item.active
                ? "border-[#BEEFEB] border-r-[#0EA5A4] bg-[#F0FDFA] text-[#0EA5A4]"
                : "border-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            )}
          >
            <span aria-hidden="true" className="shrink-0">{item.icon}</span>
            <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
          </a>
        ))}
      </nav>

      {footer ? <div className="border-t border-[#E2E8F0] p-4">{footer}</div> : null}
    </aside>
  );
}

export function Sidebar({
  brand,
  items,
  footer,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose
}: SidebarProps) {
  return (
    <>
      <div className="hidden h-screen lg:block lg:w-auto">
        <SidebarPanel
          brand={brand}
          items={items}
          footer={footer}
          collapsed={collapsed}
          onToggle={onToggle}
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm">
            <SidebarPanel
              brand={brand}
              items={items}
              footer={footer}
              collapsed={false}
              onToggle={onMobileClose}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
