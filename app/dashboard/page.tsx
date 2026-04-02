"use client";

import * as React from "react";
import {
  Building2,
  CalendarClock,
  Clock3,
  ShieldCheck,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useDashboardContext } from "@/components/dashboard";
import type { MockUser } from "@/lib/auth-flow";
import {
  getAdminDoctors,
  getAdminHospitals,
  getApprovedDoctorsForHospital,
  getSelectionsForDoctor,
  getSelectionsForHospital,
  type HospitalSelection,
} from "@/lib/dashboard-data";
import { getDoctorSchedules, getScheduleBootstrap, getScheduleSummary } from "@/lib/schedule-api";
import { todayDateString } from "@/lib/scheduling";

function SummaryCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="transition hover:border-[#0EA5A4]/40">
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="ui-label">{title}</p>
          <p className="mt-2 text-[20px] font-medium leading-7 text-[#0F172A]">{value}</p>
          <p className="mt-2 ui-body-secondary">{note}</p>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { currentUser } = useDashboardContext();
  const [adminDoctors, setAdminDoctors] = React.useState<MockUser[]>([]);
  const [adminHospitals, setAdminHospitals] = React.useState<MockUser[]>([]);
  const [hospitalSelections, setHospitalSelections] = React.useState<HospitalSelection[]>([]);
  const [doctorSelections, setDoctorSelections] = React.useState<HospitalSelection[]>([]);
  const [approvedDoctors, setApprovedDoctors] = React.useState<MockUser[]>([]);
  const [todayScheduleCount, setTodayScheduleCount] = React.useState(0);
  const [todayAvailableSlots, setTodayAvailableSlots] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const today = todayDateString();

    if (currentUser.role === "admin") {
      Promise.all([getAdminDoctors(), getAdminHospitals()])
        .then(([doctors, hospitals]) => {
          if (!active) return;
          setAdminDoctors(doctors);
          setAdminHospitals(hospitals);
        })
        .catch(() => {
          if (!active) return;
          setAdminDoctors([]);
          setAdminHospitals([]);
        });
    }

    if (currentUser.role === "hospital") {
      Promise.all([
        getSelectionsForHospital(currentUser.id).catch(() => []),
        getApprovedDoctorsForHospital(currentUser.id).catch(() => []),
        getScheduleBootstrap().catch(() => ({ doctors: [] })),
        getDoctorSchedules().catch(() => []),
        getScheduleSummary(today).catch(() => ({
          date: today,
          totalSchedules: 0,
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
        })),
      ])
        .then(([selections, doctors, bootstrap, schedules, summary]) => {
          if (!active) return;

          const selectionMap = new Map<string, HospitalSelection>();
          selections.forEach((selection) => {
            selectionMap.set(selection.doctorId, selection);
          });

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
            const doctorId = schedule.doctorId;
            if (!doctorId || selectionMap.has(doctorId)) return;

            selectionMap.set(doctorId, {
              id: `${doctorId}:${currentUser.id}:approved-schedule`,
              doctorId,
              hospitalId: currentUser.id,
              status: "approved",
              requestedAt: today,
            });
          });

          const doctorMap = new Map<string, MockUser>();
          doctors.forEach((doctor) => {
            doctorMap.set(doctor.id, doctor);
          });

          (bootstrap.doctors || []).forEach((doctor) => {
            const doctorId = doctor.userId || doctor.id;
            if (!doctorId || doctorMap.has(doctorId)) return;

            doctorMap.set(doctorId, {
              id: doctorId,
              role: "doctor",
              fullName: doctor.name,
              mobileNumber: doctor.phone,
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
              fullName: schedule.doctorName || "Doctor",
              email: "",
              department: schedule.department,
              approvalStatus: "approved",
              registrationDate: today,
            });
          });

          setHospitalSelections(Array.from(selectionMap.values()));
          setApprovedDoctors(Array.from(doctorMap.values()));
          setTodayScheduleCount(summary.totalSchedules || schedules.length || 0);
          setTodayAvailableSlots(
            summary.availableSlots ||
              schedules.reduce(
                (sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length,
                0
              ) ||
              0
          );
        });
    }

    if (currentUser.role === "doctor") {
      getSelectionsForDoctor(currentUser.id)
        .then((selections) => {
          if (!active) return;
          setDoctorSelections(selections);
        })
        .catch(() => {
          if (!active) return;
          setDoctorSelections([]);
        });
    }

    return () => {
      active = false;
    };
  }, [currentUser]);

  if (currentUser.role === "admin") {
    const hospitals = adminHospitals;
    const doctors = adminDoctors;
    const pendingDoctorApprovals = doctors.filter((user) => user.approvalStatus === "pending");
    const approvedDoctorsCount = doctors.filter((user) => user.approvalStatus === "approved");
    const pendingHospitalApprovals = hospitals.filter((user) => user.approvalStatus === "pending");
    const approvedHospitals = hospitals.filter((user) => user.approvalStatus === "approved");

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Total Doctors"
            value={String(doctors.length)}
            note="Registered doctor accounts"
            icon={<Stethoscope className="size-5" />}
          />
          <SummaryCard
            title="Pending Doctor Approvals"
            value={String(pendingDoctorApprovals.length)}
            note="Awaiting admin review"
            icon={<Clock3 className="size-5" />}
          />
          <SummaryCard
            title="Approved Doctors"
            value={String(approvedDoctorsCount.length)}
            note="Doctor accounts approved"
            icon={<ShieldCheck className="size-5" />}
          />
          <SummaryCard
            title="Total Hospitals"
            value={String(hospitals.length)}
            note="Registered hospital accounts"
            icon={<Building2 className="size-5" />}
          />
          <SummaryCard
            title="Pending Hospital Approvals"
            value={String(pendingHospitalApprovals.length)}
            note="Awaiting admin review"
            icon={<Clock3 className="size-5" />}
          />
          <SummaryCard
            title="Approved Hospitals"
            value={String(approvedHospitals.length)}
            note="Hospital accounts approved"
            icon={<ShieldCheck className="size-5" />}
          />
        </section>
      </div>
    );
  }

  if (currentUser.role === "hospital") {
    const pendingRequests = hospitalSelections.filter((selection) => selection.status === "pending");
    const approvedRequests = hospitalSelections.filter((selection) => selection.status === "approved");

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Doctor Approval"
            value={String(pendingRequests.length)}
            note={`${approvedRequests.length} approved requests`}
            icon={<ShieldCheck className="size-5" />}
          />
          <SummaryCard
            title="Doctor Schedule"
            value={String(todayScheduleCount)}
            note={`${approvedDoctors.length} active doctors`}
            icon={<CalendarClock className="size-5" />}
          />
          <SummaryCard
            title="Patient Entry"
            value={String(todayAvailableSlots)}
            note="Open slots available for token generation"
            icon={<Ticket className="size-5" />}
          />
        </section>
      </div>
    );
  }

  const approvedSelections = doctorSelections.filter((selection) => selection.status === "approved");
  const pendingSelections = doctorSelections.filter((selection) => selection.status === "pending");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Selected Hospitals"
          value={String(doctorSelections.length)}
          note="Total hospital requests"
          icon={<Building2 className="size-5" />}
        />
        <SummaryCard
          title="Approved Hospitals"
          value={String(approvedSelections.length)}
          note="Active hospital access"
          icon={<ShieldCheck className="size-5" />}
        />
        <SummaryCard
          title="Pending Requests"
          value={String(pendingSelections.length)}
          note="Waiting for review"
          icon={<Clock3 className="size-5" />}
        />
      </section>
    </div>
  );
}
