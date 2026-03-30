import { AuthTopbar } from "@/components/auth/AuthTopbar";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { OtpForm } from "@/components/auth/OtpForm";
import { isAuthRole } from "@/lib/auth-flow";

export default async function VerifyOtpPage({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const roleParam = typeof resolvedSearchParams?.role === "string" ? resolvedSearchParams.role : null;
  const role = isAuthRole(roleParam) ? roleParam : null;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AuthTopbar />
      <AuthSplitLayout
        title="Verify OTP"
        description="Enter the one-time password sent for this authentication request."
        imageVariant="otp"
        role={role}
      >
        <OtpForm />
      </AuthSplitLayout>
    </main>
  );
}
