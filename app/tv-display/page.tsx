"use client";

import * as React from "react";
import { NowCallingSection, QueueList, TVHeader } from "@/components/tv-display";
import { getPatientTokens } from "@/lib/schedule-api";
import type { PatientTokenRecord } from "@/lib/scheduling-types";

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
    date: "2026-04-16",
    time: "09:00 AM",
    status: "CALLING",
    createdAt: "2026-04-16T09:00:00.000Z",
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
    date: "2026-04-16",
    time: "09:15 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-16T09:15:00.000Z",
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
    date: "2026-04-16",
    time: "09:30 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-16T09:30:00.000Z",
  },
  {
    id: "tv-token-4",
    tokenNumber: 4,
    patientName: "Kiran Rao",
    dob: "1968-01-18",
    bloodGroup: "AB+",
    aadhaar: "",
    contact: "9999999994",
    department: "Dermatology",
    doctorName: "Sonal Shah",
    date: "2026-04-16",
    time: "09:45 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-16T09:45:00.000Z",
  },
  {
    id: "tv-token-5",
    tokenNumber: 5,
    patientName: "Farah Khan",
    dob: "1991-05-30",
    bloodGroup: "A-",
    aadhaar: "",
    contact: "9999999995",
    department: "ENT",
    doctorName: "Rahul Bedi",
    date: "2026-04-16",
    time: "10:00 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-16T10:00:00.000Z",
  },
  {
    id: "tv-token-6",
    tokenNumber: 6,
    patientName: "Suresh Iyer",
    dob: "1983-09-11",
    bloodGroup: "O-",
    aadhaar: "",
    contact: "9999999996",
    department: "General Medicine",
    doctorName: "Neha Verma",
    date: "2026-04-16",
    time: "10:15 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-16T10:15:00.000Z",
  },
  {
    id: "tv-token-7",
    tokenNumber: 7,
    patientName: "Lakshmi Devi",
    dob: "1959-12-03",
    bloodGroup: "B-",
    aadhaar: "",
    contact: "9999999997",
    department: "Ophthalmology",
    doctorName: "Harish Menon",
    date: "2026-04-16",
    time: "10:30 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-16T10:30:00.000Z",
  },
  {
    id: "tv-token-8",
    tokenNumber: 8,
    patientName: "Nitin Das",
    dob: "1986-06-27",
    bloodGroup: "AB-",
    aadhaar: "",
    contact: "9999999998",
    department: "Pediatrics",
    doctorName: "Pooja Rao",
    date: "2026-04-16",
    time: "10:45 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-16T10:45:00.000Z",
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
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function TVDisplayPage() {
  const [now, setNow] = React.useState(() => new Date());
  const [tokens, setTokens] = React.useState<PatientTokenRecord[]>(() => sortTokens(MOCK_TOKENS));
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [usingMockData, setUsingMockData] = React.useState(true);
  const [demoMode, setDemoMode] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

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
      setIsUpdating(true);
      setActiveIndex((current) => (current + 1) % tokens.length);
    }, 8000);

    return () => {
      window.clearInterval(rotationTimer);
    };
  }, [tokens, usingMockData]);

  React.useEffect(() => {
    if (!isUpdating) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsUpdating(false);
    }, 550);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isUpdating]);

  const displayTokens = React.useMemo(() => {
    if (tokens.length === 0) {
      return [];
    }

    return usingMockData ? applySimulation(tokens, activeIndex) : tokens;
  }, [activeIndex, tokens, usingMockData]);

  const currentToken =
    displayTokens.find((token) => token.status === "CALLING") || displayTokens[0] || null;
  const currentTokenIndex = currentToken ? displayTokens.findIndex((token) => token.id === currentToken.id) : -1;
  const nextToken =
    currentTokenIndex >= 0
      ? displayTokens.slice(currentTokenIndex + 1).find((token) => token.status !== "COMPLETED") || null
      : displayTokens.find((token) => token.status === "NOT_STARTED") || null;

  return (
    <main className="h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_42%,#f8fafc_100%)] p-6 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_24%)]" />
      <div className="relative mx-auto flex h-full max-w-[1800px] flex-col space-y-6">
        <TVHeader currentDate={formatDisplayDate(now)} currentTime={formatDisplayTime(now)} />

        <div className="min-h-0 flex-1">
          <NowCallingSection token={currentToken} nextToken={nextToken} isUpdating={isUpdating} />
        </div>

        <div className="min-h-0 flex-[1.15]">
          <QueueList tokens={displayTokens.slice(0, 10)} />
        </div>
      </div>
    </main>
  );
}
