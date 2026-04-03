"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { GetCity, GetCountries, GetState } from "react-country-state-city";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { FormWrapper } from "@/components/FormWrapper";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { Select } from "@/components/Select";
import { DatePicker as ScheduleDatePicker } from "@/components/scheduling/DatePicker";
import { useAuthRole } from "@/components/auth/AuthRoleContext";
import {
  AuthRole,
  beginMockSignup,
  formatRoleLabel,
  isAuthRole,
  type SignupPayload,
} from "@/lib/auth-flow";
import { getDepartments, type DepartmentRecord } from "@/lib/dashboard-data";
import { logger } from "@/lib/logger";
import { bloodGroupOptions } from "@/lib/scheduling-types";
import { defaultSignupValues, signupSchema, type SignupFormValues } from "@/utils/validationSchemas";

type CountryOption = { id: number; name: string };
type StateOption = { id: number; name: string };
type CityOption = { id: number; name: string };

function buildPayload(role: AuthRole, values: SignupFormValues): SignupPayload {
  const common = {
    role,
    fullName: values.fullName,
    mobileNumber: values.mobileNumber,
    email: values.email,
    password: values.password,
    confirmPassword: values.confirmPassword,
    country: values.country,
    state: values.state,
    city: values.city,
  } as const;

  if (role === "doctor") {
    return {
      ...common,
      role: "doctor",
      medicalRegistrationId: values.medicalRegistrationId,
      specialization: values.specialization,
      department: values.department,
      gender: values.gender,
      dob: values.dob,
      bloodGroup: values.bloodGroup,
    };
  }

  if (role === "hospital") {
    return {
      ...common,
      role: "hospital",
      hospitalName: values.hospitalName,
      department: values.department,
    };
  }

  return {
    ...common,
    role: "admin",
    hospitalName: values.hospitalName,
    adminAccessCode: values.adminAccessCode,
  };
}

