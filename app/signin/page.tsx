import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignInForm } from "@/components/auth/SignInForm";
import { isAuthRole } from "@/lib/auth-flow";

export default async function SigninPage({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const roleParam = typeof resolvedSearchParams?.role === "string" ? resolvedSearchParams.role : null;
  const role = isAuthRole(roleParam) ? roleParam : null;
  const imageMap = {
    doctor: {
      src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
      alt: "Doctor in surgery"
    },
    hospital: {
      src: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1200&q=80",
      alt: "Hospital team at work"
    },
    admin: {
      src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      alt: "Administrator workspace"
    }
  } as const;
  const image = imageMap[role ?? "doctor"];

  return (
    <AuthLayout
      title="Sign In"
      description="Access the hospital token management system with your account."
      imageSrc={image.src}
      imageAlt={image.alt}
    >
        <SignInForm />
    </AuthLayout>
  );
}
