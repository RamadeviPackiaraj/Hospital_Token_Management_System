"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ticket } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { Card as UiCard } from "@/components/ui";
import {
  CreateEntryCard,
  PatientEntryForm,
  TokenList,
} from "@/components/patient-entry";
import {
  formatScheduleDate,
  todayDateString,
} from "@/lib/scheduling";
import {
  type DoctorScheduleRecord,
  type PatientTokenRecord,
} from "@/lib/mock-data/scheduling";
import {
  assignPatientToken,
  getDoctorSchedules,
  getPatientTokens,
  getScheduleBootstrap,
} from "@/lib/schedule-api";
import { logger } from "@/lib/logger";
import {
  defaultPatientEntryValues,
  patientEntrySchema,
  type PatientEntryFormValues,
} from "@/utils/schedulingSchemas";

export default function PatientEntryPage() {
  const { currentUser } = useDashboardContext();
  const [schedules, setSchedules] = React.useState<DoctorScheduleRecord[]>([]);
  const [tokens, setTokens] = React.useState<PatientTokenRecord[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [formMessage, setFormMessage] = React.useState("");

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
        <h2 className="text-base font-medium text-[#0F172A]">Patient Entry</h2>
        <p className="mt-1 text-sm text-[#64748B]">Only hospital users can access patient entry and token generation.</p>
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
      })
      .catch((error) => {
        if (!active) return;
        setSchedules([]);
        setTokens([]);
        setDepartments([]);
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

  return (
    <div className="space-y-6">
      <PageHero
        title="Patient Entry"
        description="Manage patient token creation"
        icon={<Ticket className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
        imageAlt="Patient registration desk"
        stats={[
          { label: "Today", value: formatScheduleDate(visitDate) },
          { label: "Generated", value: String(tokens.length) },
          { label: "Open Slots", value: String(todayAvailable) },
        ]}
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
          onSubmit={handleSubmit(onSubmit)}
          onCancel={() => {
            reset(defaultPatientEntryValues);
            setFormMessage("");
            setShowForm(false);
          }}
        />
      ) : null}

      <TokenList tokens={tokens} departments={departments} />
    </div>
  );
}
