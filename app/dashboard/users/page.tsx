"use client";

import * as React from "react";
import { Building2, Check, Search, ShieldCheck, Stethoscope, X } from "lucide-react";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Avatar } from "@/components/data-display/Avatar";
import { Badge, Button, Card, Input, Select, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import { formatDisplayDate } from "@/lib/utils";
import {
  formatApprovalStatus,
  formatRoleLabel,
  getMockUsers,
  updateMockUserStatus,
  type MockUser,
  type UserApprovalStatus
} from "@/lib/auth-flow";

type UserRow = Record<string, unknown> & MockUser;

function badgeVariant(status: UserApprovalStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

function roleAccountLabel(role: MockUser["role"]) {
  return role === "doctor" ? "Doctor account" : "Hospital account";
}

function roleVisual(role: MockUser["role"]) {
  return role === "doctor"
    ? {
        icon: <Stethoscope className="size-4 text-[#0EA5A4]" />,
        label: "Doctor"
      }
    : {
        icon: <Building2 className="size-4 text-[#0EA5A4]" />,
        label: "Hospital"
      };
}

export default function UsersPage() {
  const { currentUser, refreshSession } = useDashboardContext();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [users, setUsers] = React.useState<MockUser[]>([]);
  const [rejectTarget, setRejectTarget] = React.useState<MockUser | null>(null);

  React.useEffect(() => {
    setUsers(getMockUsers());
  }, []);

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">Admin access only</h2>
        <p className="mt-1 text-sm text-[#64748B]">Only admins can review users.</p>
      </Card>
    );
  }

  const filteredUsers = users.filter((user) => {
    if (user.role === "admin") return false;

    const matchesSearch =
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.approvalStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  function updateStatus(userId: string, status: UserApprovalStatus) {
    updateMockUserStatus(userId, status);
    setUsers(getMockUsers());
    refreshSession();
  }

  function confirmRejectUser() {
    if (!rejectTarget) {
      return;
    }

    updateStatus(rejectTarget.id, "rejected");
    setRejectTarget(null);
  }

  const tableRows: UserRow[] = filteredUsers.map((user) => ({ ...user }));

  return (
    <div className="space-y-6">
      <PageHero
        title="User Approval Workflow"
        description="Approve user registrations"
        icon={<ShieldCheck className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80"
        imageAlt="Hospital administration desk"
        stats={[
          { label: "Pending", value: String(users.filter((user) => user.approvalStatus === "pending").length) },
          { label: "Approved", value: String(users.filter((user) => user.approvalStatus === "approved").length) },
          { label: "Rejected", value: String(users.filter((user) => user.approvalStatus === "rejected").length) }
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
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
            Role
            <Select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              options={[
                { label: "All Roles", value: "all" },
                { label: "Doctor", value: "doctor" },
                { label: "Hospital", value: "hospital" }
              ]}
            />
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
        <Table<UserRow>
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
                    <p className="mt-1 text-xs text-[#64748B]">{roleAccountLabel(row.role)}</p>
                  </div>
                </div>
              )
            },
            {
              key: "role",
              header: "Role",
              render: (row) => {
                const visual = roleVisual(row.role);

                return (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2">
                    {visual.icon}
                    <span>{visual.label}</span>
                  </div>
                );
              }
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
                    onClick={() => updateStatus(row.id, "approved")}
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
          data={tableRows}
          pageSize={6}
          emptyMessage="No users matched the selected filters."
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(rejectTarget)}
        title="Reject User"
        description="Are you sure you want to reject this user?"
        confirmLabel="Confirm Reject"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={confirmRejectUser}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
