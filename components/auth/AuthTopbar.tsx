"use client";

import Link from "next/link";

export function AuthTopbar() {
  return (
    <header className="border-b border-[#0b8b8b] bg-[#0EA5A4]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-medium text-[#F8FAFC]">
          Hospital Token Management System
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/signin" className="text-sm font-medium text-[#F8FAFC] transition hover:text-white/80">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm font-medium text-[#F8FAFC] transition hover:text-white/80">
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}
