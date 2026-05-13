"use client";

import { Badge, Card } from "@/components/ui";
import { Modal } from "@/components/overlay";
import { OperationalActivityTimeline, type OperationalTimelineItem } from "@/components/calls/OperationalActivityTimeline";
import { CALL_STATUS_LABELS, formatCallDateTime, formatDuration, getFinalStatusBadgeVariant, type ActiveCall, type CallLogEntry } from "@/lib/calls";

export function OperationalDetailsModal({
  open,
  title,
  onClose,
  activeCalls,
  recentLogs,
  timelineItems,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  activeCalls: ActiveCall[];
  recentLogs: CallLogEntry[];
  timelineItems: OperationalTimelineItem[];
}) {
  return (
    <Modal
      open={open}
      title={title}
      description="Operational call summary, recent logs, and timeline activity for this profile."
      onClose={onClose}
      className="max-w-5xl"
      bodyClassName="space-y-6"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Active calls" value={String(activeCalls.length)} />
        <MetricCard label="Recent logs" value={String(recentLogs.length)} />
        <MetricCard
          label="Latest activity"
          value={timelineItems[0] ? formatCallDateTime(timelineItems[0].occurredAt) : "No activity"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-5">
          <p className="ui-section-title">Recent call logs</p>
          <div className="mt-4 space-y-3">
            {recentLogs.length ? (
              recentLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-[#E2E8F0] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[#0F172A]">{log.messageLabel}</p>
                    <Badge status={getFinalStatusBadgeVariant(log.finalStatus)}>{CALL_STATUS_LABELS[log.finalStatus]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#64748B]">{log.hospitalName} · {log.department}</p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {formatCallDateTime(log.startedAt)} to {formatCallDateTime(log.endedAt)}
                  </p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Duration {formatDuration(log.durationMs)} · Ended by {log.endedBy}
                  </p>
                </div>
              ))
            ) : (
              <p className="ui-body-secondary">No recent call logs available for this profile.</p>
            )}
          </div>
        </Card>

        <OperationalActivityTimeline items={timelineItems} title="Operational activity timeline" />
      </div>
    </Modal>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="ui-card-meta">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#0F172A]">{value}</p>
    </Card>
  );
}
