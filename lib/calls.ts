"use client";

import type { AppLanguage } from "@/lib/i18n";
import { formatDisplayDate } from "@/lib/utils";

export type CallPriority = "routine" | "priority" | "critical";
export type CallFinalStatus = "completed" | "cancelled" | "missed";
export type CallEndedBy = "doctor" | "hospital";
export type CallMessageSource = "predefined" | "custom";

export interface HospitalCallTarget {
  id: string;
  name: string;
  city: string;
  hospitalProfileId?: string;
}

export interface OperationalMessageTemplate {
  id: string;
  label: string;
  priority: CallPriority;
  source: CallMessageSource;
}

export interface ActiveCall {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  hospitalId: string;
  hospitalName: string;
  messageId: string;
  messageLabel: string;
  priority: CallPriority;
  startedAt: number;
  status: "active";
  doctorProfileId?: string;
  hospitalProfileId?: string;
  hospitalUserId?: string;
}

export interface CallLogEntry extends Omit<ActiveCall, "status"> {
  endedAt: number;
  endedBy: CallEndedBy;
  finalStatus: CallFinalStatus;
  durationMs: number;
}

export interface StartCallPayload {
  doctorId: string;
  doctorName: string;
  department: string;
  hospitalId: string;
  hospitalName: string;
  messageId: string;
  messageLabel: string;
  priority: CallPriority;
}

export const CALL_PRIORITY_LABELS: Record<CallPriority, string> = {
  routine: "Routine",
  priority: "Priority",
  critical: "Critical",
};

export const CALL_STATUS_LABELS: Record<CallFinalStatus, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  missed: "Missed",
};

export function getPriorityBadgeVariant(priority: CallPriority) {
  if (priority === "critical") return "error";
  if (priority === "priority") return "warning";
  return "info";
}

export function getFinalStatusBadgeVariant(status: CallFinalStatus) {
  if (status === "completed") return "success";
  if (status === "cancelled") return "warning";
  return "error";
}

export function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatCallDateTime(timestamp: number) {
  return formatDisplayDate(new Date(timestamp).toISOString());
}

export function getActiveDuration(startedAt: number) {
  return formatDuration(Date.now() - startedAt);
}

export function buildVoiceNotificationMessage(call: ActiveCall, language: AppLanguage) {
  const doctorName = call.doctorName;
  const department = call.department;
  const message = call.messageLabel.toLowerCase();

  if (language === "hi") {
    return `${doctorName}, ${department} से, ${message}.`;
  }

  if (language === "ta") {
    return `${department} பிரிவிலிருந்து டாக்டர் ${doctorName}, ${message}.`;
  }

  if (language === "ml") {
    return `${department} വിഭാഗത്തിലെ ഡോക്ടർ ${doctorName}, ${message}.`;
  }

  return `Doctor ${doctorName} from ${department} ${message.toLowerCase()}.`;
}

export function getSpeechLanguage(language: AppLanguage) {
  if (language === "hi") return "hi-IN";
  if (language === "ta") return "ta-IN";
  if (language === "ml") return "ml-IN";
  return "en-IN";
}
