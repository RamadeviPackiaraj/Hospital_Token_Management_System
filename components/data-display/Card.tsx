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
      className={cn(
        "rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-panel",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{value}</h3>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
        {icon ? (
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-700" aria-hidden="true">
            {icon}
          </div>
        ) : null}
      </div>
      {trend ? <div className="mt-4 text-sm text-slate-600">{trend}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
