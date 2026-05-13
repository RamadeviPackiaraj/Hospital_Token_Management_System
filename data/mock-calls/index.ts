import type { ActiveCall, CallLogEntry, HospitalCallTarget, OperationalMessageTemplate } from "@/lib/calls";

export const DEFAULT_CALL_MESSAGES: OperationalMessageTemplate[] = [
  { id: "call-next-patient", label: "Call Next Patient", priority: "routine", source: "predefined" },
  { id: "need-break", label: "I Need a Break", priority: "routine", source: "predefined" },
  { id: "need-nurse-support", label: "I Need Support (Nurse)", priority: "priority", source: "predefined" },
];

export const MOCK_HOSPITAL_TARGETS: HospitalCallTarget[] = [
  { id: "hospital-apollo-chennai", name: "Apollo Specialty Hospital", city: "Chennai" },
  { id: "hospital-care-kochi", name: "Care Medical Centre", city: "Kochi" },
  { id: "hospital-fortis-delhi", name: "Fortis City Hospital", city: "New Delhi" },
];

const now = Date.now();

export const MOCK_ACTIVE_CALLS: ActiveCall[] = [
  {
    id: "call-live-rajesh",
    doctorId: "seed-doctor-rajesh",
    doctorName: "Rajesh Kumar",
    department: "Cardiology",
    hospitalId: "hospital-apollo-chennai",
    hospitalName: "Apollo Specialty Hospital",
    messageId: "need-nurse-support",
    messageLabel: "I Need Support (Nurse)",
    priority: "priority",
    startedAt: now - 1000 * 60 * 6,
    status: "active",
  },
];

export const MOCK_CALL_LOGS: CallLogEntry[] = [
  {
    id: "call-log-1",
    doctorId: "seed-doctor-aisha",
    doctorName: "Dr. Aisha Rahman",
    department: "Radiology",
    hospitalId: "hospital-care-kochi",
    hospitalName: "Care Medical Centre",
    messageId: "call-next-patient",
    messageLabel: "Call Next Patient",
    priority: "routine",
    startedAt: now - 1000 * 60 * 90,
    endedAt: now - 1000 * 60 * 82,
    endedBy: "doctor",
    finalStatus: "completed",
    durationMs: 1000 * 60 * 8,
  },
  {
    id: "call-log-2",
    doctorId: "seed-doctor-vikram",
    doctorName: "Dr. Vikram Menon",
    department: "Orthopedics",
    hospitalId: "hospital-fortis-delhi",
    hospitalName: "Fortis City Hospital",
    messageId: "need-nurse-support",
    messageLabel: "I Need Support (Nurse)",
    priority: "priority",
    startedAt: now - 1000 * 60 * 240,
    endedAt: now - 1000 * 60 * 225,
    endedBy: "hospital",
    finalStatus: "completed",
    durationMs: 1000 * 60 * 15,
  },
  {
    id: "call-log-3",
    doctorId: "seed-doctor-nisha",
    doctorName: "Dr. Nisha Patel",
    department: "General Medicine",
    hospitalId: "hospital-apollo-chennai",
    hospitalName: "Apollo Specialty Hospital",
    messageId: "need-break",
    messageLabel: "I Need a Break",
    priority: "routine",
    startedAt: now - 1000 * 60 * 420,
    endedAt: now - 1000 * 60 * 410,
    endedBy: "doctor",
    finalStatus: "cancelled",
    durationMs: 1000 * 60 * 10,
  },
];
