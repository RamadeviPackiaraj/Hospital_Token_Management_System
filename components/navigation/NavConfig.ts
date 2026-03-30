"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

export type NavLayoutType = "top" | "sidebar" | "combo" | "bottom";
export type NavTheme = "light" | "dark";
export type NavbarVariant =
  | "horizontal"
  | "vertical"
  | "collapsible"
  | "icon-only"
  | "dropdown"
  | "tree"
  | "mobile"
  | "sticky"
  | "floating"
  | "tabs"
  | "mega"
  | "role-based"
  | "bottom";

export interface NavColors {
  primary: string;
  background: string;
  hover: string;
  text: string;
  border: string;
  muted: string;
  accent: string;
}

export interface NavItem {
  label: string;
  path?: string;
  icon?: LucideIcon;
  iconTone?:
    | "sky"
    | "blue"
    | "violet"
    | "fuchsia"
    | "emerald"
    | "teal"
    | "amber"
    | "rose"
    | "indigo"
    | "lime";
  badge?: string;
  description?: string;
  disabled?: boolean;
  external?: boolean;
  exact?: boolean;
  featured?: boolean;
  children?: NavItem[];
  roles?: string[];
}

const lightColors: NavColors = {
  primary: "#0f172a",
  background: "rgba(255, 255, 255, 0.92)",
  hover: "rgba(15, 23, 42, 0.08)",
  text: "#0f172a",
  border: "rgba(148, 163, 184, 0.3)",
  muted: "#475569",
  accent: "rgba(219, 234, 254, 0.95)"
};

const darkColors: NavColors = {
  primary: "#f8fafc",
  background: "rgba(15, 23, 42, 0.92)",
  hover: "rgba(148, 163, 184, 0.12)",
  text: "#e2e8f0",
  border: "rgba(148, 163, 184, 0.24)",
  muted: "#94a3b8",
  accent: "rgba(30, 41, 59, 0.96)"
};

export function resolveNavColors(
  theme: NavTheme = "light",
  colors?: Partial<NavColors>
): NavColors {
  return {
    ...(theme === "dark" ? darkColors : lightColors),
    ...colors
  };
}

export function getNavStyle(
  theme: NavTheme = "light",
  colors?: Partial<NavColors>
): React.CSSProperties {
  const resolved = resolveNavColors(theme, colors);

  return {
    ["--nav-primary" as string]: resolved.primary,
    ["--nav-background" as string]: resolved.background,
    ["--nav-hover" as string]: resolved.hover,
    ["--nav-text" as string]: resolved.text,
    ["--nav-border" as string]: resolved.border,
    ["--nav-muted" as string]: resolved.muted,
    ["--nav-accent" as string]: resolved.accent
  } as React.CSSProperties;
}

export function filterNavItems(items: NavItem[], role?: string): NavItem[] {
  return items.reduce<NavItem[]>((accumulator, item) => {
    const allowed = !item.roles?.length || !role || item.roles.includes(role);

    if (!allowed) {
      return accumulator;
    }

    const children = item.children ? filterNavItems(item.children, role) : undefined;
    accumulator.push({
      ...item,
      children
    });
    return accumulator;
  }, []);
}

export function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.path) {
    if (item.exact) {
      return pathname === item.path;
    }

    if (item.path !== "/" && pathname.startsWith(item.path)) {
      return true;
    }

    if (pathname === item.path) {
      return true;
    }
  }

  return item.children?.some((child) => isItemActive(child, pathname)) ?? false;
}
