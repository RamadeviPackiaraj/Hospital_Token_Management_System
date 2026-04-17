"use client";

import * as React from "react";
import { CalendarDays, Clock3, Hospital, Stethoscope, Ticket } from "lucide-react";
import { useTimer } from "@/components/tv-display";
import { getPatientTokens } from "@/lib/schedule-api";
import type { PatientTokenRecord } from "@/lib/scheduling-types";

// Mock tokens with more entries for queue display
const MOCK_TOKENS: PatientTokenRecord[] = [
  {
    id: "tv-token-1",
    tokenNumber: 1,
    patientName: "Asha Patel",
    dob: "1988-03-14",
    bloodGroup: "B+",
    aadhaar: "",
    contact: "9999999991",
    department: "Cardiology",
    doctorName: "Rohan Mehta",
    date: "2026-04-17",
    time: "09:00 AM",
    status: "CALLING",
    createdAt: "2026-04-17T09:00:00.000Z",
  },
  {
    id: "tv-token-2",
    tokenNumber: 2,
    patientName: "Priya Nair",
    dob: "1994-07-22",
    bloodGroup: "A+",
    aadhaar: "",
    contact: "9999999992",
    department: "Orthopedics",
    doctorName: "Anil Kumar",
    date: "2026-04-17",
    time: "09:15 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T09:15:00.000Z",
  },
  {
    id: "tv-token-3",
    tokenNumber: 3,
    patientName: "Vikram Singh",
    dob: "1979-11-08",
    bloodGroup: "O+",
    aadhaar: "",
    contact: "9999999993",
    department: "Neurology",
    doctorName: "Meera Joseph",
    date: "2026-04-17",
    time: "09:30 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T09:30:00.000Z",
  },
  {
    id: "tv-token-4",
    tokenNumber: 4,
    patientName: "Rajesh Kumar",
    dob: "1985-05-12",
    bloodGroup: "AB+",
    aadhaar: "",
    contact: "9999999994",
    department: "Dermatology",
    doctorName: "Priya Sharma",
    date: "2026-04-17",
    time: "09:45 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T09:45:00.000Z",
  },
  {
    id: "tv-token-5",
    tokenNumber: 5,
    patientName: "Neha Gupta",
    dob: "1990-08-19",
    bloodGroup: "B-",
    aadhaar: "",
    contact: "9999999995",
    department: "ENT",
    doctorName: "Dr. Sanjay Patel",
    date: "2026-04-17",
    time: "10:00 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T10:00:00.000Z",
  },
  {
    id: "tv-token-6",
    tokenNumber: 6,
    patientName: "Arjun Singh",
    dob: "1988-12-25",
    bloodGroup: "O-",
    aadhaar: "",
    contact: "9999999996",
    department: "Pediatrics",
    doctorName: "Dr. Anitha Singh",
    date: "2026-04-17",
    time: "10:15 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T10:15:00.000Z",
  },
  {
    id: "tv-token-7",
    tokenNumber: 7,
    patientName: "Meera Joshi",
    dob: "1992-03-07",
    bloodGroup: "A-",
    aadhaar: "",
    contact: "9999999997",
    department: "Gynecology",
    doctorName: "Dr. Neelam Joshi",
    date: "2026-04-17",
    time: "10:30 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T10:30:00.000Z",
  },
  {
    id: "tv-token-8",
    tokenNumber: 8,
    patientName: "Sanjay Verma",
    dob: "1986-01-14",
    bloodGroup: "B+",
    aadhaar: "",
    contact: "9999999998",
    department: "Cardiology",
    doctorName: "Dr. Rohan Mehta",
    date: "2026-04-17",
    time: "10:45 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T10:45:00.000Z",
  },
  {
    id: "tv-token-9",
    tokenNumber: 9,
    patientName: "Kavya Desai",
    dob: "1995-06-20",
    bloodGroup: "AB-",
    aadhaar: "",
    contact: "9999999999",
    department: "Orthopedics",
    doctorName: "Dr. Anil Kumar",
    date: "2026-04-17",
    time: "11:00 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T11:00:00.000Z",
  },
  {
    id: "tv-token-10",
    tokenNumber: 10,
    patientName: "Arun Malik",
    dob: "1980-09-08",
    bloodGroup: "O+",
    aadhaar: "",
    contact: "9999999900",
    department: "Neurology",
    doctorName: "Dr. Meera Joseph",
    date: "2026-04-17",
    time: "11:15 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T11:15:00.000Z",
  },
];

function getTodayDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sortTokens(tokens: PatientTokenRecord[]) {
  return [...tokens].sort((left, right) => left.tokenNumber - right.tokenNumber);
}

function applySimulation(tokens: PatientTokenRecord[], activeIndex: number) {
  return tokens.map((token, index) => {
    let status: PatientTokenRecord["status"] = "NOT_STARTED";

    if (index < activeIndex) {
      status = "COMPLETED";
    } else if (index === activeIndex) {
      status = "CALLING";
    }

    return {
      ...token,
      status,
    };
  });
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDisplayTime(date: Date) {
  const timeString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);

  // Split time and AM/PM
  const parts = timeString.split(" ");
  const time = parts[0];
  const period = parts[1];

  return { time, period };
}

function parseTimeString(timeStr: string | undefined) {
  if (!timeStr) return { time: "Not available", period: "" };
  
  // Check if time already has AM/PM
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const parts = timeStr.split(" ");
    return { time: parts[0], period: parts[1] || "" };
  }
  
  // If no AM/PM, try to parse 24-hour format and convert to 12-hour
  const timeParts = timeStr.split(":");
  if (timeParts.length >= 2) {
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const period = hours >= 12 ? "PM" : "AM";
    
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
    
    return { time: `${hours}:${minutes}`, period };
  }
  
  return { time: timeStr, period: "" };
}

function getStatusText(status?: PatientTokenRecord["status"]) {
  if (status === "CALLING") return "Now Calling";
  if (status === "COMPLETED") return "Completed";
  return "Waiting";
}

