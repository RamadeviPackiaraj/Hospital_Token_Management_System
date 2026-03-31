"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";

export function SettingsNavCard({
  href,
  icon,
  title,
  description
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="rounded-[10px] p-4 transition duration-200 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
              {icon}
            </div>
            <div>
              <h2 className="text-base font-medium text-[#0F172A]">{title}</h2>
              <p className="mt-1 text-sm text-[#64748B]">{description}</p>
            </div>
          </div>

          <span className="text-[#64748B]">
            <ChevronRight className="size-5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
