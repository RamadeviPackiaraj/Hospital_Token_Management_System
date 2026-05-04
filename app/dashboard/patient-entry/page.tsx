"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ticket } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Card as UiCard } from "@/components/ui";
import { BodySecondary, SectionTitle } from "@/components/ui/Typography";
import {
  CreateEntryCard,
  PatientEntryForm,
  TokenList,
  LinearProgressDisplay,
  TokenEditModal,
} from "@/components/patient-entry";
import {
  formatScheduleDate,
  todayDateString,
} from "@/lib/scheduling";
import {
  assignPatientToken,
  deletePatientToken,
  getDoctorSchedules,
  getPatientTokens,
  getScheduleBootstrap,
  updatePatientToken,
  updatePatientTokenStatus,
} from "@/lib/schedule-api";
import { logger } from "@/lib/logger";
import { speakTokenAnnouncement } from "@/lib/browser-tts";
import type { DoctorScheduleRecord, PatientTokenRecord } from "@/lib/scheduling-types";
import {
  defaultPatientEntryValues,
  patientEntrySchema,
  type PatientEntryFormValues,
} from "@/utils/schedulingSchemas";

export default function PatientEntryPage() {
  const { currentUser } = useDashboardContext();
  const { t } = useI18n();
  const [schedules, setSchedules] = React.useState<DoctorScheduleRecord[]>([]);
  const [tokens, setTokens] = React.useState<PatientTokenRecord[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [departmentDisplayByValue, setDepartmentDisplayByValue] = React.useState<Record<string, string>>({});
  const [showForm, setShowForm] = React.useState(false);
  const [formMessage, setFormMessage] = React.useState("");
  const [updatingTokenId, setUpdatingTokenId] = React.useState<string | null>(null);
  const [editingToken, setEditingToken] = React.useState<PatientTokenRecord | null>(null);
  const [deleteTokenTarget, setDeleteTokenTarget] = React.useState<PatientTokenRecord | null>(null);

  const methods = useForm<PatientEntryFormValues>({
    resolver: zodResolver(patientEntrySchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: defaultPatientEntryValues,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  if (currentUser.role !== "hospital") {
    return (
      <UiCard className="p-4">
        <SectionTitle>{t("patientEntry.title")}</SectionTitle>
        <BodySecondary className="mt-2">{t("dashboard.header.accessRestricted")}</BodySecondary>
      </UiCard>
    );
  }

  const visitDate = todayDateString();

  React.useEffect(() => {
    let active = true;

    Promise.all([
      getDoctorSchedules({ date: visitDate }),
      getPatientTokens({ date: visitDate }),
      getScheduleBootstrap(),
    ])
      .then(([scheduleRecords, tokenRecords, bootstrap]) => {
        if (!active) return;
        setSchedules(scheduleRecords);
        setTokens(tokenRecords);
        setDepartments(bootstrap.departments || []);
        setDepartmentDisplayByValue(
          Object.fromEntries(
            (bootstrap.departments || []).map((department, index) => [
              department,
              bootstrap.displayDepartments?.[index] || department,
            ])
          )
        );
      })
      .catch((error) => {
        if (!active) return;
        setSchedules([]);
        setTokens([]);
        setDepartments([]);
        setDepartmentDisplayByValue({});
        setFormMessage(error instanceof Error ? error.message : "Unable to load patient entry data.");
      });

    return () => {
      active = false;
    };
  }, [visitDate]);

  const todaySchedules = schedules.filter((schedule) => schedule.date === visitDate);
  const todayAvailable = todaySchedules.reduce(
    (sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length,
    0
  );

  const activeToken = tokens.find((token) => token.status === "CALLING") || null;

  async function onSubmit(values: PatientEntryFormValues) {
    try {
      const result = await assignPatientToken({
        patientName: values.patientName,
        dob: values.dob,
        bloodGroup: values.bloodGroup,
        aadhaar: values.aadhaar,
        contact: values.contact,
        department: values.department,
        date: visitDate,
      });

      setSchedules((current) =>
        current.map((schedule) => (schedule.id === result.schedule.id ? result.schedule : schedule))
      );
      setTokens((current) => [result.token, ...current]);
      setFormMessage("");
      reset(defaultPatientEntryValues);
      setShowForm(false);
      logger.success("Patient token generated successfully.", {
        source: "patient-entry",
        data: {
          patientName: result.token.patientName,
          tokenNumber: result.token.tokenNumber,
          department: result.token.department,
        },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate patient token.";
      setFormMessage(message);
      logger.error("Unable to generate the patient token.", {
        source: "patient-entry",
        data: { error: message, department: values.department },
        toast: true,
      });
    }
  }

  async function handleTokenStatusChange(tokenId: string, status: PatientTokenRecord["status"]) {
    setUpdatingTokenId(tokenId);

    try {
      const updatedToken = await updatePatientTokenStatus({ tokenId, status });
      setTokens((current) =>
        current.map((token) => (token.id === updatedToken.id ? updatedToken : token))
      );
      if (status === "CALLING") {
        speakTokenAnnouncement({ tokenNumber: updatedToken.tokenNumber });
      }
      logger.success("Token status updated", {
        source: "patient-entry",
        data: { tokenId, status },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      logger.error("Failed to update status", {
        source: "patient-entry",
        data: { tokenId, status, error: message },
        toast: true,
      });
    } finally {
      setUpdatingTokenId(null);
    }
  }

  async function handleTokenEdit(values: PatientEntryFormValues) {
    if (!editingToken) {
      return;
    }

    setUpdatingTokenId(editingToken.id);

    try {
      const updatedToken = await updatePatientToken({
        tokenId: editingToken.id,
        patientName: values.patientName,
        dob: values.dob,
        bloodGroup: values.bloodGroup,
        aadhaar: values.aadhaar,
        contact: values.contact,
      });

      setTokens((current) =>
        current.map((token) => (token.id === updatedToken.id ? updatedToken : token))
      );
      setEditingToken(null);
      logger.success("Token updated successfully", {
        source: "patient-entry",
        data: { tokenId: updatedToken.id },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update token";
      logger.error("Failed to update token", {
        source: "patient-entry",
        data: { tokenId: editingToken.id, error: message },
        toast: true,
      });
    } finally {
      setUpdatingTokenId(null);
    }
  }

  async function handleDeleteToken() {
    if (!deleteTokenTarget) {
      return;
    }

    setUpdatingTokenId(deleteTokenTarget.id);

    try {
      await deletePatientToken(deleteTokenTarget.id);
      setTokens((current) => current.filter((token) => token.id !== deleteTokenTarget.id));
      setDeleteTokenTarget(null);
      logger.success("Token deleted successfully", {
        source: "patient-entry",
        data: { tokenId: deleteTokenTarget.id },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete token";
      logger.error("Failed to delete token", {
        source: "patient-entry",
        data: { tokenId: deleteTokenTarget.id, error: message },
        toast: true,
      });
    } finally {
      setUpdatingTokenId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title={t("patientEntry.title")}
        description={t("patientEntry.description")}
        icon={<Ticket className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
        imageAlt="Patient registration desk"
        stats={[
          { label: t("patientEntry.today"), value: formatScheduleDate(visitDate) },
          { label: t("patientEntry.generated"), value: String(tokens.length) },
          { label: t("patientEntry.openSlots"), value: String(todayAvailable) },
        ]}
        supplementaryContent={
          <LinearProgressDisplay
            currentToken={activeToken?.tokenNumber || null}
            status={activeToken?.status || null}
            compact
          />
        }
      />

      <CreateEntryCard
        active={showForm}
        onClick={() => {
          setFormMessage("");
          setShowForm((current) => !current);
        }}
      />

      {showForm ? (
        <PatientEntryForm
          control={control}
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          visitDate={visitDate}
          message={formMessage}
          departments={departments}
          departmentDisplayByValue={departmentDisplayByValue}
          onSubmit={handleSubmit(onSubmit)}
          onCancel={() => {
            reset(defaultPatientEntryValues);
            setFormMessage("");
            setShowForm(false);
          }}
        />
      ) : null}

      <TokenList
        tokens={tokens}
        departments={departments}
        updatingTokenId={updatingTokenId}
        onStatusChange={handleTokenStatusChange}
        onEdit={(tokenId) => {
          const token = tokens.find((item) => item.id === tokenId) || null;
          setEditingToken(token);
        }}
        onDelete={(tokenId) => {
          const token = tokens.find((item) => item.id === tokenId) || null;
          setDeleteTokenTarget(token);
        }}
      />

      <TokenEditModal
        open={Boolean(editingToken)}
        token={editingToken}
        saving={Boolean(editingToken && updatingTokenId === editingToken.id)}
        onClose={() => setEditingToken(null)}
        onSave={handleTokenEdit}
      />

      <ConfirmationDialog
        open={Boolean(deleteTokenTarget)}
        title={t("common.actions.delete")}
        description={`Are you sure you want to delete this token${deleteTokenTarget ? ` for ${deleteTokenTarget.patientName}` : ""}?`}
        confirmLabel={t("common.actions.delete")}
        cancelLabel={t("common.actions.cancel")}
        confirmVariant="danger"
        onCancel={() => setDeleteTokenTarget(null)}
        onConfirm={() => void handleDeleteToken()}
      />
    </div>
  );
}
