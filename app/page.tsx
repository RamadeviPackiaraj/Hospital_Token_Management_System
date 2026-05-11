import Link from "next/link";
import { ArrowRight, Building2, Clock3, ShieldCheck, Stethoscope, Ticket } from "lucide-react";
import { AuthTopbar } from "@/components/auth/AuthTopbar";
import { Card } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AuthTopbar showSignup={false} />

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:gap-8">
          <div className="max-w-2xl space-y-5 pt-4">
            <div className="space-y-3">
              <p className="ui-label block leading-4 tracking-[0.2em]">
                Hospital Queue Management
              </p>
              <h1 className="ui-page-title max-w-[520px] text-balance">
                Run patient tokens, staff access, and queue flow from one hospital dashboard.
              </h1>

              <p className="max-w-xl ui-body-secondary">
                A simple system for reception teams, doctors, and administrators to manage daily queue operations.
              </p>
            </div>

            <div className="flex">
              <Link
                href="/signin"
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#0ea5a4] bg-[#0ea5a4] px-4 text-sm font-medium leading-5 text-white transition hover:bg-[#0b8b8b]"
              >
                Access Portal
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Patients served",
                  value: "120+",
                  description: "daily token volume",
                  icon: <Ticket className="size-4" />
                },
                {
                  label: "Care units",
                  value: "18",
                  description: "departments managed",
                  icon: <Building2 className="size-4" />
                },
                {
                  label: "Active doctors",
                  value: "45+",
                  description: "schedules available",
                  icon: <Stethoscope className="size-4" />
                }
              ].map((item) => (
                <Card key={item.label} className="min-h-[114px]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-card-title">{item.label}</p>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                      {item.icon}
                    </div>
                  </div>
                  <p className="mt-3 ui-section-title">{item.value}</p>
                  <p className="mt-1 ui-meta">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-3">
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"
                alt="Hospital corridor with medical staff"
                className="block h-[260px] w-full object-cover sm:h-[320px] lg:h-[420px]"
              />
            </div>

            <div className="grid gap-3 border-t border-[#E2E8F0] px-2 pb-2 pt-4 sm:grid-cols-2">
              <div className="min-h-[152px] rounded-lg bg-[#F8FAFC] p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-[#0EA5A4]" />
                  <p className="ui-meta">Queue coordination</p>
                </div>
                <p className="mt-2 ui-body">
                  Track tokens, desks, and doctor availability from one place.
                </p>
              </div>
              <div className="min-h-[152px] rounded-lg bg-[#F8FAFC] p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#0EA5A4]" />
                  <p className="ui-meta">Role-based access</p>
                </div>
                <p className="mt-2 ui-body">
                  Give staff, doctors, and admins the right level of access.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
