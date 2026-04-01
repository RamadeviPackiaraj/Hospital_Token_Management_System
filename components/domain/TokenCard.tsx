import { StatusIndicator, StatusIndicatorProps } from "@/components/domain/StatusIndicator";
import { cn } from "@/lib/utils";

export interface TokenCardProps {
  tokenNumber: string;
  patientName?: string;
  counter?: string;
  status: StatusIndicatorProps["status"];
  estimatedTime?: string;
  className?: string;
}

export function TokenCard({
  tokenNumber,
  patientName,
  counter,
  status,
  estimatedTime,
  className
}: TokenCardProps) {
  return (
    <article
      className={cn("ui-card", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ui-label">Token</p>
          <h3 className="mt-2 ui-section-title">{tokenNumber}</h3>
          {patientName ? <p className="mt-2 ui-body-secondary">{patientName}</p> : null}
        </div>
        <StatusIndicator status={status} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <p className="ui-meta uppercase tracking-[0.08em]">Counter</p>
          <p className="mt-1 ui-body">{counter ?? "Unassigned"}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <p className="ui-meta uppercase tracking-[0.08em]">Estimated Wait</p>
          <p className="mt-1 ui-body">{estimatedTime ?? "Pending"}</p>
        </div>
      </div>
    </article>
  );
}
