"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Search, X } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui";
import { Card, DatePicker, Input, Select } from "@/components/scheduling";
import { bloodGroupOptions } from "@/lib/mock-data/scheduling";
import { createSelectOptions, formatScheduleDate } from "@/lib/scheduling";
import type { PatientEntryFormValues } from "@/utils/schedulingSchemas";

interface PatientEntryFormProps {
  control: Control<PatientEntryFormValues>;
  register: UseFormRegister<PatientEntryFormValues>;
  errors: FieldErrors<PatientEntryFormValues>;
  isSubmitting: boolean;
  visitDate: string;
  message: string;
  departments: string[];
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
  onSubmit,
  onCancel,
}: PatientEntryFormProps) {
  return (
    <Card className="w-full p-4 transition hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-[#0F172A]">Enter Patient Details</h2>
          <p className="mt-1 text-sm text-[#64748B]">Fill in the patient details to generate the next available token.</p>
        </div>
        <p className="text-xs text-[#64748B]">{formatScheduleDate(visitDate)}</p>
      </div>

      {message ? <p className="mt-3 text-sm text-[#64748B]">{message}</p> : null}

      <div className="my-4 border-t border-[#E2E8F0]" />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="patientName"
            label="Patient Name"
            placeholder="Enter patient name"
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
                label="DOB"
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
            label="Blood Group"
            placeholder="Select blood group"
            options={[...bloodGroupOptions]}
            error={errors.bloodGroup?.message}
            required
            defaultValue=""
            {...register("bloodGroup")}
          />

          <Input
            id="aadhaar"
            label="Aadhaar"
            placeholder="Optional 12-digit Aadhaar"
            error={errors.aadhaar?.message}
            maxLength={12}
            {...register("aadhaar")}
          />

          <Input
            id="contact"
            label="Phone or Email"
            placeholder="Enter phone or email"
            error={errors.contact?.message}
            required
            {...register("contact")}
          />

          <Select
            id="department"
            label="Department"
            placeholder="Select department"
            options={createSelectOptions(departments)}
            error={errors.department?.message}
            required
            defaultValue=""
            {...register("department")}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            className="border-[#E2E8F0] text-[#64748B] hover:border-[#0EA5A4] hover:text-[#0EA5A4]"
            leftIcon={<X className="size-4" />}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} leftIcon={<Search className="size-4" />}>
            Generate Token
          </Button>
        </div>
      </form>
    </Card>
  );
}
