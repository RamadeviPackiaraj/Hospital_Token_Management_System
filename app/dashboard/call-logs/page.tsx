"use client";

import { FileClock } from "lucide-react";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { CallLogsTable } from "@/components/call-logs/CallLogsTable";
import { useCallStore } from "@/store/callStore";

export default function CallLogsPage() {
  const { currentUser } = useDashboardContext();
  const logs = useCallStore((state) => state.callLogs);

  const scopedLogs = logs.filter((log) => {
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "doctor") {
      return log.doctorId === currentUser.id || log.doctorName === currentUser.displayFullName || log.doctorName === currentUser.fullName;
    }
    return true;
  });

  return (
    <section className="space-y-6">
      <PageHero
        title="Call Logs"
        description="Review doctor to hospital call history in a simple readable format."
        icon={<FileClock className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
        imageAlt="Call log records"
        stats={[
          { label: "Entries", value: String(scopedLogs.length) },
          { label: "Completed", value: String(scopedLogs.filter((log) => log.finalStatus === "completed").length) },
          { label: "Missed", value: String(scopedLogs.filter((log) => log.finalStatus === "missed").length) },
        ]}
      />
      <CallLogsTable logs={scopedLogs} />
    </section>
  );
}
