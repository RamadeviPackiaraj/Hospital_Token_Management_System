"use client";

import * as React from "react";
import { Building2, ClipboardList, Hospital, Landmark } from "lucide-react";
import { Badge, Button, Card, Checkbox, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import { formatApprovalStatus, getMockUsers, type MockUser } from "@/lib/auth-flow";
import { formatDisplayDate } from "@/lib/utils";
import {
  getSelectionsForDoctor,
  submitHospitalSelections,
  type HospitalSelection
} from "@/lib/dashboard-data";

type HospitalRow = Record<string, unknown> &
  MockUser & {
    feeLabel?: string;
  };

function badgeVariant(status: HospitalSelection["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

export default function HospitalsPage() {
  const { currentUser } = useDashboardContext();
  const [selectedHospitalIds, setSelectedHospitalIds] = React.useState<string[]>([]);
  const [existingSelections, setExistingSelections] = React.useState<HospitalSelection[]>([]);
  const hospitals = getMockUsers().filter((user) => user.role === "hospital");

  React.useEffect(() => {
    if (currentUser.role === "doctor") {
      setExistingSelections(getSelectionsForDoctor(currentUser.id));
    }
  }, [currentUser.id, currentUser.role]);

  const hospitalRows: HospitalRow[] = hospitals.map((hospital) => ({ ...hospital }));

  if (currentUser.role === "admin") {
    return (
      <div className="space-y-6">
        <PageHero
          title="Hospital Registry"
          description="View hospital accounts"
          icon={<Hospital className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80"
          imageAlt="Hospital building"
          stats={[
            { label: "Hospitals", value: String(hospitalRows.length) },
            { label: "Approved", value: String(hospitalRows.filter((row) => row.approvalStatus === "approved").length) }
          ]}
        />

        <Card className="p-4">
        <Table<HospitalRow>
          columns={[
            {
              key: "hospitalName",
              header: "Hospital Name",
              render: (row) => row.hospitalName || row.fullName
            },
            { key: "fullName", header: "Primary Contact" },
            { key: "email", header: "Email" },
            {
              key: "approvalStatus",
              header: "Status",
              render: (row) => (
                <Badge
                  status={
                    row.approvalStatus === "approved"
                      ? "success"
                      : row.approvalStatus === "rejected"
                        ? "error"
                        : "warning"
                  }
                >
                  {formatApprovalStatus(row.approvalStatus)}
                </Badge>
              )
            }
          ]}
          data={hospitalRows}
          pageSize={5}
        />
        </Card>
      </div>
    );
  }

  if (currentUser.role === "doctor") {
    function toggleHospital(hospitalId: string) {
      setSelectedHospitalIds((currentSelection) =>
        currentSelection.includes(hospitalId)
          ? currentSelection.filter((item) => item !== hospitalId)
          : [...currentSelection, hospitalId]
      );
    }

    function handleSubmit() {
      submitHospitalSelections(currentUser.id, selectedHospitalIds);
      setExistingSelections(getSelectionsForDoctor(currentUser.id));
      setSelectedHospitalIds([]);
    }

    return (
      <div className="space-y-6">
        <PageHero
          title="Hospital Selection"
          description="Select hospitals"
          icon={<Landmark className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80"
          imageAlt="Hospital reception"
          stats={[
            { label: "Available", value: String(hospitals.filter((hospital) => hospital.approvalStatus === "approved").length) },
            { label: "Requests", value: String(existingSelections.length) }
          ]}
        />

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-4">
          <div>
            <h2 className="text-base font-medium text-[#0F172A]">Select Hospitals</h2>
            <p className="mt-1 text-sm text-[#64748B]">Choose and submit</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {hospitals
              .filter((hospital) => hospital.approvalStatus === "approved")
              .map((hospital) => (
                <div
                  key={hospital.id}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                >
                  <Checkbox
                    checked={selectedHospitalIds.includes(hospital.id)}
                    onChange={() => toggleHospital(hospital.id)}
                    label={hospital.hospitalName || hospital.fullName}
                    description={`${hospital.city}, ${hospital.state}`}
                  />
                </div>
              ))}
          </div>

          <div className="mt-4">
            <Button className="h-10 rounded-md" onClick={handleSubmit} disabled={selectedHospitalIds.length === 0}>
              Submit Selection
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-base font-medium text-[#0F172A]">Current Requests</h2>
          <div className="mt-4 space-y-3">
            {existingSelections.length > 0 ? (
              existingSelections.map((selection) => {
                const hospital = hospitals.find((item) => item.id === selection.hospitalId);

                return (
                  <div key={selection.id} className="rounded-xl border border-[#E2E8F0] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {hospital?.hospitalName || hospital?.fullName || "Hospital"}
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">Requested {formatDisplayDate(selection.requestedAt)}</p>
                      </div>
                      <Badge status={badgeVariant(selection.status)}>
                        {selection.status.charAt(0).toUpperCase() + selection.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[#64748B]">No hospital requests submitted yet.</p>
            )}
          </div>
        </Card>
      </div>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-base font-medium text-[#0F172A]">Hospital Profile</h2>
      <p className="mt-1 text-sm text-[#64748B]">Use Doctors to manage approvals.</p>
    </Card>
  );
}
