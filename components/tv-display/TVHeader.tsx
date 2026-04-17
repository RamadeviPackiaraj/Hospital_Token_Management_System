import { motion } from "framer-motion";
import { Activity, Building2, CalendarDays, Clock3, Sparkles } from "lucide-react";

interface TVHeaderProps {
  currentDate: string;
  currentTime: string;
}

export function TVHeader({ currentDate, currentTime }: TVHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/80 px-8 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[#14b8a6]" />
      <div className="absolute left-0 top-0 h-full w-40 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14),transparent_72%)]" />
      <div className="absolute right-0 top-0 h-full w-40 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.10),transparent_72%)]" />

      <div className="relative flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#0f766e,#22d3ee)] text-white shadow-[0_20px_50px_rgba(20,184,166,0.28)]">
            <Building2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Queue Display
            </div>
            <p className="text-[24px] font-semibold tracking-tight text-slate-900">Hospital Token Management</p>
            <p className="text-[14px] text-slate-500">Live outpatient calling screen with real-time queue movement.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-full border border-teal-200 bg-teal-50 px-4 py-2 md:flex md:items-center md:gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[12px] font-medium uppercase tracking-[0.24em] text-teal-700">Live Feed</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays className="h-4 w-4 text-teal-600" />
                <p className="text-[11px] font-medium uppercase tracking-[0.24em]">Current Date</p>
              </div>
              <p className="mt-2 text-[16px] font-semibold text-slate-900">{currentDate}</p>
            </div>

            <div className="rounded-[20px] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock3 className="h-4 w-4 text-cyan-600" />
                <p className="text-[11px] font-medium uppercase tracking-[0.24em]">Live Clock</p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[16px] font-semibold tabular-nums text-slate-900">{currentTime}</p>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
