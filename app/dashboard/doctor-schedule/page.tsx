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
  getApprovedDoctorsForHospital,
  getHospitalDepartmentAssignments,
} from "@/lib/dashboard-data";
import { ApiRequestError } from "@/lib/api";
import {
  createDoctorOptions,
  createSelectOptions,
  formatScheduleDate,
  generateTimeSlots,
} from "@/lib/scheduling";
import {
  createDoctorSchedule,
  deleteDoctorSchedule,
  getDoctorSchedules,
  getScheduleBootstrap,
  type ScheduleDoctorDirectoryItem,
  updateDoctorSchedule,
} from "@/lib/schedule-api";
import { logger } from "@/lib/logger";
import type { DoctorScheduleRecord } from "@/lib/scheduling-types";
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
  const [doctorDirectory, setDoctorDirectory] = React.useState<ScheduleDoctorDirectoryItem[]>([]);
  const [approvedDoctors, setApprovedDoctors] = React.useState<ScheduleDoctorDirectoryItem[]>([]);
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
    const approvedOnly = approvedDoctors.filter((doctor) => doctor.isApproved);

    if (!selectedDepartment) {
      return approvedOnly;
    }

    return approvedOnly.filter((doctor) => doctor.department === selectedDepartment);
  }, [approvedDoctors, selectedDepartment]);

  const selectedDoctor = React.useMemo(
    () => doctorDirectory.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [doctorDirectory, selectedDoctorId]
  );

  const previewSlots = React.useMemo(
    () => generateTimeSlots(startTime || "", endTime || "", Number(consultationTime || 15)).map((slot) => slot.time),
    [consultationTime, endTime, startTime]
  );
  const hasApprovedDoctors = filteredDoctors.length > 0;
  const selectedApprovedDoctor = React.useMemo(
    () => filteredDoctors.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [filteredDoctors, selectedDoctorId]
  );
  const canSaveSchedule = Boolean(selectedDepartment && selectedApprovedDoctor);
  const selectedDoctorSchedules = React.useMemo(() => {
    if (!selectedDoctorId || !selectedDate) {
      return [];
    }

    return schedules.filter(
      (schedule) =>
        schedule.doctorId === selectedDoctorId &&
        schedule.date === selectedDate &&
        schedule.id !== editingScheduleId
    );
  }, [editingScheduleId, schedules, selectedDate, selectedDoctorId]);
  const conflictingSchedules = React.useMemo(() => {
    if (!startTime || !endTime) {
      return [];
    }

    const nextStart = startTime;
    const nextEnd = endTime;

    return selectedDoctorSchedules.filter(
      (schedule) =>
        Boolean(schedule.startTime) &&
        Boolean(schedule.endTime) &&
        nextStart < String(schedule.endTime) &&
        nextEnd > String(schedule.startTime)
    );
  }, [endTime, selectedDoctorSchedules, startTime]);

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
          isApproved: true,
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
          isApproved: Boolean(bootstrapDoctor?.isApproved),
        });
      });

      return Array.from(uniqueDoctors.values());
    },
    []
  );

  const showPreview = Boolean(selectedDepartment && selectedDoctorId && selectedDate && startTime && endTime);
  const totalSlots = React.useMemo(
    () => schedules.reduce((sum, schedule) => sum + schedule.slots.length, 0),
    [schedules]
  );
  const availableSlots = React.useMemo(
    () => schedules.reduce((sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length, 0),
    [schedules]
  );

  React.useEffect(() => {
    if (currentUser.role !== "hospital") return;

    let active = true;

    Promise.all([
      getScheduleBootstrap(),
      getDoctorSchedules(),
      getApprovedDoctorsForHospital(currentUser.id).catch(() => []),
      getHospitalDepartmentAssignments(currentUser.id).catch(() => []),
    ])
      .then(([bootstrap, scheduleRecords, approvedDoctors, storedAssignments]) => {
        if (!active) return;
        const assignmentMap = new Map(storedAssignments.map((item) => [item.doctorId, item.department] as const));
        const approvedDirectory = buildApprovedDoctorDirectory(
          approvedDoctors.filter((doctor) => doctor.approvalStatus === "approved"),
          (bootstrap.doctors || []).filter((doctor) => doctor.isApproved),
          scheduleRecords
        ).map((doctor) => ({
          ...doctor,
          department: assignmentMap.get(doctor.id) || doctor.department || "",
        }));

        const assignedDepartments = Array.from(
          new Set(
            storedAssignments
              .map((assignment) => assignment.department)
              .filter((department) => department && department.trim())
          )
        );

        setDepartments(assignedDepartments);
        setApprovedDoctors(
          approvedDirectory.filter((doctor) => doctor.isApproved && Boolean(doctor.department?.trim()))
        );
        setDoctorDirectory(approvedDirectory);
        setSchedules(mergeDoctorNames(scheduleRecords, approvedDirectory));
      })
      .catch((error) => {
        if (!active) return;
        setDepartments([]);
        setApprovedDoctors([]);
        setDoctorDirectory([]);
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

      const doctor = approvedDoctors.find((item) => item.id === doctorId);
      if (!doctor || !values.department) return;

      if (doctor.department !== values.department) {
        setValue("doctorId", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [approvedDoctors, setValue, watch]);

  React.useEffect(() => {
    if (!selectedDoctorId) {
      return;
    }

    const doctorStillAvailable = filteredDoctors.some((doctor) => doctor.id === selectedDoctorId);
    if (!doctorStillAvailable) {
      setValue("doctorId", "");
    }
  }, [filteredDoctors, selectedDoctorId, setValue]);

  if (currentUser.role !== "hospital") {
    return (
      <UiCard className="p-4">
        <h2 className="ui-section-title">Doctor Schedule</h2>
        <p className="mt-1 ui-body-secondary">Only hospital users can access doctor schedule management.</p>
      </UiCard>
    );
  }

  function getApiErrorMessage(error: unknown) {
    if (error instanceof ApiRequestError) {
      const apiData =
        error.data && typeof error.data === "object" && "message" in error.data
          ? (error.data as { message?: string })
          : null;
      return apiData?.message || error.message;
    }

    return error instanceof Error ? error.message : "Failed to save schedule";
  }

  async function onSubmit(values: DoctorScheduleFormValues) {
    const doctor = approvedDoctors.find((item) => item.id === values.doctorId);
    if (!doctor) {
      const message = "No approved doctors available";
      setSubmitMessage(message);
      logger.error(message, {
        source: "doctor-schedule",
        data: { doctorId: values.doctorId, department: values.department },
        toast: true,
      });
      return;
    }

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
      console.log("Payload:", payload);

      if (editingScheduleId) {
        const response = await updateDoctorSchedule({
          scheduleId: editingScheduleId,
          ...payload,
        });
        console.log("Response:", response);

        setSchedules((current) =>
          current.map((schedule) =>
            schedule.id === editingScheduleId ? mergeDoctorNames([response], doctorDirectory)[0] : schedule
          )
        );
        setSubmitMessage("Schedule updated successfully");
        setEditingScheduleId(null);
        reset(defaultDoctorScheduleValues);
        logger.success("Schedule updated successfully", {
          source: "doctor-schedule",
          data: {
            scheduleId: response.id,
            doctorId: doctor.id,
            doctorName: doctor.name,
            date: values.date,
          },
          toast: true,
        });
        return;
      }

      const response = await createDoctorSchedule(payload);
      console.log("Response:", response);

      setSchedules((current) => [mergeDoctorNames([response], doctorDirectory)[0], ...current]);
      setSubmitMessage("Schedule created successfully");
      reset(defaultDoctorScheduleValues);
      logger.success("Schedule created successfully", {
        source: "doctor-schedule",
        data: {
          doctorId: doctor.id,
          doctorName: doctor.name,
          date: values.date,
          slots: response.slots.length,
        },
        toast: true,
        });
    } catch (error) {
      const message = getApiErrorMessage(error);
      const errorData =
        error instanceof ApiRequestError && error.data && typeof error.data === "object" ? error.data : error;
      console.log("Error:", errorData);
      setSubmitMessage(message);
      logger.error(message, {
        source: "doctor-schedule",
        data: { error: errorData, doctorId: values.doctorId, date: values.date },
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
        description="Manage doctor availability with a consistent weekly scheduling workflow."
        icon={<CalendarDays className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
        imageAlt="Doctor schedule workflow"
        stats={[
          { label: "Schedules", value: String(schedules.length) },
          { label: "Slots", value: String(totalSlots) },
          { label: "Available", value: String(availableSlots) },
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <UiCard>
          <div className="flex flex-col gap-2">
            <p className="ui-section-title">Scheduling Overview</p>
            <p className="ui-body-secondary">
              Build department-wise schedules, preview slot coverage, and avoid overlapping timings before saving.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="ui-card-interior-muted">
              <p className="ui-label">Assigned Departments</p>
              <p className="mt-2 ui-card-title">{departments.length}</p>
            </div>
            <div className="ui-card-interior-muted">
              <p className="ui-label">Approved Doctors</p>
              <p className="mt-2 ui-card-title">{approvedDoctors.length}</p>
            </div>
            <div className="ui-card-interior-muted">
              <p className="ui-label">Draft Status</p>
              <p className="mt-2 ui-card-title">{showForm ? "Open" : "Closed"}</p>
            </div>
          </div>
        </UiCard>

        <UiCard>
          <div className="flex flex-col gap-2">
            <p className="ui-section-title">Scheduling Rules</p>
            <p className="ui-body-secondary">
              Use the standard sequence to keep doctor rosters readable and conflict-free.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="ui-card-interior">
              <p className="ui-label">1. Department</p>
              <p className="mt-1 ui-card-body">Select a department before choosing a doctor.</p>
            </div>
            <div className="ui-card-interior">
              <p className="ui-label">2. Time Range</p>
              <p className="mt-1 ui-card-body">Set date, duration, start time, and end time.</p>
            </div>
            <div className="ui-card-interior">
              <p className="ui-label">3. Review</p>
              <p className="mt-1 ui-card-body">Check preview slots and existing schedules, then save.</p>
            </div>
          </div>
        </UiCard>
      </section>

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
            doctorEmptyMessage={!filteredDoctors.length ? "No approved doctors available" : undefined}
            submitMessage={submitMessage}
            isSubmitting={isSubmitting}
            minDate={new Date().toISOString().slice(0, 10)}
            submitLabel={editingScheduleId ? "Update Schedule" : "Save Schedule"}
            disableDoctorSelection={!selectedDepartment || !hasApprovedDoctors}
            disableSubmit={!canSaveSchedule || isSubmitting}
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
              className="transition"
            >
              <SlotPreview slots={previewSlots} />
              {selectedDoctorSchedules.length ? (
                <div className="mt-4 ui-card-interior">
                  <p className="ui-card-title">Existing schedules on this date</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {selectedDoctorSchedules.map((schedule) => {
                      const isConflict = conflictingSchedules.some((item) => item.id === schedule.id);

                      return (
                        <div
                          key={schedule.id}
                          className={
                            isConflict
                              ? "rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]"
                              : "rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A]"
                          }
                        >
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      );
                    })}
                  </div>
                  {conflictingSchedules.length ? (
                    <p className="mt-3 ui-body text-[#B91C1C]">
                      Warning: this time range overlaps with an existing schedule.
                    </p>
                  ) : null}
                </div>
              ) : null}
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
