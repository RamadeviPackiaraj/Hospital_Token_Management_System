"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  filterNavItems,
  getNavStyle,
  type NavColors,
  type NavItem,
  type NavLayoutType,
  type NavbarVariant,
  type NavTheme
} from "./NavConfig";
import { MenuItem } from "./MenuItem";
import { MobileDrawer } from "./MobileDrawer";
import { Sidebar } from "./Sidebar";

export interface NavbarProps {
  items: NavItem[];
  brand?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  role?: string;
  layout?: NavLayoutType;
  variant?: NavbarVariant;
  theme?: NavTheme;
  colors?: Partial<NavColors>;
  activePath?: string;
  className?: string;
  navbarClassName?: string;
  sidebarClassName?: string;
  defaultCollapsed?: boolean;
}

function TopBar({
  items,
  brand,
  actions,
  activePath,
  role,
  variant,
  footer,
  theme,
  colors,
  navbarClassName
}: {
  items: NavItem[];
  brand?: ReactNode;
  actions?: ReactNode;
  activePath: string;
  role?: string;
  variant: NavbarVariant;
  footer?: ReactNode;
  theme: NavTheme;
  colors?: Partial<NavColors>;
  navbarClassName?: string;
}) {
  const filteredItems = React.useMemo(() => filterNavItems(items, role), [items, role]);
  const floating = variant === "floating";
  const sticky = variant === "sticky";
  const tabs = variant === "tabs";

  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border border-white/60 bg-white/70 text-[var(--nav-text)] shadow-md shadow-slate-200/60 backdrop-blur-lg supports-[backdrop-filter]:bg-white/65",
        sticky && "sticky top-4 z-40",
        floating && "mx-auto max-w-6xl",
        navbarClassName
      )}
      style={getNavStyle(theme, colors)}
    >
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <div className="min-w-0 shrink-0 lg:max-w-[13rem] xl:max-w-none">{brand}</div>
        {!tabs ? (
          <div className="hidden min-w-0 flex-1 overflow-x-auto lg:flex lg:items-center lg:gap-2 lg:whitespace-nowrap">
            {filteredItems.map((item) => (
              <MenuItem
                key={`${item.label}-${item.path ?? "group"}`}
                item={item}
                activePath={activePath}
                role={role}
                orientation="horizontal"
                dropdownMode={variant === "mega" || item.featured ? "mega" : "menu"}
              />
            ))}
          </div>
        ) : (
          <div className="hidden min-w-0 flex-1 lg:block" />
        )}
        <div className="hidden items-center gap-2 xl:flex">
          {actions ?? (
            <>
              <button
                type="button"
                className="focus-ring inline-flex size-10 items-center justify-center rounded-full bg-white/70 text-[var(--nav-muted)] transition-all duration-300 ease-in-out hover:scale-105 hover:bg-slate-100 hover:text-[var(--nav-text)]"
                aria-label="Search"
              >
                <Search className="size-4" />
              </button>
              <button
                type="button"
                className="focus-ring inline-flex size-10 items-center justify-center rounded-full bg-white/70 text-[var(--nav-muted)] transition-all duration-300 ease-in-out hover:scale-105 hover:bg-slate-100 hover:text-[var(--nav-text)]"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </button>
            </>
          )}
        </div>
        <MobileDrawer
          items={filteredItems}
          brand={brand}
          footer={footer}
          activePath={activePath}
          role={role}
          theme={theme}
          colors={colors}
          title="Navigation menu"
        />
      </div>

      {tabs ? (
        <div className="overflow-x-auto border-t border-white/60 px-6 pt-3">
          <div className="flex min-w-max items-center gap-6">
            {filteredItems.map((item) => (
              <MenuItem
                key={`tab-${item.label}-${item.path ?? "group"}`}
                item={item}
                activePath={activePath}
                role={role}
                orientation="tabs"
                dropdownMode="menu"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Navbar({
  items,
  brand,
  actions,
  footer,
  role,
  layout = "top",
  variant = "horizontal",
  theme = "light",
  colors,
  activePath,
  className,
  navbarClassName,
  sidebarClassName,
  defaultCollapsed = false
}: NavbarProps) {
  const pathname = usePathname();
  const resolvedActivePath = activePath ?? pathname;
  const filteredItems = React.useMemo(() => filterNavItems(items, role), [items, role]);
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed || variant === "icon-only");

  if (layout === "sidebar") {
    return (
      <div className={className} style={getNavStyle(theme, colors)}>
        <div className="flex items-center justify-between rounded-[2rem] border border-[var(--nav-border)] bg-[var(--nav-background)] px-4 py-4 text-[var(--nav-text)] shadow-sm lg:hidden">
          <div className="min-w-0 flex-1">{brand}</div>
          <MobileDrawer
            items={filteredItems}
            brand={brand}
            footer={footer}
            activePath={resolvedActivePath}
            role={role}
            theme={theme}
            colors={colors}
          />
        </div>
        <Sidebar
          items={filteredItems}
          brand={brand}
          footer={footer}
          activePath={resolvedActivePath}
          role={role}
          theme={theme}
          colors={colors}
          collapsible={variant === "collapsible" || variant === "icon-only"}
          collapsed={collapsed}
          iconOnly={variant === "icon-only"}
          tree={variant === "tree" || variant === "vertical"}
          onToggle={() => setCollapsed((current) => !current)}
          className={sidebarClassName}
        />
      </div>
    );
  }

  if (layout === "combo") {
    return (
      <div className={cn("space-y-4", className)} style={getNavStyle(theme, colors)}>
        <TopBar
          items={filteredItems}
          brand={brand}
          actions={actions}
          activePath={resolvedActivePath}
          role={role}
          variant={variant === "sticky" || variant === "floating" ? variant : "horizontal"}
          footer={footer}
          theme={theme}
          colors={colors}
          navbarClassName={navbarClassName}
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <Sidebar
            items={filteredItems}
            brand={brand}
            footer={footer}
            activePath={resolvedActivePath}
            role={role}
            theme={theme}
            colors={colors}
            collapsible
            collapsed={collapsed}
            tree
            onToggle={() => setCollapsed((current) => !current)}
            responsive="desktop"
            className={sidebarClassName}
          />
          <div className="rounded-[2rem] border border-dashed border-[var(--nav-border)] bg-white/50 p-6 text-sm text-[var(--nav-muted)]">
            Pair this shell with dashboard content, widgets, charts, or tables. On mobile the
            sidebar flows into the drawer trigger in the top bar.
          </div>
        </div>
      </div>
    );
  }

  if (layout === "bottom" || variant === "bottom") {
    return (
      <div className={className} style={getNavStyle(theme, colors)}>
        <nav
          aria-label="Bottom navigation"
          className="fixed inset-x-4 bottom-4 z-40 rounded-[2rem] border border-[var(--nav-border)] bg-[var(--nav-background)] px-2 py-2 text-[var(--nav-text)] shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl md:inset-x-auto md:left-1/2 md:w-[min(34rem,calc(100vw-2rem))] md:-translate-x-1/2"
        >
          <div className="flex items-center justify-between gap-1">
            {filteredItems.slice(0, 5).map((item) => (
              <MenuItem
                key={`bottom-${item.label}`}
                item={item}
                activePath={resolvedActivePath}
                role={role}
                orientation="bottom"
              />
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className={className}>
      <TopBar
        items={filteredItems}
        brand={brand}
        actions={actions}
        activePath={resolvedActivePath}
        role={role}
        variant={variant}
        footer={footer}
        theme={theme}
        colors={colors}
        navbarClassName={navbarClassName}
      />
    </div>
  );
}