export function SignUpFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedRole } = useAuthRole();
  const roleParam = searchParams.get("role");
  const selectedRole = isAuthRole(roleParam) ? roleParam : null;

  const [serverError, setServerError] = React.useState("");
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [states, setStates] = React.useState<StateOption[]>([]);
  const [cities, setCities] = React.useState<CityOption[]>([]);
  const [selectedCountryId, setSelectedCountryId] = React.useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = React.useState<number | null>(null);
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);

  const methods = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      ...defaultSignupValues,
      role: selectedRole ?? "doctor",
    },
  });

  const {
    control,
    register,
    reset,
    setValue,
    watch,
    formState: { errors, touchedFields, isSubmitting },
  } = methods;

  const values = watch();
  const countryOptions = countries.map((country) => ({ value: String(country.id), label: country.name }));
  const stateOptions = states.map((state) => ({ value: String(state.id), label: state.name }));
  const cityOptions = cities.map((city) => ({ value: String(city.id), label: city.name }));
  const departmentOptions = departments.map((department) => ({
    label: department.name,
    value: department.name,
  }));

  const mobileNumberRegistration = register("mobileNumber", {
    onChange: (event) => {
      event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
      setServerError("");
    },
  });

  function isFieldValid(fieldName: keyof SignupFormValues) {
    return Boolean(
      (touchedFields as Partial<Record<keyof SignupFormValues, boolean>>)[fieldName] &&
        watch(fieldName) &&
        !errors[fieldName]
    );
  }

  function handleRoleSelect(role: AuthRole) {
    setSelectedRole(role);
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", role);
    router.push(`/signup?${params.toString()}`);
  }

  React.useEffect(() => {
    let active = true;

    GetCountries().then((nextCountries) => {
      if (!active) return;
      setCountries((nextCountries as CountryOption[]) ?? []);
    });

    getDepartments()
      .then((nextDepartments) => {
        if (!active) return;
        setDepartments(nextDepartments);
      })
      .catch(() => {
        if (!active) return;
        setDepartments([]);
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!selectedRole) {
      return;
    }

    reset({
      ...defaultSignupValues,
      role: selectedRole,
    });
    setSelectedCountryId(null);
    setSelectedStateId(null);
    setStates([]);
    setCities([]);
    setServerError("");
    setSelectedRole(selectedRole);
  }, [reset, selectedRole, setSelectedRole]);

  React.useEffect(() => {
    if (!selectedCountryId) {
      setStates([]);
      setCities([]);
      return;
    }

    let active = true;
    GetState(selectedCountryId).then((nextStates) => {
      if (!active) return;
      setStates((nextStates as StateOption[]) ?? []);
    });

    return () => {
      active = false;
    };
  }, [selectedCountryId]);

  React.useEffect(() => {
    if (!selectedCountryId || !selectedStateId) {
      setCities([]);
      return;
    }

    let active = true;
    GetCity(selectedCountryId, selectedStateId).then((nextCities) => {
      if (!active) return;
      setCities((nextCities as CityOption[]) ?? []);
    });

    return () => {
      active = false;
    };
  }, [selectedCountryId, selectedStateId]);

  async function handleSubmit(formValues: SignupFormValues) {
    if (!selectedRole) {
      return;
    }

    setServerError("");

    try {
      const challenge = await beginMockSignup(buildPayload(selectedRole, formValues));
      setSelectedRole(challenge.role);
      logger.success(`${formatRoleLabel(selectedRole)} account created. Verify OTP to continue.`, {
        source: "auth.signup",
        data: { role: selectedRole, email: formValues.email },
        toast: true,
      });
      router.push(`/verify-otp?mode=${challenge.mode}&role=${challenge.role}`);
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : "Unable to start sign up.";
      setServerError(message);
      logger.error("Unable to create your account right now.", {
        source: "auth.signup",
        data: { role: selectedRole, error: message },
        toast: true,
      });
    }
  }

  if (!selectedRole) {
    return (
      <AuthCard>
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-[20px] font-medium text-[#0F172A]">Hospital Token Management System</h2>
            <p className="text-sm text-[#64748B]">Select a role to continue.</p>
          </div>
          <RoleSelector selectedRole={null} onSelect={handleRoleSelect} />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <FormWrapper methods={methods} onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-[20px] font-medium text-[#0F172A]">Hospital Token Management System</h2>
            <p className="text-sm text-[#64748B]">
              Create your {formatRoleLabel(selectedRole).toLowerCase()} account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="inline-flex h-11 items-center gap-1 text-sm font-medium text-[#64748B] transition hover:text-[#0F172A]"
          >
            <ArrowLeft className="size-4" />
            Change
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            placeholder="Enter full name"
            error={errors.fullName?.message}
            success={isFieldValid("fullName")}
            {...register("fullName", {
              onChange: () => setServerError(""),
            })}
          />

          <Input
            label="Mobile Number"
            placeholder="Enter mobile number"
            inputMode="numeric"
            maxLength={10}
            error={errors.mobileNumber?.message}
            success={isFieldValid("mobileNumber")}
            {...mobileNumberRegistration}
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter email"
            autoComplete="email"
            error={errors.email?.message}
            success={isFieldValid("email")}
            {...register("email", {
              onChange: () => setServerError(""),
            })}
          />

          <PasswordInput
            label="Password"
            placeholder="Create password"
            autoComplete="new-password"
            error={errors.password?.message}
            success={isFieldValid("password")}
            {...register("password", {
              onChange: () => setServerError(""),
            })}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            success={isFieldValid("confirmPassword")}
            {...register("confirmPassword", {
              onChange: () => setServerError(""),
            })}
          />

          {selectedRole === "doctor" ? (
            <Input
              label="Medical Registration ID"
              placeholder="Enter registration ID"
              error={errors.medicalRegistrationId?.message}
              success={isFieldValid("medicalRegistrationId")}
              {...register("medicalRegistrationId", {
                onChange: () => setServerError(""),
              })}
            />
          ) : null}

          {selectedRole === "hospital" || selectedRole === "admin" ? (
            <Input
              label="Hospital Name"
              placeholder="Enter hospital name"
              error={errors.hospitalName?.message}
              success={isFieldValid("hospitalName")}
              {...register("hospitalName", {
                onChange: () => setServerError(""),
              })}
            />
          ) : null}

          {selectedRole === "admin" ? (
            <Input
              label="Admin Access Code"
              placeholder="Enter access code"
              error={errors.adminAccessCode?.message}
              success={isFieldValid("adminAccessCode")}
              {...register("adminAccessCode", {
                onChange: () => setServerError(""),
              })}
            />
          ) : null}

          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                label="Country"
                value={selectedCountryId ? String(selectedCountryId) : ""}
                options={countryOptions}
                placeholder="Select country"
                error={errors.country?.message}
                success={isFieldValid("country")}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const countryId = Number(event.target.value);
                  const country = countries.find((item) => item.id === countryId);

                  setSelectedCountryId(countryId);
                  setSelectedStateId(null);
                  setStates([]);
                  setCities([]);
                  field.onChange(country?.name ?? "");
                  setValue("state", "", { shouldDirty: true, shouldValidate: true });
                  setValue("city", "", { shouldDirty: true, shouldValidate: true });
                  setServerError("");
                }}
              />
            )}
          />

          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select
                label="State"
                value={selectedStateId ? String(selectedStateId) : ""}
                options={stateOptions}
                placeholder="Select state"
                disabled={!selectedCountryId}
                error={errors.state?.message}
                success={isFieldValid("state")}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const stateId = Number(event.target.value);
                  const state = states.find((item) => item.id === stateId);

                  setSelectedStateId(stateId);
                  field.onChange(state?.name ?? "");
                  setValue("city", "", { shouldDirty: true, shouldValidate: true });
                  setServerError("");
                }}
              />
            )}
          />

          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Select
                label="City"
                value={
                  cities.find((city) => city.name === values.city)?.id
                    ? String(cities.find((city) => city.name === values.city)?.id)
                    : ""
                }
                options={cityOptions}
                placeholder="Select city"
                disabled={!selectedStateId}
                error={errors.city?.message}
                success={isFieldValid("city")}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const cityId = Number(event.target.value);
                  const city = cities.find((item) => item.id === cityId);

                  field.onChange(city?.name ?? "");
                  setServerError("");
                }}
              />
            )}
          />

          {selectedRole === "doctor" || selectedRole === "hospital" ? (
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Select
                  label="Department"
                  value={field.value}
                  options={departmentOptions}
                  placeholder="Select department"
                  error={errors.department?.message}
                  success={isFieldValid("department")}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    setServerError("");
                  }}
                />
              )}
            />
          ) : null}

          {selectedRole === "doctor" ? (
            <>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Gender"
                    value={field.value}
                    options={[
                      { label: "Female", value: "female" },
                      { label: "Male", value: "male" },
                      { label: "Other", value: "other" },
                    ]}
                    placeholder="Select gender"
                    error={errors.gender?.message}
                    success={isFieldValid("gender")}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      setServerError("");
                    }}
                  />
                )}
              />

              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <ScheduleDatePicker
                    id="dob"
                    label="Date of Birth"
                    value={field.value}
                    onChange={(nextValue) => {
                      field.onChange(nextValue);
                      setServerError("");
                    }}
                    onBlur={field.onBlur}
                    error={errors.dob?.message}
                    required
                    max={new Date().toISOString().slice(0, 10)}
                  />
                )}
              />

              <Controller
                name="bloodGroup"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Blood Group"
                    value={field.value}
                    options={[...bloodGroupOptions]}
                    placeholder="Select blood group"
                    error={errors.bloodGroup?.message}
                    success={isFieldValid("bloodGroup")}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      setServerError("");
                    }}
                  />
                )}
              />

              <Input
                label="Specialization"
                required={false}
                placeholder="Enter specialization"
                error={errors.specialization?.message}
                success={isFieldValid("specialization")}
                {...register("specialization", {
                  onChange: () => setServerError(""),
                })}
              />
            </>
          ) : null}
        </div>

        {serverError ? <p className="text-sm text-[#EF4444]">{serverError}</p> : null}

        <AuthButton type="submit" loading={isSubmitting} rightIcon={<ArrowRight className="size-4" />}>
          Continue
        </AuthButton>
      </FormWrapper>
    </AuthCard>
  );
}
