"use client";

import * as React from "react";
import {
  Building2,
  Check,
  CreditCard,
  IndianRupee,
  PencilLine,
  Sparkles,
  WalletCards,
  X
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import type { MockUser } from "@/lib/auth-flow";
import { apiRequest } from "@/lib/api";
import {
  getAdminHospitals,
  getSubscriptionSettings,
  updateCustomHospitalFee,
  updateDefaultFee,
  type SubscriptionSettings
} from "@/lib/dashboard-data";

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

export function SettingsSubscriptionsContent() {
  const { currentUser } = useDashboardContext();
  const [settings, setSettings] = React.useState<SubscriptionSettings | null>(null);
  const [draftDefaultFee, setDraftDefaultFee] = React.useState("");
  const [editingHospitalId, setEditingHospitalId] = React.useState<string | null>(null);
  const [editingFee, setEditingFee] = React.useState("");
  const [hospitals, setHospitals] = React.useState<MockUser[]>([]);
  const [hospitalSubscription, setHospitalSubscription] = React.useState<{
    amount: number;
    defaultAmount?: number;
    source?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;

    if (currentUser.role === "admin") {
      Promise.all([getSubscriptionSettings(), getAdminHospitals()])
        .then(([settingsData, hospitalData]) => {
          if (!active) return;
          setSettings(settingsData);
          setDraftDefaultFee(settingsData.defaultFee);
          setHospitals(hospitalData);
        })
        .catch(() => {
          if (!active) return;
          setSettings({ defaultFee: "0", customFees: [] });
          setDraftDefaultFee("0");
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
      amount: customFee || settings?.defaultFee || "0",
      feeSource: customFee ? "Hospital override" : "Default fee"
    };
  });

  async function saveDefaultFee() {
    if (!settings) return;
    const nextSettings = await updateDefaultFee(draftDefaultFee);
    setSettings(nextSettings);
    setDraftDefaultFee(nextSettings.defaultFee);
  }

  async function saveCustomFee(hospitalId: string) {
    if (!editingFee.trim()) {
      setEditingHospitalId(null);
      setEditingFee("");
      return;
    }
    const nextSettings = await updateCustomHospitalFee(hospitalId, editingFee);
    setSettings(nextSettings);
    setEditingHospitalId(null);
    setEditingFee("");
  }

  if (currentUser.role !== "admin") {
    const displayFee =
      hospitalSubscription?.amount != null ? String(hospitalSubscription.amount) : "0";
    const defaultFee =
      hospitalSubscription?.defaultAmount != null
        ? String(hospitalSubscription.defaultAmount)
        : displayFee;

    return (
      <div className="space-y-6">
        <PageHero
          title="Subscription Summary"
          description="View pricing"
          icon={<WalletCards className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
          imageAlt="Billing and payment desk"
          stats={[
            { label: "Current Fee", value: formatFee(displayFee) },
            { label: "Default Fee", value: formatFee(defaultFee) }
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 transition hover:border-[#0EA5A4]/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0EA5A4]">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="text-base font-medium text-[#0F172A]">Current Plan</p>
                  <p className="mt-1 text-xs text-[#64748B]">
                    {hospitalSubscription?.source === "hospital_override" ? "Custom fee" : "Using default"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-[#E2E8F0] pt-4">
              <p className="text-[32px] font-medium leading-none text-[#0F172A]">
                {formatFee(displayFee)}
              </p>
            </div>
          </Card>

          <Card className="p-4 transition hover:border-[#0EA5A4]/40">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0EA5A4]">
                <IndianRupee className="size-5" />
              </div>
              <div>
                <p className="text-base font-medium text-[#0F172A]">Default Fee</p>
                <p className="mt-1 text-xs text-[#64748B]">Contact admin for custom pricing</p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#E2E8F0] pt-4">
              <p className="text-[32px] font-medium leading-none text-[#0F172A]">
                {formatFee(defaultFee)}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Card className="p-4">Loading subscription settings...</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Subscription Management"
        description="Manage pricing"
        icon={<WalletCards className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
        imageAlt="Billing and payment desk"
        stats={[
          { label: "Default Fee", value: formatFee(settings.defaultFee) },
          { label: "Overrides", value: String(settings.customFees.length) }
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_144px] md:items-end">
          <label className="min-w-0 flex-1 space-y-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#0F172A]">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <CreditCard className="size-4" />
              </span>
              Default Fee
            </span>
            <Input
              value={draftDefaultFee}
              onChange={(event) => setDraftDefaultFee(event.target.value)}
              placeholder="Enter default fee"
            />
          </label>

          <Button className="h-11 w-full px-4" onClick={() => void saveDefaultFee()}>
            Save Fee
          </Button>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <Sparkles className="size-4" />
              </span>
              <h2 className="text-base font-medium text-[#0F172A]">Hospital Overrides</h2>
            </div>
            <p className="text-sm text-[#64748B]">Custom pricing per hospital</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B]">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
              <Building2 className="size-4" />
            </span>
            <span>Overrides</span>
            <span className="text-sm text-[#0F172A]">{settings.customFees.length}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {hospitalRows.map((row) => {
            const isEditing = editingHospitalId === row.id;

            return (
              <Card key={row.id} className="flex h-full flex-col p-4 transition hover:border-[#0EA5A4]/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                      <Building2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-medium text-[#0F172A]">
                        {row.displayName}
                      </h3>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {row.customFee ? "Custom fee" : "Using default"}
                      </p>
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
                      Edit
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 border-t border-[#E2E8F0] pt-4">
                  <p className="text-[32px] font-medium leading-none text-[#0F172A]">
                    {formatFee(row.amount)}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#64748B]">
                    <IndianRupee className="size-4 text-[#0EA5A4]" />
                    <span>{row.feeSource}</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <Input
                      value={editingFee}
                      onChange={(event) => setEditingFee(event.target.value)}
                      placeholder={`Leave blank to use ${formatFee(settings.defaultFee)}`}
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-10"
                        leftIcon={<Check className="size-4" />}
                        onClick={() => void saveCustomFee(row.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10"
                        leftIcon={<X className="size-4" />}
                        onClick={() => {
                          setEditingHospitalId(null);
                          setEditingFee("");
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
