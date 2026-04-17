import { motion } from "framer-motion";
import { BellRing, CheckCircle2, ClipboardList, Hourglass, Stethoscope, UserRound } from "lucide-react";
import type { PatientTokenRecord } from "@/lib/scheduling-types";

interface QueueListProps {
  tokens: PatientTokenRecord[];
}

function formatTokenNumber(tokenNumber: number) {
  return `#${String(tokenNumber).padStart(3, "0")}`;
}

function getStatusLabel(status: PatientTokenRecord["status"]) {
  if (status === "CALLING") return "Calling";
  if (status === "COMPLETED") return "Completed";
  return "Waiting";
}

function getStatusClasses(status: PatientTokenRecord["status"]) {
  if (status === "CALLING") {
    return "border-teal-200 bg-teal-50 text-teal-700";
  }

  if (status === "COMPLETED") {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getStatusIcon(status: PatientTokenRecord["status"]) {
  if (status === "CALLING") return BellRing;
  if (status === "COMPLETED") return CheckCircle2;
  return Hourglass;
}

export function QueueList({ tokens }: QueueListProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.18 }}
      className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/78 p-8 shadow-[0_32px_120px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[#14b8a6]" />
      <div className="absolute right-0 top-0 h-40 w-40 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_72%)]" />

      <div className="relative flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-teal-600" />
            <p className="text-[16px] font-medium text-slate-900">Queue List</p>
          </div>
          <p className="mt-2 text-[14px] text-slate-500">Upcoming hospital tokens with live queue movement.</p>
        </div>

        <div className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2">
          <span className="text-[12px] font-medium uppercase tracking-[0.24em] text-teal-700">{tokens.length} Tokens</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {tokens.map((token, index) => {
          const isCalling = token.status === "CALLING";
          const StatusIcon = getStatusIcon(token.status);

          return (
            <motion.div
              key={token.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              whileHover={{ y: -2, transition: { duration: 0.18 } }}
              className={`grid grid-cols-[180px_minmax(0,1fr)_220px_150px] items-center gap-4 rounded-[24px] border px-5 py-5 backdrop-blur-xl ${
                isCalling
                  ? "border-l-4 border-teal-400 border-teal-100 bg-[linear-gradient(90deg,rgba(204,251,241,0.95),rgba(255,255,255,0.82))] shadow-[0_18px_50px_rgba(20,184,166,0.10)]"
                  : "border-white/80 bg-white/72"
              }`}
            >
              <div>
                <div className="inline-flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      isCalling ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <p className={`text-[16px] font-medium ${isCalling ? "text-teal-700" : "text-slate-900"}`}>
                    {formatTokenNumber(token.tokenNumber)}
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="truncate text-[14px] text-slate-900">{token.patientName}</p>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="truncate text-[14px] text-slate-500">{token.department}</p>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium ${getStatusClasses(token.status)}`}
                >
                  <StatusIcon className={`h-3.5 w-3.5 ${isCalling ? "animate-pulse" : ""}`} />
                  {getStatusLabel(token.status)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
