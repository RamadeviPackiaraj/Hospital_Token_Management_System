"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@/components/i18n";
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
  const { t } = useI18n();
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
      title={t("patientEntry.editToken")}
      description={t("patientEntry.editTokenDescription")}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.actions.cancel")}
          </Button>
          <Button onClick={handleSubmit((values) => void onSave(values))} loading={saving}>
            {t("patientEntry.saveChanges")}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id="edit-patientName"
          label={t("patientEntry.patientName")}
          error={errors.patientName?.message}
          {...register("patientName")}
        />

        <Controller
          name="dob"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="edit-dob"
              label={t("patientEntry.dob")}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.dob?.message}
            />
          )}
        />

        <Select
          id="edit-bloodGroup"
          label={t("patientEntry.bloodGroup")}
          options={[...bloodGroupOptions]}
          error={errors.bloodGroup?.message}
          defaultValue=""
          {...register("bloodGroup")}
        />

        <Input
          id="edit-aadhaar"
          label={t("patientEntry.aadhaar")}
          error={errors.aadhaar?.message}
          {...register("aadhaar")}
        />

        <Input
          id="edit-contact"
          label={t("patientEntry.contact")}
          error={errors.contact?.message}
          {...register("contact")}
        />

        <Input id="edit-department" label={t("schedule.department")} value={token?.displayDepartment || token?.department || ""} readOnly />
      </div>
    </Modal>
  );
}
