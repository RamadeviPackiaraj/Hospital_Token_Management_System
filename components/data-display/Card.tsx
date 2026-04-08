import { cn } from "@/lib/utils";

export interface CardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  trend?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  value,
  description,
  trend,
  icon,
  children,
  className
}: CardProps) {
  return (
    <section
      className={cn("ui-card", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="ui-meta">{title}</p>
          <h3 className="ui-section-title">{value}</h3>
          {description ? <p className="ui-body-secondary">{description}</p> : null}
        </div>
        {icon ? (
          <div className="rounded-lg bg-[#F0FDFA] p-3 text-[#0EA5A4]" aria-hidden="true">
            {icon}
          </div>
        ) : null}
      </div>
      {trend ? <div className="mt-4 ui-body-secondary">{trend}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
