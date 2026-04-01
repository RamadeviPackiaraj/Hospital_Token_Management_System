import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-[#E2E8F0] bg-[#FFFFFF] p-4 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-[#F8FAFC] p-4 text-[#64748B]">
          {icon}
        </div>
      ) : null}
      <h3 className="ui-section-title">{title}</h3>
      <p className="mx-auto mt-2 max-w-md ui-body-secondary">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
