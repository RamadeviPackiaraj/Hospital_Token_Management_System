"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Drawer } from "@/components/overlay/Drawer";
import { cn } from "@/lib/utils";
import { getNavStyle, type NavColors, type NavItem, type NavTheme } from "./NavConfig";
import { Sidebar } from "./Sidebar";

export interface MobileDrawerProps {
  items: NavItem[];
  brand?: ReactNode;
  footer?: ReactNode;
  activePath: string;
  role?: string;
  title?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  className?: string;
  theme?: NavTheme;
  colors?: Partial<NavColors>;
  previewDesktop?: boolean;
}

export function MobileDrawer({
  items,
  brand,
  footer,
  activePath,
  role,
  title = "Navigation",
  open,
  defaultOpen = false,
  onOpenChange,
  triggerClassName,
  className,
  theme = "light",
  colors,
  previewDesktop = false
}: MobileDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = typeof open === "boolean";
  const drawerOpen = isControlled ? open : internalOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <div className={cn(!previewDesktop && "lg:hidden", className)} style={getNavStyle(theme, colors)}>
      <button
        type="button"
        className={cn(
          "focus-ring inline-flex size-11 items-center justify-center rounded-2xl border border-[var(--nav-border)] bg-[var(--nav-background)] text-[var(--nav-text)] shadow-sm backdrop-blur",
          triggerClassName
        )}
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>

      <Drawer open={drawerOpen} side="left" title={title} onClose={() => setOpen(false)}>
        <Sidebar
          items={items}
          brand={brand}
          footer={footer}
          activePath={activePath}
          role={role}
          theme={theme}
          colors={colors}
          tree
          className={cn("min-h-[calc(100vh-7rem)] w-full", !previewDesktop && "lg:hidden")}
        />
      </Drawer>
    </div>
  );
}
