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
    <section className="ui-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="ui-section-title">{title}</h3>
          <p className="ui-body-secondary">{description}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="ui-body">
                {item.tokenNumber} · {item.patientName}
              </p>
              <p className="ui-body-secondary">{item.department}</p>
            </div>
            <StatusIndicator status={item.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
