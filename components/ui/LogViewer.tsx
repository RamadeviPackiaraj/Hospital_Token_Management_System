"use client";

import * as React from "react";
import { Bug, ChevronDown, Copy, Download, Trash2, X } from "lucide-react";
import { useLogger } from "@/hooks/useLogger";
import type { LogLevel } from "@/store/logStore";
import { cn } from "@/lib/utils";

const levelStyles = {
  info: "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]",
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
  warn: "border-[#FDE68A] bg-[#FFFBEB] text-[#A16207]",
  error: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
} as const;

export function LogViewer() {
  const { logs, isOpen, filter, toggleOpen, clearLogs, setOpen, setFilter } = useLogger();
  const [expandedLogIds, setExpandedLogIds] = React.useState<string[]>([]);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const filteredLogs = React.useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((log) => log.type === filter);
  }, [filter, logs]);

  React.useEffect(() => {
    if (!isOpen || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [filteredLogs, isOpen]);

  function toggleExpanded(logId: string) {
    setExpandedLogIds((current) =>
      current.includes(logId) ? current.filter((id) => id !== logId) : [...current, logId]
    );
  }

  async function copyLogs() {
    await navigator.clipboard.writeText(JSON.stringify(filteredLogs, null, 2));
  }

  function downloadLogs() {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `frontend-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {isOpen ? (
        <section className="ui-card w-[320px] max-w-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="ui-section-title">Frontend Logs</h2>
              <p className="ui-meta">{filteredLogs.length} visible of {logs.length}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="ui-icon-button"
                onClick={() => void copyLogs()}
                aria-label="Copy logs"
              >
                <Copy className="size-4" />
              </button>
              <button
                type="button"
                className="ui-icon-button"
                onClick={downloadLogs}
                aria-label="Download logs"
              >
                <Download className="size-4" />
              </button>
              <button
                type="button"
                className="ui-icon-button"
                onClick={clearLogs}
                aria-label="Clear logs"
              >
                <Trash2 className="size-4" />
              </button>
              <button
                type="button"
                className="ui-icon-button"
                onClick={() => setOpen(false)}
                aria-label="Close logs"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", "info", "success", "warn", "error"] as const).map((level) => (
              <button
                key={level}
                type="button"
                className={cn(
                  "focus-ring rounded-md border px-2 py-1 text-xs font-medium transition",
                  filter === level
                    ? "border-[#0EA5A4] bg-[#F0FDFA] text-[#0EA5A4]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#0EA5A4] hover:text-[#0EA5A4]"
                )}
                onClick={() => setFilter(level)}
              >
                {level}
              </button>
            ))}
          </div>

          <div ref={listRef} className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
                <p className="ui-meta">No logs yet.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <article key={log.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-panel">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]",
                        levelStyles[log.type]
                      )}
                    >
                      {log.type}
                    </span>
                    <span className="ui-meta">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-2 ui-body">{log.message}</p>
                  {log.source ? (
                    <p className="mt-1 ui-meta">Source: {log.source}</p>
                  ) : null}
                  {log.data !== undefined ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-[10px] font-medium text-[#0EA5A4]"
                        onClick={() => toggleExpanded(log.id)}
                      >
                        {expandedLogIds.includes(log.id) ? "Hide data" : "Show data"}
                      </button>
                      {expandedLogIds.includes(log.id) ? (
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-[#F8FAFC] p-2 text-xs text-[#64748B]">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={toggleOpen}
        className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] shadow-panel transition hover:border-[#0EA5A4] hover:text-[#0EA5A4]"
      >
        <Bug className="size-4" />
        Logs
        <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5 text-xs text-[#64748B]">{logs.length}</span>
        <ChevronDown className={cn("size-4 transition", isOpen && "rotate-180")} />
      </button>
    </div>
  );
}
