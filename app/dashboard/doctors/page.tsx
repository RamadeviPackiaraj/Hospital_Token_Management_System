"use client";

import * as React from "react";
import { Check, Search, ShieldCheck, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Avatar } from "@/components/data-display/Avatar";
import { Badge, Card, Input, Select, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import { formatDisplayDate } from "@/lib/utils";
import {
  formatApprovalStatus,
  type MockUser,
  type UserApprovalStatus
} from "@/lib/auth-flow";
import { apiRequest } from "@/lib/api";
import { getAdminDoctors } from "@/lib/dashboard-data";

type DoctorRow = Record<string, unknown> & MockUser;

function badgeVariant(status: UserApprovalStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

export default function DoctorsPage() {
  const searchParams = useSearchParams();
  const { currentUser, refreshSession } = useDashboardContext();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [users, setUsers] = React.useState<MockUser[]>([]);
  const [rejectTarget, setRejectTarget] = React.useState<MockUser | null>(null);

  React.useEffect(() => {
    getAdminDoctors()
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  React.useEffect(() => {
    const nextStatus = searchParams.get("status");
    setStatusFilter(
      nextStatus === "pending" || nextStatus === "approved" || nextStatus === "rejected"
        ? nextStatus
        : "all"
    );
  }, [searchParams]);

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">Doctor module</h2>
        <p className="mt-1 text-sm text-[#64748B]">Admin can review doctor registrations here.</p>
      </Card>
    );
  }

  const doctorRows: DoctorRow[] = users
    .filter((user) => user.role === "doctor")
    .filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.approvalStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .map((user) => ({ ...user }));

  async function updateStatus(userId: string, status: UserApprovalStatus) {
    await apiRequest(`/admin/doctors/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    const updated = await getAdminDoctors();
    setUsers(updated);
    await refreshSession();
  }

  function confirmRejectDoctor() {
    if (!rejectTarget) {
      return;
    }

    void updateStatus(rejectTarget.id, "rejected");
    setRejectTarget(null);
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Doctor Approval Workflow"
        description="Approve doctor registrations"
        icon={<ShieldCheck className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80"
        imageAlt="Hospital administration desk"
        stats={[
          { label: "Pending", value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "pending").length) },
          { label: "Approved", value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "approved").length) },
          { label: "Rejected", value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "rejected").length) }
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-[#0F172A]">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="pl-10"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm text-[#0F172A]">
            Status
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" }
              ]}
            />
          </label>
        </div>
      </Card>

      <Card className="p-4">
        <Table<DoctorRow>
          columns={[
            {
              key: "profile",
              header: "Profile",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.fullName} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{row.fullName}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{row.email}</p>
                    <p className="mt-1 text-xs text-[#64748B]">Doctor account</p>
                  </div>
                </div>
              )
            },
            {
              key: "details",
              header: "Details",
              render: (row) => (
                <div className="space-y-1">
                  <p className="text-sm text-[#0F172A]">{row.mobileNumber}</p>
                  <p className="text-xs text-[#64748B]">
                    {row.city}, {row.state}
                  </p>
                  <p className="text-xs text-[#64748B]">{row.country}</p>
                </div>
              )
            },
            {
              key: "registrationDate",
              header: "Registered",
              render: (row) => (
                <div className="space-y-1">
                  <p className="text-sm text-[#0F172A]">{formatDisplayDate(row.registrationDate)}</p>
                  <p className="text-xs text-[#64748B]">Recent request</p>
                </div>
              )
            },
            {
              key: "approvalStatus",
              header: "Status",
              render: (row) => (
                <Badge status={badgeVariant(row.approvalStatus)} className="font-medium">
                  {formatApprovalStatus(row.approvalStatus)}
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
                      onClick={() => void updateStatus(row.id, "approved")}
                    >
                    <Check className="size-4" />
                    Approve
                  </button>
                    <button
                      type="button"
                      className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#EF4444] bg-transparent px-3 text-sm font-medium text-[#EF4444] transition hover:bg-red-50"
                      onClick={() => setRejectTarget(row)}
                    >
                    <X className="size-4" />
                    Reject
                  </button>
                </div>
              )
            }
          ]}
          data={doctorRows}
          pageSize={6}
          emptyMessage="No doctors matched the selected filters."
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(rejectTarget)}
        title="Reject Doctor"
        description="Are you sure you want to reject this doctor?"
        confirmLabel="Confirm Reject"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={confirmRejectDoctor}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