// Voice Announcement System
function speakToken(token: PatientTokenRecord) {
  // Check if browser supports Speech Synthesis
  if (!window.speechSynthesis) {
    console.warn("Speech Synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Create announcement message
  const message = `Token number ${token.tokenNumber}, ${token.patientName}, please proceed to doctor ${token.doctorName}`;

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.0; // Normal pitch
  utterance.volume = 1.0; // Full volume

  // Speak the announcement
  window.speechSynthesis.speak(utterance);

  // Repeat announcement after 2.5 seconds
  setTimeout(() => {
    if (window.speechSynthesis) {
      const repeatUtterance = new SpeechSynthesisUtterance(message);
      repeatUtterance.rate = 0.9;
      repeatUtterance.pitch = 1.0;
      repeatUtterance.volume = 1.0;
      window.speechSynthesis.speak(repeatUtterance);
    }
  }, 2500);
}

function formatTokenNumber(tokenNumber?: number) {
  if (!tokenNumber) return "TOKEN #---";
  return `TOKEN #${String(tokenNumber).padStart(3, "0")}`;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-[#E2E8F0] px-6 py-5 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
          {icon}
        </div>
        <span className="text-[16px] font-medium leading-6 text-[#0F172A]">{label}</span>
      </div>
      <p className="mt-2 ml-12 text-[18px] font-normal leading-7 text-[#0F172A]">{value}</p>
    </div>
  );
}

export default function TVDisplayPage() {
  const [now, setNow] = React.useState<Date | null>(null);
  const [tokens, setTokens] = React.useState<PatientTokenRecord[]>(() => sortTokens(MOCK_TOKENS));
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [usingMockData, setUsingMockData] = React.useState(true);
  const [demoMode, setDemoMode] = React.useState(false);
  const previousTokenRef = React.useRef<PatientTokenRecord | null>(null);

  // Initialize date after hydration on client
  React.useEffect(() => {
    setNow(new Date());
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDemoMode(params.get("demo") === "1");
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  React.useEffect(() => {
    if (demoMode) {
      setTokens(sortTokens(MOCK_TOKENS));
      setActiveIndex(0);
      setUsingMockData(true);
      return;
    }

    let isMounted = true;

    async function loadTokens() {
      try {
        const liveTokens = await getPatientTokens({ date: getTodayDateKey(new Date()) });

        if (!isMounted || liveTokens.length === 0) {
          return;
        }

        const sortedTokens = sortTokens(liveTokens).slice(0, 10);
        const currentLiveIndex = Math.max(
          sortedTokens.findIndex((token) => token.status === "CALLING"),
          0
        );

        setTokens(sortedTokens);
        setActiveIndex(currentLiveIndex);
        setUsingMockData(false);
      } catch {
        if (!isMounted) {
          return;
        }

        setTokens(sortTokens(MOCK_TOKENS));
        setActiveIndex(0);
        setUsingMockData(true);
      }
    }

    void loadTokens();

    const poller = window.setInterval(() => {
      void loadTokens();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(poller);
    };
  }, [demoMode]);

  React.useEffect(() => {
    if (!usingMockData || tokens.length === 0) {
      return;
    }

    const rotationTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % tokens.length);
    }, 8000);

    return () => {
      window.clearInterval(rotationTimer);
    };
  }, [tokens, usingMockData]);

  const displayTokens = React.useMemo(() => {
    if (tokens.length === 0) {
      return [];
    }

    return usingMockData ? applySimulation(tokens, activeIndex) : tokens;
  }, [activeIndex, tokens, usingMockData]);

  const currentToken =
    displayTokens.find((token) => token.status === "CALLING") || displayTokens[0] || null;

  const { formatted } = useTimer(currentToken?.id ?? null, currentToken?.status === "CALLING");

  // Voice Announcement Effect
  React.useEffect(() => {
    if (
      currentToken &&
      currentToken.status === "CALLING" &&
      previousTokenRef.current?.id !== currentToken.id
    ) {
      // Delay announcement for smooth UX
      const announcementTimer = setTimeout(() => {
        speakToken(currentToken);
      }, 500);

      previousTokenRef.current = currentToken;

      return () => {
        clearTimeout(announcementTimer);
      };
    }
  }, [currentToken]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6 text-[#0F172A]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <section className="rounded-[18px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-panel">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <CalendarDays className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">Date</p>
              </div>
              <p className="mt-4 text-[32px] font-medium leading-10 text-[#0F172A]">
                {formatDisplayDate(now || new Date())}
              </p>
            </div>

            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <Clock3 className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">Time</p>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <p className="text-[32px] font-medium leading-10 text-[#0F172A]">
                  {formatDisplayTime(now || new Date()).time}
                </p>
                <span className="text-[16px] font-semibold leading-6 text-[#0EA5A4]">
                  {formatDisplayTime(now || new Date()).period}
                </span>
              </div>
            </div>

            <div className="col-span-2 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-6 lg:col-span-1">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <Clock3 className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">Call Duration</p>
              </div>
              <p className="mt-4 text-[32px] font-medium leading-10 text-[#0F172A]">{formatted}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#0EA5A4] bg-[#FFFFFF] p-8 shadow-panel">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[14px] font-medium uppercase tracking-[0.12em] text-[#64748B]">
                {getStatusText(currentToken?.status)}
              </p>
              <h1 className="mt-4 text-[88px] font-medium leading-none text-[#0EA5A4]">
                {formatTokenNumber(currentToken?.tokenNumber)}
              </h1>
            </div>

            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#CCFBF1] bg-[#F0FDFA] text-[#0EA5A4]">
              <Ticket className="h-12 w-12" />
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#E2E8F0] bg-[#FFFFFF] shadow-panel">
          <div className="border-b border-[#E2E8F0] px-6 py-5">
            <h2 className="text-[24px] font-medium leading-8 text-[#0F172A]">Patient Details</h2>
          </div>

          <div className="overflow-hidden">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Patient Name</th>
                  <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Doctor</th>
                  <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Department</th>
                  <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Contact</th>
                  <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Visit Date</th>
                  <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Scheduled Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E2E8F0]">
                  <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                    {currentToken?.patientName ?? "Waiting for next patient"}
                  </td>
                  <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                    {currentToken ? `Dr. ${currentToken.doctorName}` : "Not available"}
                  </td>
                  <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                    {currentToken?.department ?? "Not available"}
                  </td>
                  <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                    {currentToken?.contact ?? "Not available"}
                  </td>
                  <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                    {currentToken?.date ?? formatDisplayDate(now || new Date())}
                  </td>
                  <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                    <div className="flex items-baseline gap-2">
                      <span>{parseTimeString(currentToken?.time).time}</span>
                      {parseTimeString(currentToken?.time).period && (
                        <span className="text-[14px] font-semibold text-[#0EA5A4]">
                          {parseTimeString(currentToken?.time).period}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
