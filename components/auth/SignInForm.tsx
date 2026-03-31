"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthRole } from "@/components/auth/AuthRoleContext";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { InputField } from "@/components/auth/InputField";
import { beginMockSignin } from "@/lib/auth-flow";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedRole } = useAuthRole();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const verified = searchParams.get("verified") === "1";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const challenge = await beginMockSignin({ email, password });
      setSelectedRole(challenge.role);
      router.push(`/verify-otp?mode=${challenge.mode}&role=${challenge.role}`);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <h1 className="text-[20px] font-medium text-[#0F172A]">Hospital Token Management System</h1>
          <p className="text-sm text-[#64748B]">Enter your email and password to continue.</p>
          {verified ? (
            <p className="text-sm font-medium text-emerald-600">
              Registration verified. Please sign in to continue.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>

        <p className="text-center text-xs text-[#64748B]">
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-[#0EA5A4]">
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
