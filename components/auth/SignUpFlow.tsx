"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GetCity, GetCountries, GetState } from "react-country-state-city";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { InputField } from "@/components/auth/InputField";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { SelectField } from "@/components/auth/SelectField";
import { useAuthRole } from "@/components/auth/AuthRoleContext";
import {
  AuthRole,
  beginMockSignup,
  formatRoleLabel,
  isAuthRole,
  type SignupPayload
} from "@/lib/auth-flow";
import { getDepartments } from "@/lib/dashboard-data";

type SignupFieldKey =
  | "fullName"
  | "mobileNumber"
  | "email"
  | "password"
  | "confirmPassword"
  | "medicalRegistrationId"
  | "specialization"
  | "hospitalName"
  | "department"
  | "country"
  | "state"
  | "city"
  | "adminAccessCode";

type SignupFormState = Record<SignupFieldKey, string>;

type CountryOption = { id: number; name: string };
type StateOption = { id: number; name: string };
type CityOption = { id: number; name: string };

const initialState: SignupFormState = {
  fullName: "",
  mobileNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  medicalRegistrationId: "",
  specialization: "",
  hospitalName: "",
  department: "",
  country: "",
  state: "",
  city: "",
  adminAccessCode: ""
};

function buildPayload(role: AuthRole, values: SignupFormState): SignupPayload {
  const common = {
    role,
    fullName: values.fullName,
    mobileNumber: values.mobileNumber,
    email: values.email,
    password: values.password,
    confirmPassword: values.confirmPassword,
    country: values.country,
    state: values.state,
    city: values.city
  } as const;

  if (role === "doctor") {
    return {
      ...common,
      role: "doctor",
      medicalRegistrationId: values.medicalRegistrationId,
      specialization: values.specialization,
      department: values.department
    };
  }

  if (role === "hospital") {
    return {
      ...common,
      role: "hospital",
      hospitalName: values.hospitalName,
      department: values.department
    };
  }

  return {
    ...common,
    role: "admin",
    hospitalName: values.hospitalName,
    adminAccessCode: values.adminAccessCode
  };
}

