"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormWrapper } from "@/components/FormWrapper";
import { OTPInput } from "@/components/OTPInput";
import { Button } from "@/components/ui";
import { useAuthRole } from "@/components/auth/AuthRoleContext";
import {
  clearPendingAuthChallenge,
  formatRoleLabel,
  getPendingAuthChallenge,
  resendMockOtp,
  type PendingAuthChallenge,
  verifyMockOtp,
} from "@/lib/auth-flow";
import { logger } from "@/lib/logger";
import { verifyOtpSchema, type VerifyOtpFormValues } from "@/utils/validationSchemas";

export function OtpForm() {
  const router = useRouter();
  const { setSelectedRole } = useAuthRole();
  const [challenge, setChallenge] = React.useState<PendingAuthChallenge | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [serverError, setServerError] = React.useState("");

  const methods = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const {
    control,
    setValue,
    clearErrors,
    watch,
    formState: { errors, touchedFields, isSubmitting },
  } = methods;

  const otpValue = watch("otp");
  const otpSuccess = Boolean(touchedFields.otp && otpValue?.length === 6 && !errors.otp);

  React.useEffect(() => {
    const pending = getPendingAuthChallenge();
    setChallenge(pending);
    setIsHydrated(true);

    if (pending?.role) {
      setSelectedRole(pending.role);
    }
  }, [setSelectedRole]);

  async function handleVerify(values: VerifyOtpFormValues) {
    setServerError("");

    try {
      const result = await verifyMockOtp(values);
      if (result.mode === "signup") {
        logger.success("OTP verified successfully. Please sign in to continue.", {
          source: "auth.otp",
          toast: true,
        });
        router.push("/signin?verified=1");
        return;
      }

      if (result.session) {
        setSelectedRole(result.session.role);
        logger.success("OTP verified successfully.", {
          source: "auth.otp",
          data: { role: result.session.role },
          toast: true,
        });
        router.push(`/dashboard?role=${result.session.role}`);
      }
    } catch (otpError) {
      const message = otpError instanceof Error ? otpError.message : "Unable to verify OTP.";
      setServerError(message);
      logger.error("OTP verification failed. Please try again.", {
        source: "auth.otp",
        data: { error: message },
        toast: true,
      });
    }
  }

  async function handleResend() {
    setServerError("");

    try {
      await resendMockOtp();
      setChallenge(getPendingAuthChallenge());
      setValue("otp", "", { shouldDirty: false, shouldValidate: false });
      clearErrors("otp");
      logger.success("A new OTP has been sent.", {
        source: "auth.otp",
        toast: true,
      });
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Unable to resend OTP.";
      setServerError(message);
      logger.error("Unable to resend OTP right now.", {
        source: "auth.otp",
        data: { error: message },
        toast: true,
      });
      throw resendError;
    }
  }

  if (!isHydrated) {
    return (
      <AuthCard>
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">Loading verification request...</p>
        </div>
      </AuthCard>
    );
  }

  if (!challenge) {
    return (
      <AuthCard>
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">No pending verification request was found.</p>
          <Button
            variant="outline"
            onClick={() => {
              clearPendingAuthChallenge();
              router.push("/signin");
            }}
          >
            Go to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <FormWrapper methods={methods} onSubmit={handleVerify}>
        <div className="space-y-2">
          <h1 className="text-[20px] font-medium text-[#0F172A]">Verify OTP</h1>
          <p className="text-sm text-[#64748B]">You are verifying as {formatRoleLabel(challenge.role)}</p>
        </div>

        <Controller
          name="otp"
          control={control}
          render={({ field }) => (
            <OTPInput
              label="OTP"
              value={field.value}
              onChange={(nextValue) => {
                field.onChange(nextValue.replace(/\D/g, "").slice(0, 6));
                setServerError("");
              }}
              error={errors.otp?.message}
              success={otpSuccess}
              onResend={handleResend}
            />
          )}
        />

        {serverError ? <p className="text-sm text-[#EF4444]">{serverError}</p> : null}

        <Button type="submit" fullWidth loading={isSubmitting}>
          Verify
        </Button>
      </FormWrapper>
    </AuthCard>
  );
}
