"use client";

import * as React from "react";
import {
  Building2,
  Check,
  IndianRupee,
  PencilLine,
  Sparkles,
  Stethoscope,
  WalletCards,
  X,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import {
  getDoctorSubscriptionRecords,
  saveDoctorSubscriptionRecords,
  type DoctorSubscriptionRecord,
} from "@/lib/doctor-subscription-mock";
import { logger } from "@/lib/logger";

function formatFee(value: string) {
  return `Rs ${value}`;
}

export function SettingsDoctorSubscriptionsContent() {
  const { currentUser } = useDashboardContext();
  const [doctorSubscriptions, setDoctorSubscriptions] = React.useState<DoctorSubscriptionRecord[]>([]);
  const [editingDoctorId, setEditingDoctorId] = React.useState<string | null>(null);
  const [editingDoctorRate, setEditingDoctorRate] = React.useState("");
  const [editingDoctorHospitals, setEditingDoctorHospitals] = React.useState("");
  const [doctorFeeError, setDoctorFeeError] = React.useState("");
  const [savingDoctorId, setSavingDoctorId] = React.useState<string | null>(null);
  const [filterText, setFilterText] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<"all" | "high" | "low">("all");

  React.useEffect(() => {
    let active = true;

    getDoctorSubscriptionRecords()
      .then((data) => {
        if (!active) return;
        setDoctorSubscriptions(data);
      })
      .catch(() => {
        if (!active) return;
        setDoctorSubscriptions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const totalDoctorSubscriptionValue = doctorSubscriptions.reduce(
    (sum, doctor) => sum + doctor.hospitalCount * doctor.ratePerHospital,
    0
  );

  const filteredDoctorSubscriptions = doctorSubscriptions.filter((doctor) => {
    const total = doctor.hospitalCount * doctor.ratePerHospital;
    const matchesText = doctor.fullName.toLowerCase().includes(filterText.toLowerCase());
    const matchesMode =
      filterMode === "all" ||
      (filterMode === "high" && total >= 1500) ||
      (filterMode === "low" && total < 1500);
    return matchesText && matchesMode;
  });

  async function saveDoctorSubscription(doctorId: string) {
    const ratePerHospital = Number(editingDoctorRate);
    const hospitalCount = Number(editingDoctorHospitals);

    if (!Number.isFinite(ratePerHospital) || ratePerHospital < 0 || !Number.isFinite(hospitalCount) || hospitalCount < 0) {
      setDoctorFeeError("Enter valid hospital count and per-hospital fee.");
      return;
    }

    setDoctorFeeError("");
    setSavingDoctorId(doctorId);

    try {
      const nextRecords = doctorSubscriptions.map((doctor) =>
        doctor.id === doctorId
          ? {
              ...doctor,
              ratePerHospital,
              hospitalCount,
            }
          : doctor
      );

      const saved = await saveDoctorSubscriptionRecords(nextRecords);
      setDoctorSubscriptions(saved);
      setEditingDoctorId(null);
      setEditingDoctorRate("");
      setEditingDoctorHospitals("");
      logger.success("Doctor subscription updated.", {
        source: "settings.subscriptions.doctors",
        data: { doctorId, ratePerHospital, hospitalCount },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save doctor subscription.";
      setDoctorFeeError(message);
      logger.error("Unable to update the doctor subscription.", {
        source: "settings.subscriptions.doctors",
        data: { doctorId, error: message },
        toast: true,
      });
    } finally {
      setSavingDoctorId(null);
    }
  }

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <p className="ui-body-secondary">Only admins can manage doctor subscription pricing.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Doctor Subscriptions"
        description="Manage per-hospital doctor pricing on a dedicated page with filters and lower scroll."
        icon={<WalletCards className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
        imageAlt="Billing and payment desk"
        stats={[
          { label: "Doctors", value: String(filteredDoctorSubscriptions.length) },
          { label: "Per Hospital", value: "Manual" },
          { label: "Total Value", value: formatFee(String(totalDoctorSubscriptionValue)) },
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="ui-meta">Search</span>
            <Input
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder="Search doctor"
            />
          </label>
          <label className="space-y-2">
            <span className="ui-meta">Filter</span>
            <select
              value={filterMode}
              onChange={(event) => setFilterMode(event.target.value as "all" | "high" | "low")}
              className="focus-ring min-h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A]"
            >
              <option value="all">All</option>
              <option value="high">Rs 1500 and above</option>
              <option value="low">Below Rs 1500</option>
            </select>
          </label>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <Sparkles className="size-4" />
              </span>
              <h2 className="ui-section-title">Doctor Subscription Cards</h2>
            </div>
            <p className="ui-body-secondary">Manual fee entry per hospital with computed totals.</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B]">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
              <Stethoscope className="size-4" />
            </span>
            <span>Visible</span>
            <span className="text-sm font-medium text-[#0F172A]">{filteredDoctorSubscriptions.length}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredDoctorSubscriptions.map((doctor) => {
            const isEditing = editingDoctorId === doctor.id;
            const doctorTotal = doctor.hospitalCount * doctor.ratePerHospital;

            return (
              <Card key={doctor.id} className="flex h-full flex-col p-4 transition hover:border-[#0EA5A4]/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                      <Stethoscope className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate ui-section-title">{doctor.fullName}</h3>
                      <p className="mt-1 ui-meta">
                        {doctor.hospitalCount} hospitals x {formatFee(String(doctor.ratePerHospital))} per hospital
                      </p>
                    </div>
                  </div>

                  {!isEditing ? (
                    <button
                      type="button"
                      className="focus-ring inline-flex h-9 shrink-0 self-start items-center gap-1 rounded-md bg-[#0EA5A4] px-3 text-sm font-medium text-white transition hover:bg-[#0d9488]"
                      onClick={() => {
                        setEditingDoctorId(doctor.id);
                        setEditingDoctorRate(String(doctor.ratePerHospital));
                        setEditingDoctorHospitals(String(doctor.hospitalCount));
                        setDoctorFeeError("");
                      }}
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 border-t border-[#E2E8F0] pt-4">
                  <p className="ui-page-title leading-none">{formatFee(String(doctorTotal))}</p>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#64748B]">
                    <Building2 className="size-4 text-[#0EA5A4]" />
                    <span>{doctor.hospitalCount} linked hospitals</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="ui-meta">Hospitals</span>
                        <Input
                          value={editingDoctorHospitals}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          onChange={(event) => {
                            setEditingDoctorHospitals(event.target.value);
                            setDoctorFeeError("");
                          }}
                          placeholder="Enter hospital count"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="ui-meta">Per Hospital Fee</span>
                        <Input
                          value={editingDoctorRate}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          onChange={(event) => {
                            setEditingDoctorRate(event.target.value);
                            setDoctorFeeError("");
                          }}
                          placeholder="Enter per hospital fee"
                        />
                      </label>
                    </div>

                    <div className="rounded-lg bg-white px-3 py-3 text-sm text-[#64748B]">
                      Total subscription:
                      <span className="ml-2 font-medium text-[#0F172A]">
                        {formatFee(
                          String((Number(editingDoctorHospitals) || 0) * (Number(editingDoctorRate) || 0))
                        )}
                      </span>
                    </div>

                    {doctorFeeError ? <p className="text-sm text-[#EF4444]">{doctorFeeError}</p> : null}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-10"
                        leftIcon={<Check className="size-4" />}
                        loading={savingDoctorId === doctor.id}
                        onClick={() => void saveDoctorSubscription(doctor.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10"
                        leftIcon={<X className="size-4" />}
                        onClick={() => {
                          setEditingDoctorId(null);
                          setEditingDoctorRate("");
                          setEditingDoctorHospitals("");
                          setDoctorFeeError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
