"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Clock3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { Card as UiCard } from "@/components/ui";
import {
  CreateCard,
  CreateSchedule,
  HighlightCard,
  ScheduleList,
  SlotPreview,
} from "@/components/scheduling";
import {
  createDoctorOptions,
  createSelectOptions,
  formatScheduleDate,
  generateTimeSlots,
} from "@/lib/scheduling";
import type { DoctorScheduleRecord } from "@/lib/mock-data/scheduling";
import {
  createDoctorSchedule,
  getDoctorSchedules,
  getScheduleBootstrap,
  type ScheduleDoctorDirectoryItem,
} from "@/lib/schedule-api";
import {
  defaultDoctorScheduleValues,
  doctorScheduleSchema,
  type DoctorScheduleFormValues,
} from "@/utils/schedulingSchemas";

export default function DoctorSchedulePage() {
  const { currentUser } = useDashboardContext();
  const [showForm, setShowForm] = React.useState(false);
  const [schedules, setSchedules] = React.useState<DoctorScheduleRecord[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [doctors, setDoctors] = React.useState<ScheduleDoctorDirectoryItem[]>([]);
  const [submitMessage, setSubmitMessage] = React.useState("");

  const methods = useForm<DoctorScheduleFormValues>({
    resolver: zodResolver(doctorScheduleSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: defaultDoctorScheduleValues,
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  const selectedDepartment = watch("department");
  const selectedDoctorId = watch("doctorId");
  const selectedDate = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const consultationTime = watch("consultationTime");

  const filteredDoctors = React.useMemo(() => {
    if (!selectedDepartment) return doctors;
    return doctors.filter((doctor) => doctor.department === selectedDepartment);
  }, [doctors, selectedDepartment]);

  const selectedDoctor = React.useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId]
  );

  const previewSlots = React.useMemo(
    () => generateTimeSlots(startTime || "", endTime || "", Number(consultationTime || 15)).map((slot) => slot.time),
    [consultationTime, endTime, startTime]
  );

  const mergeDoctorNames = React.useCallback(
    (scheduleRecords: DoctorScheduleRecord[], doctorDirectory: ScheduleDoctorDirectoryItem[]) =>
      scheduleRecords.map((schedule) => {
        const matchedDoctor = doctorDirectory.find((doctor) => doctor.id === schedule.doctorId);
        const hasGenericName = !schedule.doctorName?.trim() || schedule.doctorName.trim().toLowerCase() === "doctor";

        if (!matchedDoctor || !hasGenericName) {
          return schedule;
        }

        return {
          ...schedule,
          doctorName: matchedDoctor.name,
          department: schedule.department || matchedDoctor.department,
        };
      }),
    []
  );

  const showPreview = Boolean(selectedDepartment && selectedDoctorId && selectedDate && startTime && endTime);

  React.useEffect(() => {
    if (currentUser.role !== "hospital") return;

    let active = true;

    Promise.all([getScheduleBootstrap(), getDoctorSchedules()])
      .then(([bootstrap, scheduleRecords]) => {
        if (!active) return;
        setDepartments(bootstrap.departments || []);
        setDoctors(bootstrap.doctors || []);
        setSchedules(mergeDoctorNames(scheduleRecords, bootstrap.doctors || []));
      })
      .catch((error) => {
        if (!active) return;
        setDepartments([]);
        setDoctors([]);
        setSchedules([]);
        setSubmitMessage(error instanceof Error ? error.message : "Unable to load doctor schedules.");
      });

    return () => {
      active = false;
    };
  }, [currentUser.role, mergeDoctorNames]);

  React.useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name !== "department") return;

      const doctorId = values.doctorId;
      if (!doctorId) return;

      const doctor = doctors.find((item) => item.id === doctorId);
      if (!doctor || !values.department) return;

      if (doctor.department !== values.department) {
        setValue("doctorId", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [doctors, setValue, watch]);

  if (currentUser.role !== "hospital") {
    return (
      <UiCard className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">Doctor Schedule</h2>
        <p className="mt-1 text-sm text-[#64748B]">Only hospital users can access doctor schedule management.</p>
      </UiCard>
    );
  }

  async function onSubmit(values: DoctorScheduleFormValues) {
    const doctor = doctors.find((item) => item.id === values.doctorId);
    if (!doctor) return;

    try {
      setSubmitMessage("");

      const nextSchedule = await createDoctorSchedule({
        doctorId: doctor.id,
        department: values.department,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        consultationTime: Number(values.consultationTime),
      });

      setSchedules((current) => [mergeDoctorNames([nextSchedule], doctors)[0], ...current]);
      setSubmitMessage(`Saved ${nextSchedule.slots.length} slots for ${doctor.name}.`);
      reset(defaultDoctorScheduleValues);
      setShowForm(false);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Unable to save doctor schedule.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Doctor Schedule Board"
        description="Manage doctor availability"
        icon={<CalendarDays className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
        imageAlt="Doctor schedule workflow"
        stats={[
          { label: "Schedules", value: String(schedules.length) },
          { label: "Slots", value: String(schedules.reduce((sum, schedule) => sum + schedule.slots.length, 0)) },
          { label: "Available", value: String(schedules.reduce((sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length, 0)) },
        ]}
      />

      <CreateCard active={showForm} onClick={() => setShowForm((current) => !current)} />

      {showForm ? (
        <section className={showPreview ? "grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]" : "grid gap-6"}>
          <CreateSchedule
            control={control}
            register={register}
            errors={errors}
            departmentOptions={createSelectOptions(departments)}
            doctorOptions={createDoctorOptions(filteredDoctors)}
            submitMessage={submitMessage}
            isSubmitting={isSubmitting}
            minDate={new Date().toISOString().slice(0, 10)}
            onSubmit={handleSubmit(onSubmit)}
          />

          {showPreview ? (
            <HighlightCard
              title="Slot Preview"
              description={
                selectedDoctor && selectedDate
                  ? `${selectedDoctor.name} • ${formatScheduleDate(selectedDate)}`
                  : "Generated slots"
              }
              tone="primary"
              icon={<Clock3 className="size-5" />}
              className="transition hover:shadow-sm"
            >
              <SlotPreview slots={previewSlots} />
            </HighlightCard>
          ) : null}
        </section>
      ) : null}

      <ScheduleList schedules={schedules} />
    </div>
  );
}
