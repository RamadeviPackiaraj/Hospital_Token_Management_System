"use client";

import * as React from "react";
import { Check, Search, ShieldCheck, UserRoundCheck, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Avatar } from "@/components/data-display/Avatar";
import { Badge, Card, Input, Select, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import { formatDisplayDate } from "@/lib/utils";
import {
  formatApprovalStatus,
  type MockUser,
  type UserApprovalStatus,
} from "@/lib/auth-flow";
import { apiRequest } from "@/lib/api";
import { getAdminDoctors } from "@/lib/dashboard-data";

type DoctorRow = Record<string, unknown> & MockUser;
type HospitalDoctorRequest = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
};

function badgeVariant(status: UserApprovalStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

function requestBadgeVariant(status: HospitalDoctorRequest["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

function formatDoctorDetail(value: string | undefined, fallback = "Not provided") {
  return value && value.trim() ? value : fallback;
}

export default function DoctorsPage() {
  const searchParams = useSearchParams();
  const { currentUser, refreshSession } = useDashboardContext();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [users, setUsers] = React.useState<MockUser[]>([]);
  const [rejectTarget, setRejectTarget] = React.useState<MockUser | null>(null);
  const [hospitalRequests, setHospitalRequests] = React.useState<HospitalDoctorRequest[]>([]);
  const [hospitalSearch, setHospitalSearch] = React.useState("");
  const [hospitalStatusFilter, setHospitalStatusFilter] = React.useState("all");
  const [loadingHospitalView, setLoadingHospitalView] = React.useState(true);
  const [hospitalError, setHospitalError] = React.useState("");
  const [actioningDoctorId, setActioningDoctorId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentUser.role !== "admin") return;

    getAdminDoctors()
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
  }, [currentUser.role]);

  React.useEffect(() => {
    const nextStatus = searchParams.get("status");
    setStatusFilter(
      nextStatus === "pending" || nextStatus === "approved" || nextStatus === "rejected"
        ? nextStatus
        : "all"
    );
  }, [searchParams]);

  React.useEffect(() => {
    if (currentUser.role !== "hospital") return;
    void loadHospitalRequests();
  }, [currentUser.id, currentUser.role]);

  async function loadHospitalRequests() {
    setLoadingHospitalView(true);
    setHospitalError("");

    try {
      const [pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
        apiRequest<{ doctors: Array<Omit<HospitalDoctorRequest, "status">> }>(
          `/hospitals/${currentUser.id}/pending-doctors`
        ),
        apiRequest<{ doctors: Array<Omit<HospitalDoctorRequest, "status">> }>(
          `/hospitals/${currentUser.id}/approved-doctors`
        ),
        apiRequest<{ doctors: Array<Omit<HospitalDoctorRequest, "status">> }>(
          `/hospitals/${currentUser.id}/rejected-doctors`
        ),
      ]);

      const pending = (pendingResponse.doctors || []).map((doctor) => ({
        ...doctor,
        status: "pending" as const,
      }));
      const approved = (approvedResponse.doctors || []).map((doctor) => ({
        ...doctor,
        status: "approved" as const,
      }));
      const rejected = (rejectedResponse.doctors || []).map((doctor) => ({
        ...doctor,
        status: "rejected" as const,
      }));
      setHospitalRequests([
        ...pending,
        ...approved,
        ...rejected,
      ]);
    } catch (error) {
      setHospitalError(error instanceof Error ? error.message : "Unable to load doctor requests.");
      setHospitalRequests([]);
    } finally {
      setLoadingHospitalView(false);
    }
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
      body: JSON.stringify({ status }),
    });
    const updated = await getAdminDoctors();
    setUsers(updated);
    await refreshSession();
  }

  async function updateHospitalDoctorStatus(doctorId: string, status: "approved" | "rejected") {
    setActioningDoctorId(doctorId);
    setHospitalError("");

    try {
      await apiRequest(
        status === "approved"
          ? `/hospitals/${currentUser.id}/approve-doctor`
          : `/hospitals/${currentUser.id}/reject-doctor`,
        {
          method: "PATCH",
          body: JSON.stringify({ doctorId }),
        }
      );
      await loadHospitalRequests();
    } catch (error) {
      setHospitalError(error instanceof Error ? error.message : "Unable to update doctor request.");
    } finally {
      setActioningDoctorId(null);
    }
  }

  function confirmRejectDoctor() {
    if (!rejectTarget) return;
    void updateStatus(rejectTarget.id, "rejected");
    setRejectTarget(null);
  }

  if (currentUser.role === "hospital") {
    const filteredRequests = hospitalRequests.filter((doctor) => {
      const term = hospitalSearch.toLowerCase();
      const matchesSearch =
        doctor.name.toLowerCase().includes(term) || doctor.email.toLowerCase().includes(term);
      const matchesStatus =
        hospitalStatusFilter === "all" || doctor.status === hospitalStatusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6">
        <PageHero
          title="Doctor Approval Board"
          description="Approve doctor requests"
          icon={<UserRoundCheck className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
          imageAlt="Medical team discussion"
          stats={[
            { label: "Requests", value: String(hospitalRequests.length) },
            {
              label: "Pending",
              value: String(hospitalRequests.filter((doctor) => doctor.status === "pending").length),
            },
            {
              label: "Rejected",
              value: String(hospitalRequests.filter((doctor) => doctor.status === "rejected").length),
            },
          ]}
        />

        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[#0F172A]">
              Search
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                  value={hospitalSearch}
                  onChange={(event) => setHospitalSearch(event.target.value)}
                  placeholder="Search by doctor name or email"
                  className="pl-10"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm text-[#0F172A]">
              Status
              <Select
                value={hospitalStatusFilter}
                onChange={(event) => setHospitalStatusFilter(event.target.value)}
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ]}
            />
            </label>
          </div>
          {hospitalError ? <p className="mt-3 text-sm text-[#EF4444]">{hospitalError}</p> : null}
        </Card>

        <Card className="p-4">
          <Table<HospitalDoctorRequest>
            columns={[
              {
                key: "doctor",
                header: "Doctor",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{row.name}</p>
                      <p className="mt-1 text-xs text-[#64748B]">Hospital request</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "details",
                header: "Details",
                render: (row) => (
                  <div className="space-y-1">
                    <p className="text-sm text-[#0F172A]">{formatDoctorDetail(row.department)}</p>
                    <p className="text-xs text-[#64748B]">
                      Requested{" "}
                      {row.createdAt
                        ? formatDisplayDate(row.createdAt).replace(/ \d{2}:\d{2} (AM|PM)$/, "")
                        : "Recently"}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge status={requestBadgeVariant(row.status)} className="font-medium">
                    {row.status === "approved"
                      ? "Approved"
                      : row.status === "rejected"
                        ? "Rejected"
                        : "Pending"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                className: "min-w-[220px]",
                render: (row) => (
                    <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={actioningDoctorId === row.userId}
                        className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#22C55E] bg-transparent px-3 text-sm font-medium text-[#22C55E] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void updateHospitalDoctorStatus(row.userId, "approved")}
                      >
                        <Check className="size-4" />
                        Approve
                    </button>
                      <button
                        type="button"
                        disabled={actioningDoctorId === row.userId}
                        className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#EF4444] bg-transparent px-3 text-sm font-medium text-[#EF4444] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void updateHospitalDoctorStatus(row.userId, "rejected")}
                      >
                        <X className="size-4" />
                        Reject
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredRequests}
            loading={loadingHospitalView}
            pageSize={6}
            emptyMessage="No doctor requests matched the selected filters."
          />
        </Card>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">Doctor module</h2>
        <p className="mt-1 text-sm text-[#64748B]">Admin can review doctor registrations here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Doctor Approval Workflow"
        description="Approve doctor registrations"
        icon={<ShieldCheck className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
        imageAlt="Doctor portrait"
        stats={[
          { label: "Pending", value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "pending").length) },
          { label: "Approved", value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "approved").length) },
          { label: "Rejected", value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "rejected").length) },
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
                { label: "Rejected", value: "rejected" },
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
              ),
            },
            {
              key: "details",
              header: "Details",
              render: (row) => (
                <div className="space-y-1">
                  <p className="text-sm text-[#0F172A]">{row.mobileNumber}</p>
                  <p className="text-xs text-[#64748B]">Department: {formatDoctorDetail(row.department)}</p>
                  <p className="text-xs text-[#64748B]">Specialization: {formatDoctorDetail(row.specialization)}</p>
                  <p className="text-xs text-[#64748B]">Registration ID: {formatDoctorDetail(row.medicalRegistrationId)}</p>
                </div>
              ),
            },
            {
              key: "registrationDate",
              header: "Registered",
              render: (row) => (
                <div className="space-y-1">
                  <p className="text-sm text-[#0F172A]">{formatDisplayDate(row.registrationDate || "")}</p>
                  <p className="text-xs text-[#64748B]">Recent request</p>
                </div>
              ),
            },
            {
              key: "approvalStatus",
              header: "Status",
              render: (row) => (
                <Badge status={badgeVariant(row.approvalStatus)} className="font-medium">
                  {formatApprovalStatus(row.approvalStatus)}
                </Badge>
              ),
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
              ),
            },
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
