"use client";

import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavStyle, type NavColors, type NavItem, type NavTheme } from "./NavConfig";
import { MenuItem } from "./MenuItem";

export interface SidebarProps {
  items: NavItem[];
  brand?: ReactNode;
  footer?: ReactNode;
  activePath: string;
  role?: string;
  theme?: NavTheme;
  colors?: Partial<NavColors>;
  collapsed?: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
  iconOnly?: boolean;
  tree?: boolean;
  fixed?: boolean;
  responsive?: "always" | "desktop";
  className?: string;
  itemClassName?: string;
}

export function Sidebar({
  items,
  brand,
  footer,
  activePath,
  role,
  theme = "light",
  colors,
  collapsed = false,
  onToggle,
  collapsible = false,
  iconOnly = false,
  tree = false,
  fixed = false,
  responsive = "always",
  className,
  itemClassName
}: SidebarProps) {
  const compact = collapsed || iconOnly;

  return (
    <aside
      className={cn(
        "flex h-full min-h-[28rem] flex-col overflow-hidden rounded-[2rem] border border-[var(--nav-border)] bg-[var(--nav-background)] text-[var(--nav-text)] shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-[width] duration-300",
        compact ? "w-full lg:w-24" : "w-full lg:w-[min(20rem,24vw)]",
        responsive === "desktop" && "hidden lg:flex",
        fixed && "lg:sticky lg:top-6",
        className
      )}
      style={getNavStyle(theme, colors)}
    >
      <div className="flex items-center gap-3 border-b border-[var(--nav-border)] px-4 py-4">
        <div className={cn("min-w-0 flex-1", compact && "sr-only")}>{brand}</div>
        {collapsible ? (
          <button
            type="button"
            className="focus-ring inline-flex size-10 items-center justify-center rounded-2xl text-[var(--nav-muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--nav-text)]"
            onClick={onToggle}
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {compact ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar navigation">
        <div className="space-y-1.5">
          {items.map((item) => (
            <MenuItem
              key={`${item.label}-${item.path ?? "group"}`}
              item={item}
              activePath={activePath}
              role={role}
              orientation="vertical"
              dropdownMode={tree ? "tree" : item.featured ? "mega" : "menu"}
              collapsed={compact}
              iconOnly={iconOnly}
              className={itemClassName}
            />
          ))}
        </div>
      </nav>

      {footer ? (
        <div className="border-t border-[var(--nav-border)] px-4 py-4">
          <div className={cn(compact && "sr-only")}>{footer}</div>
        </div>
      ) : null}
    </aside>
  );
}
