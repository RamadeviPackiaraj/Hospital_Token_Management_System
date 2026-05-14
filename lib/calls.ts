"use client";

import type { AppLanguage } from "@/lib/i18n";
import { formatDisplayDate } from "@/lib/utils";

export type CallPriority = "routine" | "priority" | "critical";
export type CallFinalStatus = "completed" | "cancelled" | "missed";
export type CallEndedBy = "doctor" | "hospital";
export type CallMessageSource = "predefined" | "custom";
export type CallDisplayStatus = CallFinalStatus | "active";

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

const CALL_STATUS_TRANSLATIONS: Record<CallFinalStatus, Partial<Record<AppLanguage, string>>> = {
  completed: {
    ta: "முடிந்தது",
    hi: "पूर्ण",
    ml: "പൂർത്തിയായി",
  },
  cancelled: {
    ta: "ரத்து செய்யப்பட்டது",
    hi: "रद्द",
    ml: "റദ്ദാക്കി",
  },
  missed: {
    ta: "தவறியது",
    hi: "छूटी",
    ml: "നഷ്ടപ്പെട്ടു",
  },
};

const ACTIVE_STATUS_TRANSLATIONS: Partial<Record<AppLanguage, string>> = {
  en: "Active",
  ta: "செயலில்",
  hi: "सक्रिय",
  ml: "സജീവം",
};

const CALL_MESSAGE_TRANSLATIONS: Record<string, Partial<Record<AppLanguage, string>>> = {
  ineedabreak: {
    ta: "எனக்கு ஒரு இடைவேளை வேண்டும்",
    hi: "मुझे एक विराम चाहिए",
    ml: "എനിക്ക് ഒരു ഇടവേള വേണം",
  },
  ineedsupportnurse: {
    ta: "எனக்கு செவிலியர் உதவி வேண்டும்",
    hi: "मुझे नर्स की सहायता चाहिए",
    ml: "എനിക്ക് നഴ്സിന്റെ സഹായം വേണം",
  },
  callnextpatient: {
    ta: "அடுத்த நோயாளியை அழைக்கவும்",
    hi: "अगले मरीज को बुलाइए",
    ml: "അടുത്ത രോഗിയെ വിളിക്കൂ",
  },
};

const DEPARTMENT_TRANSLATIONS: Record<string, Partial<Record<AppLanguage, string>>> = {
  cardiology: {
    ta: "இதய நோய் பிரிவு",
    hi: "हृदय रोग विभाग",
    ml: "ഹൃദയ വിഭാഗം",
  },
  generalmedicine: {
    ta: "பொது மருத்துவம்",
    hi: "सामान्य चिकित्सा",
    ml: "ജനറൽ മെഡിസിൻ",
  },
  general_medicine: {
    ta: "பொது மருத்துவம்",
    hi: "सामान्य चिकित्सा",
    ml: "ജനറൽ മെഡിസിൻ",
  },
};

function normalizeCallText(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

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

export function localizeCallMessageLabel(label: string, language: AppLanguage) {
  if (language === "en") {
    return label;
  }

  return CALL_MESSAGE_TRANSLATIONS[normalizeCallText(label)]?.[language] || label;
}

export function localizeCallDepartmentLabel(department: string, language: AppLanguage) {
  if (language === "en") {
    return department;
  }

  return DEPARTMENT_TRANSLATIONS[normalizeCallText(department)]?.[language] || department;
}

export function localizeCallStatusLabel(status: CallFinalStatus, language: AppLanguage) {
  if (language === "en") {
    return CALL_STATUS_LABELS[status];
  }

  return CALL_STATUS_TRANSLATIONS[status]?.[language] || CALL_STATUS_LABELS[status];
}

export function localizeDisplayCallStatusLabel(status: CallDisplayStatus, language: AppLanguage) {
  if (status === "active") {
    return ACTIVE_STATUS_TRANSLATIONS[language] || ACTIVE_STATUS_TRANSLATIONS.en || "Active";
  }

  return localizeCallStatusLabel(status, language);
}

export function getDisplayCallStatusBadgeVariant(status: CallDisplayStatus) {
  if (status === "active") return "info";
  return getFinalStatusBadgeVariant(status);
}

export function buildVoiceNotificationMessage(call: ActiveCall, language: AppLanguage) {
  const doctorName = call.doctorName;
  const department = localizeCallDepartmentLabel(call.department, language);
  const message = localizeCallMessageLabel(call.messageLabel, language);

  if (language === "hi") {
    return `${department} से डॉक्टर ${doctorName}: ${message}.`;
  }

  if (language === "ta") {
    return `${department} பிரிவிலிருந்து டாக்டர் ${doctorName}: ${message}.`;
  }

  if (language === "ml") {
    return `${department} വിഭാഗത്തിലെ ഡോക്ടർ ${doctorName}: ${message}.`;
  }

  return `Doctor ${doctorName} from ${department}: ${message}.`;
}

export function getSpeechLanguage(language: AppLanguage) {
  if (language === "hi") return "hi-IN";
  if (language === "ta") return "ta-IN";
  if (language === "ml") return "ml-IN";
  return "en-IN";
}
