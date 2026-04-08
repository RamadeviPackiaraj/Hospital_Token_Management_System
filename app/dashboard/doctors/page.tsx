"use client";

import * as React from "react";
import { Check, Pencil, Search, ShieldCheck, Trash2, UserRoundCheck, X } from "lucide-react";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Avatar } from "@/components/data-display/Avatar";
import { Badge, Button, Card, Input, Select, Table } from "@/components/ui";
import { useDashboardContext, PageHero, AdminUserEditModal } from "@/components/dashboard";
import { formatDisplayDate } from "@/lib/utils";
import {
  formatApprovalStatus,
  type MockUser,
  type UserApprovalStatus,
} from "@/lib/auth-flow";
import { apiRequest } from "@/lib/api";
import { getAdminDoctors } from "@/lib/dashboard-data";
import { applyAdminUserMocks, deleteAdminUserMock, saveAdminUserMock } from "@/lib/admin-user-mocks";
import { logger } from "@/lib/logger";

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
  const { currentUser, refreshSession } = useDashboardContext();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [users, setUsers] = React.useState<MockUser[]>([]);
  const [rejectTarget, setRejectTarget] = React.useState<MockUser | null>(null);
  const [editTarget, setEditTarget] = React.useState<MockUser | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MockUser | null>(null);
  const [hospitalRequests, setHospitalRequests] = React.useState<HospitalDoctorRequest[]>([]);
  const [hospitalSearch, setHospitalSearch] = React.useState("");
  const [hospitalStatusFilter, setHospitalStatusFilter] = React.useState("all");
  const [loadingHospitalView, setLoadingHospitalView] = React.useState(true);
  const [hospitalError, setHospitalError] = React.useState("");
  const [actioningDoctorId, setActioningDoctorId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentUser.role !== "admin") return;

    getAdminDoctors()
      .then((data) => setUsers(applyAdminUserMocks("doctor", data)))
      .catch(() => setUsers([]));
  }, [currentUser.role]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const nextStatus = new URLSearchParams(window.location.search).get("status");
    setStatusFilter(
      nextStatus === "pending" || nextStatus === "approved" || nextStatus === "rejected"
        ? nextStatus
        : "all"
    );
  }, []);

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

      const requestsByDoctorId = new Map<string, HospitalDoctorRequest>();

      [...pending, ...approved, ...rejected].forEach((doctor) => {
        requestsByDoctorId.set(doctor.userId, doctor);
      });

      setHospitalRequests(Array.from(requestsByDoctorId.values()));
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
    try {
      await apiRequest(`/admin/doctors/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const updated = await getAdminDoctors();
      setUsers(updated);
      await refreshSession();
      logger.success(status === "approved" ? "Doctor approved." : "Doctor rejected.", {
        source: "doctors.admin",
        data: { userId, status },
        toast: true,
        destructive: status === "rejected",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update doctor status.";
      logger.error("Unable to update the doctor status.", {
        source: "doctors.admin",
        data: { userId, status, error: message },
        toast: true,
      });
    }
  }

  async function updateHospitalDoctorStatus(
    doctorId: string,
    nextStatus: "approved" | "rejected",
    currentStatus?: HospitalDoctorRequest["status"]
  ) {
    setActioningDoctorId(doctorId);
    setHospitalError("");

    try {
      await apiRequest(
        nextStatus === "approved"
          ? `/hospitals/${currentUser.id}/approve-doctor`
          : `/hospitals/${currentUser.id}/reject-doctor`,
        {
          method: "PATCH",
          body: JSON.stringify({ doctorId }),
        }
      );
      await loadHospitalRequests();
      logger.success(nextStatus === "approved" ? "Doctor approved." : "Doctor rejected.", {
        source: "doctors.hospital",
        data: { doctorId, nextStatus },
        toast: true,
        destructive: nextStatus === "rejected",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update doctor request.";

      if (message === "Doctor has not selected this hospital") {
        if (currentStatus === "approved" && nextStatus === "approved") {
          setHospitalError("Doctor already approved.");
          logger.warn("Doctor is already approved.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
          });
        } else if (currentStatus === "rejected" && nextStatus === "rejected") {
          setHospitalError("Doctor already rejected.");
          logger.warn("Doctor is already rejected.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
            destructive: true,
          });
        } else if (currentStatus === "approved" && nextStatus === "rejected") {
          setHospitalError("Doctor is already approved and cannot be rejected from this record.");
          logger.warn("This approved doctor cannot be rejected here.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
            destructive: true,
          });
        } else if (currentStatus === "rejected" && nextStatus === "approved") {
          setHospitalError("Doctor is already rejected and cannot be approved from this record.");
          logger.warn("This rejected doctor cannot be approved here.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
          });
        } else {
          setHospitalError("Doctor status cannot be updated from this record.");
          logger.warn("Doctor status cannot be changed from this record.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
            destructive: nextStatus === "rejected",
          });
        }
      } else {
        setHospitalError(message);
        logger.error("Unable to update the doctor request.", {
          source: "doctors.hospital",
          data: { doctorId, currentStatus, nextStatus, error: message },
          toast: true,
        });
      }
    } finally {
      setActioningDoctorId(null);
    }
  }

  function confirmRejectDoctor() {
    if (!rejectTarget) return;
    void updateStatus(rejectTarget.id, "rejected");
    setRejectTarget(null);
  }

  function handleSaveDoctor(user: MockUser) {
    saveAdminUserMock("doctor", user);
    setUsers((current) => current.map((item) => (item.id === user.id ? user : item)));
    setEditTarget(null);
    logger.success("Doctor updated in frontend mock mode.", {
      source: "doctors.admin",
      data: { userId: user.id, emailChanged: editTarget?.email !== user.email },
      toast: true,
    });
  }

  function handleDeleteDoctor() {
    if (!deleteTarget) {
      return;
    }

    deleteAdminUserMock("doctor", deleteTarget.id);
    setUsers((current) => current.filter((item) => item.id !== deleteTarget.id));
    logger.warn("Doctor deleted in frontend mock mode.", {
      source: "doctors.admin",
      data: { userId: deleteTarget.id },
      toast: true,
      destructive: true,
    });
    setDeleteTarget(null);
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
            <label className="grid gap-2">
              <span className="ui-field-label">Search</span>
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

            <label className="grid gap-2">
              <span className="ui-field-label">Status</span>
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
          {hospitalError ? <p className="mt-3 text-sm font-normal leading-5 text-[#EF4444]">{hospitalError}</p> : null}
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
                      <p className="ui-card-title">{row.name}</p>
                      <p className="mt-1 ui-card-meta">Hospital request</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "details",
                header: "Details",
                render: (row) => (
                  <div className="space-y-1">
                    <p className="ui-card-body">{formatDoctorDetail(row.department)}</p>
                    <p className="ui-card-meta">
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
                  <div className="flex items-center justify-start gap-3 whitespace-nowrap">
                    <Button
                      disabled={actioningDoctorId === row.userId || row.status === "approved"}
                      variant="successOutline"
                      size="sm"
                      leftIcon={<Check className="size-4" />}
                      onClick={() => void updateHospitalDoctorStatus(row.userId, "approved", row.status)}
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={actioningDoctorId === row.userId || row.status === "rejected"}
                      variant="dangerOutline"
                      size="sm"
                      leftIcon={<X className="size-4" />}
                      onClick={() => void updateHospitalDoctorStatus(row.userId, "rejected", row.status)}
                    >
                      Reject
                    </Button>
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
        <h2 className="ui-section-title">Doctor module</h2>
        <p className="mt-1 ui-body-secondary">Admin can review doctor registrations here.</p>
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
          <label className="grid gap-2">
            <span className="ui-field-label">Search</span>
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

          <label className="grid gap-2">
            <span className="ui-field-label">Status</span>
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
                    <p className="ui-card-title">{row.fullName}</p>
                    <p className="mt-1 ui-card-meta">{row.email}</p>
                    <p className="mt-1 ui-card-meta">Doctor account</p>
                  </div>
                </div>
              ),
            },
            {
              key: "details",
              header: "Details",
                render: (row) => (
                  <div className="space-y-1">
                    <p className="ui-card-body">{row.mobileNumber}</p>
                    <p className="ui-card-meta">Department: {formatDoctorDetail(row.department)}</p>
                    <p className="ui-card-meta">Specialization: {formatDoctorDetail(row.specialization)}</p>
                    <p className="ui-card-meta">Registration ID: {formatDoctorDetail(row.medicalRegistrationId)}</p>
                  </div>
                ),
              },
            {
              key: "registrationDate",
              header: "Registered",
                render: (row) => (
                  <div className="space-y-1">
                    <p className="ui-card-body">{formatDisplayDate(row.registrationDate || "")}</p>
                    <p className="ui-card-meta">Recent request</p>
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
                  <div className="flex items-center justify-start gap-3 whitespace-nowrap">
                    <Button
                      variant="successOutline"
                      size="sm"
                      leftIcon={<Check className="size-4" />}
                      onClick={() => void updateStatus(row.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      leftIcon={<X className="size-4" />}
                      onClick={() => setRejectTarget(row)}
                    >
                      Reject
                    </Button>
                    <button
                      type="button"
                      className="ui-icon-button text-[#0EA5A4] hover:text-[#0EA5A4]"
                      onClick={() => setEditTarget(row)}
                      aria-label={`Edit ${row.fullName}`}
                      title="Edit doctor"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="ui-icon-button text-[#EF4444] hover:text-[#EF4444] hover:border-[#EF4444]"
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`Delete ${row.fullName}`}
                      title="Delete doctor"
                    >
                      <Trash2 className="size-4" />
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
      <AdminUserEditModal
        open={Boolean(editTarget)}
        role="doctor"
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveDoctor}
      />
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Doctor"
        description="This frontend-only delete removes the doctor from the admin table using mock data."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteDoctor}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
