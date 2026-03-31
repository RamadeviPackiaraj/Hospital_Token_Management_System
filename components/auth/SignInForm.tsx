"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthRole } from "@/components/auth/AuthRoleContext";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormWrapper } from "@/components/FormWrapper";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { beginMockSignin } from "@/lib/auth-flow";
import { signInSchema, type SignInFormValues } from "@/utils/validationSchemas";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedRole } = useAuthRole();
  const [serverError, setServerError] = React.useState("");
  const verified = searchParams.get("verified") === "1";

  const methods = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    watch,
    formState: { errors, touchedFields, isSubmitting },
  } = methods;

  const emailValue = watch("email");
  const passwordValue = watch("password");
  const emailSuccess = Boolean(touchedFields.email && emailValue && !errors.email);
  const passwordSuccess = Boolean(touchedFields.password && passwordValue && !errors.password);

  async function handleSubmit(values: SignInFormValues) {
    setServerError("");

    try {
      const challenge = await beginMockSignin(values);
      setSelectedRole(challenge.role);
      router.push(`/verify-otp?mode=${challenge.mode}&role=${challenge.role}`);
    } catch (signInError) {
      setServerError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    }
  }

  return (
    <AuthCard>
      <FormWrapper methods={methods} onSubmit={handleSubmit}>
        <div className="space-y-2">
          <h1 className="text-[20px] font-medium text-[#0F172A]">Sign in</h1>
          <p className="text-sm text-[#64748B]">Enter your email and password to continue.</p>
          {verified ? (
            <p className="rounded-xl border border-[#22C55E] bg-[#F0FDF4] px-3 py-2 text-sm text-[#15803D]">
              Registration verified. Please sign in to continue.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            error={errors.email?.message}
            success={emailSuccess}
            {...register("email")}
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            success={passwordSuccess}
            {...register("password")}
          />
        </div>

        {serverError ? <p className="text-sm text-[#EF4444]">{serverError}</p> : null}

        <AuthButton type="submit" loading={isSubmitting}>
          Sign in
        </AuthButton>

        <p className="text-center text-sm text-[#64748B]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[#0EA5A4] transition hover:text-[#0B8B8B]">
            Sign up
          </Link>
        </p>
      </FormWrapper>
    </AuthCard>
  );
}
