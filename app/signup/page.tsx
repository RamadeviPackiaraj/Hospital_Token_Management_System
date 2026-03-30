import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignUpFlow } from "@/components/auth/SignUpFlow";
import { isAuthRole } from "@/lib/auth-flow";

export default async function SignupPage({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const roleParam = typeof resolvedSearchParams?.role === "string" ? resolvedSearchParams.role : null;
  const role = isAuthRole(roleParam) ? roleParam : null;
  const imageMap = {
    doctor: {
      src: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80",
      alt: "Doctor speaking with a patient"
    },
    hospital: {
      src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
      alt: "Hospital operating room"
    },
    admin: {
      src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      alt: "Administrator office desk"
    }
  } as const;
  const image = imageMap[role ?? "doctor"];

  return (
    <AuthLayout
      title="Sign Up"
      description="Choose your role and continue with the required account details."
      imageSrc={image.src}
      imageAlt={image.alt}
    >
        <SignUpFlow />
    </AuthLayout>
  );
}
