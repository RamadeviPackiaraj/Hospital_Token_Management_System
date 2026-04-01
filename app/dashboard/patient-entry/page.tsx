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
  assignFirstAvailableToken,
  formatScheduleDate,
  getStoredDoctorSchedules,
  persistDoctorSchedules,
  todayDateString,
} from "@/lib/scheduling";
import {
  mockPatientTokens,
  type DoctorScheduleRecord,
  type PatientTokenRecord,
} from "@/lib/mock-data/scheduling";
import {
  defaultPatientEntryValues,
  patientEntrySchema,
  type PatientEntryFormValues,
} from "@/utils/schedulingSchemas";

export default function PatientEntryPage() {
  const { currentUser } = useDashboardContext();
  const [schedules, setSchedules] = React.useState<DoctorScheduleRecord[]>([]);
  const [tokens, setTokens] = React.useState<PatientTokenRecord[]>(mockPatientTokens);
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

  React.useEffect(() => {
    setSchedules(getStoredDoctorSchedules());
  }, []);

  if (currentUser.role !== "hospital") {
    return (
      <UiCard className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">Patient Entry</h2>
        <p className="mt-1 text-sm text-[#64748B]">Only hospital users can access patient entry and token generation.</p>
      </UiCard>
    );
  }

  const visitDate = todayDateString();
  const todaySchedules = schedules.filter((schedule) => schedule.date === visitDate);
  const todayAvailable = todaySchedules.reduce(
    (sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length,
    0
  );

  function onSubmit(values: PatientEntryFormValues) {
    const result = assignFirstAvailableToken(schedules, values.department, visitDate);

    setSchedules(result.schedules);
    persistDoctorSchedules(result.schedules);

    if (!result.assignment) {
      setFormMessage(`No availability found in ${values.department}. Try another department.`);
      return;
    }

    const createdAt = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    setTokens((current) => [
      {
        id: `${result.assignment.date}-${result.assignment.department}-${result.assignment.tokenNumber}-${Date.now()}`,
        tokenNumber: result.assignment.tokenNumber,
        patientName: values.patientName,
        dob: values.dob,
        bloodGroup: values.bloodGroup,
        aadhaar: values.aadhaar,
        contact: values.contact,
        department: result.assignment.department,
        doctorName: result.assignment.doctorName,
        date: result.assignment.date,
        time: result.assignment.time,
        createdAt,
      },
      ...current,
    ]);
    setFormMessage("");
    reset(defaultPatientEntryValues);
    setShowForm(false);
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
          onSubmit={handleSubmit(onSubmit)}
          onCancel={() => {
            reset(defaultPatientEntryValues);
            setFormMessage("");
            setShowForm(false);
          }}
        />
      ) : null}

      <TokenList tokens={tokens} />
    </div>
  );
}
