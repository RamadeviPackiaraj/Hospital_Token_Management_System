"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterNavItems, isItemActive, type NavItem } from "./NavConfig";

function getIconToneClasses(tone?: NavItem["iconTone"]) {
  switch (tone) {
    case "sky":
      return "bg-sky-100 text-sky-700";
    case "blue":
      return "bg-blue-100 text-blue-700";
    case "violet":
      return "bg-violet-100 text-violet-700";
    case "fuchsia":
      return "bg-fuchsia-100 text-fuchsia-700";
    case "emerald":
      return "bg-emerald-100 text-emerald-700";
    case "teal":
      return "bg-teal-100 text-teal-700";
    case "amber":
      return "bg-amber-100 text-amber-700";
    case "rose":
      return "bg-rose-100 text-rose-700";
    case "indigo":
      return "bg-indigo-100 text-indigo-700";
    case "lime":
      return "bg-lime-100 text-lime-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export interface DropdownMenuProps {
  item: NavItem;
  activePath: string;
  role?: string;
  align?: "left" | "right";
  mega?: boolean;
  level?: number;
  onNavigate?: () => void;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
}

export function DropdownMenu({
  item,
  activePath,
  role,
  align = "left",
  mega = false,
  level = 0,
  onNavigate,
  className,
  triggerClassName,
  panelClassName
}: DropdownMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const children = React.useMemo(() => filterNavItems(item.children ?? [], role), [item.children, role]);
  const active = isItemActive(item, activePath);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!children.length) {
    return null;
  }

  const alignmentClass =
    level > 0
      ? "left-full top-0 ml-3"
      : align === "right"
        ? "right-0 top-full mt-3"
        : "left-0 top-full mt-3";

  return (
    <div
      ref={menuRef}
      className={cn("relative", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "focus-ring flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-[var(--nav-accent)] text-[var(--nav-primary)]"
            : "text-[var(--nav-text)] hover:bg-[var(--nav-hover)]",
          triggerClassName
        )}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {item.icon ? (
          <span className={cn("inline-flex size-8 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]", getIconToneClasses(item.iconTone))}>
            <item.icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
        <span>{item.label}</span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: level > 0 ? 0 : 8, x: level > 0 ? -8 : 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: level > 0 ? 0 : 6, x: level > 0 ? -6 : 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="menu"
            className={cn(
              "absolute z-50 min-w-[16rem] rounded-3xl border border-[var(--nav-border)] bg-[var(--nav-background)] p-3 shadow-2xl backdrop-blur-xl",
              mega && "w-[min(44rem,calc(100vw-2rem))]",
              alignmentClass,
              panelClassName
            )}
          >
            {mega ? (
              <div className="grid gap-3 md:grid-cols-2">
                {children.map((child) => (
                  <div
                    key={child.label}
                    className="rounded-2xl border border-[var(--nav-border)] bg-white/40 p-4 dark:bg-slate-900/30"
                  >
                    <div className="flex items-start gap-3">
                      {child.icon ? (
                        <span className={cn("mt-0.5 rounded-2xl p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]", getIconToneClasses(child.iconTone))}>
                          <child.icon className="size-5" aria-hidden="true" />
                        </span>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--nav-text)]">{child.label}</p>
                        {child.description ? (
                          <p className="mt-1 text-sm text-[var(--nav-muted)]">{child.description}</p>
                        ) : null}
                        {child.children?.length ? (
                          <div className="mt-3 space-y-1">
                            {filterNavItems(child.children, role).map((grandChild) => (
                              <Link
                                key={grandChild.label}
                                href={grandChild.path ?? "#"}
                                className="focus-ring flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--nav-muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--nav-text)]"
                                onClick={() => {
                                  setOpen(false);
                                  onNavigate?.();
                                }}
                              >
                                <span>{grandChild.label}</span>
                                <ChevronRight className="size-4" aria-hidden="true" />
                              </Link>
                            ))}
                          </div>
                        ) : child.path ? (
                          <Link
                            href={child.path}
                            className="focus-ring mt-3 inline-flex rounded-xl bg-[var(--nav-primary)] px-3 py-2 text-sm font-medium text-white"
                            onClick={() => {
                              setOpen(false);
                              onNavigate?.();
                            }}
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {children.map((child) =>
                  child.children?.length ? (
                    <DropdownMenu
                      key={child.label}
                      item={child}
                      activePath={activePath}
                      role={role}
                      level={level + 1}
                      onNavigate={onNavigate}
                      triggerClassName="w-full justify-between px-3"
                      panelClassName="min-w-[14rem]"
                    />
                  ) : child.path ? (
                    <Link
                      key={child.label}
                      href={child.path}
                      role="menuitem"
                      className={cn(
                        "focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                        isItemActive(child, activePath)
                          ? "bg-[var(--nav-accent)] font-medium text-[var(--nav-primary)]"
                          : "text-[var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-text)]"
                      )}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                    >
                      {child.icon ? (
                        <span className={cn("inline-flex size-10 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]", getIconToneClasses(child.iconTone))}>
                          <child.icon className="size-5" aria-hidden="true" />
                        </span>
                      ) : null}
                      <span className="flex-1">{child.label}</span>
                      {child.badge ? (
                        <span className="rounded-full bg-[var(--nav-hover)] px-2 py-1 text-[11px] font-semibold">
                          {child.badge}
                        </span>
                      ) : null}
                    </Link>
                  ) : null
                )}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
