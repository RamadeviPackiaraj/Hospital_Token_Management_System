import { z } from "zod";

const REQUIRED_MESSAGE = "This field is required";
const NAME_REGEX = /^[A-Za-z ]+$/;

function parseDate(value: string) {
  let normalizedValue = value;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    normalizedValue = `${year}-${month}-${day}`;
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${normalizedValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function requiredString() {
  return z.string().trim().min(1, REQUIRED_MESSAGE);
}

export function emailSchema() {
  return requiredString().email("Enter a valid email address");
}

export function passwordSchema() {
  return requiredString()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/\d/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");
}

export function nameSchema() {
  return requiredString().regex(NAME_REGEX, "Only alphabets and spaces are allowed");
}

export function phoneSchema(length = 10) {
  return requiredString()
    .regex(/^\d+$/, "Only digits are allowed")
    .length(length, `Phone number must be ${length} digits`);
}

export function numberSchema(options?: { min?: number; max?: number; required?: boolean }) {
  const { min, max, required = true } = options ?? {};

  let schema = z.string().trim();

  if (required) {
    schema = schema.min(1, REQUIRED_MESSAGE);
  }

  return schema
    .refine((value) => value.length === 0 || /^\d+$/.test(value), "Only numeric values are allowed")
    .refine((value) => {
      if (value.length === 0 || min === undefined) return true;
      return Number(value) >= min;
    }, min !== undefined ? `Value must be at least ${min}` : "Invalid value")
    .refine((value) => {
      if (value.length === 0 || max === undefined) return true;
      return Number(value) <= max;
    }, max !== undefined ? `Value must be at most ${max}` : "Invalid value");
}

export function selectSchema() {
  return requiredString();
}

export function dateSchema(options?: {
  allowPast?: boolean;
  allowToday?: boolean;
  required?: boolean;
}) {
  const { allowPast = false, allowToday = true, required = true } = options ?? {};

  let schema = z.string().trim();

  if (required) {
    schema = schema.min(1, REQUIRED_MESSAGE);
  }

  return schema
    .refine((value) => value.length === 0 || parseDate(value) !== null, "Enter a valid date")
    .refine((value) => {
      if (value.length === 0 || allowPast) return true;

      const parsed = parseDate(value);
      if (!parsed) return false;

      const today = getTodayStart();
      return allowToday ? parsed >= today : parsed > today;
    }, allowToday ? "Date cannot be in the past" : "Date must be in the future");
}

export function otpSchema(length = 6) {
  return requiredString().regex(new RegExp(`^\\d{${length}}$`), `OTP must be ${length} digits`);
}

export const signInSchema = z.object({
  email: emailSchema(),
  password: requiredString(),
});

export const signupRoleSchema = z.enum(["doctor", "hospital", "admin"]);

export const signupSchema = z
  .object({
    role: signupRoleSchema,
    fullName: nameSchema(),
    mobileNumber: phoneSchema(),
    email: emailSchema(),
    password: passwordSchema(),
    confirmPassword: requiredString(),
    medicalRegistrationId: z.string().trim().optional().default(""),
    specialization: z.string().trim().optional().default(""),
    hospitalName: z.string().trim().optional().default(""),
    department: z.string().trim().optional().default(""),
    gender: z.string().trim().optional().default(""),
    dob: dateSchema({ allowPast: true, required: false }).optional().default(""),
    bloodGroup: z.string().trim().optional().default(""),
    country: selectSchema(),
    state: selectSchema(),
    city: selectSchema(),
    adminAccessCode: z.string().trim().optional().default(""),
  })
  .superRefine((values, context) => {
    if (values.confirmPassword !== values.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords must match",
      });
    }

    if (values.role === "doctor") {
      if (!values.medicalRegistrationId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["medicalRegistrationId"],
          message: REQUIRED_MESSAGE,
        });
      }

      if (!values.department) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["department"],
          message: REQUIRED_MESSAGE,
        });
      }

      if (!values.gender) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gender"],
          message: REQUIRED_MESSAGE,
        });
      }

      if (!values.dob) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dob"],
          message: REQUIRED_MESSAGE,
        });
      }

      if (!values.bloodGroup) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bloodGroup"],
          message: REQUIRED_MESSAGE,
        });
      }
    }

    if (values.role === "hospital") {
      if (!values.hospitalName) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hospitalName"],
          message: REQUIRED_MESSAGE,
        });
      }

      if (!values.department) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["department"],
          message: REQUIRED_MESSAGE,
        });
      }
    }

    if (values.role === "admin") {
      if (!values.hospitalName) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hospitalName"],
          message: REQUIRED_MESSAGE,
        });
      }

      if (!values.adminAccessCode) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["adminAccessCode"],
          message: REQUIRED_MESSAGE,
        });
      }
    }
  });

export const verifyOtpSchema = z.object({
  otp: otpSchema(),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export const defaultSignupValues: SignupFormValues = {
  role: "doctor",
  fullName: "",
  mobileNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  medicalRegistrationId: "",
  specialization: "",
  hospitalName: "",
  department: "",
  gender: "",
  dob: "",
  bloodGroup: "",
  country: "",
  state: "",
  city: "",
  adminAccessCode: "",
};
