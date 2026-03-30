import { Badge } from "@/components/ui/Badge";

export interface StatusIndicatorProps {
  status: "waiting" | "in-progress" | "completed" | "cancelled";
}

const statusMap = {
  waiting: { label: "Waiting", tone: "warning" as const },
  "in-progress": { label: "In Progress", tone: "info" as const },
  completed: { label: "Completed", tone: "success" as const },
  cancelled: { label: "Cancelled", tone: "error" as const }
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusMap[status];
  return <Badge status={config.tone}>{config.label}</Badge>;
}
