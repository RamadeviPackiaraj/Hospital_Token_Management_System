"use client";

import * as React from "react";
import { Card, Badge } from "@/components/ui";

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
}

export function PageHero({
  title,
  description,
  icon,
  imageSrc,
  imageAlt,
  stats = [],
  supplementaryContent,
}: PageHeroProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const hasSupplementaryContent = Boolean(supplementaryContent);
  const imageFrameClass = hasSupplementaryContent
    ? "h-[136px] w-[220px] shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
    : "overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]";

  return (
    <Card className="overflow-hidden">
      <div
        className={
          hasSupplementaryContent
            ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] lg:items-center"
            : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center"
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
              {icon}
            </div>
            <div>
              <h2 className="ui-page-title">{title}</h2>
              {description ? <p className="mt-1 ui-body-secondary">{description}</p> : null}
            </div>
          </div>

          {stats.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {stats.map((stat) => (
                <Badge key={stat.label} variant="neutral" className="rounded-lg px-4 py-2">
                  <span className="ui-meta">{stat.label}</span>
                  <span className="ml-2 ui-body">{stat.value}</span>
                </Badge>
              ))}
            </div>
          ) : null}

          {supplementaryContent ? <div className="lg:hidden">{supplementaryContent}</div> : null}
        </div>

        <div className="hidden lg:block">
          {hasSupplementaryContent ? (
            <div className="flex items-stretch gap-4">
              <div className="flex min-w-0 flex-1 items-stretch">{supplementaryContent}</div>
              <div className={imageFrameClass}>
                {imageFailed ? (
                  <div className="flex h-[136px] w-full items-center justify-center bg-[#F8FAFC] p-4 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#0EA5A4]">
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
                <div className="flex h-[136px] w-full items-center justify-center bg-[#F8FAFC] p-4 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#0EA5A4]">
                      {icon}
                    </div>
                    <p className="ui-meta">{imageAlt}</p>
                  </div>
                </div>
              ) : (
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="h-[136px] w-full object-cover"
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
