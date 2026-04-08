"use client";

import * as React from "react";
import { Building2, Check, Mail, MapPin, RotateCcw, Search, ShieldCheck, WalletCards, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Avatar } from "@/components/data-display/Avatar";
import { Badge, Button, Card, Checkbox, Input, Select, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import { formatDisplayDate } from "@/lib/utils";
import {
  formatApprovalStatus,
  type MockUser,
  type UserApprovalStatus,
} from "@/lib/auth-flow";
import { apiRequest, buildQuery } from "@/lib/api";
import {
  getSelectionsForDoctor,
  getDoctorSubscriptionSummary,
  removeHospitalSelection,
  submitHospitalSelections,
  type HospitalSelection,
  getAdminHospitals,
  type DoctorSubscriptionSummary,
} from "@/lib/dashboard-data";
import { logger } from "@/lib/logger";

type HospitalRow = Record<string, unknown> & MockUser;
type HospitalDirectoryItem = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  status: string;
};

function badgeVariant(status: UserApprovalStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

function splitLocation(location?: string | null) {
  const parts = (location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] || "",
    state: parts[1] || "",
    country: parts[2] || "",
  };
}

function formatRequestStatus(status: HospitalSelection["status"]) {
  return status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending";
}

function requestBadgeVariant(status: HospitalSelection["status"]) {
  return status === "approved" ? "success" : status === "rejected" ? "error" : "warning";
}

function getRequestDateLabel(requestedAt: string) {
  const formatted = formatDisplayDate(requestedAt);
  return formatted.replace(/ \d{2}:\d{2} (AM|PM)$/, "");
}

