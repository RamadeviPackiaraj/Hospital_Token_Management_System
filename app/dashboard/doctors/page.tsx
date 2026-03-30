"use client";

import * as React from "react";
import { Check, Stethoscope, UserRoundCheck, X } from "lucide-react";
import { Avatar } from "@/components/data-display/Avatar";
import { Badge, Button, Card, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import { getMockUsers, type MockUser } from "@/lib/auth-flow";
import { formatDisplayDate } from "@/lib/utils";
import {
  getDoctorNameById,
  getSelectionsForHospital,
  updateHospitalSelectionStatus,
  type HospitalSelection
} from "@/lib/dashboard-data";

type DoctorRow = Record<string, unknown> & MockUser;
type SelectionRow = Record<string, unknown> & HospitalSelection;

function badgeVariant(status: HospitalSelection["status"] | MockUser["approvalStatus"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

export default function DoctorsPage() {
  const { currentUser } = useDashboardContext();
  const [selections, setSelections] = React.useState<HospitalSelection[]>([]);

  React.useEffect(() => {
    if (currentUser.role === "hospital") {
      setSelections(getSelectionsForHospital(currentUser.id));
    }
  }, [currentUser.id, currentUser.role]);

  const doctorRows: DoctorRow[] = getMockUsers()
    .filter((user) => user.role === "doctor")
    .map((user) => ({ ...user }));
  const selectionRows: SelectionRow[] = selections.map((selection) => ({ ...selection }));

  if (currentUser.role === "admin") {
    return (
      <div className="space-y-6">
        <PageHero
          title="Doctor Directory"
          description="View doctor records"
          icon={<Stethoscope className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
          imageAlt="Doctor consultation"
          stats={[
            { label: "Total Doctors", value: String(doctorRows.length) },
            { label: "Approved", value: String(doctorRows.filter((row) => row.approvalStatus === "approved").length) }
          ]}
        />

        <Card className="p-4">
        <Table<DoctorRow>
          columns={[
            {
              key: "fullName",
              header: "Doctor Name",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.fullName} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{row.fullName}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{row.email}</p>
                  </div>
                </div>
              )
            },
            { key: "department", header: "Department" },
            { key: "specialization", header: "Specialization" },
            {
              key: "approvalStatus",
              header: "Status",
              render: (row) => (
                <Badge status={badgeVariant(row.approvalStatus)}>
                  {row.approvalStatus.charAt(0).toUpperCase() + row.approvalStatus.slice(1)}
                </Badge>
              )
            }
          ]}
          data={doctorRows}
          pageSize={5}
        />
        </Card>
      </div>
    );
  }

  if (currentUser.role === "hospital") {
    function updateStatus(selectionId: string, status: HospitalSelection["status"]) {
      updateHospitalSelectionStatus(selectionId, status);
      setSelections(getSelectionsForHospital(currentUser.id));
    }

    return (
      <div className="space-y-6">
        <PageHero
          title="Doctor Approval Board"
          description="Approve doctor requests"
          icon={<UserRoundCheck className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
          imageAlt="Hospital team working"
          stats={[
            { label: "Requests", value: String(selectionRows.length) },
            { label: "Pending", value: String(selectionRows.filter((row) => row.status === "pending").length) }
          ]}
        />

        <Card className="p-4">
        <Table<SelectionRow>
          columns={[
            {
              key: "doctorName",
              header: "Doctor",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={getDoctorNameById(row.doctorId)} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{getDoctorNameById(row.doctorId)}</p>
                    <p className="mt-1 text-xs text-[#64748B]">Hospital request</p>
                  </div>
                </div>
              )
            },
            {
              key: "department",
              header: "Details",
              render: (row) => {
                const doctor = getMockUsers().find((user) => user.id === row.doctorId);
                return (
                  <div className="space-y-1">
                    <p className="text-sm text-[#0F172A]">{doctor?.department || doctor?.specialization || "-"}</p>
                    <p className="text-xs text-[#64748B]">Requested {formatDisplayDate(row.requestedAt)}</p>
                  </div>
                );
              }
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge status={badgeVariant(row.status)}>
                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                </Badge>
              )
            },
            {
              key: "actions",
              header: "Actions",
              className: "min-w-[220px]",
              render: (row) => (
                <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                  <button
                    type="button"
                    className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#22C55E] bg-transparent px-3 text-sm font-medium text-[#22C55E] transition hover:bg-green-50"
                    onClick={() => updateStatus(row.id, "approved")}
                  >
                    <Check className="size-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#EF4444] bg-transparent px-3 text-sm font-medium text-[#EF4444] transition hover:bg-red-50"
                    onClick={() => updateStatus(row.id, "rejected")}
                  >
                    <X className="size-4" />
                    Reject
                  </button>
                </div>
              )
            }
          ]}
          data={selectionRows}
          pageSize={5}
          emptyMessage="No doctor requests are waiting for review."
        />
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-base font-medium text-[#0F172A]">Doctor module</h2>
      <p className="mt-1 text-sm text-[#64748B]">Use Hospitals to track requests.</p>
    </Card>
  );
}
