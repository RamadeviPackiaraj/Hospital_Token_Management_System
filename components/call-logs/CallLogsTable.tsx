"use client";

import * as React from "react";
import { ArrowDownAZ, CalendarDays, ClipboardList, Filter, Search, TimerReset } from "lucide-react";
import { CallDuration } from "@/components/calls/CallDuration";
import { Button, Card, Input, Select, StatusBadge, Table } from "@/components/ui";
import { DatePicker } from "@/components/utility";
import { getDepartments, type DepartmentRecord } from "@/lib/dashboard-data";
import { localizeDepartmentName } from "@/lib/dynamic-localization";
import {
  formatCallDateTime,
  formatDuration,
  getDisplayCallStatusBadgeVariant,
  localizeDisplayCallStatusLabel,
  localizeCallMessageLabel,
  type ActiveCall,
  type CallDisplayStatus,
  type CallLogEntry,
} from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";
import { formatDisplayDate } from "@/lib/utils";

type CallLogTableRow = Record<string, unknown> & {
  id: string;
  doctorName: string;
  department: string;
  hospitalName: string;
  messageLabel: string;
  startedAt: number;
  endedAt: number | null;
  endedBy: "doctor" | "hospital" | null;
  durationMs: number;
  displayStatus: CallDisplayStatus;
};

const callLogsTableCopy = {
  en: {
    search: "Search",
    searchPlaceholder: "Search by doctor, department, hospital, or message",
    department: "Department",
    status: "Status",
    sort: "Sort",
    date: "Date",
    clear: "Clear filters",
    allDepartments: "All Departments",
    allStatuses: "All statuses",
    endedNewest: "Ended time: newest first",
    endedOldest: "Ended time: oldest first",
    startedNewest: "Started time: newest first",
    startedOldest: "Started time: oldest first",
    doctorAsc: "Doctor: A to Z",
    doctorDesc: "Doctor: Z to A",
    hospital: "Hospital",
    message: "Message",
    started: "Started",
    ended: "Ended",
    duration: "Duration",
    endedBy: "Ended by",
    doctor: "Doctor",
    active: "Active",
    noLogs: "No call logs found.",
    previous: "Previous",
    next: "Next",
    page: "Page",
  },
  ta: {
    search: "Search",
    searchPlaceholder: "Search by doctor, department, hospital, or message",
    department: "Department",
    status: "Status",
    sort: "Sort",
    date: "Date",
    clear: "Clear filters",
    allDepartments: "All Departments",
    allStatuses: "All statuses",
    endedNewest: "Ended time: newest first",
    endedOldest: "Ended time: oldest first",
    startedNewest: "Started time: newest first",
    startedOldest: "Started time: oldest first",
    doctorAsc: "Doctor: A to Z",
    doctorDesc: "Doctor: Z to A",
    hospital: "Hospital",
    message: "Message",
    started: "Started",
    ended: "Ended",
    duration: "Duration",
    endedBy: "Ended by",
    doctor: "Doctor",
    active: "Active",
    noLogs: "No call logs found.",
    previous: "Previous",
    next: "Next",
    page: "Page",
  },
  hi: {
    search: "Search",
    searchPlaceholder: "Search by doctor, department, hospital, or message",
    department: "Department",
    status: "Status",
    sort: "Sort",
    date: "Date",
    clear: "Clear filters",
    allDepartments: "All Departments",
    allStatuses: "All statuses",
    endedNewest: "Ended time: newest first",
    endedOldest: "Ended time: oldest first",
    startedNewest: "Started time: newest first",
    startedOldest: "Started time: oldest first",
    doctorAsc: "Doctor: A to Z",
    doctorDesc: "Doctor: Z to A",
    hospital: "Hospital",
    message: "Message",
    started: "Started",
    ended: "Ended",
    duration: "Duration",
    endedBy: "Ended by",
    doctor: "Doctor",
    active: "Active",
    noLogs: "No call logs found.",
    previous: "Previous",
    next: "Next",
    page: "Page",
  },
  ml: {
    search: "Search",
    searchPlaceholder: "Search by doctor, department, hospital, or message",
    department: "Department",
    status: "Status",
    sort: "Sort",
    date: "Date",
    clear: "Clear filters",
    allDepartments: "All Departments",
    allStatuses: "All statuses",
    endedNewest: "Ended time: newest first",
    endedOldest: "Ended time: oldest first",
    startedNewest: "Started time: newest first",
    startedOldest: "Started time: oldest first",
    doctorAsc: "Doctor: A to Z",
    doctorDesc: "Doctor: Z to A",
    hospital: "Hospital",
    message: "Message",
    started: "Started",
    ended: "Ended",
    duration: "Duration",
    endedBy: "Ended by",
    doctor: "Doctor",
    active: "Active",
    noLogs: "No call logs found.",
    previous: "Previous",
    next: "Next",
    page: "Page",
  },
} as const;