export default function HospitalsPage() {
  const searchParams = useSearchParams();
  const { currentUser, refreshSession } = useDashboardContext();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [users, setUsers] = React.useState<MockUser[]>([]);
  const [rejectTarget, setRejectTarget] = React.useState<MockUser | null>(null);
  const [availableHospitals, setAvailableHospitals] = React.useState<HospitalDirectoryItem[]>([]);
  const [requests, setRequests] = React.useState<HospitalSelection[]>([]);
  const [selectedHospitalIds, setSelectedHospitalIds] = React.useState<string[]>([]);
  const [doctorSearch, setDoctorSearch] = React.useState("");
  const [loadingDoctorView, setLoadingDoctorView] = React.useState(true);
  const [doctorError, setDoctorError] = React.useState("");
  const [submittingSelection, setSubmittingSelection] = React.useState(false);
  const [removingHospitalId, setRemovingHospitalId] = React.useState<string | null>(null);
  const [subscriptionSummary, setSubscriptionSummary] = React.useState<DoctorSubscriptionSummary | null>(null);

  React.useEffect(() => {
    if (currentUser.role !== "admin") return;

    getAdminHospitals()
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
    if (currentUser.role !== "doctor") return;

    let active = true;
    setLoadingDoctorView(true);
    setDoctorError("");

    Promise.all([
      apiRequest<{ items: HospitalDirectoryItem[] }>(
        `/hospitals${buildQuery({ status: "approved", limit: 100 })}`
      ),
      getSelectionsForDoctor(currentUser.id),
      getDoctorSubscriptionSummary(currentUser.id),
    ])
      .then(([hospitalResponse, doctorRequests, doctorSubscription]) => {
        if (!active) return;
        setAvailableHospitals(hospitalResponse.items || []);
        setRequests(doctorRequests);
        setSubscriptionSummary(doctorSubscription);
      })
      .catch((error) => {
        if (!active) return;
        setDoctorError(error instanceof Error ? error.message : "Unable to load hospitals.");
        setAvailableHospitals([]);
        setRequests([]);
        setSubscriptionSummary(null);
      })
      .finally(() => {
        if (!active) return;
        setLoadingDoctorView(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser.id, currentUser.role]);

  const hospitalRows: HospitalRow[] = users
    .filter((user) => user.role === "hospital")
    .filter((user) => {
      const matchesSearch =
        (user.hospitalName || user.fullName).toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.approvalStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .map((user) => ({ ...user }));

  async function updateStatus(userId: string, status: UserApprovalStatus) {
    try {
      await apiRequest(`/admin/hospitals/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const updated = await getAdminHospitals();
      setUsers(updated);
      await refreshSession();
      logger.success(status === "approved" ? "Hospital approved." : "Hospital rejected.", {
        source: "hospitals.admin",
        data: { userId, status },
        toast: true,
        destructive: status === "rejected",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update hospital status.";
      logger.error("Unable to update the hospital status.", {
        source: "hospitals.admin",
        data: { userId, status, error: message },
        toast: true,
      });
    }
  }

  function confirmRejectHospital() {
    if (!rejectTarget) return;
    void updateStatus(rejectTarget.id, "rejected");
    setRejectTarget(null);
  }

  async function handleSubmitSelection() {
    if (!selectedHospitalIds.length) return;

    setSubmittingSelection(true);
    setDoctorError("");

    try {
      const nextRequests = await submitHospitalSelections(currentUser.id, selectedHospitalIds);
      const nextSubscriptionSummary = await getDoctorSubscriptionSummary(currentUser.id);
      setRequests(nextRequests);
      setSubscriptionSummary(nextSubscriptionSummary);
      setSelectedHospitalIds([]);
      logger.success("Hospital selection submitted.", {
        source: "hospitals.doctor",
        data: { hospitalIds: selectedHospitalIds },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit hospital selection.";
      setDoctorError(message);
      logger.error("Unable to submit the hospital selection.", {
        source: "hospitals.doctor",
        data: { hospitalIds: selectedHospitalIds, error: message },
        toast: true,
      });
    } finally {
      setSubmittingSelection(false);
    }
  }

  function getRevertLabel(status: HospitalSelection["status"]) {
    if (status === "pending") return "Cancel Request";
    if (status === "approved") return "Remove Selection";
    return "Clear Rejection";
  }

  async function handleRemoveSelection(hospitalId: string) {
    setRemovingHospitalId(hospitalId);
    setDoctorError("");

    try {
      const nextRequests = await removeHospitalSelection(currentUser.id, hospitalId);
      const nextSubscriptionSummary = await getDoctorSubscriptionSummary(currentUser.id);
      setRequests(nextRequests);
      setSubscriptionSummary(nextSubscriptionSummary);
      setSelectedHospitalIds((current) => current.filter((id) => id !== hospitalId));
      logger.success("Hospital selection reverted successfully.", {
        source: "hospitals.doctor",
        data: { hospitalId },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to revert hospital selection.";
      setDoctorError(message);
      logger.error("Unable to revert the hospital selection.", {
        source: "hospitals.doctor",
        data: { hospitalId, error: message },
        toast: true,
      });
    } finally {
      setRemovingHospitalId(null);
    }
  }

  if (currentUser.role === "doctor") {
    const requestsByHospitalId = new Map(requests.map((request) => [request.hospitalId, request]));
    const approvedRequests = requests.filter((request) => request.status === "approved");
    const pendingRequests = requests.filter((request) => request.status === "pending");
    const usedSlots = subscriptionSummary?.usedHospitalSlots ?? approvedRequests.length + pendingRequests.length;
    const hospitalLimit = subscriptionSummary?.hospitalLimit ?? 1;
    const remainingSlots = Math.max(0, subscriptionSummary?.remainingHospitalSlots ?? hospitalLimit - usedSlots);
    const filteredHospitals = availableHospitals.filter((hospital) => {
      const term = doctorSearch.toLowerCase();
      const matchesSearch =
        hospital.name.toLowerCase().includes(term) || hospital.email.toLowerCase().includes(term);
      const notAlreadyRequested = !requestsByHospitalId.has(hospital.id);

      return matchesSearch && notAlreadyRequested;
    });
    const subscriptionAmount = subscriptionSummary?.ratePerHospital ?? 500;
    const selectionLimitReached = selectedHospitalIds.length >= remainingSlots;

    return (
      <div className="space-y-6">
        <PageHero
          title="Hospital Selection"
          description="Choose within your plan."
          icon={<Building2 className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80"
          imageAlt="Hospital building exterior"
          stats={[
            { label: "Plan", value: `Rs ${subscriptionAmount}` },
            { label: "Limit", value: `${hospitalLimit} Hospitals` },
            { label: "Remaining", value: String(remainingSlots) },
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <WalletCards className="size-5" />
              </div>
              <div className="space-y-1">
                <h2 className="ui-section-title">Choose Hospitals</h2>
                <p className="ui-body-secondary">Rs 500 gives 1 hospital slot.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <p className="ui-meta">Approved</p>
                <p className="mt-1 ui-section-title leading-none">{approvedRequests.length}</p>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <p className="ui-meta">Pending</p>
                <p className="mt-1 ui-section-title leading-none">{pendingRequests.length}</p>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <p className="ui-meta">Selected</p>
                <p className="mt-1 ui-section-title leading-none">{selectedHospitalIds.length}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                  value={doctorSearch}
                  onChange={(event) => setDoctorSearch(event.target.value)}
                  placeholder="Search hospital by name or email"
                  className="pl-10"
                />
              </div>

              {doctorError ? <p className="ui-body text-[#EF4444]">{doctorError}</p> : null}
              {!doctorError && remainingSlots === 0 ? (
                <p className="ui-body-secondary">You have used all hospital slots in this plan.</p>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {filteredHospitals.map((hospital) => {
                  const location = splitLocation(hospital.location);
                  const checked = selectedHospitalIds.includes(hospital.id);
                  const disableSelection = !checked && (submittingSelection || selectionLimitReached);

                  return (
                    <label
                      key={hospital.id}
                      className={`flex cursor-pointer gap-4 rounded-lg border bg-white p-4 transition ${checked ? "border-[#0EA5A4]" : "border-[#E2E8F0] hover:border-[#0EA5A4]/50"} ${disableSelection ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disableSelection}
                        onChange={(event) => {
                          const nextChecked = event.target.checked;
                          setSelectedHospitalIds((current) =>
                            nextChecked ? [...current, hospital.id] : current.filter((id) => id !== hospital.id)
                          );
                        }}
                      />
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="min-w-0">
                          <p className="truncate ui-card-title">{hospital.name}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Mail className="mt-0.5 size-4 shrink-0 text-[#64748B]" />
                            <p className="ui-body-secondary">{hospital.email}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-[#64748B]" />
                            <p className="ui-body-secondary">
                              {[location.city, location.state].filter(Boolean).join(", ") || "Location unavailable"}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <WalletCards className="mt-0.5 size-4 shrink-0 text-[#64748B]" />
                            <p className="ui-body-secondary">Uses 1 hospital slot</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {!loadingDoctorView && filteredHospitals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <p className="ui-body-secondary">No approved hospitals matched your search.</p>
                </div>
              ) : null}

              <Button
                className="h-11 px-5"
                onClick={() => void handleSubmitSelection()}
                loading={submittingSelection}
                disabled={selectedHospitalIds.length === 0 || remainingSlots === 0}
              >
                Submit Selection
              </Button>
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <div className="space-y-1">
              <h2 className="ui-section-title">Current Requests</h2>
              <p className="ui-body-secondary">View current status.</p>
              <p className="ui-meta">{approvedRequests.length} approved / {pendingRequests.length} pending</p>
            </div>

            <div className="space-y-3">
              {requests.map((request) => {
                const hospital = availableHospitals.find((item) => item.id === request.hospitalId) || null;

                return (
                  <div key={request.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="truncate ui-section-title">
                          {hospital?.name || request.hospitalName || "Hospital request"}
                        </p>
                        <p className="ui-meta">Requested {getRequestDateLabel(request.requestedAt)}</p>
                        <p className="ui-meta">
                          {request.status === "approved" ? "1 slot used" : "Waiting for review"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={requestBadgeVariant(request.status)}>
                          {formatRequestStatus(request.status)}
                        </Badge>
                        <button
                          type="button"
                          className="ui-icon-button"
                          disabled={submittingSelection || removingHospitalId === request.hospitalId}
                          onClick={() => void handleRemoveSelection(request.hospitalId)}
                          aria-label={getRevertLabel(request.status)}
                          title={getRevertLabel(request.status)}
                        >
                          <RotateCcw className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loadingDoctorView && requests.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <p className="ui-body-secondary">No hospital requests submitted yet.</p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">Hospital module</h2>
        <p className="mt-1 text-sm text-[#64748B]">Admin can review hospital registrations here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Hospital Approval Workflow"
        description="Approve hospital registrations"
        icon={<ShieldCheck className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80"
        imageAlt="Hospital administration desk"
        stats={[
          { label: "Pending", value: String(users.filter((user) => user.role === "hospital" && user.approvalStatus === "pending").length) },
          { label: "Approved", value: String(users.filter((user) => user.role === "hospital" && user.approvalStatus === "approved").length) },
          { label: "Rejected", value: String(users.filter((user) => user.role === "hospital" && user.approvalStatus === "rejected").length) },
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
                placeholder="Search by hospital name or email"
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
        <Table<HospitalRow>
          columns={[
            {
              key: "profile",
              header: "Profile",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.hospitalName || row.fullName} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                  <div>
                    <p className="ui-section-title">{row.hospitalName || row.fullName}</p>
                    <p className="mt-1 ui-meta">{row.email}</p>
                    <p className="mt-1 ui-meta">Hospital account</p>
                  </div>
                </div>
              ),
            },
            {
              key: "details",
              header: "Details",
              render: (row) => (
                <div className="space-y-1">
                  <p className="ui-body">{row.mobileNumber}</p>
                  <p className="ui-meta">{row.city}, {row.state}</p>
                  <p className="ui-meta">{row.country}</p>
                </div>
              ),
            },
            {
              key: "registrationDate",
              header: "Registered",
              render: (row) => (
                <div className="space-y-1">
                  <p className="ui-body">{formatDisplayDate(row.registrationDate || "")}</p>
                  <p className="ui-meta">Recent request</p>
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
          data={hospitalRows}
          pageSize={6}
          emptyMessage="No hospitals matched the selected filters."
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(rejectTarget)}
        title="Reject Hospital"
        description="Are you sure you want to reject this hospital?"
        confirmLabel="Confirm Reject"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={confirmRejectHospital}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
