"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

interface PageHeroStat {
  label: string;
  value: string;
}

interface PageHeroProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  stats?: PageHeroStat[];
  supplementaryContent?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHero({
  title,
  description,
  icon,
  imageSrc,
  imageAlt,
  stats = [],
  supplementaryContent,
  backHref,
  backLabel,
}: PageHeroProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const hasSupplementaryContent = Boolean(supplementaryContent);
  const imageFrameClass = hasSupplementaryContent
    ? "h-[108px] w-[180px] shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
    : "overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]";

  return (
    <Card className="overflow-hidden">
      <div
        className={
          hasSupplementaryContent
            ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,380px)] lg:items-center"
            : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center"
        }
      >
        <div className="space-y-4">
          {backHref && backLabel ? (
            <div>
              <Link
                href={backHref}
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B] transition hover:border-[#0EA5A4] hover:text-[#0EA5A4]"
              >
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
            </div>
          ) : null}

          <PageHeader title={title} description={description} icon={icon} />

          {stats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.map((stat) => (
                <StatusBadge key={stat.label} tone="neutral" dot={false} className="rounded-lg px-3 py-2">
                  <span className="ui-meta">{stat.label}</span>
                  <span className="ml-2 ui-body">{stat.value}</span>
                </StatusBadge>
              ))}
            </div>
          ) : null}

          {supplementaryContent ? <div className="lg:hidden">{supplementaryContent}</div> : null}
        </div>

        <div className="hidden lg:block">
          {hasSupplementaryContent ? (
            <div className="flex items-stretch gap-3">
              <div className="flex min-w-0 flex-1 items-stretch">{supplementaryContent}</div>
              <div className={imageFrameClass}>
                {imageFailed ? (
                  <div className="flex h-[108px] w-full items-center justify-center bg-[#F8FAFC] p-3 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-white text-[#0EA5A4]">
                        {icon}
                      </div>
                      <p className="ui-meta">{imageAlt}</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className={imageFrameClass}>
              {imageFailed ? (
                <div className="flex h-[108px] w-full items-center justify-center bg-[#F8FAFC] p-3 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-white text-[#0EA5A4]">
                      {icon}
                    </div>
                    <p className="ui-meta">{imageAlt}</p>
                  </div>
                </div>
              ) : (
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="h-[108px] w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
