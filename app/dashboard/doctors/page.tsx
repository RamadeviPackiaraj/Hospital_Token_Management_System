"use client";

import * as React from "react";
import { Check, Pencil, Search, ShieldCheck, Trash2, UserRoundCheck, X } from "lucide-react";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Avatar } from "@/components/data-display/Avatar";
import { Badge, Button, Card, Input, Select, Table } from "@/components/ui";
import { useDashboardContext, PageHero, AdminUserEditModal } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import { formatDisplayDate } from "@/lib/utils";
import {
  type MockUser,
  type UserApprovalStatus,
} from "@/lib/auth-flow";
import { apiRequest } from "@/lib/api";
import { deleteAdminDoctor, getAdminDoctors, updateAdminDoctorProfile } from "@/lib/dashboard-data";
import { logger } from "@/lib/logger";

type DoctorRow = Record<string, unknown> & MockUser;
type HospitalDoctorRequest = {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string;
  department?: string;
  displayDepartment?: string;
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
  const { t } = useI18n();
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
      .then((data) => setUsers(data))
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
      logger.success(status === "approved" ? t("doctors.approveSuccess") : t("doctors.rejectSuccess"), {
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
          setHospitalError(t("doctors.alreadyApproved"));
          logger.warn("Doctor is already approved.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
          });
        } else if (currentStatus === "rejected" && nextStatus === "rejected") {
          setHospitalError(t("doctors.alreadyRejected"));
          logger.warn("Doctor is already rejected.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
            destructive: true,
          });
        } else if (currentStatus === "approved" && nextStatus === "rejected") {
          setHospitalError(t("doctors.alreadyApprovedRecord"));
          logger.warn("This approved doctor cannot be rejected here.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
            destructive: true,
          });
        } else if (currentStatus === "rejected" && nextStatus === "approved") {
          setHospitalError(t("doctors.alreadyRejectedRecord"));
          logger.warn("This rejected doctor cannot be approved here.", {
            source: "doctors.hospital",
            data: { doctorId, currentStatus, nextStatus },
            toast: true,
          });
        } else {
          setHospitalError(t("doctors.cannotUpdateRecord"));
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
    void (async () => {
      try {
        if (editTarget && user.approvalStatus !== editTarget.approvalStatus) {
          await apiRequest(`/admin/doctors/${user.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: user.approvalStatus }),
          });
        }

        await updateAdminDoctorProfile(user);
        const updated = await getAdminDoctors();
        setUsers(updated);
        setEditTarget(null);
        await refreshSession();
        logger.success("Doctor updated.", {
          source: "doctors.admin",
          data: { userId: user.id, emailChanged: editTarget?.email !== user.email },
          toast: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update doctor.";
        logger.error("Unable to update doctor.", {
          source: "doctors.admin",
          data: { userId: user.id, error: message },
          toast: true,
        });
      }
    })();
  }

  function handleDeleteDoctor() {
    if (!deleteTarget) {
      return;
    }

    void (async () => {
      try {
        await deleteAdminDoctor(deleteTarget.id);
        const updated = await getAdminDoctors();
        setUsers(updated);
        logger.warn("Doctor deleted.", {
          source: "doctors.admin",
          data: { userId: deleteTarget.id },
          toast: true,
          destructive: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete doctor.";
        logger.error("Unable to delete doctor.", {
          source: "doctors.admin",
          data: { userId: deleteTarget.id, error: message },
          toast: true,
        });
      } finally {
        setDeleteTarget(null);
      }
    })();
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
          title={t("doctors.hospitalTitle")}
          description={t("doctors.hospitalDescription")}
          icon={<UserRoundCheck className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
          imageAlt={t("doctors.imageAltHospital")}
          stats={[
            { label: t("doctors.requests"), value: String(hospitalRequests.length) },
            {
              label: t("common.statuses.pending"),
              value: String(hospitalRequests.filter((doctor) => doctor.status === "pending").length),
            },
            {
              label: t("common.statuses.rejected"),
              value: String(hospitalRequests.filter((doctor) => doctor.status === "rejected").length),
            },
          ]}
        />

        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="ui-field-label">{t("common.actions.search")}</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                  value={hospitalSearch}
                  onChange={(event) => setHospitalSearch(event.target.value)}
                  placeholder={t("doctors.searchDoctorEmail")}
                  className="pl-10"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="ui-field-label">{t("common.actions.status")}</span>
              <Select
                value={hospitalStatusFilter}
                onChange={(event) => setHospitalStatusFilter(event.target.value)}
              options={[
                { label: t("common.statuses.allStatuses"), value: "all" },
                { label: t("common.statuses.pending"), value: "pending" },
                { label: t("common.statuses.approved"), value: "approved" },
                { label: t("common.statuses.rejected"), value: "rejected" },
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
                header: t("doctors.doctor"),
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={row.displayName || row.name} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                    <div>
                      <p className="ui-card-title">{row.displayName || row.name}</p>
                      <p className="mt-1 ui-card-meta">{t("doctors.hospitalRequest")}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "details",
                header: t("doctors.details"),
                render: (row) => (
                  <div className="space-y-1">
                    <p className="ui-card-body">{formatDoctorDetail(row.displayDepartment || row.department)}</p>
                    <p className="ui-card-meta">
                      Requested{" "}
                      {row.createdAt
                        ? formatDisplayDate(row.createdAt).replace(/ \d{2}:\d{2} (AM|PM)$/, "")
                        : t("common.recent")}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                header: t("common.actions.status"),
                render: (row) => (
                  <Badge status={requestBadgeVariant(row.status)} className="font-medium">
                    {row.status === "approved"
                      ? t("common.statuses.approved")
                      : row.status === "rejected"
                        ? t("common.statuses.rejected")
                        : t("common.statuses.pending")}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: t("doctors.actions"),
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
                      {t("common.actions.approve")}
                    </Button>
                    <Button
                      disabled={actioningDoctorId === row.userId || row.status === "rejected"}
                      variant="dangerOutline"
                      size="sm"
                      leftIcon={<X className="size-4" />}
                      onClick={() => void updateHospitalDoctorStatus(row.userId, "rejected", row.status)}
                    >
                      {t("common.actions.reject")}
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredRequests}
            loading={loadingHospitalView}
            pageSize={6}
            emptyMessage={t("doctors.noRequestsFiltered")}
          />
        </Card>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <h2 className="ui-section-title">{t("doctors.fallbackModuleTitle")}</h2>
        <p className="mt-1 ui-body-secondary">{t("doctors.fallbackModuleDescription")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title={t("doctors.adminTitle")}
        description={t("doctors.adminDescription")}
        icon={<ShieldCheck className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
        imageAlt={t("doctors.imageAltAdmin")}
        stats={[
          { label: t("common.statuses.pending"), value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "pending").length) },
          { label: t("common.statuses.approved"), value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "approved").length) },
          { label: t("common.statuses.rejected"), value: String(users.filter((user) => user.role === "doctor" && user.approvalStatus === "rejected").length) },
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="ui-field-label">{t("common.actions.search")}</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("doctors.searchNameEmail")}
                className="pl-10"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="ui-field-label">{t("common.actions.status")}</span>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { label: t("common.statuses.allStatuses"), value: "all" },
                { label: t("common.statuses.pending"), value: "pending" },
                { label: t("common.statuses.approved"), value: "approved" },
                { label: t("common.statuses.rejected"), value: "rejected" },
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
              header: t("doctors.profile"),
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.displayFullName || row.fullName} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                  <div>
                    <p className="ui-card-title">{row.displayFullName || row.fullName}</p>
                    <p className="mt-1 ui-card-meta">{row.email}</p>
                    <p className="mt-1 ui-card-meta">{t("doctors.doctorAccount")}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "details",
              header: t("doctors.details"),
                render: (row) => (
                  <div className="space-y-1">
                    <p className="ui-card-body">{row.mobileNumber}</p>
                    <p className="ui-card-meta">{t("doctors.department")}: {formatDoctorDetail(row.displayDepartment || row.department, t("common.notProvided"))}</p>
                    <p className="ui-card-meta">{t("doctors.specialization")}: {formatDoctorDetail(row.displaySpecialization || row.specialization, t("common.notProvided"))}</p>
                    <p className="ui-card-meta">{t("doctors.registrationId")}: {formatDoctorDetail(row.medicalRegistrationId, t("common.notProvided"))}</p>
                  </div>
                ),
              },
            {
              key: "registrationDate",
              header: t("doctors.registered"),
                render: (row) => (
                  <div className="space-y-1">
                    <p className="ui-card-body">{formatDisplayDate(row.registrationDate || "")}</p>
                    <p className="ui-card-meta">{t("common.requestedRecently")}</p>
                  </div>
                ),
              },
            {
              key: "approvalStatus",
              header: t("common.actions.status"),
              render: (row) => (
                <Badge status={badgeVariant(row.approvalStatus)} className="font-medium">
                  {row.approvalStatus === "approved"
                    ? t("common.statuses.approved")
                    : row.approvalStatus === "rejected"
                      ? t("common.statuses.rejected")
                      : t("common.statuses.pending")}
                </Badge>
              ),
            },
            {
              key: "actions",
                header: t("doctors.actions"),
                className: "min-w-[220px]",
                render: (row) => (
                  <div className="flex items-center justify-start gap-3 whitespace-nowrap">
                    <Button
                      variant="successOutline"
                      size="sm"
                      leftIcon={<Check className="size-4" />}
                      onClick={() => void updateStatus(row.id, "approved")}
                    >
                      {t("common.actions.approve")}
                    </Button>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      leftIcon={<X className="size-4" />}
                      onClick={() => setRejectTarget(row)}
                    >
                      {t("common.actions.reject")}
                    </Button>
                    <button
                      type="button"
                      className="ui-icon-button text-[#0EA5A4] hover:text-[#0EA5A4]"
                      onClick={() => setEditTarget(row)}
                      aria-label={`Edit ${row.displayFullName || row.fullName}`}
                      title={t("doctors.editDoctor")}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="ui-icon-button text-[#EF4444] hover:text-[#EF4444] hover:border-[#EF4444]"
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`Delete ${row.displayFullName || row.fullName}`}
                      title={t("doctors.deleteDoctor")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ),
              },
          ]}
          data={doctorRows}
          pageSize={6}
          emptyMessage={t("doctors.noDoctorsFiltered")}
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(rejectTarget)}
        title={t("doctors.rejectDialogTitle")}
        description={t("doctors.rejectDialogDescription")}
        confirmLabel={t("doctors.confirmReject")}
        cancelLabel={t("common.actions.cancel")}
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
        title={t("doctors.deleteDialogTitle")}
        description={t("doctors.deleteDialogDescription")}
        confirmLabel={t("common.actions.delete")}
        cancelLabel={t("common.actions.cancel")}
        confirmVariant="danger"
        onConfirm={handleDeleteDoctor}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
