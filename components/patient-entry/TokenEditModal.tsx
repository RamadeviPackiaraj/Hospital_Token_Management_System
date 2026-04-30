"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/overlay/Modal";
import { Button } from "@/components/ui/Button";
import { DatePicker, Input, Select } from "@/components/scheduling";
import { bloodGroupOptions, type PatientTokenRecord } from "@/lib/scheduling-types";
import { patientEntrySchema, type PatientEntryFormValues } from "@/utils/schedulingSchemas";

interface TokenEditModalProps {
  open: boolean;
  token: PatientTokenRecord | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: PatientEntryFormValues) => void | Promise<void>;
}

export function TokenEditModal({
  open,
  token,
  saving = false,
  onClose,
  onSave,
}: TokenEditModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PatientEntryFormValues>({
    resolver: zodResolver(patientEntrySchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      patientName: "",
      dob: "",
      bloodGroup: "",
      aadhaar: "",
      contact: "",
      department: "",
    },
  });

  React.useEffect(() => {
    if (!token) {
      return;
    }

    reset({
      patientName: token.patientName,
      dob: token.dob,
      bloodGroup: token.bloodGroup,
      aadhaar: token.aadhaar,
      contact: token.contact,
      department: token.department,
    });
  }, [reset, token]);

  return (
    <Modal
      open={open}
      title="Edit Token"
      description="Update patient details for this token."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((values) => void onSave(values))} loading={saving}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id="edit-patientName"
          label="Patient Name"
          error={errors.patientName?.message}
          {...register("patientName")}
        />

        <Controller
          name="dob"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="edit-dob"
              label="DOB"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.dob?.message}
            />
          )}
        />

        <Select
          id="edit-bloodGroup"
          label="Blood Group"
          options={[...bloodGroupOptions]}
          error={errors.bloodGroup?.message}
          defaultValue=""
          {...register("bloodGroup")}
        />

        <Input
          id="edit-aadhaar"
          label="Aadhaar"
          error={errors.aadhaar?.message}
          {...register("aadhaar")}
        />

        <Input
          id="edit-contact"
          label="Phone or Email"
          error={errors.contact?.message}
          {...register("contact")}
        />

        <Input id="edit-department" label="Department" value={token?.department || ""} readOnly />
      </div>
    </Modal>
  );
}
