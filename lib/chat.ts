import type { AuthRole } from "@/lib/auth-flow";

export type ChatSender = "doctor" | "hospital";
export type ChatMessageType = "quick" | "manual";
export type ChatMessageStatus = "read" | "unread";

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: ChatSender;
  message: string;
  type: ChatMessageType;
  createdAt: number;
  isRead: boolean;
  editedAt?: number | null;
  readAt?: number | null;
  doctorId?: string;
  hospitalId?: string;
  doctorUserId?: string;
  hospitalUserId?: string;
  senderUserId?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: Exclude<AuthRole, "admin">;
  subtitle: string;
  status: "pending" | "approved" | "rejected" | "mock";
}

export const QUICK_MESSAGES: Record<Exclude<AuthRole, "admin">, string[]> = {
  doctor: [
    "Patient is ready",
    "Review completed",
    "Prescription shared",
    "Need room update",
    "Tests required",
    "Patient stable",
    "Discharge planned",
    "Urgent consult needed",
    "Follow-up required",
    "Need billing clearance",
    "Please call back",
  ],
  hospital: [
    "Bed assigned",
    "Need approval",
    "Emergency case",
    "Schedule updated",
    "Delay expected",
    "Patient waiting",
    "Lab report ready",
    "Ambulance arrived",
    "Admission confirmed",
    "Please confirm",
  ],
};

const FALLBACK_PARTICIPANTS: Record<Exclude<AuthRole, "admin">, ChatParticipant[]> = {
  doctor: [
    {
      id: "hospital-mock-city-care",
      name: "City Care Hospital",
      role: "hospital",
      subtitle: "Mock hospital conversation",
      status: "mock",
    },
  ],
  hospital: [
    {
      id: "doctor-mock-ananya",
      name: "Dr. Ananya Rao",
      role: "doctor",
      subtitle: "Mock doctor conversation",
      status: "mock",
    },
  ],
};

export function getFallbackParticipants(role: Exclude<AuthRole, "admin">) {
  return FALLBACK_PARTICIPANTS[role];
}

export function normalizeChatIdentity(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getConversationId(left: string, right: string) {
  return [left, right].sort().join("::");
}

export function getSharedConversationId(leftRole: ChatSender, leftName: string, rightRole: ChatSender, rightName: string) {
  return getConversationId(
    `${leftRole}:${normalizeChatIdentity(leftName)}`,
    `${rightRole}:${normalizeChatIdentity(rightName)}`
  );
}

export function createMessage(
  sender: ChatSender,
  message: string,
  type: ChatMessageType,
  conversationId: string,
  isRead = false
): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationId,
    sender,
    message,
    type,
    createdAt: Date.now(),
    isRead,
  };
}

export function mapChatMessageFromApi(message: {
  id: string;
  conversationId: string;
  sender: ChatSender;
  message: string;
  type: ChatMessageType;
  createdAt: string | number | Date;
  isRead: boolean;
  editedAt?: string | number | Date | null;
  readAt?: string | number | Date | null;
  doctorId?: string;
  hospitalId?: string;
  doctorUserId?: string;
  hospitalUserId?: string;
  senderUserId?: string;
}): ChatMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    sender: message.sender,
    message: message.message,
    type: message.type,
    createdAt: new Date(message.createdAt).getTime(),
    isRead: message.isRead,
    editedAt: message.editedAt ? new Date(message.editedAt).getTime() : null,
    readAt: message.readAt ? new Date(message.readAt).getTime() : null,
    doctorId: message.doctorId,
    hospitalId: message.hospitalId,
    doctorUserId: message.doctorUserId,
    hospitalUserId: message.hospitalUserId,
    senderUserId: message.senderUserId,
  };
}

export function formatChatTime(value: number | string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function getStatusLabel(status?: ChatMessageStatus) {
  if (!status) return "";
  return status === "read" ? "Read" : "Unread";
}

export function formatChatDateLabel(value: number | string) {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) return "Today";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
