"use client";

import { FileClock } from "lucide-react";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { CallLogsTable } from "@/components/call-logs/CallLogsTable";
import { useI18n } from "@/components/i18n";
import { useCallStore } from "@/store/callStore";
import type { ActiveCall, CallLogEntry } from "@/lib/calls";

const callLogsPageCopy = {
  en: {
    title: "Call Logs",
    description: "See recent call history.",
    entries: "Entries",
    completed: "Completed",
    missed: "Missed",
  },
  ta: {
    title: "அழைப்பு பதிவுகள்",
    description: "மருத்துவரிடமிருந்து மருத்துவமனைக்கு சென்ற அழைப்பு வரலாற்றை எளிதாகப் பார்வையிடுங்கள்.",
    entries: "பதிவுகள்",
    completed: "முடிந்தது",
    missed: "தவறியது",
  },
  hi: {
    title: "कॉल लॉग",
    description: "डॉक्टर से अस्पताल कॉल इतिहास को सरल पठनीय रूप में देखें।",
    entries: "प्रविष्टियाँ",
    completed: "पूर्ण",
    missed: "छूटी",
  },
  ml: {
    title: "കോൾ ലോഗുകൾ",
    description: "ഡോക്ടറിൽ നിന്ന് ആശുപത്രിയിലേക്കുള്ള കോൾ ചരിത്രം ലളിതമായി പരിശോധിക്കുക.",
    entries: "എൻട്രികൾ",
    completed: "പൂർത്തിയായി",
    missed: "മിസ് ചെയ്തു",
  },
} as const;

export default function CallLogsPage() {
  const { currentUser } = useDashboardContext();
  const { language } = useI18n();
  const copy = callLogsPageCopy[language] || callLogsPageCopy.en;
  const logs = useCallStore((state) => state.callLogs);
  const activeCalls = useCallStore((state) => state.activeCalls);

  const scopedLogs = logs.filter((log) => {
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "doctor") {
      return log.doctorId === currentUser.id || log.doctorName === currentUser.displayFullName || log.doctorName === currentUser.fullName;
    }
    return true;
  });

  const scopedActiveCalls = activeCalls.filter((call) => {
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "doctor") {
      return call.doctorId === currentUser.id || call.doctorName === currentUser.displayFullName || call.doctorName === currentUser.fullName;
    }
    return true;
  });

  const logEntries: Array<CallLogEntry | ActiveCall> = [...scopedActiveCalls, ...scopedLogs];

  return (
    <section className="space-y-6">
      <PageHero
        title={copy.title}
        description={copy.description}
        icon={<FileClock className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
        imageAlt="Call log records"
        stats={[
          { label: copy.entries, value: String(logEntries.length) },
          { label: copy.completed, value: String(scopedLogs.filter((log) => log.finalStatus === "completed").length) },
          { label: copy.missed, value: String(scopedLogs.filter((log) => log.finalStatus === "missed").length) },
        ]}
      />
      <CallLogsTable logs={scopedLogs} activeCalls={scopedActiveCalls} language={language} />
    </section>
  );
}
