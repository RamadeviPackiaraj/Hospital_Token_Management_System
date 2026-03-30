import { StatusIndicator, StatusIndicatorProps } from "@/components/domain/StatusIndicator";

export interface QueueItem {
  id: string;
  tokenNumber: string;
  patientName: string;
  department: string;
  status: StatusIndicatorProps["status"];
}

export interface QueueListProps {
  items: QueueItem[];
  title?: string;
  description?: string;
}

export function QueueList({
  items,
  title = "Live Queue",
  description = "Responsive list for quick triage visibility."
}: QueueListProps) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {item.tokenNumber} · {item.patientName}
              </p>
              <p className="text-sm text-slate-500">{item.department}</p>
            </div>
            <StatusIndicator status={item.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