export function CallLogsTable({
  logs,
  activeCalls,
  language,
}: {
  logs: CallLogEntry[];
  activeCalls: ActiveCall[];
  language: AppLanguage;
}) {
  const copy = callLogsTableCopy[language] || callLogsTableCopy.en;
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [sort, setSort] = React.useState("ended-desc");
  const [dateInput, setDateInput] = React.useState("");
  const [mobilePage, setMobilePage] = React.useState(1);
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const mobilePageSize = 5;

  React.useEffect(() => {
    let active = true;

    getDepartments()
      .then((nextDepartments) => {
        if (!active) return;
        setDepartments(nextDepartments);
      })
      .catch(() => {
        if (!active) return;
        setDepartments([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const rows = React.useMemo<CallLogTableRow[]>(() => {
    const activeRows = activeCalls.map((call) => ({
      id: call.id,
      doctorName: call.doctorName,
      department: call.department,
      hospitalName: call.hospitalName,
      messageLabel: call.messageLabel,
      startedAt: call.startedAt,
      endedAt: null,
      endedBy: null,
      durationMs: Date.now() - call.startedAt,
      displayStatus: "active" as const,
    }));

    const logRows = logs.map((log) => ({
      id: log.id,
      doctorName: log.doctorName,
      department: log.department,
      hospitalName: log.hospitalName,
      messageLabel: log.messageLabel,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      endedBy: log.endedBy,
      durationMs: log.durationMs,
      displayStatus: log.finalStatus,
    }));

    return [...activeRows, ...logRows];
  }, [activeCalls, logs]);

  const departmentOptions = React.useMemo(() => {
    return [
      { label: copy.allDepartments, value: "all" },
      ...departments
        .map((departmentItem) => ({
          label: localizeDepartmentName(departmentItem.name, departmentItem.displayName),
          value: departmentItem.name,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    ];
  }, [copy.allDepartments, departments]);

  const filteredLogs = React.useMemo(() => {
    const next = rows.filter((log) => {
      const matchesDepartment = department === "all" || log.department === department;
      const matchesStatus = status === "all" || log.displayStatus === status;
      const haystack = [log.doctorName, log.department, log.hospitalName, log.messageLabel].join(" ").toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase());
      const matchesDate = !dateInput || formatDisplayDate(dateInput) === formatDisplayDate(new Date(log.startedAt).toISOString().slice(0, 10));
      return matchesDepartment && matchesStatus && matchesSearch && matchesDate;
    });

    return next.sort((left, right) => {
      if (left.displayStatus === "active" && right.displayStatus !== "active" && sort === "ended-desc") return -1;
      if (left.displayStatus !== "active" && right.displayStatus === "active" && sort === "ended-desc") return 1;
      if (sort === "doctor-asc") return left.doctorName.localeCompare(right.doctorName);
      if (sort === "doctor-desc") return right.doctorName.localeCompare(left.doctorName);
      if (sort === "started-asc") return left.startedAt - right.startedAt;
      if (sort === "started-desc") return right.startedAt - left.startedAt;
      if (sort === "ended-asc") return (left.endedAt ?? Number.MAX_SAFE_INTEGER) - (right.endedAt ?? Number.MAX_SAFE_INTEGER);
      return (right.endedAt ?? Number.MAX_SAFE_INTEGER) - (left.endedAt ?? Number.MAX_SAFE_INTEGER);
    });
  }, [dateInput, department, rows, search, sort, status]);

  const mobileTotalPages = Math.max(1, Math.ceil(filteredLogs.length / mobilePageSize));

  const mobileItems = React.useMemo(() => {
    const startIndex = (mobilePage - 1) * mobilePageSize;
    return filteredLogs.slice(startIndex, startIndex + mobilePageSize);
  }, [filteredLogs, mobilePage]);

  React.useEffect(() => {
    setMobilePage(1);
  }, [search, department, status, sort, dateInput]);

  React.useEffect(() => {
    setMobilePage((current) => Math.min(current, mobileTotalPages));
  }, [mobileTotalPages]);

  return (
    <div className="space-y-4">
      <Card className="p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_220px_160px] xl:items-end">
          <label className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              <Search className="size-3.5" />
              {copy.search}
            </span>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.searchPlaceholder} />
          </label>

          <label className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              <Filter className="size-3.5" />
              {copy.department}
            </span>
            <Select value={department} onChange={(event) => setDepartment(event.target.value)} options={departmentOptions} />
          </label>

          <label className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              <Filter className="size-3.5" />
              {copy.status}
            </span>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { label: copy.allStatuses, value: "all" },
                { label: copy.active, value: "active" },
                { label: localizeDisplayCallStatusLabel("completed", language), value: "completed" },
                { label: localizeDisplayCallStatusLabel("cancelled", language), value: "cancelled" },
                { label: localizeDisplayCallStatusLabel("missed", language), value: "missed" },
              ]}
            />
          </label>

          <label className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              <ArrowDownAZ className="size-3.5" />
              {copy.sort}
            </span>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              options={[
                { label: copy.endedNewest, value: "ended-desc" },
                { label: copy.endedOldest, value: "ended-asc" },
                { label: copy.startedNewest, value: "started-desc" },
                { label: copy.startedOldest, value: "started-asc" },
                { label: copy.doctorAsc, value: "doctor-asc" },
                { label: copy.doctorDesc, value: "doctor-desc" },
              ]}
            />
          </label>

          <label className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              <CalendarDays className="size-3.5" />
              {copy.date}
            </span>
            <DatePicker value={dateInput} onChange={setDateInput} placeholder="dd/mm/yyyy" />
          </label>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 w-full rounded-xl"
              onClick={() => {
                setSearch("");
                setDepartment("all");
                setStatus("all");
                setSort("ended-desc");
                setDateInput("");
              }}
            >
              {copy.clear}
            </Button>
          </div>
        </div>
      </Card>

      <div className="hidden md:block">
        <Table<CallLogTableRow>
          rowKey="id"
          data={filteredLogs}
          pageSize={8}
          stickyHeader
          initialSort={{ key: "startedAt", direction: "desc" }}
          emptyMessage={copy.noLogs}
          columns={[
            {
              key: "doctor",
              header: copy.doctor,
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.doctorName,
              render: (row) => <span className="whitespace-nowrap text-sm font-medium text-[#0F172A]">{row.doctorName}</span>,
            },
            {
              key: "department",
              header: copy.department,
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.department,
              render: (row) => <span className="whitespace-nowrap">{localizeDepartmentName(row.department)}</span>,
            },
            {
              key: "hospital",
              header: copy.hospital,
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.hospitalName,
              render: (row) => <span className="whitespace-nowrap">{row.hospitalName}</span>,
            },
            {
              key: "message",
              header: copy.message,
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.messageLabel,
              render: (row) => <span className="whitespace-nowrap">{localizeCallMessageLabel(row.messageLabel, language)}</span>,
            },
            {
              key: "startedAt",
              header: copy.started,
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.startedAt,
              render: (row) => <span className="whitespace-nowrap">{formatCallDateTime(row.startedAt)}</span>,
            },
            {
              key: "endedAt",
              header: copy.ended,
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.endedAt,
              render: (row) => <span className="whitespace-nowrap">{row.endedAt ? formatCallDateTime(row.endedAt) : "-"}</span>,
            },
            {
              key: "duration",
              header: copy.duration,
              sortable: true,
              className: "whitespace-nowrap",
              sortValue: (row) => row.durationMs,
              render: (row) => (
                <span className="whitespace-nowrap">
                  {row.displayStatus === "active" ? <CallDuration startedAt={row.startedAt} /> : formatDuration(row.durationMs)}
                </span>
              ),
            },
            {
              key: "endedBy",
              header: copy.endedBy,
              className: "whitespace-nowrap",
              render: (row) => (
                <span className="whitespace-nowrap">{row.endedBy ? (row.endedBy === "doctor" ? copy.doctor : copy.hospital) : "-"}</span>
              ),
            },
            {
              key: "displayStatus",
              header: copy.status,
              className: "whitespace-nowrap",
              render: (row) => (
                <StatusBadge tone={getDisplayCallStatusBadgeVariant(row.displayStatus)}>
                  {localizeDisplayCallStatusLabel(row.displayStatus, language)}
                </StatusBadge>
              ),
            },
          ]}
        />
      </div>

      <div className="grid gap-4 md:hidden">
        {mobileItems.length ? (
          mobileItems.map((log) => (
            <Card key={log.id} className="p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{log.doctorName}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{localizeDepartmentName(log.department)}</p>
                </div>
                <StatusBadge tone={getDisplayCallStatusBadgeVariant(log.displayStatus)}>
                  {localizeDisplayCallStatusLabel(log.displayStatus, language)}
                </StatusBadge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileDetail icon={<Filter className="size-4" />} label={copy.department} value={localizeDepartmentName(log.department)} />
                <MobileDetail icon={<ClipboardList className="size-4" />} label={copy.hospital} value={log.hospitalName} />
                <MobileDetail icon={<Search className="size-4" />} label={copy.message} value={localizeCallMessageLabel(log.messageLabel, language)} />
                <MobileDetail icon={<CalendarDays className="size-4" />} label={copy.started} value={formatCallDateTime(log.startedAt)} />
                <MobileDetail icon={<CalendarDays className="size-4" />} label={copy.ended} value={log.endedAt ? formatCallDateTime(log.endedAt) : "-"} />
                <MobileDetail
                  icon={<TimerReset className="size-4" />}
                  label={copy.duration}
                  value={log.displayStatus === "active" ? <CallDuration startedAt={log.startedAt} /> : formatDuration(log.durationMs)}
                />
                <MobileDetail icon={<Filter className="size-4" />} label={copy.endedBy} value={log.endedBy ? (log.endedBy === "doctor" ? copy.doctor : copy.hospital) : "-"} />
                <MobileDetail
                  icon={<Filter className="size-4" />}
                  label={copy.status}
                  value={localizeDisplayCallStatusLabel(log.displayStatus, language)}
                />
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-4 text-center shadow-sm">
            <p className="text-sm text-[#64748B]">{copy.noLogs}</p>
          </Card>
        )}
        {filteredLogs.length > mobilePageSize ? (
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setMobilePage((page) => Math.max(1, page - 1))} disabled={mobilePage === 1}>
              {copy.previous}
            </Button>
            <span className="text-sm text-[#64748B]">
              {copy.page} {mobilePage} / {mobileTotalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setMobilePage((page) => Math.min(mobileTotalPages, page + 1))} disabled={mobilePage === mobileTotalPages}>
              {copy.next}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MobileDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex items-center gap-2 text-[#64748B]">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 text-sm text-[#0F172A]">{value}</p>
    </div>
  );
}
