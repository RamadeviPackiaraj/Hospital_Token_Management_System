import { AnimatePresence, motion } from "framer-motion";
import type { PatientTokenRecord } from "@/lib/scheduling-types";
import { useTimer } from "./useTimer";

interface NowCallingSectionProps {
  token: PatientTokenRecord | null;
  nextToken: PatientTokenRecord | null;
  isUpdating: boolean;
}

function formatTokenNumber(tokenNumber: number) {
  return `TOKEN #${String(tokenNumber).padStart(3, "0")}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NowCallingSection({ token, nextToken, isUpdating }: NowCallingSectionProps) {
  const { formatted } = useTimer(token?.id ?? null, token?.status === "CALLING");
  const isActive = token?.status === "CALLING";

  return (
    <section className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1.6fr)_minmax(320px,0.7fr)] gap-6">
      <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/78 shadow-[0_32px_120px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
        <motion.div
          animate={{ opacity: isUpdating ? 0.2 : 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 bg-teal-500/10"
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#14b8a6]" />
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-teal-300/18 blur-3xl" />
        <div className="absolute right-12 top-20 h-24 w-24 rounded-full border border-teal-200/70 bg-white/60" />
        <div className="absolute bottom-10 right-16 h-40 w-40 rounded-full bg-cyan-200/35 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between px-10 py-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-3 rounded-full border border-teal-200 bg-teal-50 px-5 py-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-400" />
              </span>
              <span className="text-[16px] font-medium text-teal-700">Now Calling</span>
            </div>

            <div className="rounded-full border border-slate-200 bg-white/75 px-4 py-2">
              <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-slate-500">Smart Display</p>
            </div>
          </div>

          <div className="flex flex-1 items-center">
            <div className="w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={token?.id ?? "empty"}
                  initial={{ opacity: 0, y: 28, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[12px] font-medium uppercase tracking-[0.32em] text-slate-500">Current Token</p>
                  <motion.h1
                    animate={isActive ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="mt-6 text-[80px] font-medium leading-none text-teal-600 drop-shadow-[0_0_18px_rgba(20,184,166,0.12)]"
                  >
                    {token ? formatTokenNumber(token.tokenNumber) : "TOKEN #---"}
                  </motion.h1>

                  <div className="mt-10 grid grid-cols-[minmax(0,1fr)_240px] gap-8">
                    <div className="space-y-4">
                      <p className="text-[24px] font-medium text-slate-900">
                        {token ? token.patientName : "Waiting for the next patient"}
                      </p>
                      <div className="space-y-2">
                        <p className="text-[14px] text-slate-700">
                          {token ? `Dr. ${token.doctorName}` : "Doctor will appear here"}
                        </p>
                        <p className="text-[14px] text-slate-500">{token ? token.department : "Department pending"}</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/80 bg-white/72 p-5 backdrop-blur-xl">
                      <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-slate-500">Up Next</p>
                      <p className="mt-4 text-[24px] font-medium text-teal-700">
                        {nextToken ? `#${String(nextToken.tokenNumber).padStart(3, "0")}` : "--"}
                      </p>
                      <p className="mt-3 text-[14px] text-slate-700">
                        {nextToken ? nextToken.patientName : "Queue waiting for the next token"}
                      </p>
                      <p className="mt-2 text-[14px] text-slate-500">{nextToken?.department ?? "Waiting hall standby"}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <motion.aside
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/78 p-8 shadow-[0_32px_120px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[#14b8a6]" />
        <div className="absolute right-0 top-0 h-40 w-40 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_72%)]" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-medium text-slate-900">Doctor Panel</p>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-slate-600">
                {isActive ? "Active" : "Idle"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 via-cyan-300 to-emerald-300 text-[24px] font-medium text-slate-950 shadow-[0_18px_40px_rgba(20,184,166,0.20)]">
              {getInitials(token?.doctorName ?? "NA")}
            </div>

            <div className="space-y-2">
              <p className="text-[16px] font-medium text-slate-900">{token ? `Dr. ${token.doctorName}` : "Awaiting doctor"}</p>
              <p className="text-[14px] text-slate-500">{token?.department ?? "Department pending"}</p>
            </div>
          </div>

          <div className="mt-8 space-y-5 rounded-[24px] border border-white/80 bg-white/72 p-6 backdrop-blur-xl">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-slate-500">Patient</p>
              <p className="mt-3 text-[24px] font-medium text-slate-900">{token?.patientName ?? "Waiting for patient"}</p>
            </div>

            <div className="h-px bg-slate-200" />

            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-slate-500">Call Duration</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <p className="text-[20px] font-medium tabular-nums text-teal-700">{formatted}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-[24px] border border-amber-200 bg-amber-50/90 p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-amber-700">Status</p>
            <p className="mt-3 text-[14px] text-amber-900">
              {token ? "Patient should proceed to the consultation room when called." : "Waiting for the next live token."}
            </p>
          </div>
        </div>
      </motion.aside>
    </section>
  );
}
