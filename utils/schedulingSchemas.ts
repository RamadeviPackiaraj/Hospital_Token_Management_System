import { z } from "zod";
import { dateSchema, nameSchema, requiredString, selectSchema } from "@/utils/validationSchemas";
import { getDoctorById, generateTimeSlots } from "@/lib/scheduling";

export const doctorScheduleSchema = z
  .object({
    doctorId: selectSchema(),
    department: selectSchema(),
    date: dateSchema(),
    startTime: requiredString(),
    endTime: requiredString(),
    consultationTime: requiredString().refine((value) => /^\d+$/.test(value) && Number(value) > 0, {
      message: "Enter consultation time in minutes",
    }),
  })
  .superRefine((values, context) => {
    const doctor = getDoctorById(values.doctorId);

    if (doctor && doctor.department !== values.department) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doctorId"],
        message: "Selected doctor does not belong to this department",
      });
    }

    if (values.startTime && values.endTime && values.startTime >= values.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be later than start time",
      });
    }

    const slots = generateTimeSlots(
      values.startTime,
      values.endTime,
      Number(values.consultationTime)
    );

    if (slots.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consultationTime"],
        message: "Choose a valid time range that creates at least one slot",
      });
    }
  });

export const patientEntrySchema = z.object({
  patientName: nameSchema(),
  dob: dateSchema({ allowPast: true }),
  bloodGroup: selectSchema(),
  aadhaar: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value.length === 0 || /^\d{12}$/.test(value), "Aadhaar must be 12 digits"),
  contact: requiredString().refine((value) => {
    const trimmed = value.trim();
    const isPhone = /^\d{10}$/.test(trimmed);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return isPhone || isEmail;
  }, "Enter a valid 10-digit phone number or email"),
  department: selectSchema(),
});

export type DoctorScheduleFormValues = z.infer<typeof doctorScheduleSchema>;
export type PatientEntryFormValues = z.infer<typeof patientEntrySchema>;

export const defaultDoctorScheduleValues: DoctorScheduleFormValues = {
  doctorId: "",
  department: "",
  date: "",
  startTime: "",
  endTime: "",
  consultationTime: "15",
};

export const defaultPatientEntryValues: PatientEntryFormValues = {
  patientName: "",
  dob: "",
  bloodGroup: "",
  aadhaar: "",
  contact: "",
  department: "",
};
