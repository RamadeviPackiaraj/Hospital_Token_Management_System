"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Hospital,
  ShieldAlert,
  Stethoscope,
  Ticket,
  Users,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import type { MockUser } from "@/lib/auth-flow";
import {
  getAdminDoctors,
  getAdminHospitals,
  getApprovedDoctorsForHospital,
  getSelectionsForDoctor,
  getSelectionsForHospital,
  type HospitalSelection,
} from "@/lib/dashboard-data";
import { localizeDepartmentName } from "@/lib/dynamic-localization";
import { getDoctorSchedules, getPatientTokens, getScheduleBootstrap, getScheduleSummary } from "@/lib/schedule-api";
import type { DoctorScheduleRecord, PatientTokenRecord, PatientTokenStatus } from "@/lib/scheduling-types";
import { todayDateString } from "@/lib/scheduling";

type RoleCopy = {
  labels: {
    kpis: string;
    analytics: string;
    activity: string;
    noData: string;
    viewAll: string;
    noUpcoming: string;
    noRecent: string;
    status: string;
    date: string;
    entity: string;
    department: string;
    doctor: string;
    patient: string;
    hospital: string;
    tokens: string;
    available: string;
    booked: string;
    consultations: string;
  };
  admin: {
    pendingDoctorApprovals: string;
    pendingHospitalApprovals: string;
    totalDoctors: string;
    totalHospitals: string;
    registrationTrends: string;
    registrationsFootnote: string;
    approvalDistribution: string;
    approvalFootnote: string;
    recentActivity: string;
    recentActivityFootnote: string;
    doctorRegistration: string;
    hospitalApproval: string;
  };
  hospital: {
    activeDoctors: string;
    todaysTokens: string;
    pendingApprovals: string;
    dailyPatientFlow: string;
    patientFlowFootnote: string;
    departmentActivity: string;
    departmentActivityFootnote: string;
    tokenDistribution: string;
    tokenDistributionFootnote: string;
    doctorAvailability: string;
    doctorAvailabilityFootnote: string;
    recentPatientEntries: string;
    recentPatientEntriesFootnote: string;
  };
  doctor: {
    activeHospitals: string;
    pendingRequests: string;
    todaysConsultations: string;
    patientVisitTrends: string;
    patientVisitFootnote: string;
    consultationAnalytics: string;
    consultationFootnote: string;
    upcomingSchedules: string;
    upcomingSchedulesFootnote: string;
    recentAppointments: string;
    recentAppointmentsFootnote: string;
  };
};

type AdminActivityRow = {
  id: string;
  title: string;
  entity: string;
  status: "approved" | "pending" | "rejected";
  date: string;
};

type TrendDatum = {
  label: string;
  primary: number;
  secondary?: number;
};

type BreakdownDatum = {
  label: string;
  value: number;
  tone: "teal" | "mint" | "amber" | "rose";
};

type BarDatum = {
  label: string;
  value: number;
  note?: string;
};

type TableColumn<T> = {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
};

const LOCALE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  ml: "ml-IN",
  ta: "ta-IN",
} as const;

const CHART_TONES = {
  teal: "#0EA5A4",
  mint: "#14B8A6",
  amber: "#F59E0B",
  rose: "#F97316",
} as const;

const zeroSummary = {
  date: "",
  totalSchedules: 0,
  totalSlots: 0,
  bookedSlots: 0,
  availableSlots: 0,
};

function startOfDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatShortDate(value: string, language: keyof typeof LOCALE_MAP) {
  const date = startOfDay(value);
  if (!date) return "--";
  return new Intl.DateTimeFormat(LOCALE_MAP[language], {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatTableDate(value: string, language: keyof typeof LOCALE_MAP) {
  const date = startOfDay(value);
  if (!date) return "--";
  return new Intl.DateTimeFormat(LOCALE_MAP[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function monthKey(value: string) {
  const date = startOfDay(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(value: string) {
  const date = startOfDay(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function getLastMonths(language: keyof typeof LOCALE_MAP, count: number) {
  const base = new Date();
  base.setDate(1);
  base.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const next = new Date(base);
    next.setMonth(base.getMonth() - (count - index - 1));
    const key = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(LOCALE_MAP[language], { month: "short" }).format(next);
    return { key, label };
  });
}

function getLastDays(language: keyof typeof LOCALE_MAP, count: number) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const next = new Date(base);
    next.setDate(base.getDate() - (count - index - 1));
    const key = next.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat(LOCALE_MAP[language], { weekday: "short" }).format(next);
    return { key, label };
  });
}

function getStatusTone(status: string) {
  if (status === "approved" || status === "COMPLETED") return "success" as const;
  if (status === "pending" || status === "CALLING") return "warning" as const;
  if (status === "rejected") return "error" as const;
  return "info" as const;
}

function getTokenStatusLabel(status: PatientTokenStatus, copy: RoleCopy) {
  if (status === "COMPLETED") return copy.labels.consultations;
  if (status === "CALLING") return copy.labels.booked;
  return copy.labels.available;
}

function buildMonthlyRegistrationTrend(
  language: keyof typeof LOCALE_MAP,
  doctors: MockUser[],
  hospitals: MockUser[]
): TrendDatum[] {
  const months = getLastMonths(language, 6);
  const doctorCounts = new Map<string, number>();
  const hospitalCounts = new Map<string, number>();

  doctors.forEach((doctor) => {
    const key = monthKey(doctor.registrationDate || "");
    if (!key) return;
    doctorCounts.set(key, (doctorCounts.get(key) || 0) + 1);
  });

  hospitals.forEach((hospital) => {
    const key = monthKey(hospital.registrationDate || "");
    if (!key) return;
    hospitalCounts.set(key, (hospitalCounts.get(key) || 0) + 1);
  });

  return months.map((month) => ({
    label: month.label,
    primary: doctorCounts.get(month.key) || 0,
    secondary: hospitalCounts.get(month.key) || 0,
  }));
}

function buildDailyCountTrend(
  language: keyof typeof LOCALE_MAP,
  items: Array<{ date?: string | null }>,
  count: number
): TrendDatum[] {
  const days = getLastDays(language, count);
  const totals = new Map<string, number>();

  items.forEach((item) => {
    const key = dayKey(item.date || "");
    if (!key) return;
    totals.set(key, (totals.get(key) || 0) + 1);
  });

  return days.map((day) => ({
    label: day.label,
    primary: totals.get(day.key) || 0,
  }));
}

function buildDailyTokenTrend(
  language: keyof typeof LOCALE_MAP,
  schedules: DoctorScheduleRecord[],
  tokens: PatientTokenRecord[],
  count: number
): TrendDatum[] {
  const days = getLastDays(language, count);
  const bookedMap = new Map<string, number>();
  const capacityMap = new Map<string, number>();

  schedules.forEach((schedule) => {
    const key = dayKey(schedule.date);
    if (!key) return;
    capacityMap.set(key, (capacityMap.get(key) || 0) + schedule.slots.length);
    bookedMap.set(
      key,
      (bookedMap.get(key) || 0) + schedule.slots.filter((slot) => slot.isBooked).length
    );
  });

  tokens.forEach((token) => {
    const key = dayKey(token.date);
    if (!key) return;
    bookedMap.set(key, Math.max(bookedMap.get(key) || 0, 0));
  });

  return days.map((day) => ({
    label: day.label,
    primary: bookedMap.get(day.key) || 0,
    secondary: capacityMap.get(day.key) || 0,
  }));
}

function buildApprovalBreakdown(doctors: MockUser[], hospitals: MockUser[]): BreakdownDatum[] {
  const all = [...doctors, ...hospitals];
  const approved = all.filter((item) => item.approvalStatus === "approved").length;
  const pending = all.filter((item) => item.approvalStatus === "pending").length;
  const rejected = all.filter((item) => item.approvalStatus === "rejected").length;

  return [
    { label: "Approved", value: approved, tone: "teal" },
    { label: "Pending", value: pending, tone: "amber" },
    { label: "Rejected", value: rejected, tone: "rose" },
  ];
}

function buildTokenBreakdown(tokens: PatientTokenRecord[]): BreakdownDatum[] {
  return [
    { label: "Not Started", value: tokens.filter((token) => token.status === "NOT_STARTED").length, tone: "mint" },
    { label: "Calling", value: tokens.filter((token) => token.status === "CALLING").length, tone: "amber" },
    { label: "Completed", value: tokens.filter((token) => token.status === "COMPLETED").length, tone: "teal" },
  ];
}

function buildDepartmentBars(tokens: PatientTokenRecord[], limit = 5): BarDatum[] {
  const counts = new Map<string, number>();

  tokens.forEach((token) => {
    const key = localizeDepartmentName(token.department, token.displayDepartment);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function buildAdminRecentActivity(doctors: MockUser[], hospitals: MockUser[], copy: RoleCopy): AdminActivityRow[] {
  const latestDoctors = doctors
    .slice()
    .sort((left, right) => (right.registrationDate || "").localeCompare(left.registrationDate || ""))
    .slice(0, 4)
    .map((doctor) => ({
      id: `doctor-${doctor.id}`,
      title: doctor.displayFullName || doctor.fullName,
      entity: copy.admin.doctorRegistration,
      status: doctor.approvalStatus,
      date: doctor.registrationDate || "",
    }));

  const latestHospitalApprovals = hospitals
    .filter((hospital) => hospital.approvalStatus === "approved")
    .sort((left, right) => (right.registrationDate || "").localeCompare(left.registrationDate || ""))
    .slice(0, 4)
    .map((hospital) => ({
      id: `hospital-${hospital.id}`,
      title: hospital.displayHospitalName || hospital.displayFullName || hospital.fullName,
      entity: copy.admin.hospitalApproval,
      status: hospital.approvalStatus,
      date: hospital.registrationDate || "",
    }));

  return [...latestDoctors, ...latestHospitalApprovals]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 6);
}

function MetricCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <Card className="border-[#DCE9EE] p-4 shadow-sm transition hover:border-[#0EA5A4]/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-[#0F172A]">{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
          {icon}
        </span>
      </div>
    </Card>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block rounded-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5A4] focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

function SectionCard({
  eyebrow,
  title,
  subtitle,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-[#DCE9EE] p-4 shadow-sm ${className || ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0EA5A4]">{eyebrow}</p> : null}
          <h2 className="mt-1 text-lg font-semibold text-[#0F172A]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="pt-4">{children}</div>
    </Card>
  );
}

function TrendChart({
  data,
  primaryLabel,
  secondaryLabel,
  noDataLabel,
}: {
  data: TrendDatum[];
  primaryLabel: string;
  secondaryLabel?: string;
  noDataLabel: string;
}) {
  const width = 520;
  const height = 220;
  const padding = 20;
  const values = data.flatMap((item) => [item.primary, item.secondary || 0]);
  const maxValue = Math.max(...values, 0);

  if (!data.length || maxValue === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-[#94A3B8]">{noDataLabel}</div>;
  }

  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const scaleY = (value: number) => height - padding - (value / maxValue) * (height - padding * 2);

  const primaryPoints = data
    .map((item, index) => `${padding + index * xStep},${scaleY(item.primary)}`)
    .join(" ");
  const primaryArea = `${padding},${height - padding} ${primaryPoints} ${padding + (data.length - 1) * xStep},${height - padding}`;

  const secondaryPoints = secondaryLabel
    ? data.map((item, index) => `${padding + index * xStep},${scaleY(item.secondary || 0)}`).join(" ")
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#64748B]">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#0EA5A4]" />
          {primaryLabel}
        </span>
        {secondaryLabel ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#94A3B8]" />
            {secondaryLabel}
          </span>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" role="img" aria-label={primaryLabel}>
        {[0, 0.5, 1].map((tick) => {
          const y = padding + tick * (height - padding * 2);
          return <line key={tick} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E2E8F0" strokeDasharray="4 6" />;
        })}
        <polygon points={primaryArea} fill="#CCFBF1" opacity="0.9" />
        <polyline fill="none" stroke="#0EA5A4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={primaryPoints} />
        {secondaryLabel ? (
          <polyline fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={secondaryPoints} />
        ) : null}
        {data.map((item, index) => {
          const x = padding + index * xStep;
          return (
            <g key={`${item.label}-${index}`}>
              <circle cx={x} cy={scaleY(item.primary)} r="4" fill="#0EA5A4" />
              {secondaryLabel ? <circle cx={x} cy={scaleY(item.secondary || 0)} r="3.5" fill="#94A3B8" /> : null}
              <text x={x} y={height - 2} textAnchor="middle" className="fill-[#64748B] text-[11px]">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({
  data,
  centerValue,
  centerLabel,
  noDataLabel,
}: {
  data: BreakdownDatum[];
  centerValue: string;
  centerLabel: string;
  noDataLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
      <div className="relative mx-auto flex size-[180px] items-center justify-center">
        {total === 0 ? (
          <div className="text-center text-sm text-[#94A3B8]">{noDataLabel}</div>
        ) : (
          <>
            <svg viewBox="0 0 140 140" className="size-[180px] -rotate-90">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="14" />
              {data.map((item) => {
                const length = total === 0 ? 0 : (item.value / total) * circumference;
                const dashArray = `${length} ${circumference - length}`;
                const dashOffset = -offset;
                offset += length;
                return (
                  <circle
                    key={item.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={CHART_TONES[item.tone]}
                    strokeWidth="14"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-[#0F172A]">{centerValue}</span>
              <span className="mt-1 text-xs uppercase tracking-[0.12em] text-[#64748B]">{centerLabel}</span>
            </div>
          </>
        )}
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#FCFEFF] px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_TONES[item.tone] }} />
              <span className="text-sm font-medium text-[#0F172A]">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarList({ data, noDataLabel }: { data: BarDatum[]; noDataLabel: string }) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  if (!data.length || maxValue === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-[#94A3B8]">{noDataLabel}</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#0F172A]">{item.label}</p>
              {item.note ? <p className="text-xs text-[#64748B]">{item.note}</p> : null}
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-[#E6F7F6]">
            <div
              className="h-2 rounded-full bg-[#0EA5A4]"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 10)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DataTable<T>({
  columns,
  rows,
  emptyLabel,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  emptyLabel: string;
}) {
  if (!rows.length) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-[#94A3B8]">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#E2E8F0]">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-0 py-3 text-xs font-medium uppercase tracking-[0.12em] text-[#64748B] ${column.align === "right" ? "text-right" : "text-left"}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF4F7]">
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-0 py-4 align-top text-sm text-[#0F172A] ${column.align === "right" ? "text-right" : "text-left"}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardPageContent() {
  const { currentUser } = useDashboardContext();
  const { language } = useI18n();
  const copy = dashboardCopy[language] || dashboardCopy.en;
  const today = todayDateString();

  const [adminDoctors, setAdminDoctors] = React.useState<MockUser[]>([]);
  const [adminHospitals, setAdminHospitals] = React.useState<MockUser[]>([]);
  const [hospitalSelections, setHospitalSelections] = React.useState<HospitalSelection[]>([]);
  const [doctorSelections, setDoctorSelections] = React.useState<HospitalSelection[]>([]);
  const [approvedDoctors, setApprovedDoctors] = React.useState<MockUser[]>([]);
  const [hospitalSchedules, setHospitalSchedules] = React.useState<DoctorScheduleRecord[]>([]);
  const [doctorSchedules, setDoctorSchedulesState] = React.useState<DoctorScheduleRecord[]>([]);
  const [hospitalTokens, setHospitalTokens] = React.useState<PatientTokenRecord[]>([]);
  const [doctorTokens, setDoctorTokens] = React.useState<PatientTokenRecord[]>([]);
  const [todaySummary, setTodaySummary] = React.useState(zeroSummary);

  React.useEffect(() => {
    let active = true;

    async function loadAdminData() {
      try {
        const [doctors, hospitals] = await Promise.all([getAdminDoctors(), getAdminHospitals()]);
        if (!active) return;
        setAdminDoctors(doctors);
        setAdminHospitals(hospitals);
      } catch {
        if (!active) return;
        setAdminDoctors([]);
        setAdminHospitals([]);
      }
    }

    async function loadHospitalData() {
      try {
        const [selections, doctors, bootstrap, schedules, summary, tokens] = await Promise.all([
          getSelectionsForHospital(currentUser.id).catch(() => []),
          getApprovedDoctorsForHospital(currentUser.id).catch(() => []),
          getScheduleBootstrap().catch(() => ({
            doctors: [] as Array<{
              id?: string;
              userId?: string;
              name: string;
              department: string;
              email?: string;
            }>,
          })),
          getDoctorSchedules().catch(() => []),
          getScheduleSummary(today).catch(() => zeroSummary),
          getPatientTokens().catch(() => []),
        ]);

        if (!active) return;

        const selectionMap = new Map<string, HospitalSelection>();
        selections.forEach((selection) => selectionMap.set(selection.doctorId, selection));

        (bootstrap.doctors || []).forEach((doctor) => {
          const doctorId = doctor.userId || doctor.id;
          if (!doctorId || selectionMap.has(doctorId)) return;
          selectionMap.set(doctorId, {
            id: `${doctorId}:${currentUser.id}:approved-bootstrap`,
            doctorId,
            hospitalId: currentUser.id,
            status: "approved",
            requestedAt: today,
          });
        });

        schedules.forEach((schedule) => {
          if (!schedule.doctorId || selectionMap.has(schedule.doctorId)) return;
          selectionMap.set(schedule.doctorId, {
            id: `${schedule.doctorId}:${currentUser.id}:approved-schedule`,
            doctorId: schedule.doctorId,
            hospitalId: currentUser.id,
            status: "approved",
            requestedAt: today,
          });
        });

        const doctorMap = new Map<string, MockUser>();
        doctors.forEach((doctor) => doctorMap.set(doctor.id, doctor));

        (bootstrap.doctors || []).forEach((doctor) => {
          const doctorId = doctor.userId || doctor.id;
          if (!doctorId || doctorMap.has(doctorId)) return;
          doctorMap.set(doctorId, {
            id: doctorId,
            role: "doctor",
            fullName: doctor.name,
            email: doctor.email || "",
            department: doctor.department,
            approvalStatus: "approved",
            registrationDate: today,
          });
        });

        schedules.forEach((schedule) => {
          if (!schedule.doctorId || doctorMap.has(schedule.doctorId)) return;
          doctorMap.set(schedule.doctorId, {
            id: schedule.doctorId,
            role: "doctor",
            fullName: schedule.displayDoctorName || schedule.doctorName,
            email: "",
            department: schedule.department,
            displayDepartment: schedule.displayDepartment,
            approvalStatus: "approved",
            registrationDate: schedule.date,
          });
        });

        setHospitalSelections(Array.from(selectionMap.values()));
        setApprovedDoctors(Array.from(doctorMap.values()));
        setHospitalSchedules(schedules);
        setHospitalTokens(tokens);
        setTodaySummary(summary);
      } catch {
        if (!active) return;
        setHospitalSelections([]);
        setApprovedDoctors([]);
        setHospitalSchedules([]);
        setHospitalTokens([]);
        setTodaySummary(zeroSummary);
      }
    }

    async function loadDoctorData() {
      try {
        const [selections, schedules, tokens] = await Promise.all([
          getSelectionsForDoctor(currentUser.id).catch(() => []),
          getDoctorSchedules({ doctorId: currentUser.id }).catch(() => []),
          getPatientTokens({ doctorId: currentUser.id }).catch(() => []),
        ]);

        if (!active) return;
        setDoctorSelections(selections);
        setDoctorSchedulesState(schedules);
        setDoctorTokens(tokens);
      } catch {
        if (!active) return;
        setDoctorSelections([]);
        setDoctorSchedulesState([]);
        setDoctorTokens([]);
      }
    }

    if (currentUser.role === "admin") {
      void loadAdminData();
    }

    if (currentUser.role === "hospital") {
      void loadHospitalData();
    }

    if (currentUser.role === "doctor") {
      void loadDoctorData();
    }

    return () => {
      active = false;
    };
  }, [currentUser, today]);

  if (currentUser.role === "admin") {
    const pendingDoctorApprovals = adminDoctors.filter((user) => user.approvalStatus === "pending");
    const pendingHospitalApprovals = adminHospitals.filter((user) => user.approvalStatus === "pending");
    const registrationTrend = buildMonthlyRegistrationTrend(language, adminDoctors, adminHospitals);
    const approvalBreakdown = buildApprovalBreakdown(adminDoctors, adminHospitals);
    const recentActivity = buildAdminRecentActivity(adminDoctors, adminHospitals, copy);

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={copy.admin.pendingDoctorApprovals} value={String(pendingDoctorApprovals.length)} icon={<ShieldAlert className="size-5" />} href="/dashboard/doctors?status=pending" />
          <MetricCard label={copy.admin.pendingHospitalApprovals} value={String(pendingHospitalApprovals.length)} icon={<Hospital className="size-5" />} href="/dashboard/hospitals?status=pending" />
          <MetricCard label={copy.admin.totalDoctors} value={String(adminDoctors.length)} icon={<Stethoscope className="size-5" />} href="/dashboard/doctors" />
          <MetricCard label={copy.admin.totalHospitals} value={String(adminHospitals.length)} icon={<Building2 className="size-5" />} href="/dashboard/hospitals" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <SectionCard eyebrow={copy.labels.analytics} title={copy.admin.registrationTrends} subtitle={copy.admin.registrationsFootnote}>
            <TrendChart
              data={registrationTrend}
              primaryLabel={copy.admin.totalDoctors}
              secondaryLabel={copy.admin.totalHospitals}
              noDataLabel={copy.labels.noData}
            />
          </SectionCard>
          <SectionCard eyebrow={copy.labels.analytics} title={copy.admin.approvalDistribution} subtitle={copy.admin.approvalFootnote}>
            <DonutChart
              data={approvalBreakdown}
              centerValue={String(adminDoctors.length + adminHospitals.length)}
              centerLabel={copy.labels.entity}
              noDataLabel={copy.labels.noData}
            />
          </SectionCard>
        </section>

        <SectionCard
          eyebrow={copy.labels.activity}
          title={copy.admin.recentActivity}
          subtitle={copy.admin.recentActivityFootnote}
          action={
            <Link href="/dashboard/doctors" className="inline-flex items-center gap-1 text-sm font-medium text-[#0EA5A4]">
              {copy.labels.viewAll}
              <ChevronRight className="size-4" />
            </Link>
          }
        >
          <DataTable
            rows={recentActivity}
            emptyLabel={copy.labels.noData}
            columns={[
              {
                key: "title",
                label: copy.labels.entity,
                render: (row) => (
                  <div>
                    <p className="font-medium text-[#0F172A]">{row.title}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{row.entity}</p>
                  </div>
                ),
              },
              {
                key: "status",
                label: copy.labels.status,
                render: (row) => <Badge variant={getStatusTone(row.status)}>{row.status}</Badge>,
              },
              {
                key: "date",
                label: copy.labels.date,
                align: "right",
                render: (row) => formatTableDate(row.date, language),
              },
            ]}
          />
        </SectionCard>
      </div>
    );
  }

  if (currentUser.role === "hospital") {
    const pendingApprovals = hospitalSelections.filter((selection) => selection.status === "pending");
    const todayTokens = hospitalTokens.filter((token) => token.date === today);
    const patientFlowTrend = buildDailyCountTrend(
      language,
      hospitalTokens.map((token) => ({ date: token.date })),
      7
    );
    const tokenBreakdown = buildTokenBreakdown(todayTokens);
    const departmentBars = buildDepartmentBars(todayTokens.length ? todayTokens : hospitalTokens);
    const doctorAvailabilityRows = approvedDoctors
      .map((doctor) => {
        const schedules = hospitalSchedules.filter((schedule) => schedule.doctorId === doctor.id && schedule.date === today);
        const availableSlots = schedules.reduce(
          (sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length,
          0
        );
        const bookedSlots = schedules.reduce(
          (sum, schedule) => sum + schedule.slots.filter((slot) => slot.isBooked).length,
          0
        );

        return {
          id: doctor.id,
          doctor: doctor.displayFullName || doctor.fullName,
          department: localizeDepartmentName(doctor.department, doctor.displayDepartment),
          availableSlots,
          bookedSlots,
        };
      })
      .sort((left, right) => right.bookedSlots - left.bookedSlots)
      .slice(0, 6);

    const recentEntries = hospitalTokens
      .slice()
      .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`))
      .slice(0, 6);

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard label={copy.hospital.activeDoctors} value={String(approvedDoctors.length)} icon={<Users className="size-5" />} href="/dashboard/doctors" />
          <MetricCard label={copy.hospital.todaysTokens} value={String(todayTokens.length || todaySummary.bookedSlots)} icon={<Ticket className="size-5" />} href="/dashboard/patient-entry" />
          <MetricCard label={copy.hospital.pendingApprovals} value={String(pendingApprovals.length)} icon={<ShieldAlert className="size-5" />} href="/dashboard/doctors" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <SectionCard eyebrow={copy.labels.analytics} title={copy.hospital.dailyPatientFlow} subtitle={copy.hospital.patientFlowFootnote}>
            <TrendChart
              data={buildDailyTokenTrend(language, hospitalSchedules, hospitalTokens, 7)}
              primaryLabel={copy.labels.booked}
              secondaryLabel={copy.labels.available}
              noDataLabel={copy.labels.noData}
            />
          </SectionCard>
          <SectionCard eyebrow={copy.labels.analytics} title={copy.hospital.tokenDistribution} subtitle={copy.hospital.tokenDistributionFootnote}>
            <DonutChart
              data={tokenBreakdown}
              centerValue={String(todayTokens.length || todaySummary.bookedSlots)}
              centerLabel={copy.labels.tokens}
              noDataLabel={copy.labels.noData}
            />
          </SectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <SectionCard eyebrow={copy.labels.analytics} title={copy.hospital.departmentActivity} subtitle={copy.hospital.departmentActivityFootnote}>
            <BarList data={departmentBars} noDataLabel={copy.labels.noData} />
          </SectionCard>
          <SectionCard eyebrow={copy.labels.activity} title={copy.hospital.doctorAvailability} subtitle={copy.hospital.doctorAvailabilityFootnote}>
            <DataTable
              rows={doctorAvailabilityRows}
              emptyLabel={copy.labels.noData}
              columns={[
                {
                  key: "doctor",
                  label: copy.labels.doctor,
                  render: (row) => (
                    <div>
                      <p className="font-medium text-[#0F172A]">{row.doctor}</p>
                      <p className="mt-1 text-xs text-[#64748B]">{row.department}</p>
                    </div>
                  ),
                },
                {
                  key: "availableSlots",
                  label: copy.labels.available,
                  align: "right",
                  render: (row) => row.availableSlots,
                },
                {
                  key: "bookedSlots",
                  label: copy.labels.booked,
                  align: "right",
                  render: (row) => row.bookedSlots,
                },
              ]}
            />
          </SectionCard>
        </section>

        <SectionCard eyebrow={copy.labels.activity} title={copy.hospital.recentPatientEntries} subtitle={copy.hospital.recentPatientEntriesFootnote}>
          <DataTable
            rows={recentEntries}
            emptyLabel={copy.labels.noRecent}
            columns={[
              {
                key: "patient",
                label: copy.labels.patient,
                render: (row) => (
                  <div>
                    <p className="font-medium text-[#0F172A]">{row.displayPatientName || row.patientName}</p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {localizeDepartmentName(row.department, row.displayDepartment)}
                    </p>
                  </div>
                ),
              },
              {
                key: "doctor",
                label: copy.labels.doctor,
                render: (row) => row.displayDoctorName || row.doctorName,
              },
              {
                key: "status",
                label: copy.labels.status,
                render: (row) => <Badge variant={getStatusTone(row.status)}>{row.status}</Badge>,
              },
              {
                key: "date",
                label: copy.labels.date,
                align: "right",
                render: (row) => `${formatShortDate(row.date, language)} · ${row.time}`,
              },
            ]}
          />
        </SectionCard>
      </div>
    );
  }

  const approvedSelections = doctorSelections.filter((selection) => selection.status === "approved");
  const pendingSelections = doctorSelections.filter((selection) => selection.status === "pending");
  const todayConsultations = doctorTokens.filter((token) => token.date === today);
  const upcomingSchedules = doctorSchedules
    .filter((schedule) => schedule.date >= today)
    .sort((left, right) => `${left.date} ${left.startTime || ""}`.localeCompare(`${right.date} ${right.startTime || ""}`))
    .slice(0, 6);
  const recentAppointments = doctorTokens
    .slice()
    .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label={copy.doctor.activeHospitals} value={String(approvedSelections.length)} icon={<Building2 className="size-5" />} href="/dashboard/hospitals" />
        <MetricCard label={copy.doctor.pendingRequests} value={String(pendingSelections.length)} icon={<Clock3 className="size-5" />} href="/dashboard/hospitals" />
        <MetricCard label={copy.doctor.todaysConsultations} value={String(todayConsultations.length)} icon={<CalendarClock className="size-5" />} href="/dashboard/doctor-schedule" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <SectionCard eyebrow={copy.labels.analytics} title={copy.doctor.patientVisitTrends} subtitle={copy.doctor.patientVisitFootnote}>
          <TrendChart
            data={buildDailyCountTrend(language, doctorTokens.map((token) => ({ date: token.date })), 7)}
            primaryLabel={copy.labels.patient}
            noDataLabel={copy.labels.noData}
          />
        </SectionCard>
        <SectionCard eyebrow={copy.labels.analytics} title={copy.doctor.consultationAnalytics} subtitle={copy.doctor.consultationFootnote}>
          <DonutChart
            data={buildTokenBreakdown(todayConsultations.length ? todayConsultations : doctorTokens)}
            centerValue={String(todayConsultations.length)}
            centerLabel={copy.labels.consultations}
            noDataLabel={copy.labels.noData}
          />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard eyebrow={copy.labels.activity} title={copy.doctor.upcomingSchedules} subtitle={copy.doctor.upcomingSchedulesFootnote}>
          <DataTable
            rows={upcomingSchedules}
            emptyLabel={copy.labels.noUpcoming}
            columns={[
              {
                key: "date",
                label: copy.labels.date,
                render: (row) => (
                  <div>
                    <p className="font-medium text-[#0F172A]">{formatTableDate(row.date, language)}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{row.startTime || "--"} - {row.endTime || "--"}</p>
                  </div>
                ),
              },
              {
                key: "department",
                label: copy.labels.department,
                render: (row) => localizeDepartmentName(row.department, row.displayDepartment),
              },
              {
                key: "slots",
                label: copy.labels.available,
                align: "right",
                render: (row) => row.slots.filter((slot) => !slot.isBooked).length,
              },
            ]}
          />
        </SectionCard>
        <SectionCard eyebrow={copy.labels.activity} title={copy.doctor.recentAppointments} subtitle={copy.doctor.recentAppointmentsFootnote}>
          <DataTable
            rows={recentAppointments}
            emptyLabel={copy.labels.noRecent}
            columns={[
              {
                key: "patient",
                label: copy.labels.patient,
                render: (row) => (
                  <div>
                    <p className="font-medium text-[#0F172A]">{row.displayPatientName || row.patientName}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{localizeDepartmentName(row.department, row.displayDepartment)}</p>
                  </div>
                ),
              },
              {
                key: "status",
                label: copy.labels.status,
                render: (row) => <Badge variant={getStatusTone(row.status)}>{row.status}</Badge>,
              },
              {
                key: "date",
                label: copy.labels.date,
                align: "right",
                render: (row) => `${formatShortDate(row.date, language)} · ${row.time}`,
              },
            ]}
          />
        </SectionCard>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}

const dashboardCopy: Record<string, RoleCopy> = {
  en: {
    labels: {
      kpis: "KPIs",
      analytics: "Analytics",
      activity: "Operations",
      noData: "No analytics data available yet.",
      viewAll: "View all",
      noUpcoming: "No upcoming schedules available.",
      noRecent: "No recent activity available.",
      status: "Status",
      date: "Date",
      entity: "Entity",
      department: "Department",
      doctor: "Doctor",
      patient: "Patient",
      hospital: "Hospital",
      tokens: "Tokens",
      available: "Available",
      booked: "Booked",
      consultations: "Completed",
    },
    admin: {
      pendingDoctorApprovals: "Pending Doctor Approvals",
      pendingHospitalApprovals: "Pending Hospital Approvals",
      totalDoctors: "Total Doctors",
      totalHospitals: "Total Hospitals",
      registrationTrends: "Registration Trends",
      registrationsFootnote: "Monthly doctor and hospital onboarding volume.",
      approvalDistribution: "Approval Distribution",
      approvalFootnote: "Current approval mix across platform accounts.",
      recentActivity: "Recent Activity",
      recentActivityFootnote: "Latest doctor registrations and hospital approvals.",
      doctorRegistration: "Doctor registration",
      hospitalApproval: "Hospital approval",
    },
    hospital: {
      activeDoctors: "Active Doctors",
      todaysTokens: "Today's Tokens",
      pendingApprovals: "Pending Approvals",
      dailyPatientFlow: "Daily Patient Flow",
      patientFlowFootnote: "Booked slots against total daily schedule capacity.",
      departmentActivity: "Department Activity",
      departmentActivityFootnote: "Highest token volume by department.",
      tokenDistribution: "Token Distribution",
      tokenDistributionFootnote: "Current queue progression for today's tokens.",
      doctorAvailability: "Doctor Availability",
      doctorAvailabilityFootnote: "Today’s capacity and booked load by doctor.",
      recentPatientEntries: "Recent Patient Entries",
      recentPatientEntriesFootnote: "Latest token registrations and queue movement.",
    },
    doctor: {
      activeHospitals: "Active Hospitals",
      pendingRequests: "Pending Requests",
      todaysConsultations: "Today's Consultations",
      patientVisitTrends: "Patient Visit Trends",
      patientVisitFootnote: "Daily patient appointments over the last week.",
      consultationAnalytics: "Consultation Analytics",
      consultationFootnote: "Status mix for today’s and recent consultations.",
      upcomingSchedules: "Upcoming Schedules",
      upcomingSchedulesFootnote: "Next scheduled clinic windows and remaining capacity.",
      recentAppointments: "Recent Appointments",
      recentAppointmentsFootnote: "Most recent patient tokens handled by your schedule.",
    },
  },
  hi: {
    labels: {
      kpis: "केपीआई",
      analytics: "एनालिटिक्स",
      activity: "संचालन",
      noData: "अभी एनालिटिक्स डेटा उपलब्ध नहीं है।",
      viewAll: "सभी देखें",
      noUpcoming: "कोई आगामी शेड्यूल उपलब्ध नहीं है।",
      noRecent: "कोई हाल की गतिविधि उपलब्ध नहीं है।",
      status: "स्थिति",
      date: "तारीख",
      entity: "रिकॉर्ड",
      department: "विभाग",
      doctor: "डॉक्टर",
      patient: "मरीज",
      hospital: "अस्पताल",
      tokens: "टोकन",
      available: "उपलब्ध",
      booked: "बुक्ड",
      consultations: "पूर्ण",
    },
    admin: {
      pendingDoctorApprovals: "लंबित डॉक्टर अनुमोदन",
      pendingHospitalApprovals: "लंबित अस्पताल अनुमोदन",
      totalDoctors: "कुल डॉक्टर",
      totalHospitals: "कुल अस्पताल",
      registrationTrends: "पंजीकरण रुझान",
      registrationsFootnote: "मासिक डॉक्टर और अस्पताल ऑनबोर्डिंग।",
      approvalDistribution: "अनुमोदन वितरण",
      approvalFootnote: "सभी खातों की वर्तमान स्थिति।",
      recentActivity: "हाल की गतिविधि",
      recentActivityFootnote: "नवीनतम डॉक्टर पंजीकरण और अस्पताल अनुमोदन।",
      doctorRegistration: "डॉक्टर पंजीकरण",
      hospitalApproval: "अस्पताल अनुमोदन",
    },
    hospital: {
      activeDoctors: "सक्रिय डॉक्टर",
      todaysTokens: "आज के टोकन",
      pendingApprovals: "लंबित अनुमोदन",
      dailyPatientFlow: "दैनिक मरीज प्रवाह",
      patientFlowFootnote: "बुक्ड स्लॉट बनाम कुल दैनिक क्षमता।",
      departmentActivity: "विभाग गतिविधि",
      departmentActivityFootnote: "विभाग अनुसार टोकन वॉल्यूम।",
      tokenDistribution: "टोकन वितरण",
      tokenDistributionFootnote: "आज की कतार की प्रगति।",
      doctorAvailability: "डॉक्टर उपलब्धता",
      doctorAvailabilityFootnote: "आज की क्षमता और बुक्ड लोड।",
      recentPatientEntries: "हाल की मरीज प्रविष्टियाँ",
      recentPatientEntriesFootnote: "नवीनतम टोकन और कतार गतिविधि।",
    },
    doctor: {
      activeHospitals: "सक्रिय अस्पताल",
      pendingRequests: "लंबित अनुरोध",
      todaysConsultations: "आज की परामर्श संख्या",
      patientVisitTrends: "मरीज विजिट रुझान",
      patientVisitFootnote: "पिछले सप्ताह की दैनिक अपॉइंटमेंट्स।",
      consultationAnalytics: "परामर्श एनालिटिक्स",
      consultationFootnote: "आज और हाल की परामर्श स्थिति।",
      upcomingSchedules: "आगामी शेड्यूल",
      upcomingSchedulesFootnote: "अगले क्लिनिक स्लॉट और शेष क्षमता।",
      recentAppointments: "हाल की अपॉइंटमेंट्स",
      recentAppointmentsFootnote: "आपके शेड्यूल के नवीनतम टोकन।",
    },
  },
  ml: {
    labels: {
      kpis: "കെപിഐ",
      analytics: "അനലിറ്റിക്സ്",
      activity: "ഓപ്പറേഷൻസ്",
      noData: "ഇപ്പോൾ അനലിറ്റിക്സ് ഡാറ്റ ലഭ്യമല്ല.",
      viewAll: "എല്ലാം കാണുക",
      noUpcoming: "വരാനിരിക്കുന്ന ഷെഡ്യൂളുകളില്ല.",
      noRecent: "സമീപകാല പ്രവർത്തനം ഇല്ല.",
      status: "സ്ഥിതി",
      date: "തീയതി",
      entity: "റെക്കോർഡ്",
      department: "വിഭാഗം",
      doctor: "ഡോക്ടർ",
      patient: "രോഗി",
      hospital: "ആശുപത്രി",
      tokens: "ടോക്കണുകൾ",
      available: "ലഭ്യം",
      booked: "ബുക്ക് ചെയ്തത്",
      consultations: "പൂർത്തിയായി",
    },
    admin: {
      pendingDoctorApprovals: "ബാക്കി ഡോക്ടർ അംഗീകാരങ്ങൾ",
      pendingHospitalApprovals: "ബാക്കി ആശുപത്രി അംഗീകാരങ്ങൾ",
      totalDoctors: "ആകെ ഡോക്ടർമാർ",
      totalHospitals: "ആകെ ആശുപത്രികൾ",
      registrationTrends: "രജിസ്ട്രേഷൻ പ്രവണതകൾ",
      registrationsFootnote: "മാസാന്ത്യ ഡോക്ടർ, ആശുപത്രി ഓൺബോർഡിംഗ്.",
      approvalDistribution: "അംഗീകാര വിതരണം",
      approvalFootnote: "പ്ലാറ്റ്ഫോമിലെ അക്കൗണ്ട് നില വിതരണം.",
      recentActivity: "സമീപകാല പ്രവർത്തനം",
      recentActivityFootnote: "പുതിയ ഡോക്ടർ രജിസ്ട്രേഷനും ആശുപത്രി അംഗീകാരവും.",
      doctorRegistration: "ഡോക്ടർ രജിസ്ട്രേഷൻ",
      hospitalApproval: "ആശുപത്രി അംഗീകാരം",
    },
    hospital: {
      activeDoctors: "സജീവ ഡോക്ടർമാർ",
      todaysTokens: "ഇന്നത്തെ ടോക്കണുകൾ",
      pendingApprovals: "ബാക്കി അംഗീകാരങ്ങൾ",
      dailyPatientFlow: "ദൈനംദിന രോഗി പ്രവാഹം",
      patientFlowFootnote: "ബുക്ക് ചെയ്ത സ്ലോട്ടുകൾ vs ദിവസ ശേഷി.",
      departmentActivity: "വിഭാഗ പ്രവർത്തനം",
      departmentActivityFootnote: "വിഭാഗം അനുസരിച്ചുള്ള ടോക്കൺ വോള്യം.",
      tokenDistribution: "ടോക്കൺ വിതരണം",
      tokenDistributionFootnote: "ഇന്നത്തെ ക്യൂ പുരോഗതി.",
      doctorAvailability: "ഡോക്ടർ ലഭ്യത",
      doctorAvailabilityFootnote: "ഇന്നത്തെ ശേഷിയും ബുക്ക്ഡ് ലോഡും.",
      recentPatientEntries: "സമീപകാല രോഗി എൻട്രികൾ",
      recentPatientEntriesFootnote: "പുതിയ ടോക്കണുകളും ക്യൂ ചലനങ്ങളും.",
    },
    doctor: {
      activeHospitals: "സജീവ ആശുപത്രികൾ",
      pendingRequests: "ബാക്കി അഭ്യർത്ഥനകൾ",
      todaysConsultations: "ഇന്നത്തെ കൺസൾട്ടേഷൻസ്",
      patientVisitTrends: "രോഗി സന്ദർശന പ്രവണത",
      patientVisitFootnote: "കഴിഞ്ഞ ആഴ്ചയിലെ ദിനംപ്രതി അപ്പോയിന്റ്മെന്റുകൾ.",
      consultationAnalytics: "കൺസൾട്ടേഷൻ അനലിറ്റിക്സ്",
      consultationFootnote: "ഇന്നത്തെയും സമീപകാലത്തെയും കൺസൾട്ടേഷൻ നില.",
      upcomingSchedules: "വരാനിരിക്കുന്ന ഷെഡ്യൂളുകൾ",
      upcomingSchedulesFootnote: "അടുത്ത ക്ലിനിക് വിൻഡോകളും ശേഷിയും.",
      recentAppointments: "സമീപകാല അപ്പോയിന്റ്മെന്റുകൾ",
      recentAppointmentsFootnote: "നിങ്ങളുടെ ഷെഡ്യൂളിലെ പുതിയ ടോക്കണുകൾ.",
    },
  },
  ta: {
    labels: {
      kpis: "கேபிஐ",
      analytics: "பகுப்பாய்வு",
      activity: "செயல்பாடு",
      noData: "இப்போது பகுப்பாய்வு தரவு இல்லை.",
      viewAll: "அனைத்தையும் காண்க",
      noUpcoming: "வரவிருக்கும் அட்டவணைகள் இல்லை.",
      noRecent: "சமீபத்திய செயல்பாடு இல்லை.",
      status: "நிலை",
      date: "தேதி",
      entity: "பதிவு",
      department: "துறை",
      doctor: "மருத்துவர்",
      patient: "நோயாளர்",
      hospital: "மருத்துவமனை",
      tokens: "டோக்கன்கள்",
      available: "காலி",
      booked: "பதிவு",
      consultations: "முடிந்தது",
    },
    admin: {
      pendingDoctorApprovals: "நிலுவை மருத்துவர் ஒப்புதல்கள்",
      pendingHospitalApprovals: "நிலுவை மருத்துவமனை ஒப்புதல்கள்",
      totalDoctors: "மொத்த மருத்துவர்கள்",
      totalHospitals: "மொத்த மருத்துவமனைகள்",
      registrationTrends: "பதிவு போக்குகள்",
      registrationsFootnote: "மாதாந்திர மருத்துவர் மற்றும் மருத்துவமனை சேர்க்கை.",
      approvalDistribution: "ஒப்புதல் பகிர்வு",
      approvalFootnote: "அனைத்து கணக்குகளின் தற்போதைய நிலை.",
      recentActivity: "சமீபத்திய செயல்பாடு",
      recentActivityFootnote: "புதிய மருத்துவர் பதிவுகள் மற்றும் மருத்துவமனை ஒப்புதல்கள்.",
      doctorRegistration: "மருத்துவர் பதிவு",
      hospitalApproval: "மருத்துவமனை ஒப்புதல்",
    },
    hospital: {
      activeDoctors: "செயலில் உள்ள மருத்துவர்கள்",
      todaysTokens: "இன்றைய டோக்கன்கள்",
      pendingApprovals: "நிலுவை ஒப்புதல்கள்",
      dailyPatientFlow: "தினசரி நோயாளர் ஓட்டம்",
      patientFlowFootnote: "பதிவு செய்யப்பட்ட இடங்கள் vs தினசரி திறன்.",
      departmentActivity: "துறை செயல்பாடு",
      departmentActivityFootnote: "துறையின்படி டோக்கன் அளவு.",
      tokenDistribution: "டோக்கன் பகிர்வு",
      tokenDistributionFootnote: "இன்றைய வரிசை முன்னேற்றம்.",
      doctorAvailability: "மருத்துவர் கிடைப்புத் தன்மை",
      doctorAvailabilityFootnote: "இன்றைய திறன் மற்றும் பதிவு சுமை.",
      recentPatientEntries: "சமீபத்திய நோயாளர் பதிவுகள்",
      recentPatientEntriesFootnote: "புதிய டோக்கன்கள் மற்றும் வரிசை இயக்கம்.",
    },
    doctor: {
      activeHospitals: "செயலில் உள்ள மருத்துவமனைகள்",
      pendingRequests: "நிலுவை கோரிக்கைகள்",
      todaysConsultations: "இன்றைய ஆலோசனைகள்",
      patientVisitTrends: "நோயாளர் வருகை போக்கு",
      patientVisitFootnote: "கடந்த வார தினசரி நேரம்சேர்த்தல்கள்.",
      consultationAnalytics: "ஆலோசனை பகுப்பாய்வு",
      consultationFootnote: "இன்றைய மற்றும் சமீபத்திய ஆலோசனை நிலைகள்.",
      upcomingSchedules: "வரவிருக்கும் அட்டவணைகள்",
      upcomingSchedulesFootnote: "அடுத்த கிளினிக் நேரங்கள் மற்றும் மீதமுள்ள திறன்.",
      recentAppointments: "சமீபத்திய நேரம்சேர்த்தல்கள்",
      recentAppointmentsFootnote: "உங்கள் அட்டவணையில் சமீபத்திய டோக்கன்கள்.",
    },
  },
};
