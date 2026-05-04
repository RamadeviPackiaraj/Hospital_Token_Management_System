"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Plus } from "lucide-react";
import { Controller } from "react-hook-form";
import { useI18n } from "@/components/i18n";
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
  doctorHint?: string;
  doctorEmptyMessage?: string;
  submitMessage: string;
  isSubmitting: boolean;
  minDate: string;
  submitLabel?: string;
  disableDoctorSelection?: boolean;
  disableSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: () => void;
}

export function CreateSchedule({
  control,
  register,
  errors,
  departmentOptions,
  doctorOptions,
  doctorHint,
  doctorEmptyMessage,
  submitMessage,
  isSubmitting,
  minDate,
  submitLabel = "Save Schedule",
  disableDoctorSelection = false,
  disableSubmit = false,
  onCancel,
  onSubmit,
}: CreateScheduleProps) {
  const { t } = useI18n();

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-2">
        <h2 className="ui-section-title">{t("schedule.formTitle")}</h2>
        <p className="ui-body-secondary">{t("schedule.formDescription")}</p>
        {submitMessage ? <p className="ui-meta text-[#0EA5A4]">{submitMessage}</p> : null}
      </div>

      <div className="my-4 ui-card-divider" />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            id="department"
            label={t("schedule.department")}
            placeholder={t("schedule.selectDepartment")}
            options={departmentOptions}
            error={errors.department?.message}
            required
            defaultValue=""
            {...register("department")}
          />

          <Select
            id="doctorId"
            label={t("schedule.doctor")}
            placeholder={t("schedule.selectDoctor")}
            options={doctorOptions}
            error={errors.doctorId?.message}
            hint={doctorEmptyMessage || doctorHint}
            required
            defaultValue=""
            disabled={disableDoctorSelection}
            {...register("doctorId")}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="date"
                label={t("schedule.date")}
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
            label={t("schedule.consultationTime")}
            placeholder={t("schedule.enterMinutes")}
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
                label={t("schedule.startTime")}
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
                label={t("schedule.endTime")}
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

        <div className="flex flex-wrap justify-end gap-3">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("common.actions.cancel")}
            </Button>
          ) : null}
          <Button type="submit" loading={isSubmitting} disabled={disableSubmit} leftIcon={<Plus className="size-4" />}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
