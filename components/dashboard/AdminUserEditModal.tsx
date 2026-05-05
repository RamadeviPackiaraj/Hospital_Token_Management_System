"use client";

import * as React from "react";
import { ArrowLeft, Building2, MailCheck } from "lucide-react";
import { GetCity, GetCountries, GetState } from "react-country-state-city";
import { useI18n } from "@/components/i18n";
import { OTPInput } from "@/components/OTPInput";
import { Button, Input, Select } from "@/components/ui";
import { Modal } from "@/components/overlay/Modal";
import type { MockUser } from "@/lib/auth-flow";
import {
  getDepartments,
  requestAdminUserEmailChange,
  verifyAdminUserEmailChange,
  type DepartmentRecord,
} from "@/lib/dashboard-data";

type CountryOption = { id: number; name: string };
type StateOption = { id: number; name: string };
type CityOption = { id: number; name: string };

export interface AdminUserEditModalProps {
  open: boolean;
  role: "doctor" | "hospital";
  user: MockUser | null;
  onClose: () => void;
  onSave: (user: MockUser) => void;
}

type OtpState = "idle" | "sent" | "verified";

function normalizeDraft(role: "doctor" | "hospital", user: MockUser | null): MockUser | null {
  if (!user) {
    return null;
  }

  return {
    ...user,
    fullName: user.fullName?.trim() || "",
    mobileNumber: user.mobileNumber?.trim() || "",
    email: user.email?.trim() || "",
    hospitalName: role === "hospital" ? user.hospitalName || user.fullName : user.hospitalName,
    gender: user.gender?.trim().toLowerCase() || undefined,
    specialization: user.specialization?.trim() || undefined,
    department: user.department?.trim() || undefined,
    medicalRegistrationId: user.medicalRegistrationId?.trim() || undefined,
    bloodGroup: user.bloodGroup?.trim() || undefined,
    country: user.country?.trim() || undefined,
    state: user.state?.trim() || undefined,
    city: user.city?.trim() || undefined,
  };
}

