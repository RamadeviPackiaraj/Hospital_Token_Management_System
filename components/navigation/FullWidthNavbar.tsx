"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Globe, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FullWidthNavbarItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface FullWidthNavbarProps {
  brand?: React.ReactNode;
  items: FullWidthNavbarItem[];
  languageLabel?: string;
  accountLabel?: string;
  onAccountClick?: () => void;
  className?: string;
}

export function FullWidthNavbar({
  brand,
  items,
  languageLabel = "English",
  accountLabel = "My Account",
  onAccountClick,
  className
}: FullWidthNavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0F2A] text-white", className)}>
      <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8" aria-label="Main navigation">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            {brand ?? (
              <>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#0B0F2A]">
                  NX
                </span>
                <span className="text-base font-semibold tracking-tight text-white">Nexa Hosting</span>
              </>
            )}
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:text-white"
              >
                <span>{item.label}</span>
                {item.hasDropdown ? <ChevronDown className="size-4" aria-hidden="true" /> : null}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:text-white"
            aria-label="Change language"
          >
            <Globe className="size-4" aria-hidden="true" />
            <span>{languageLabel}</span>
          </button>
          <button
            type="button"
            className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            onClick={onAccountClick}
          >
            {accountLabel}
          </button>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md text-gray-200 transition hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen((current) => !current)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-white/10 px-4 py-4 sm:px-6 lg:hidden">
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.label}</span>
                {item.hasDropdown ? <ChevronDown className="size-4" aria-hidden="true" /> : null}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:text-white"
            >
              <Globe className="size-4" aria-hidden="true" />
              <span>{languageLabel}</span>
            </button>
            <button
              type="button"
              className="rounded-md border border-white/30 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              onClick={onAccountClick}
            >
              {accountLabel}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
