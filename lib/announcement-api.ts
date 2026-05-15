import { apiRequest } from "@/lib/api";

export type AnnouncementLanguage = "en" | "ta" | "hi" | "ml";

export interface GenerateAnnouncementPayload {
  tokenNumber: number;
  patientName: string;
  doctorName: string;
  department: string;
  language: AnnouncementLanguage;
  gender?: "male" | "female";
}

export interface GenerateAnnouncementResponse {
  originalText: string;
  translatedText: string;
  language: AnnouncementLanguage;
  cacheKey: string;
  audioUrl: string | null;
}

export async function generateAnnouncement(payload: GenerateAnnouncementPayload) {
  return apiRequest<GenerateAnnouncementResponse>("/generate-announcement", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface GenerateTextAnnouncementPayload {
  text: string;
  language: AnnouncementLanguage;
  gender?: "male" | "female";
}

export async function generateTextAnnouncement(payload: GenerateTextAnnouncementPayload) {
  return apiRequest<GenerateAnnouncementResponse>("/generate-announcement/text", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
