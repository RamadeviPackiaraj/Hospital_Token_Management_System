"use client";

import * as React from "react";
import { useAuthRole } from "@/components/auth/AuthRoleContext";
import { AuthRole, getRoleTheme } from "@/lib/auth-flow";
import { Card } from "@/components/ui";

const hospitalScenes: Record<AuthRole, { signin: string; signup: string; otp: string; alt: string }> = {
  doctor: {
    signin:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    signup:
      "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80",
    otp: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
    alt: "Doctor reviewing reports on a tablet"
  },
  hospital: {
    signin:
      "https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1200&q=80",
    signup:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
    otp: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80",
    alt: "Hospital team working on a reception system"
  },
  admin: {
    signin:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    signup:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    otp: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80",
    alt: "Administrator working on a laptop in an office"
  }
};

export function AuthSplitLayout({
  title,
  description,
  imageVariant,
  role,
  children
}: {
  title: string;
  description: string;
  imageVariant: "signin" | "signup" | "otp";
  role?: AuthRole | null;
  children: React.ReactNode;
}) {
  const { selectedRole } = useAuthRole();
  const activeRole = role ?? selectedRole ?? "doctor";
  const theme = getRoleTheme(activeRole);
  const scene = hospitalScenes[activeRole];
  const contentWidthClass = imageVariant === "signup" ? "max-w-4xl" : "max-w-lg";
  const imagePanelClass = "relative h-[560px] bg-[#E2E8F0]";

  return (
    <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="flex items-center justify-center">
          <div className={`w-full ${contentWidthClass} space-y-6`}>
            <div className="space-y-2">
              <h1 className="text-[20px] font-medium text-[#0F172A]">{title}</h1>
              <p className="text-sm leading-6 text-[#64748B]">{description}</p>
              <div className="h-1 w-12 rounded-full" style={{ backgroundColor: theme.primary }} />
            </div>
            {children}
          </div>
        </div>

        <Card className="hidden overflow-hidden rounded-xl shadow-none lg:block">
          <div className={imagePanelClass}>
            <img
              src={scene[imageVariant]}
              alt={scene.alt}
              className="h-full w-full object-cover opacity-75 blur-[1px]"
            />
            <div className="absolute inset-0 bg-white/15" />
          </div>
        </Card>
      </div>
    </section>
  );
}