export function SignUpFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedRole } = useAuthRole();
  const roleParam = searchParams.get("role");
  const selectedRole = isAuthRole(roleParam) ? roleParam : null;

  const [values, setValues] = React.useState<SignupFormState>(initialState);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [states, setStates] = React.useState<StateOption[]>([]);
  const [cities, setCities] = React.useState<CityOption[]>([]);
  const [selectedCountryId, setSelectedCountryId] = React.useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = React.useState<number | null>(null);
  const [departments, setDepartments] = React.useState(getDepartments());

  const countryOptions = countries.map((country) => ({ value: String(country.id), label: country.name }));
  const stateOptions = states.map((state) => ({ value: String(state.id), label: state.name }));
  const cityOptions = cities.map((city) => ({ value: String(city.id), label: city.name }));
  const departmentOptions = departments.map((department) => ({
    label: department.name,
    value: department.name
  }));

  function updateValue(key: SignupFieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
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

    setDepartments(getDepartments());

    return () => {
      active = false;
    };
  }, []);

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

  React.useEffect(() => {
    if (selectedRole) {
      setSelectedRole(selectedRole);
    }
  }, [selectedRole, setSelectedRole]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    setError("");

    try {
      const challenge = await beginMockSignup(buildPayload(selectedRole, values));
      setSelectedRole(challenge.role);
      router.push(`/verify-otp?mode=${challenge.mode}&role=${challenge.role}`);
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Unable to start sign up.");
    } finally {
      setLoading(false);
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
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-[20px] font-medium text-[#0F172A]">Hospital Token Management System</h2>
            <p className="text-sm text-[#64748B]">Create your {formatRoleLabel(selectedRole).toLowerCase()} account.</p>
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
          <InputField
            label="Full Name"
            value={values.fullName}
            onChange={(event) => updateValue("fullName", event.target.value)}
            placeholder="Enter full name"
          />
          <InputField
            label="Mobile Number"
            value={values.mobileNumber}
            onChange={(event) => updateValue("mobileNumber", event.target.value)}
            placeholder="Enter mobile number"
            inputMode="numeric"
          />
          <InputField
            label="Email"
            type="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            placeholder="Enter email"
          />
          <InputField
            label="Password"
            type="password"
            value={values.password}
            onChange={(event) => updateValue("password", event.target.value)}
            placeholder="Create password"
          />
          <InputField
            label="Confirm Password"
            type="password"
            value={values.confirmPassword}
            onChange={(event) => updateValue("confirmPassword", event.target.value)}
            placeholder="Confirm password"
          />

          {selectedRole === "doctor" ? (
            <InputField
              label="Medical Registration ID"
              value={values.medicalRegistrationId}
              onChange={(event) => updateValue("medicalRegistrationId", event.target.value)}
              placeholder="Enter registration ID"
            />
          ) : null}

          {selectedRole === "hospital" ? (
            <InputField
              label="Hospital Name"
              value={values.hospitalName}
              onChange={(event) => updateValue("hospitalName", event.target.value)}
              placeholder="Enter hospital name"
            />
          ) : null}

          {selectedRole === "admin" ? (
            <>
              <InputField
                label="Hospital Name"
                value={values.hospitalName}
                onChange={(event) => updateValue("hospitalName", event.target.value)}
                placeholder="Enter hospital name"
              />
              <InputField
                label="Admin Access Code"
                value={values.adminAccessCode}
                onChange={(event) => updateValue("adminAccessCode", event.target.value)}
                placeholder="Enter access code"
              />
            </>
          ) : null}

          <SelectField
            label="Country"
            value={selectedCountryId ? String(selectedCountryId) : ""}
            onChange={(event) => {
              const countryId = Number(event.target.value);
              const country = countries.find((item) => item.id === countryId);
              setSelectedCountryId(countryId);
              setSelectedStateId(null);
              setStates([]);
              setCities([]);
              setValues((current) => ({
                ...current,
                country: country?.name ?? "",
                state: "",
                city: ""
              }));
            }}
            options={countryOptions}
            placeholder="Select country"
          />
          <SelectField
            label="State"
            value={selectedStateId ? String(selectedStateId) : ""}
            onChange={(event) => {
              const stateId = Number(event.target.value);
              const state = states.find((item) => item.id === stateId);
              setSelectedStateId(stateId);
              setValues((current) => ({
                ...current,
                state: state?.name ?? "",
                city: ""
              }));
            }}
            options={stateOptions}
            placeholder="Select state"
            disabled={!selectedCountryId}
          />
          <SelectField
            label="City"
            value={cities.find((city) => city.name === values.city)?.id ? String(cities.find((city) => city.name === values.city)?.id) : ""}
            onChange={(event) => {
              const cityId = Number(event.target.value);
              const city = cities.find((item) => item.id === cityId);
              updateValue("city", city?.name ?? "");
            }}
            options={cityOptions}
            placeholder="Select city"
            disabled={!selectedStateId}
          />

          {(selectedRole === "doctor" || selectedRole === "hospital") ? (
            <SelectField
              label="Department"
              value={values.department}
              onChange={(event) => updateValue("department", event.target.value)}
              options={departmentOptions}
              placeholder="Select department"
            />
          ) : null}

          {selectedRole === "doctor" ? (
            <InputField
              label="Specialization"
              required={false}
              value={values.specialization}
              onChange={(event) => updateValue("specialization", event.target.value)}
              placeholder="Enter specialization"
            />
          ) : null}
        </div>

        {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}

        <AuthButton type="submit" loading={loading} rightIcon={<ArrowRight className="size-4" />}>
          Continue
        </AuthButton>
      </form>
    </AuthCard>
  );
}
