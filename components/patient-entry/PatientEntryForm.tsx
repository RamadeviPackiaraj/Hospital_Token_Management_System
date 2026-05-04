"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Search, X } from "lucide-react";
import { Controller } from "react-hook-form";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui";
import { Card, DatePicker, Input, Select } from "@/components/scheduling";
import { SectionTitle, BodySecondary, Label } from "@/components/ui/Typography";
import { createSelectOptions, formatScheduleDate } from "@/lib/scheduling";
import { bloodGroupOptions } from "@/lib/scheduling-types";
import type { PatientEntryFormValues } from "@/utils/schedulingSchemas";

interface PatientEntryFormProps {
  control: Control<PatientEntryFormValues>;
  register: UseFormRegister<PatientEntryFormValues>;
  errors: FieldErrors<PatientEntryFormValues>;
  isSubmitting: boolean;
  visitDate: string;
  message: string;
  departments: string[];
  departmentDisplayByValue?: Record<string, string>;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PatientEntryForm({
  control,
  register,
  errors,
  isSubmitting,
  visitDate,
  message,
  departments,
  departmentDisplayByValue = {},
  onSubmit,
  onCancel,
}: PatientEntryFormProps) {
  const { t } = useI18n();

  return (
    <Card className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <SectionTitle>{t("patientEntry.formTitle")}</SectionTitle>
          <BodySecondary className="mt-2 text-[14px]">{t("patientEntry.formDescription")}</BodySecondary>
        </div>
        <Label className="text-[12px] text-[#0EA5A4] font-semibold">{formatScheduleDate(visitDate)}</Label>
      </div>

      {message ? <BodySecondary className="mt-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[13px]">{message}</BodySecondary> : null}

      <div className="my-4 border-t border-[#E2E8F0]" />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="patientName"
            label={t("patientEntry.patientName")}
            placeholder={t("patientEntry.enterPatientName")}
            error={errors.patientName?.message}
            required
            {...register("patientName")}
          />

          <Controller
            name="dob"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="dob"
                label={t("patientEntry.dob")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.dob?.message}
                required
                max={visitDate}
              />
            )}
          />

          <Select
            id="bloodGroup"
            label={t("patientEntry.bloodGroup")}
            placeholder={t("patientEntry.selectBloodGroup")}
            options={[...bloodGroupOptions]}
            error={errors.bloodGroup?.message}
            required
            defaultValue=""
            {...register("bloodGroup")}
          />

          <Input
            id="aadhaar"
            label={t("patientEntry.aadhaar")}
            placeholder={t("patientEntry.aadhaarPlaceholder")}
            error={errors.aadhaar?.message}
            maxLength={12}
            {...register("aadhaar")}
          />

          <Input
            id="contact"
            label={t("patientEntry.contact")}
            placeholder={t("patientEntry.contactPlaceholder")}
            error={errors.contact?.message}
            required
            {...register("contact")}
          />

          <Select
            id="department"
            label={t("schedule.department")}
            placeholder={t("schedule.selectDepartment")}
            options={createSelectOptions(departments, departmentDisplayByValue)}
            error={errors.department?.message}
            required
            defaultValue=""
            {...register("department")}
          />
        </div>

        <div className="mt-2 flex flex-wrap justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            className="text-[#64748B] hover:text-[#0EA5A4]"
            leftIcon={<X className="h-4 w-4" />}
            onClick={onCancel}
          >
            {t("common.actions.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting} leftIcon={<Search className="h-4 w-4" />}>
            {t("patientEntry.generateToken")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
