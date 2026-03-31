import { AuthLayout } from "@/components/auth/AuthLayout";
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
  const imageMap = {
    doctor: {
      src: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
      alt: "Doctor reviewing records in a hospital room"
    },
    hospital: {
      src: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80",
      alt: "Hospital staff working on a reception system"
    },
    admin: {
      src: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80",
      alt: "Administrator working at an office desk"
    }
  } as const;
  const image = imageMap[role ?? "doctor"];

  return (
    <AuthLayout
      title="Verify OTP"
      description="Enter the one-time password sent for this authentication request."
      imageSrc={image.src}
      imageAlt={image.alt}
    >
      <OtpForm />
    </AuthLayout>
  );
}
