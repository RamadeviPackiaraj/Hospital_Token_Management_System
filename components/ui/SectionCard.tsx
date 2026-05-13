"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={`p-4 ${className || ""}`}>
      <PageHeader title={title} description={description} icon={icon} actions={actions} />
      <div className={`mt-4 ${bodyClassName || ""}`}>{children}</div>
    </Card>
  );
}
