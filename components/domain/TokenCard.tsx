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
      className={cn(
        "rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-panel",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Token</p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">{tokenNumber}</h3>
          {patientName ? <p className="mt-2 text-sm text-slate-500">{patientName}</p> : null}
        </div>
        <StatusIndicator status={status} />
      </div>
      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Counter</p>
          <p className="mt-1 font-medium text-slate-900">{counter ?? "Unassigned"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Estimated Wait</p>
          <p className="mt-1 font-medium text-slate-900">{estimatedTime ?? "Pending"}</p>
        </div>
      </div>
    </article>
  );
}
