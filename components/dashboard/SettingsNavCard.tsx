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
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
              {icon}
            </div>
            <div>
              <h2 className="ui-section-title">{title}</h2>
              <p className="mt-1 ui-body-secondary">{description}</p>
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
