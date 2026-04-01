"use client";

import * as React from "react";
import Link from "next/link";
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
import { getStoredDoctorSchedules, todayDateString } from "@/lib/scheduling";

function SummaryCard({
  title,
  value,
  note,
  icon,
  href,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <Card className="p-4 transition hover:border-[#0EA5A4]/40">
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{title}</p>
          <p className="mt-2 text-xl font-medium leading-none text-[#0F172A]">{value}</p>
          <p className="mt-2 text-sm text-[#64748B]">{note}</p>
        </div>
      </div>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
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

    const storedSchedules = getStoredDoctorSchedules();
    const today = todayDateString();
    const todaySchedules = storedSchedules.filter((schedule) => schedule.date === today);

    if (active) {
      setTodayScheduleCount(todaySchedules.length);
      setTodayAvailableSlots(
        todaySchedules.reduce(
          (sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length,
          0
        )
      );
    }

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
        getSelectionsForHospital(currentUser.id),
        getApprovedDoctorsForHospital(currentUser.id),
      ])
        .then(([selections, doctors]) => {
          if (!active) return;
          setHospitalSelections(selections);
          setApprovedDoctors(doctors);
        })
        .catch(() => {
          if (!active) return;
          setHospitalSelections([]);
          setApprovedDoctors([]);
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
            href="/dashboard/doctors"
          />
          <SummaryCard
            title="Pending Doctor Approvals"
            value={String(pendingDoctorApprovals.length)}
            note="Awaiting admin review"
            icon={<Clock3 className="size-5" />}
            href="/dashboard/doctors?status=pending"
          />
          <SummaryCard
            title="Approved Doctors"
            value={String(approvedDoctorsCount.length)}
            note="Doctor accounts approved"
            icon={<ShieldCheck className="size-5" />}
            href="/dashboard/doctors?status=approved"
          />
          <SummaryCard
            title="Total Hospitals"
            value={String(hospitals.length)}
            note="Registered hospital accounts"
            icon={<Building2 className="size-5" />}
            href="/dashboard/hospitals"
          />
          <SummaryCard
            title="Pending Hospital Approvals"
            value={String(pendingHospitalApprovals.length)}
            note="Awaiting admin review"
            icon={<Clock3 className="size-5" />}
            href="/dashboard/hospitals?status=pending"
          />
          <SummaryCard
            title="Approved Hospitals"
            value={String(approvedHospitals.length)}
            note="Hospital accounts approved"
            icon={<ShieldCheck className="size-5" />}
            href="/dashboard/hospitals?status=approved"
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
            href="/dashboard/doctors"
          />
          <SummaryCard
            title="Doctor Schedule"
            value={String(todayScheduleCount)}
            note={`${approvedDoctors.length} active doctors`}
            icon={<CalendarClock className="size-5" />}
            href="/dashboard/doctor-schedule"
          />
          <SummaryCard
            title="Patient Entry"
            value={String(todayAvailableSlots)}
            note="Open slots available for token generation"
            icon={<Ticket className="size-5" />}
            href="/dashboard/patient-entry"
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
