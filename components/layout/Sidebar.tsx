"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  children?: SidebarItem[];
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
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const nextOpenGroups = Object.fromEntries(
      items.filter((item) => item.children?.length).map((item) => [item.href, Boolean(item.active)])
    );
    setOpenGroups(nextOpenGroups);
  }, [items]);

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
          <div key={item.href} className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={item.href}
                className={cn(
                  "focus-ring flex min-h-11 flex-1 items-center gap-3 rounded-xl border-r-2 px-3 py-3 text-sm font-medium transition-all duration-200",
                  item.active
                    ? "border-[#BEEFEB] border-r-[#0EA5A4] bg-[#F0FDFA] text-[#0EA5A4]"
                    : "border-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                )}
              >
                <span aria-hidden="true" className="shrink-0">{item.icon}</span>
                <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
              </Link>

              {item.children?.length && !collapsed ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 min-h-10 px-2 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  aria-label={openGroups[item.href] ? `Collapse ${item.label}` : `Expand ${item.label}`}
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [item.href]: !current[item.href]
                    }))
                  }
                  leftIcon={
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        openGroups[item.href] ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  }
                />
              ) : null}
            </div>

            {item.children?.length && !collapsed && openGroups[item.href] ? (
              <div className="ml-5 border-l border-[#E2E8F0] pl-3">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "focus-ring mt-1 flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      child.active
                        ? "bg-[#F0FDFA] font-medium text-[#0EA5A4]"
                        : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    )}
                  >
                    {child.icon ? <span aria-hidden="true" className="shrink-0">{child.icon}</span> : null}
                    <span className="truncate">{child.label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
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
