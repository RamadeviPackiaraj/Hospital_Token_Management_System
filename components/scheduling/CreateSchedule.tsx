"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Plus } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui";
import { Card } from "@/components/scheduling/Card";
import { DatePicker } from "@/components/scheduling/DatePicker";
import { Input } from "@/components/scheduling/Input";
import { Select, type SelectOption } from "@/components/scheduling/Select";
import { TimePicker } from "@/components/scheduling/TimePicker";
import type { DoctorScheduleFormValues } from "@/utils/schedulingSchemas";

interface CreateScheduleProps {
  control: Control<DoctorScheduleFormValues>;
  register: UseFormRegister<DoctorScheduleFormValues>;
  errors: FieldErrors<DoctorScheduleFormValues>;
  departmentOptions: SelectOption[];
  doctorOptions: SelectOption[];
  submitMessage: string;
  isSubmitting: boolean;
  minDate: string;
  onSubmit: () => void;
}

export function CreateSchedule({
  control,
  register,
  errors,
  departmentOptions,
  doctorOptions,
  submitMessage,
  isSubmitting,
  minDate,
  onSubmit,
}: CreateScheduleProps) {
  return (
    <Card className="w-full transition hover:shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-[#0F172A]">Schedule Form</h2>
        <p className="text-sm text-[#64748B]">Select doctor availability and review slots before saving.</p>
        {submitMessage ? <p className="text-xs text-[#0EA5A4]">{submitMessage}</p> : null}
      </div>

      <div className="my-4 border-t border-[#E2E8F0]" />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            id="department"
            label="Department"
            placeholder="Select department"
            options={departmentOptions}
            error={errors.department?.message}
            required
            defaultValue=""
            {...register("department")}
          />

          <Select
            id="doctorId"
            label="Doctor"
            placeholder="Select doctor"
            options={doctorOptions}
            error={errors.doctorId?.message}
            required
            defaultValue=""
            {...register("doctorId")}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="date"
                label="Date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.date?.message}
                required
                min={minDate}
              />
            )}
          />

          <Input
            id="consultationTime"
            label="Consultation Time"
            placeholder="Enter minutes"
            error={errors.consultationTime?.message}
            required
            inputMode="numeric"
            {...register("consultationTime")}
          />

          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                id="startTime"
                label="Start Time"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.startTime?.message}
                required
                step={900}
              />
            )}
          />

          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                id="endTime"
                label="End Time"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.endTime?.message}
                required
                step={900}
              />
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} leftIcon={<Plus className="size-4" />}>
            Save Schedule
          </Button>
        </div>
      </form>
    </Card>
  );
}
