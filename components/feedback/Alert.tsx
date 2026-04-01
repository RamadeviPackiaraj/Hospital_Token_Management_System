import { cn } from "@/lib/utils";

export interface AlertProps {
  title: string;
  description?: string;
  variant?: "info" | "success" | "warning" | "error";
  action?: React.ReactNode;
  className?: string;
}

const styles = {
  info: "border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A]",
  success: "border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A]",
  warning: "border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A]",
  error: "border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A]"
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
      className={cn("rounded-lg border px-4 py-4", styles[variant], className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="ui-section-title">{title}</h4>
          {description ? <p className="mt-1 ui-body-secondary">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
