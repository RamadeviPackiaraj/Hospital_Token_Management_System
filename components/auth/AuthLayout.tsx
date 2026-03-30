import * as React from "react";
import { AuthTopbar } from "@/components/auth/AuthTopbar";
import { cn } from "@/lib/utils";

export function AuthLayout({
  title,
  description,
  imageSrc,
  imageAlt,
  children
}: {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AuthTopbar />
      <section className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto w-full max-w-[520px] space-y-6">
            <div className="space-y-2">
              <h1 className="text-[24px] font-medium text-[#0F172A]">{title}</h1>
              <p className="text-sm text-[#64748B]">{description}</p>
              <div className="h-1 w-12 rounded-full bg-[#0EA5A4]" />
            </div>
            {children}
          </div>

          <div className="hidden lg:block">
            <div className={cn("overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-2")}>
              <div className="h-[560px] overflow-hidden rounded-lg bg-[#F8FAFC]">
                <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
