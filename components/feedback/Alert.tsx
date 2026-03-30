import { cn } from "@/lib/utils";

export interface AlertProps {
  title: string;
  description?: string;
  variant?: "info" | "success" | "warning" | "error";
  action?: React.ReactNode;
  className?: string;
}

const styles = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900"
};

export function Alert({
  title,
  description,
  variant = "info",
  action,
  className
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn("rounded-2xl border px-4 py-4", styles[variant], className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold sm:text-base">{title}</h4>
          {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
