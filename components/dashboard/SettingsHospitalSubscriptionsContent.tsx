"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  IndianRupee,
  PencilLine,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import type { MockUser } from "@/lib/auth-flow";
import { apiRequest } from "@/lib/api";
import {
  getAdminHospitals,
  getSubscriptionSettings,
  updateCustomHospitalFee,
  updateDefaultFee,
  type SubscriptionSettings,
} from "@/lib/dashboard-data";
import { logger } from "@/lib/logger";

type HospitalFeeRow = Record<string, unknown> &
  MockUser & {
    displayName: string;
    customFee?: string;
    amount: string;
    feeSource: string;
  };

function formatFee(value: string) {
  return `Rs ${value}`;
}

export function SettingsHospitalSubscriptionsContent() {
  const { currentUser } = useDashboardContext();
  const { t } = useI18n();
  const [settings, setSettings] = React.useState<SubscriptionSettings | null>(null);
  const [draftDefaultFee, setDraftDefaultFee] = React.useState("500");
  const [defaultFeeError, setDefaultFeeError] = React.useState("");
  const [savingDefaultFee, setSavingDefaultFee] = React.useState(false);
  const [editingHospitalId, setEditingHospitalId] = React.useState<string | null>(null);
  const [editingFee, setEditingFee] = React.useState("");
  const [customFeeError, setCustomFeeError] = React.useState("");
  const [savingCustomFeeId, setSavingCustomFeeId] = React.useState<string | null>(null);
  const [hospitals, setHospitals] = React.useState<MockUser[]>([]);
  const [hospitalSubscription, setHospitalSubscription] = React.useState<{
    amount: number;
    defaultAmount?: number;
    source?: string;
  } | null>(null);
  const [filterText, setFilterText] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<"all" | "default" | "custom">("all");

  React.useEffect(() => {
    let active = true;

    if (currentUser.role === "admin") {
      Promise.all([getSubscriptionSettings(), getAdminHospitals()])
        .then(([settingsData, hospitalData]) => {
          if (!active) return;
          const fallbackDefaultFee =
            settingsData.defaultFee && Number(settingsData.defaultFee) > 0 ? settingsData.defaultFee : "500";
          setSettings({ ...settingsData, defaultFee: fallbackDefaultFee });
          setDraftDefaultFee(fallbackDefaultFee);
          setHospitals(hospitalData);
        })
        .catch(() => {
          if (!active) return;
          setSettings({ defaultFee: "500", customFees: [] });
          setDraftDefaultFee("500");
          setHospitals([]);
        });
    } else if (currentUser.role === "hospital") {
      apiRequest<{ amount: number; defaultAmount?: number; source?: string }>(
        `/hospitals/${currentUser.id}/subscription`
      )
        .then((data) => {
          if (!active) return;
          setHospitalSubscription(data);
        })
        .catch(() => {
          if (!active) return;
          setHospitalSubscription(null);
        });
    }

    return () => {
      active = false;
    };
  }, [currentUser]);

  const hospitalRows: HospitalFeeRow[] = hospitals.map((hospital) => {
    const customFee = settings?.customFees.find((item) => item.hospitalId === hospital.id)?.fee;

    return {
      ...hospital,
      displayName: hospital.hospitalName || hospital.fullName,
      customFee: customFee || undefined,
      amount: customFee || settings?.defaultFee || "500",
      feeSource: customFee ? t("subscriptions.hospitalOverride") : t("subscriptions.defaultFee"),
    };
  });

  const filteredHospitalRows = hospitalRows.filter((row) => {
    const matchesText =
      row.displayName.toLowerCase().includes(filterText.toLowerCase()) ||
      row.email.toLowerCase().includes(filterText.toLowerCase());

    const matchesMode =
      filterMode === "all" ||
      (filterMode === "custom" && Boolean(row.customFee)) ||
      (filterMode === "default" && !row.customFee);

    return matchesText && matchesMode;
  });

  async function saveDefaultFee() {
    if (!settings) return;
    setDefaultFeeError("");
    setSavingDefaultFee(true);

    try {
      const nextSettings = await updateDefaultFee(draftDefaultFee || "500");
      const fallbackDefaultFee =
        nextSettings.defaultFee && Number(nextSettings.defaultFee) > 0 ? nextSettings.defaultFee : "500";
      setSettings({ ...nextSettings, defaultFee: fallbackDefaultFee });
      setDraftDefaultFee(fallbackDefaultFee);
      logger.success(t("subscriptions.defaultFeeUpdated"), {
        source: "settings.subscriptions.hospitals",
        data: { defaultFee: fallbackDefaultFee },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save default fee.";
      setDefaultFeeError(message);
      logger.error("Unable to update the default subscription fee.", {
        source: "settings.subscriptions.hospitals",
        data: { error: message },
        toast: true,
      });
    } finally {
      setSavingDefaultFee(false);
    }
  }

  async function saveCustomFee(hospitalId: string) {
    if (!editingFee.trim()) {
      setEditingHospitalId(null);
      setEditingFee("");
      setCustomFeeError("");
      return;
    }

    setCustomFeeError("");
    setSavingCustomFeeId(hospitalId);

    try {
      const nextSettings = await updateCustomHospitalFee(hospitalId, editingFee);
      const fallbackDefaultFee =
        nextSettings.defaultFee && Number(nextSettings.defaultFee) > 0 ? nextSettings.defaultFee : "500";
      setSettings({ ...nextSettings, defaultFee: fallbackDefaultFee });
      setEditingHospitalId(null);
      setEditingFee("");
      logger.success(t("subscriptions.customFeeUpdated"), {
        source: "settings.subscriptions.hospitals",
        data: { hospitalId, fee: editingFee || null },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save custom fee.";
      setCustomFeeError(message);
      logger.error("Unable to update the hospital fee.", {
        source: "settings.subscriptions.hospitals",
        data: { hospitalId, error: message },
        toast: true,
      });
    } finally {
      setSavingCustomFeeId(null);
    }
  }

  if (currentUser.role !== "admin") {
    const displayFee = hospitalSubscription?.amount != null ? String(hospitalSubscription.amount) : "500";
    const defaultFee =
      hospitalSubscription?.defaultAmount != null ? String(hospitalSubscription.defaultAmount) : "500";

    return (
      <div className="space-y-6">
        <PageHero
          title={t("subscriptions.hospitalSummaryTitle")}
          description={t("subscriptions.hospitalSummaryDescription")}
          icon={<WalletCards className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
          imageAlt={t("subscriptions.imageAlt")}
          stats={[
            { label: t("subscriptions.currentFee"), value: formatFee(displayFee) },
            { label: t("subscriptions.defaultFee"), value: formatFee(defaultFee) },
          ]}
        />
      </div>
    );
  }

  if (!settings) {
    return <Card className="p-4">{t("subscriptions.loadingHospitalSettings")}</Card>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/settings/subscriptions"
        className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B] transition hover:border-[#0EA5A4] hover:text-[#0EA5A4]"
      >
        <ArrowLeft className="size-4" />
        {t("subscriptions.backToSubscriptions")}
      </Link>

      <PageHero
        title={t("subscriptions.hospitalsTitle")}
        description={t("subscriptions.hospitalsDescription")}
        icon={<WalletCards className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
        imageAlt={t("subscriptions.imageAlt")}
        stats={[
          { label: t("subscriptions.defaultFee"), value: formatFee(settings.defaultFee || "500") },
          { label: t("subscriptions.customOverrides"), value: String(settings.customFees.length) },
          { label: t("subscriptions.visibleHospitals"), value: String(filteredHospitalRows.length) },
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px] lg:items-end">
          <label className="min-w-0 space-y-2">
            <span className="inline-flex items-center gap-2 ui-body">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <CreditCard className="size-4" />
              </span>
              {t("subscriptions.defaultFee")}
            </span>
            <Input
              value={draftDefaultFee}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              onChange={(event) => {
                setDraftDefaultFee(event.target.value);
                setDefaultFeeError("");
              }}
              placeholder={t("subscriptions.enterDefaultFee")}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="ui-meta">{t("common.actions.search")}</span>
              <Input
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
                placeholder={t("subscriptions.searchHospital")}
              />
            </label>
            <label className="space-y-2">
              <span className="ui-meta">{t("common.actions.filter")}</span>
              <select
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value as "all" | "default" | "custom")}
                className="focus-ring min-h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A]"
              >
                <option value="all">{t("common.statuses.all")}</option>
                <option value="default">{t("subscriptions.defaultFee")}</option>
                <option value="custom">{t("subscriptions.customFee")}</option>
              </select>
            </label>
          </div>

          <Button className="h-11 w-full px-4" onClick={() => void saveDefaultFee()} loading={savingDefaultFee}>
            {t("subscriptions.saveFee")}
          </Button>
        </div>
        {defaultFeeError ? <p className="mt-3 text-sm text-[#EF4444]">{defaultFeeError}</p> : null}
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <Sparkles className="size-4" />
              </span>
              <h2 className="ui-section-title">{t("subscriptions.overridesTitle")}</h2>
            </div>
            <p className="ui-body-secondary">{t("subscriptions.overridesDescription")}</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B]">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
              <Building2 className="size-4" />
            </span>
            <span>{t("common.visible")}</span>
            <span className="text-sm font-medium text-[#0F172A]">{filteredHospitalRows.length}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredHospitalRows.map((row) => {
            const isEditing = editingHospitalId === row.id;

            return (
              <Card key={row.id} className="flex h-full flex-col p-4 transition hover:border-[#0EA5A4]/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                      <Building2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate ui-section-title">{row.displayName}</h3>
                      <p className="mt-1 ui-meta">{row.customFee ? t("subscriptions.customFee") : t("subscriptions.usingDefault")}</p>
                    </div>
                  </div>

                  {!isEditing ? (
                    <button
                      type="button"
                      className="focus-ring inline-flex h-9 shrink-0 self-start items-center gap-1 rounded-md bg-[#0EA5A4] px-3 text-sm font-medium text-white transition hover:bg-[#0d9488]"
                      onClick={() => {
                        const customFee =
                          settings.customFees.find((item) => item.hospitalId === row.id)?.fee || "";
                        setEditingHospitalId(row.id);
                        setEditingFee(customFee);
                      }}
                    >
                      <PencilLine className="size-4" />
                      {t("common.actions.edit")}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 border-t border-[#E2E8F0] pt-4">
                  <p className="ui-page-title leading-none">{formatFee(row.amount)}</p>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#64748B]">
                    <IndianRupee className="size-4 text-[#0EA5A4]" />
                    <span>{row.feeSource}</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <Input
                      value={editingFee}
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      onChange={(event) => {
                        setEditingFee(event.target.value);
                        setCustomFeeError("");
                      }}
                      placeholder={t("subscriptions.leaveBlankFee", { fee: formatFee(settings.defaultFee || "500") })}
                    />
                    {customFeeError ? <p className="text-sm text-[#EF4444]">{customFeeError}</p> : null}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-10"
                        leftIcon={<Check className="size-4" />}
                        loading={savingCustomFeeId === row.id}
                        onClick={() => void saveCustomFee(row.id)}
                      >
                        {t("common.actions.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10"
                        leftIcon={<X className="size-4" />}
                        onClick={() => {
                          setEditingHospitalId(null);
                          setEditingFee("");
                          setCustomFeeError("");
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