export function AdminUserEditModal({
  open,
  role,
  user,
  onClose,
  onSave,
}: AdminUserEditModalProps) {
  const { t } = useI18n();
  const [draft, setDraft] = React.useState<MockUser | null>(null);
  const [otpCode, setOtpCode] = React.useState("");
  const [otpState, setOtpState] = React.useState<OtpState>("idle");
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [error, setError] = React.useState("");
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [states, setStates] = React.useState<StateOption[]>([]);
  const [cities, setCities] = React.useState<CityOption[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const [selectedCountryId, setSelectedCountryId] = React.useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(normalizeDraft(role, user));
    setOtpCode("");
    setOtpState("idle");
    setSendingOtp(false);
    setVerifyingOtp(false);
    setError("");
  }, [open, role, user]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    GetCountries().then((nextCountries) => {
      if (!active) {
        return;
      }
      setCountries((nextCountries as CountryOption[]) ?? []);
    });

    getDepartments()
      .then((nextDepartments) => {
        if (!active) {
          return;
        }
        setDepartments(nextDepartments);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setDepartments([]);
      });

    return () => {
      active = false;
    };
  }, [open]);

  React.useEffect(() => {
    if (!draft?.country || countries.length === 0) {
      setSelectedCountryId(null);
      return;
    }

    const matchedCountry = countries.find((item) => item.name === draft.country);
    setSelectedCountryId(matchedCountry?.id ?? null);
  }, [countries, draft?.country]);

  React.useEffect(() => {
    if (!selectedCountryId) {
      setStates([]);
      setCities([]);
      setSelectedStateId(null);
      return;
    }

    let active = true;
    GetState(selectedCountryId).then((nextStates) => {
      if (!active) {
        return;
      }
      setStates((nextStates as StateOption[]) ?? []);
    });

    return () => {
      active = false;
    };
  }, [selectedCountryId]);

  React.useEffect(() => {
    if (!draft?.state || states.length === 0) {
      setSelectedStateId(null);
      return;
    }

    const matchedState = states.find((item) => item.name === draft.state);
    setSelectedStateId(matchedState?.id ?? null);
  }, [draft?.state, states]);

  React.useEffect(() => {
    if (!selectedCountryId || !selectedStateId) {
      setCities([]);
      return;
    }

    let active = true;
    GetCity(selectedCountryId, selectedStateId).then((nextCities) => {
      if (!active) {
        return;
      }
      setCities((nextCities as CityOption[]) ?? []);
    });

    return () => {
      active = false;
    };
  }, [selectedCountryId, selectedStateId]);

  const originalEmail = user?.email.trim().toLowerCase() || "";
  const nextEmail = draft?.email.trim().toLowerCase() || "";
  const emailChanged = Boolean(draft && originalEmail && nextEmail && originalEmail !== nextEmail);
  const countryOptions = countries.map((country) => ({ label: country.name, value: String(country.id) }));
  const stateOptions = states.map((state) => ({ label: state.name, value: String(state.id) }));
  const cityOptions = cities.map((city) => ({ label: city.name, value: String(city.id) }));
  const departmentOptions = departments.map((department) => ({ label: department.name, value: department.name }));
  const roleScenes = React.useMemo(
    () => ({
      doctor: {
        image:
          "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80",
        alt: t("adminEditModal.doctorImageAlt"),
      },
      hospital: {
        image:
          "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
        alt: t("adminEditModal.hospitalImageAlt"),
      },
    }),
    [t]
  );

  function updateField<K extends keyof MockUser>(field: K, value: MockUser[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleSendOtp() {
    if (!draft?.email.trim()) {
      setError(t("adminEditModal.emailRequiredForOtp"));
      return;
    }

    if (!user?.id) {
      setError(t("adminEditModal.missingUserIdRequestOtp"));
      return;
    }

    if (sendingOtp) {
      return;
    }

    setSendingOtp(true);

    requestAdminUserEmailChange(user.id, draft.email)
      .then(() => {
        setOtpState("sent");
        setOtpCode("");
        setError("");
      })
      .catch((otpError) => {
        const message = otpError instanceof Error ? otpError.message : t("adminEditModal.unableToSendOtp");
        setError(message);
      })
      .finally(() => {
        setSendingOtp(false);
      });
  }

  React.useEffect(() => {
    if (!emailChanged) {
      return;
    }

    if (otpState === "idle") {
      handleSendOtp();
    }
  }, [emailChanged, otpState]);

  async function handleResendOtp() {
    handleSendOtp();
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim()) {
      setError(t("adminEditModal.otpRequired"));
      return;
    }

    if (!user?.id) {
      setError(t("adminEditModal.missingUserIdVerifyOtp"));
      return;
    }

    setVerifyingOtp(true);
    setError("");

    try {
      await verifyAdminUserEmailChange(user.id, otpCode.trim());
      setOtpState("verified");
    } catch (otpError) {
      const message = otpError instanceof Error ? otpError.message : t("adminEditModal.invalidOtp");
      setError(message);
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handleSave() {
    if (!draft) {
      return;
    }

    if (!draft.fullName.trim()) {
      setError(role === "hospital" ? t("adminEditModal.hospitalNameRequired") : t("adminEditModal.doctorNameRequired"));
      return;
    }

    if (!draft.email.trim()) {
      setError(t("adminEditModal.emailRequired"));
      return;
    }

    if (emailChanged) {
      if (otpState !== "verified") {
        setError(t("adminEditModal.verifyOtpBeforeSaving"));
        return;
      }
    }

    onSave({
      ...draft,
      hospitalName: role === "hospital" ? draft.fullName : draft.hospitalName,
    });
  }

  return (
    <Modal
      open={open}
      title={role === "hospital" ? t("hospitals.editHospital") : t("doctors.editDoctor")}
      onClose={onClose}
      hideHeader
      className="max-w-6xl overflow-hidden p-0"
      bodyClassName="max-h-[calc(100vh-3rem)] overflow-y-auto"
    >
      {draft ? (
        <div className="grid min-h-[min(38rem,calc(100vh-3rem))] lg:grid-cols-[minmax(0,1fr)_32%]">
          <div className="bg-white px-6 py-5 sm:px-8">
            <div className="mx-auto max-w-[620px]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="ui-page-title">{`${t("dashboard.header.brandTitle")} ${t("dashboard.header.brandSubtitle")}`}</h2>
                  <p className="ui-body-secondary">
                    {role === "hospital" ? t("adminEditModal.updateHospitalDetails") : t("adminEditModal.updateDoctorDetails")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="focus-ring inline-flex h-11 items-center gap-1 text-sm font-medium text-[#64748B] transition hover:text-[#0F172A]"
                >
                  <ArrowLeft className="size-4" />
                  {t("adminEditModal.close")}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="ui-field-label">{role === "hospital" ? t("common.fields.hospitalName") : t("common.fields.doctorName")}</span>
                  <Input value={draft.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
                </label>

                <label className="grid gap-2">
                  <span className="ui-field-label">{t("common.fields.mobileNumber")}</span>
                  <Input value={draft.mobileNumber || ""} onChange={(event) => updateField("mobileNumber", event.target.value)} />
                </label>

                <label className="grid gap-2">
                  <span className="ui-field-label">{t("common.fields.email")}</span>
                  <Input
                    type="email"
                    value={draft.email}
                    onChange={(event) => {
                      updateField("email", event.target.value);
                      setOtpState("idle");
                      setOtpCode("");
                      setError("");
                    }}
                  />
                </label>

                {role === "doctor" ? (
                  <label className="grid gap-2">
                    <span className="ui-field-label">{t("doctors.registrationId")}</span>
                    <Input
                      value={draft.medicalRegistrationId || ""}
                      onChange={(event) => updateField("medicalRegistrationId", event.target.value)}
                    />
                  </label>
                ) : (
                  <label className="grid gap-2">
                    <span className="ui-field-label">{t("common.fields.approvalStatus")}</span>
                    <Select
                      value={draft.approvalStatus}
                      onChange={(event) => updateField("approvalStatus", event.target.value as MockUser["approvalStatus"])}
                      options={[
                        { label: t("common.statuses.pending"), value: "pending" },
                        { label: t("common.statuses.approved"), value: "approved" },
                        { label: t("common.statuses.rejected"), value: "rejected" },
                      ]}
                    />
                  </label>
                )}

                <label className="grid gap-2">
                  <span className="ui-field-label">{t("common.fields.country")}</span>
                  <Select
                    value={selectedCountryId ? String(selectedCountryId) : ""}
                    onChange={(event) => {
                      const countryId = Number(event.target.value);
                      const country = countries.find((item) => item.id === countryId);
                      setSelectedCountryId(countryId);
                      setSelectedStateId(null);
                      setStates([]);
                      setCities([]);
                      updateField("country", country?.name || "");
                      updateField("state", "");
                      updateField("city", "");
                    }}
                    options={countryOptions}
                    placeholder={t("common.placeholders.selectCountry")}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="ui-field-label">{t("common.fields.state")}</span>
                  <Select
                    value={selectedStateId ? String(selectedStateId) : ""}
                    onChange={(event) => {
                      const stateId = Number(event.target.value);
                      const state = states.find((item) => item.id === stateId);
                      setSelectedStateId(stateId);
                      updateField("state", state?.name || "");
                      updateField("city", "");
                    }}
                    options={stateOptions}
                    placeholder={t("common.placeholders.selectState")}
                    disabled={!selectedCountryId}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="ui-field-label">{t("common.fields.city")}</span>
                  <Select
                    value={
                      cities.find((city) => city.name === (draft.city || ""))?.id
                        ? String(cities.find((city) => city.name === (draft.city || ""))?.id)
                        : ""
                    }
                    onChange={(event) => {
                      const cityId = Number(event.target.value);
                      const city = cities.find((item) => item.id === cityId);
                      updateField("city", city?.name || "");
                    }}
                    options={cityOptions}
                    placeholder={t("common.placeholders.selectCity")}
                    disabled={!selectedStateId}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="ui-field-label">{t("schedule.department")}</span>
                  <Select
                    value={draft.department || ""}
                    onChange={(event) => updateField("department", event.target.value)}
                    options={departmentOptions}
                    placeholder={t("schedule.selectDepartment")}
                  />
                </label>

                {role === "doctor" ? (
                  <>
                    <label className="grid gap-2">
                      <span className="ui-field-label">{t("common.fields.gender")}</span>
                      <Select
                        value={draft.gender || ""}
                        onChange={(event) => updateField("gender", event.target.value)}
                        options={[
                          { label: t("tvDisplay.female"), value: "female" },
                          { label: t("tvDisplay.male"), value: "male" },
                          { label: t("common.options.other"), value: "other" },
                        ]}
                        placeholder={t("common.placeholders.selectGender")}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="ui-field-label">{t("doctors.specialization")}</span>
                      <Input
                        value={draft.specialization || ""}
                        onChange={(event) => updateField("specialization", event.target.value)}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="ui-field-label">{t("common.fields.bloodGroup")}</span>
                      <Input value={draft.bloodGroup || ""} onChange={(event) => updateField("bloodGroup", event.target.value)} />
                    </label>
                  </>
                ) : null}

                {role === "hospital" ? (
                  <label className="grid gap-2">
                    <span className="ui-field-label">{t("common.fields.approvalStatus")}</span>
                    <Select
                      value={draft.approvalStatus}
                      onChange={(event) => updateField("approvalStatus", event.target.value as MockUser["approvalStatus"])}
                      options={[
                        { label: t("common.statuses.pending"), value: "pending" },
                        { label: t("common.statuses.approved"), value: "approved" },
                        { label: t("common.statuses.rejected"), value: "rejected" },
                      ]}
                    />
                  </label>
                ) : null}
              </div>

              {emailChanged ? (
                <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="ui-section-title">{t("adminEditModal.verifyOtpTitle")}</h3>
                      <p className="ui-meta">{t("adminEditModal.verifyOtpDescription")}</p>
                    </div>
                    {otpState === "verified" ? <span className="ui-card-chip">{t("adminEditModal.verified")}</span> : null}
                  </div>

                  <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
                  <OTPInput
                    label={t("common.fields.otp")}
                    value={otpCode}
                    onChange={(nextValue) => {
                      setOtpCode(nextValue.replace(/\D/g, "").slice(0, 6));
                      setError("");
                    }}
                    success={otpState === "verified"}
                    disabled={sendingOtp || verifyingOtp}
                    onResend={handleResendOtp}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleVerifyOtp()}
                      loading={verifyingOtp}
                      disabled={sendingOtp}
                    >
                      {otpState === "verified" ? t("adminEditModal.verified") : t("adminEditModal.verify")}
                    </Button>
                  </div>
                </div>
              </div>
              ) : null}

              {!emailChanged && otpState !== "idle" ? (
                <div className="mt-4">
                  <span className="ui-card-chip">{otpState === "verified" ? t("adminEditModal.verified") : t("adminEditModal.otpSent")}</span>
                </div>
              ) : null}

              {error ? <p className="mt-4 ui-body text-[#EF4444]">{error}</p> : null}

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>
                  {t("common.actions.cancel")}
                </Button>
                <Button onClick={handleSave}>
                  {t("adminEditModal.saveChanges")}
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden border-l border-[#E2E8F0] bg-[#F8FAFC] p-5 lg:block">
            <div className="sticky top-6 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-panel">
              <img
                src={roleScenes[role].image}
                alt={roleScenes[role].alt}
                className="h-full min-h-[540px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
