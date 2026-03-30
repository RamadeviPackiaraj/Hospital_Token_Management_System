import Link from "next/link";
import { ArrowRight, Building2, Stethoscope, Ticket } from "lucide-react";
import { AuthTopbar } from "@/components/auth/AuthTopbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AuthTopbar />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:items-center">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">
                Hospital Token Management
              </p>
              <h1 className="text-[20px] font-medium leading-8 text-[#0F172A] sm:text-[24px] sm:leading-8">
                Hospital token management for doctors, hospitals, and admins.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-[#64748B]">
                Manage patient tokens, staff access, and daily queue flow in one simple hospital token management system.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signin"
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#0ea5a4] bg-[#0ea5a4] px-4 text-sm font-medium text-white transition hover:bg-[#0b8b8b]"
              >
                Sign In
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/signup"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-xl border border-[#0EA5A4] bg-white px-4 text-sm font-medium text-[#0EA5A4] transition hover:bg-[#F0FDFA]"
              >
                Sign Up
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Daily tokens", value: "120+", icon: <Ticket className="size-4" /> },
                { label: "Departments", value: "18", icon: <Building2 className="size-4" /> },
                { label: "Doctors", value: "45+", icon: <Stethoscope className="size-4" /> }
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-panel">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-[#64748B]">{item.label}</p>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                      {item.icon}
                    </div>
                  </div>
                  <p className="mt-3 text-base font-medium text-[#0F172A]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-panel">
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"
                alt="Hospital corridor with medical staff"
                className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[420px]"
              />
            </div>

            <div className="grid gap-3 border-t border-[#E2E8F0] px-2 pb-2 pt-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <p className="text-xs text-[#64748B]">Fast patient flow</p>
                <p className="mt-2 text-sm font-medium text-[#0F172A]">
                  Organize queues, departments, and doctor availability from one dashboard.
                </p>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-4">
                <p className="text-xs text-[#64748B]">Simple access</p>
                <p className="mt-2 text-sm font-medium text-[#0F172A]">
                  Separate access for hospital staff, doctors, and admins with clean sign-in flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
