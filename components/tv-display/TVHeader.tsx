import { motion } from "framer-motion";

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

      <div className="relative flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-slate-500">Current Date</p>
          <p className="text-[16px] font-medium text-slate-900">{currentDate}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-full border border-teal-200 bg-teal-50 px-4 py-2 md:flex md:items-center md:gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[12px] font-medium uppercase tracking-[0.24em] text-teal-700">Live Feed</span>
          </div>

          <div className="space-y-2 text-right">
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-slate-500">Live Clock</p>
            <p className="text-[16px] font-medium tabular-nums text-slate-900">{currentTime}</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
