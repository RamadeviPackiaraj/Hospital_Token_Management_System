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
import { getApprovedDoctorsForHospital } from "@/lib/dashboard-data";
import {
  createDoctorOptions,
  createSelectOptions,
  formatScheduleDate,
  generateTimeSlots,
} from "@/lib/scheduling";
import type { DoctorScheduleRecord } from "@/lib/mock-data/scheduling";
import {
  createDoctorSchedule,
  deleteDoctorSchedule,
  getDoctorSchedules,
  getScheduleBootstrap,
  type ScheduleDoctorDirectoryItem,
  updateDoctorSchedule,
} from "@/lib/schedule-api";
import { logger } from "@/lib/logger";
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
  const [editingScheduleId, setEditingScheduleId] = React.useState<string | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = React.useState<string | null>(null);

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

  const buildApprovedDoctorDirectory = React.useCallback(
    (
      approvedDoctors: Array<{
        id: string;
        fullName: string;
        department?: string;
        email?: string;
        mobileNumber?: string;
      }>,
      bootstrapDoctors: ScheduleDoctorDirectoryItem[],
      scheduleRecords: DoctorScheduleRecord[]
    ) => {
      const bootstrapById = new Map(
        bootstrapDoctors.map((doctor) => [doctor.userId || doctor.id, doctor] as const)
      );
      const scheduleByDoctorId = new Map(
        scheduleRecords.map((schedule) => [schedule.doctorId, schedule] as const)
      );

      const uniqueDoctors = new Map<string, ScheduleDoctorDirectoryItem>();

      approvedDoctors.forEach((doctor) => {
        const doctorId = doctor.id;
        if (!doctorId || uniqueDoctors.has(doctorId)) {
          return;
        }

        const bootstrapDoctor = bootstrapById.get(doctorId);
        const scheduledDoctor = scheduleByDoctorId.get(doctorId);
        uniqueDoctors.set(doctorId, {
          id: doctorId,
          userId: doctorId,
          name:
            bootstrapDoctor?.name ||
            doctor.fullName ||
            scheduledDoctor?.doctorName ||
            "Doctor",
          department:
            bootstrapDoctor?.department ||
            doctor.department ||
            scheduledDoctor?.department ||
            "",
          email: bootstrapDoctor?.email || doctor.email || "",
          phone: bootstrapDoctor?.phone || doctor.mobileNumber || "",
          status: "approved",
        });
      });

      scheduleRecords.forEach((schedule) => {
        if (!schedule.doctorId || uniqueDoctors.has(schedule.doctorId)) {
          return;
        }

        const bootstrapDoctor = bootstrapById.get(schedule.doctorId);
        uniqueDoctors.set(schedule.doctorId, {
          id: schedule.doctorId,
          userId: schedule.doctorId,
          name: bootstrapDoctor?.name || schedule.doctorName || "Doctor",
          department: bootstrapDoctor?.department || schedule.department || "",
          email: bootstrapDoctor?.email || "",
          phone: bootstrapDoctor?.phone || "",
          status: "approved",
        });
      });

      return Array.from(uniqueDoctors.values());
    },
    []
  );

  const showPreview = Boolean(selectedDepartment && selectedDoctorId && selectedDate && startTime && endTime);

  React.useEffect(() => {
    if (currentUser.role !== "hospital") return;

    let active = true;

    Promise.all([
      getScheduleBootstrap(),
      getDoctorSchedules(),
      getApprovedDoctorsForHospital(currentUser.id).catch(() => []),
    ])
      .then(([bootstrap, scheduleRecords, approvedDoctors]) => {
        if (!active) return;
        const approvedDirectory = buildApprovedDoctorDirectory(
          approvedDoctors,
          bootstrap.doctors || [],
          scheduleRecords
        );
        setDepartments(bootstrap.departments || []);
        setDoctors(approvedDirectory);
        setSchedules(mergeDoctorNames(scheduleRecords, approvedDirectory));
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
  }, [buildApprovedDoctorDirectory, currentUser.id, currentUser.role, mergeDoctorNames]);

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
        <h2 className="ui-section-title">Doctor Schedule</h2>
        <p className="mt-1 ui-body-secondary">Only hospital users can access doctor schedule management.</p>
      </UiCard>
    );
  }

  async function onSubmit(values: DoctorScheduleFormValues) {
    const doctor = doctors.find((item) => item.id === values.doctorId);
    if (!doctor) return;

    try {
      setSubmitMessage("");
      const payload = {
        doctorId: doctor.id,
        department: values.department,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        consultationTime: Number(values.consultationTime),
      };

      if (editingScheduleId) {
        const updatedSchedule = await updateDoctorSchedule({
          scheduleId: editingScheduleId,
          ...payload,
        });

        setSchedules((current) =>
          current.map((schedule) =>
            schedule.id === editingScheduleId ? mergeDoctorNames([updatedSchedule], doctors)[0] : schedule
          )
        );
        setSubmitMessage(`Updated ${doctor.name}'s schedule for ${formatScheduleDate(values.date)}.`);
        setEditingScheduleId(null);
        setShowForm(false);
        reset(defaultDoctorScheduleValues);
        logger.success("Doctor schedule updated successfully.", {
          source: "doctor-schedule",
          data: {
            scheduleId: updatedSchedule.id,
            doctorId: doctor.id,
            doctorName: doctor.name,
            date: values.date,
          },
          toast: true,
        });
        return;
      }

      const nextSchedule = await createDoctorSchedule(payload);

      setSchedules((current) => [mergeDoctorNames([nextSchedule], doctors)[0], ...current]);
      setSubmitMessage(`Saved ${nextSchedule.slots.length} slots for ${doctor.name}.`);
      reset(defaultDoctorScheduleValues);
      setShowForm(false);
      logger.success("Doctor schedule saved successfully.", {
        source: "doctor-schedule",
        data: {
          doctorId: doctor.id,
          doctorName: doctor.name,
          date: values.date,
          slots: nextSchedule.slots.length,
        },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save doctor schedule.";
      setSubmitMessage(message);
      logger.error("Unable to save the doctor schedule.", {
        source: "doctor-schedule",
        data: { error: message, doctorId: values.doctorId, date: values.date },
        toast: true,
      });
    }
  }

  function addMinutesToTime(value: string, minutesToAdd: number) {
    const [hoursText, minutesText] = value.split(":");
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return value;
    }

    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const normalizedHours = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const normalizedMinutes = (totalMinutes % 60).toString().padStart(2, "0");

    return `${normalizedHours}:${normalizedMinutes}`;
  }

  function handleEditSchedule(schedule: DoctorScheduleRecord) {
    const startTime = schedule.startTime ?? schedule.slots[0]?.time ?? "";
    const lastSlotTime = schedule.slots[schedule.slots.length - 1]?.time ?? "";
    const endTime = schedule.endTime ?? addMinutesToTime(lastSlotTime, schedule.consultationTime);

    reset({
      department: schedule.department,
      doctorId: schedule.doctorId,
      date: schedule.date,
      startTime,
      endTime,
      consultationTime: String(schedule.consultationTime),
    });
    setSubmitMessage("");
    setEditingScheduleId(schedule.id);
    setShowForm(true);
  }

  function handleCancelForm() {
    reset(defaultDoctorScheduleValues);
    setSubmitMessage("");
    setEditingScheduleId(null);
    setShowForm(false);
  }

  async function handleDeleteSchedule(schedule: DoctorScheduleRecord) {
    setDeletingScheduleId(schedule.id);

    try {
      await deleteDoctorSchedule(schedule.id);
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      if (editingScheduleId === schedule.id) {
        handleCancelForm();
      }
      logger.success("Doctor schedule deleted successfully.", {
        source: "doctor-schedule",
        data: { scheduleId: schedule.id, doctorName: schedule.doctorName, date: schedule.date },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete doctor schedule.";
      logger.error("Unable to delete the doctor schedule.", {
        source: "doctor-schedule",
        data: { error: message, scheduleId: schedule.id },
        toast: true,
      });
    } finally {
      setDeletingScheduleId(null);
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

      <CreateCard
        active={showForm}
        onClick={() => {
          if (showForm && editingScheduleId) {
            handleCancelForm();
            return;
          }

          setSubmitMessage("");
          setShowForm((current) => !current);
        }}
      />

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
            submitLabel={editingScheduleId ? "Update Schedule" : "Save Schedule"}
            onCancel={handleCancelForm}
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

      <ScheduleList
        schedules={schedules}
        editingScheduleId={editingScheduleId}
        deletingScheduleId={deletingScheduleId}
        onEdit={handleEditSchedule}
        onDelete={handleDeleteSchedule}
      />
    </div>
  );
}
