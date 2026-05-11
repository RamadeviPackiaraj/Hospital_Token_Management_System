"use client";

import Link from "next/link";
import { GlobalLanguageSwitcher, useI18n } from "@/components/i18n";

type AuthTopbarProps = {
  showSignup?: boolean;
};

export function AuthTopbar({ showSignup = true }: AuthTopbarProps) {
  const { t } = useI18n();

  return (
    <header className="border-b border-[#0b8b8b] bg-[#0EA5A4]">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3 text-[#F8FAFC]">
          <span className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-xs font-medium">
            HT
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-medium leading-5">Hospital Token Management</span>
            <span className="text-xs font-normal leading-4 text-white/80">Queue operations platform</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <GlobalLanguageSwitcher compact />
          <nav className="flex items-center gap-4">
          <Link
            href="/signin"
            className="inline-flex h-14 items-center text-sm font-medium leading-5 text-[#F8FAFC] transition hover:text-white/80"
          >
            {t("dashboard.header.signIn")}
          </Link>
          {showSignup ? (
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium leading-5 text-[#F8FAFC] transition hover:bg-white/15"
            >
              Sign Up
            </Link>
          ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
