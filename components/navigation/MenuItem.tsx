"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Tooltip } from "@/components/overlay/Tooltip";
import { cn } from "@/lib/utils";
import { DropdownMenu } from "./DropdownMenu";
import { filterNavItems, isItemActive, type NavItem } from "./NavConfig";

function getIconToneClasses(tone?: NavItem["iconTone"]) {
  switch (tone) {
    case "sky":
      return "bg-sky-100 text-sky-700 group-hover:bg-sky-200";
    case "blue":
      return "bg-blue-100 text-blue-700 group-hover:bg-blue-200";
    case "violet":
      return "bg-violet-100 text-violet-700 group-hover:bg-violet-200";
    case "fuchsia":
      return "bg-fuchsia-100 text-fuchsia-700 group-hover:bg-fuchsia-200";
    case "emerald":
      return "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200";
    case "teal":
      return "bg-teal-100 text-teal-700 group-hover:bg-teal-200";
    case "amber":
      return "bg-amber-100 text-amber-700 group-hover:bg-amber-200";
    case "rose":
      return "bg-rose-100 text-rose-700 group-hover:bg-rose-200";
    case "indigo":
      return "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200";
    case "lime":
      return "bg-lime-100 text-lime-700 group-hover:bg-lime-200";
    default:
      return "bg-slate-100 text-slate-700 group-hover:bg-slate-200";
  }
}

export interface MenuItemProps {
  item: NavItem;
  activePath: string;
  role?: string;
  depth?: number;
  orientation?: "horizontal" | "vertical" | "bottom" | "tabs";
  dropdownMode?: "menu" | "mega" | "tree";
  collapsed?: boolean;
  iconOnly?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function MenuItem({
  item,
  activePath,
  role,
  depth = 0,
  orientation = "vertical",
  dropdownMode = "menu",
  collapsed = false,
  iconOnly = false,
  onNavigate,
  className
}: MenuItemProps) {
  const [expanded, setExpanded] = React.useState(isItemActive(item, activePath));
  const children = React.useMemo(() => filterNavItems(item.children ?? [], role), [item.children, role]);
  const active = isItemActive(item, activePath);
  const compact = collapsed || iconOnly;
  const Icon = item.icon;
  const hasChildren = children.length > 0;
  const isTree = dropdownMode === "tree";
  const baseClassName = cn(
    "focus-ring group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover:scale-[1.03]",
    orientation === "bottom"
      ? "flex-1 flex-col justify-center px-2 py-2 text-xs"
      : orientation === "horizontal"
        ? "min-h-10 px-3 py-2 text-[13px] xl:px-3.5 xl:text-sm"
        : "min-h-11 px-3 py-2.5",
    orientation === "tabs"
      ? "rounded-none border-b-2 border-transparent px-1 pb-3 pt-1 text-[13px] xl:text-sm hover:scale-100"
      : "",
    active
      ? orientation === "tabs"
        ? "border-[var(--nav-primary)] text-[var(--nav-primary)]"
        : "bg-blue-100 text-blue-600 shadow-sm shadow-blue-100/80"
      : "text-[var(--nav-muted)] hover:bg-gray-100 hover:text-[var(--nav-text)]",
    item.disabled && "pointer-events-none opacity-50",
    className
  );

  const content = (
    <>
      {Icon ? (
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full p-2 transition-all duration-300 ease-in-out",
            orientation === "bottom"
              ? "size-10"
              : orientation === "horizontal" || orientation === "tabs"
                ? "size-10"
                : "size-11",
            active
              ? "bg-blue-100 text-blue-600 shadow-sm"
              : cn(
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                  getIconToneClasses(item.iconTone)
                )
          )}
        >
          <Icon
            className={cn(
              orientation === "bottom"
                ? "size-5"
                : orientation === "horizontal" || orientation === "tabs"
                  ? "size-5"
                  : "size-[22px]"
            )}
            aria-hidden="true"
          />
        </span>
      ) : null}
      <span className={cn("min-w-0 flex-1 truncate", compact && orientation !== "bottom" && "sr-only")}>
        {item.label}
      </span>
      {item.badge && !compact && orientation !== "bottom" ? (
        <span className="rounded-full bg-[var(--nav-hover)] px-2 py-1 text-[11px] font-semibold text-[var(--nav-text)]">
          {item.badge}
        </span>
      ) : null}
      {hasChildren && !compact && orientation !== "bottom" ? (
        <ChevronDown
          className={cn("size-4 transition-transform", (expanded || active) && isTree && "rotate-180")}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (hasChildren && !isTree) {
    return (
      <DropdownMenu
        item={item}
        activePath={activePath}
        role={role}
        mega={dropdownMode === "mega"}
        onNavigate={onNavigate}
        triggerClassName={cn(baseClassName, orientation === "bottom" && "justify-center")}
      />
    );
  }

  if (hasChildren && isTree) {
    const trigger = (
      <button
        type="button"
        aria-expanded={expanded}
        className={cn(baseClassName, "w-full justify-start")}
        onClick={() => setExpanded((current: boolean) => !current)}
      >
        {content}
      </button>
    );

    return (
      <div className="space-y-1">
        {compact ? <Tooltip content={item.label}>{trigger}</Tooltip> : trigger}
        <div
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="ml-4 space-y-1 border-l border-[var(--nav-border)] pl-3">
              {children.map((child) => (
                <MenuItem
                  key={`${child.label}-${child.path ?? depth}`}
                  item={child}
                  activePath={activePath}
                  role={role}
                  depth={depth + 1}
                  orientation={orientation}
                  dropdownMode="tree"
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item.path) {
    return null;
  }

  const link = (
    <Link
      href={item.path}
      className={cn(
        baseClassName,
        compact && orientation !== "bottom" && "justify-center px-2"
      )}
      aria-current={active ? "page" : undefined}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noreferrer" : undefined}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );

  if (compact && orientation !== "bottom") {
    return <Tooltip content={item.label}>{link}</Tooltip>;
  }

  return link;
}
