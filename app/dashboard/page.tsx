"use client";

import Link from "next/link";
import { Building2, Clock3, ShieldCheck, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui";
import { useDashboardContext } from "@/components/dashboard";
import { getMockUsers } from "@/lib/auth-flow";
import {
  getApprovedDoctorsForHospital,
  getSelectionsForDoctor,
  getSelectionsForHospital
} from "@/lib/dashboard-data";

export default function DashboardPage() {
  const { currentUser } = useDashboardContext();
  const users = getMockUsers();

  if (currentUser.role === "admin") {
    const hospitals = users.filter((user) => user.role === "hospital");
    const doctors = users.filter((user) => user.role === "doctor");
    const pendingDoctorApprovals = doctors.filter((user) => user.approvalStatus === "pending");
    const approvedDoctors = doctors.filter((user) => user.approvalStatus === "approved");
    const pendingHospitalApprovals = hospitals.filter((user) => user.approvalStatus === "pending");
    const approvedHospitals = hospitals.filter((user) => user.approvalStatus === "approved");

    return (
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Total Doctors",
            value: String(doctors.length),
            note: "Registered doctor accounts",
            icon: <Stethoscope className="size-5" />,
            href: "/dashboard/doctors"
          },
          {
            title: "Pending Doctor Approvals",
            value: String(pendingDoctorApprovals.length),
            note: "Awaiting admin review",
            icon: <Clock3 className="size-5" />,
            href: "/dashboard/doctors?status=pending"
          },
          {
            title: "Approved Doctors",
            value: String(approvedDoctors.length),
            note: "Doctor accounts approved",
            icon: <ShieldCheck className="size-5" />,
            href: "/dashboard/doctors?status=approved"
          },
          {
            title: "Total Hospitals",
            value: String(hospitals.length),
            note: "Registered hospital accounts",
            icon: <Building2 className="size-5" />,
            href: "/dashboard/hospitals"
          },
          {
            title: "Pending Hospital Approvals",
            value: String(pendingHospitalApprovals.length),
            note: "Awaiting admin review",
            icon: <Clock3 className="size-5" />,
            href: "/dashboard/hospitals?status=pending"
          },
          {
            title: "Approved Hospitals",
            value: String(approvedHospitals.length),
            note: "Hospital accounts approved",
            icon: <ShieldCheck className="size-5" />,
            href: "/dashboard/hospitals?status=approved"
          }
        ].map((item) => (
          <Link key={item.title} href={item.href} className="block">
            <Card className="p-4 transition hover:border-[#0EA5A4]/40">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#64748B]">{item.title}</p>
                  <p className="mt-3 text-[24px] font-medium leading-none text-[#0F172A]">{item.value}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{item.note}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    );
  }

  if (currentUser.role === "hospital") {
    const approvedDoctors = getApprovedDoctorsForHospital(currentUser.id);
    const hospitalSelections = getSelectionsForHospital(currentUser.id);
    const pendingRequests = hospitalSelections.filter((selection) => selection.status === "pending");
    const approvedRequests = hospitalSelections.filter((selection) => selection.status === "approved");

    return (
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Active Doctors",
            value: String(approvedDoctors.length),
            note: "Approved doctors",
            icon: <Stethoscope className="size-5" />
          },
          {
            title: "Pending Requests",
            value: String(pendingRequests.length),
            note: "Awaiting review",
            icon: <ShieldCheck className="size-5" />
          },
          {
            title: "Approved Requests",
            value: String(approvedRequests.length),
            note: "Selections already accepted",
            icon: <Clock3 className="size-5" />
          }
        ].map((item) => (
          <Card key={item.title} className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
                {item.icon}
              </div>
              <div>
                <p className="text-sm text-[#64748B]">{item.title}</p>
                <p className="mt-3 text-[24px] font-medium leading-none text-[#0F172A]">{item.value}</p>
                <p className="mt-1 text-xs text-[#64748B]">{item.note}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>
    );
  }

  const selections = getSelectionsForDoctor(currentUser.id);
  const approvedSelections = selections.filter((selection) => selection.status === "approved");
  const pendingSelections = selections.filter((selection) => selection.status === "pending");

  return (
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[
        {
          title: "Selected Hospitals",
          value: String(selections.length),
          note: "Total hospital requests",
          icon: <Building2 className="size-5" />
        },
        {
          title: "Approved Hospitals",
          value: String(approvedSelections.length),
          note: "Active hospital access",
          icon: <ShieldCheck className="size-5" />
        },
        {
          title: "Pending Requests",
          value: String(pendingSelections.length),
          note: "Waiting for hospital review",
          icon: <Clock3 className="size-5" />
        }
      ].map((item) => (
        <Card key={item.title} className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-[#64748B]">{item.title}</p>
              <p className="mt-3 text-[24px] font-medium leading-none text-[#0F172A]">{item.value}</p>
              <p className="mt-1 text-xs text-[#64748B]">{item.note}</p>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
