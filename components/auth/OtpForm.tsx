"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuthRole } from "@/components/auth/AuthRoleContext";
import { Button, Input } from "@/components/ui";
import {
  clearPendingAuthChallenge,
  formatRoleLabel,
  getPendingAuthChallenge,
  verifyMockOtp
} from "@/lib/auth-flow";

export function OtpForm() {
  const router = useRouter();
  const { setSelectedRole } = useAuthRole();
  const [challenge, setChallenge] = React.useState(getPendingAuthChallenge());
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const pending = getPendingAuthChallenge();
    setChallenge(pending);

    if (pending?.role) {
      setSelectedRole(pending.role);
    }
  }, [setSelectedRole]);

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await verifyMockOtp({ otp });
      router.push(`/dashboard?role=${session.role}`);
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
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
      <form className="space-y-5" onSubmit={handleVerify}>
        <div className="space-y-2">
          <h1 className="text-[20px] font-medium text-[#0F172A]">Verify OTP</h1>
          <p className="text-sm text-[#64748B]">You are signing in as {formatRoleLabel(challenge.role)}</p>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#0F172A]">OTP</span>
            <Input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter OTP"
              inputMode="numeric"
              maxLength={6}
            />
          </label>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <Button type="submit" fullWidth loading={loading}>
          Verify
        </Button>
      </form>
    </AuthCard>
  );
}
