"use client";

import * as React from "react";
import {
  Check,
  PencilLine,
  Sparkles,
  Stethoscope,
  WalletCards,
  X,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import {
  getDoctorSubscriptionRecords,
  updateDoctorSubscriptionRate,
  type DoctorSubscriptionRecord,
} from "@/lib/dashboard-data";
import { logger } from "@/lib/logger";

function formatFee(value: string) {
  return `Rs ${value}`;
}

function getHospitalLimit(amount: number) {
  return Math.max(1, Math.floor(amount / 500));
}

export function SettingsDoctorSubscriptionsContent() {
  const { currentUser } = useDashboardContext();
  const { t } = useI18n();
  const [doctorSubscriptions, setDoctorSubscriptions] = React.useState<DoctorSubscriptionRecord[]>([]);
  const [editingDoctorId, setEditingDoctorId] = React.useState<string | null>(null);
  const [editingDoctorRate, setEditingDoctorRate] = React.useState("");
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
    (sum, doctor) => sum + doctor.ratePerHospital,
    0
  );

  const filteredDoctorSubscriptions = doctorSubscriptions.filter((doctor) => {
    const total = doctor.ratePerHospital;
    const matchesText = doctor.fullName.toLowerCase().includes(filterText.toLowerCase());
    const matchesMode =
      filterMode === "all" ||
      (filterMode === "high" && total >= 1500) ||
      (filterMode === "low" && total < 1500);
    return matchesText && matchesMode;
  });

  async function saveDoctorSubscription(doctorId: string) {
    const ratePerHospital = Number(editingDoctorRate);

    if (!Number.isFinite(ratePerHospital) || ratePerHospital < 500 || ratePerHospital % 500 !== 0) {
      setDoctorFeeError(t("subscriptions.amountStepError"));
      return;
    }

    setDoctorFeeError("");
    setSavingDoctorId(doctorId);

    try {
      await updateDoctorSubscriptionRate(doctorId, ratePerHospital);
      const refreshedRecords = await getDoctorSubscriptionRecords();
      setDoctorSubscriptions(refreshedRecords);
      setEditingDoctorId(null);
      setEditingDoctorRate("");
      logger.success(t("subscriptions.doctorUpdated"), {
        source: "settings.subscriptions.doctors",
        data: { doctorId, ratePerHospital },
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
        <p className="ui-body-secondary">{t("subscriptions.adminOnlyDoctors")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title={t("subscriptions.doctorsTitle")}
        description={t("subscriptions.doctorsDescription")}
        icon={<WalletCards className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
        imageAlt={t("subscriptions.imageAlt")}
        stats={[
          { label: t("doctors.doctors"), value: String(filteredDoctorSubscriptions.length) },
          { label: t("subscriptions.baseStep"), value: "Rs 500" },
          { label: t("subscriptions.plans"), value: formatFee(String(totalDoctorSubscriptionValue)) },
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="ui-meta">{t("common.actions.search")}</span>
            <Input
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder={t("subscriptions.searchDoctor")}
            />
          </label>
          <label className="space-y-2">
            <span className="ui-meta">{t("common.actions.filter")}</span>
            <select
              value={filterMode}
              onChange={(event) => setFilterMode(event.target.value as "all" | "high" | "low")}
              className="focus-ring min-h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A]"
            >
              <option value="all">{t("common.statuses.all")}</option>
              <option value="high">{t("subscriptions.filterHigh")}</option>
              <option value="low">{t("subscriptions.filterLow")}</option>
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
              <h2 className="ui-section-title">{t("subscriptions.cardsTitle")}</h2>
            </div>
            <p className="ui-body-secondary">{t("subscriptions.cardsDescription")}</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B]">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
              <Stethoscope className="size-4" />
            </span>
            <span>{t("common.visible")}</span>
            <span className="text-sm font-medium text-[#0F172A]">{filteredDoctorSubscriptions.length}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredDoctorSubscriptions.map((doctor) => {
            const isEditing = editingDoctorId === doctor.id;
            const hospitalLimit = getHospitalLimit(doctor.ratePerHospital);

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
                        {t("subscriptions.plan")} {formatFee(String(doctor.ratePerHospital))} • {t("subscriptions.hospitalLimit")} {hospitalLimit} {t("hospitals.hospitals").toLowerCase()}
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
                        setDoctorFeeError("");
                      }}
                    >
                      <PencilLine className="size-4" />
                      {t("common.actions.edit")}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 border-t border-[#E2E8F0] pt-4">
                  <p className="ui-page-title leading-none">{formatFee(String(doctor.ratePerHospital))}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-[#F8FAFC] px-3 py-2">
                      <p className="ui-meta">{t("subscriptions.hospitalLimit")}</p>
                      <p className="ui-body">{hospitalLimit}</p>
                    </div>
                    <div className="rounded-lg bg-[#F8FAFC] px-3 py-2">
                      <p className="ui-meta">{t("subscriptions.used")}</p>
                      <p className="ui-body">{doctor.hospitalCount}</p>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <label className="space-y-2">
                      <span className="ui-meta">{t("subscriptions.planAmount")}</span>
                      <Input
                        value={editingDoctorRate}
                        type="number"
                        min="500"
                        step="500"
                        inputMode="numeric"
                        onChange={(event) => {
                          setEditingDoctorRate(event.target.value);
                          setDoctorFeeError("");
                        }}
                        placeholder={t("subscriptions.enterAmount")}
                      />
                    </label>

                    <div className="rounded-lg bg-white px-3 py-3">
                      <p className="ui-meta">{t("subscriptions.rule")}</p>
                      <p className="ui-body">
                        {formatFee(editingDoctorRate || "500")} allows {getHospitalLimit(Number(editingDoctorRate) || 500)} {t("hospitals.hospitals").toLowerCase()}.
                      </p>
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
                        {t("common.actions.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10"
                        leftIcon={<X className="size-4" />}
                        onClick={() => {
                          setEditingDoctorId(null);
                          setEditingDoctorRate("");
                          setDoctorFeeError("");
                        }}
                      >
                        {t("common.actions.cancel")}
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
