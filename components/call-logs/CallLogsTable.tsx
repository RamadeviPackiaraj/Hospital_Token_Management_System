"use client";

import * as React from "react";
import { Card, Input, Select, StatusBadge, Table } from "@/components/ui";
import {
  CALL_STATUS_LABELS,
  formatCallDateTime,
  formatDuration,
  getFinalStatusBadgeVariant,
  type CallLogEntry,
} from "@/lib/calls";
import { formatDisplayDate } from "@/lib/utils";

type CallLogTableRow = CallLogEntry & Record<string, unknown>;

export function CallLogsTable({ logs }: { logs: CallLogEntry[] }) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sort, setSort] = React.useState("ended-desc");
  const [dateInput, setDateInput] = React.useState("");

  const filteredLogs = React.useMemo(() => {
    const normalizedDate = normalizeDateInput(dateInput);

    const next = logs.filter((log) => {
      const matchesStatus = status === "all" || log.finalStatus === status;
      const haystack = [log.doctorName, log.department, log.hospitalName, log.messageLabel].join(" ").toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase());
      const matchesDate = !normalizedDate || formatDisplayDate(normalizedDate) === formatDisplayDate(new Date(log.startedAt).toISOString().slice(0, 10));
      return matchesStatus && matchesSearch && matchesDate;
    });

    return next.sort((left, right) => {
      if (sort === "doctor-asc") return left.doctorName.localeCompare(right.doctorName);
      if (sort === "doctor-desc") return right.doctorName.localeCompare(left.doctorName);
      if (sort === "started-asc") return left.startedAt - right.startedAt;
      if (sort === "started-desc") return right.startedAt - left.startedAt;
      if (sort === "ended-asc") return left.endedAt - right.endedAt;
      return right.endedAt - left.endedAt;
    });
  }, [dateInput, logs, search, sort, status]);

  const filteredLogRows = filteredLogs as CallLogTableRow[];

  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_220px] xl:items-end">
          <label className="grid gap-2">
            <span className="text-xs font-medium text-[#64748B]">Search</span>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by doctor, department, hospital, or message"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-[#64748B]">Status</span>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
                { label: "Missed", value: "missed" },
              ]}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-[#64748B]">Sort</span>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              options={[
                { label: "Ended time: newest first", value: "ended-desc" },
                { label: "Ended time: oldest first", value: "ended-asc" },
                { label: "Started time: newest first", value: "started-desc" },
                { label: "Started time: oldest first", value: "started-asc" },
                { label: "Doctor: A to Z", value: "doctor-asc" },
                { label: "Doctor: Z to A", value: "doctor-desc" },
              ]}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-[#64748B]">Date</span>
            <Input value={dateInput} onChange={(event) => setDateInput(event.target.value)} placeholder="dd/mm/yyyy" />
          </label>
        </div>
      </Card>

      <div className="hidden md:block">
        <Table<CallLogTableRow>
          rowKey="id"
          data={filteredLogRows}
          pageSize={8}
          stickyHeader
          emptyMessage="No call logs found."
          columns={[
            {
              key: "doctor",
              header: "Doctor",
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.doctorName,
              render: (row) => (
                <div className="whitespace-nowrap">
                  <p className="text-sm font-medium text-[#0F172A]">{row.doctorName}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{row.department}</p>
                </div>
              ),
            },
            {
              key: "hospital",
              header: "Hospital",
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.hospitalName,
              render: (row) => <span className="whitespace-nowrap">{row.hospitalName}</span>,
            },
            {
              key: "message",
              header: "Message",
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.messageLabel,
              render: (row) => <span className="whitespace-nowrap">{row.messageLabel}</span>,
            },
            {
              key: "startedAt",
              header: "Started",
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.startedAt,
              render: (row) => <span className="whitespace-nowrap">{formatCallDateTime(row.startedAt)}</span>,
            },
            {
              key: "endedAt",
              header: "Ended",
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.endedAt,
              render: (row) => <span className="whitespace-nowrap">{formatCallDateTime(row.endedAt)}</span>,
            },
            {
              key: "duration",
              header: "Duration",
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.durationMs,
              render: (row) => <span className="whitespace-nowrap">{formatDuration(row.durationMs)}</span>,
            },
            {
              key: "endedBy",
              header: "Ended by",
              className: "whitespace-nowrap",
              render: (row) => <span className="whitespace-nowrap">{row.endedBy === "doctor" ? "Doctor" : "Hospital"}</span>,
            },
            {
              key: "finalStatus",
              header: "Status",
              className: "whitespace-nowrap",
              render: (row) => (
                <StatusBadge tone={getFinalStatusBadgeVariant(row.finalStatus)}>{CALL_STATUS_LABELS[row.finalStatus]}</StatusBadge>
              ),
            },
          ]}
        />
      </div>

      <div className="grid gap-4 md:hidden">
        {filteredLogs.length ? (
          filteredLogs.map((log) => (
            <Card key={log.id} className="p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{log.doctorName}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{log.department}</p>
                </div>
                <StatusBadge tone={getFinalStatusBadgeVariant(log.finalStatus)}>{CALL_STATUS_LABELS[log.finalStatus]}</StatusBadge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileDetail label="Hospital" value={log.hospitalName} />
                <MobileDetail label="Message" value={log.messageLabel} />
                <MobileDetail label="Started" value={formatCallDateTime(log.startedAt)} />
                <MobileDetail label="Ended" value={formatCallDateTime(log.endedAt)} />
                <MobileDetail label="Duration" value={formatDuration(log.durationMs)} />
                <MobileDetail label="Ended by" value={log.endedBy === "doctor" ? "Doctor" : "Hospital"} />
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-4 text-center shadow-sm">
            <p className="text-sm text-[#64748B]">No call logs found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function normalizeDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const parts = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!parts) {
    return "";
  }

  const [, day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

function MobileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <p className="text-xs font-medium text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm text-[#0F172A]">{value}</p>
    </div>
  );
}
