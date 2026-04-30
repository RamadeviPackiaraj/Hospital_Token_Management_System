"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, ApiRequestError, getAuthToken } from "@/lib/api";
import type { ChatMessage, ChatMessageType, ChatSender } from "@/lib/chat";
import { mapChatMessageFromApi } from "@/lib/chat";

export const CHAT_SOCKET_EVENTS = Object.freeze({
  CONNECTED: "chat:connected",
  ERROR: "chat:error",
  SUBSCRIBE: "chat:subscribe",
  SUBSCRIBED: "chat:subscribed",
  UNSUBSCRIBE: "chat:unsubscribe",
  UNSUBSCRIBED: "chat:unsubscribed",
  MESSAGES_LIST: "chat:messages:list",
  MESSAGES_RESULT: "chat:messages",
  MESSAGE_CREATE: "chat:message:create",
  MESSAGE_CREATED: "chat:message:created",
  MESSAGE_UPDATE: "chat:message:update",
  MESSAGE_UPDATED: "chat:message:updated",
  MESSAGE_DELETE: "chat:message:delete",
  MESSAGE_DELETED: "chat:message:deleted",
  CONVERSATION_READ: "chat:conversation:read",
  CONVERSATION_READ_UPDATED: "chat:conversation:read:updated",
  CONVERSATION_CLEAR: "chat:conversation:clear",
  CONVERSATION_CLEARED: "chat:conversation:cleared",
} as const);

export type ChatSocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface ChatMessagePayload {
  id: string;
  conversationId: string;
  sender: ChatSender;
  message: string;
  type: ChatMessageType;
  createdAt: string;
  isRead: boolean;
  editedAt?: string | null;
  readAt?: string | null;
  doctorId: string;
  hospitalId: string;
  doctorUserId: string;
  hospitalUserId: string;
  senderUserId: string;
}

export interface ChatConversationPayload {
  conversationId: string;
  doctorId: string;
  hospitalId: string;
  doctorUserId?: string;
  hospitalUserId?: string;
}

export interface ChatReadPayload extends ChatConversationPayload {
  updated: number;
  readerRole: ChatSender;
  readAt?: string | null;
}

export interface ChatClearedPayload extends ChatConversationPayload {
  deleted: number;
}

export interface ChatMessagesResponse {
  items: ChatMessagePayload[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  conversationId: string;
  doctorId: string;
  hospitalId: string;
}

export interface ChatConversationContext {
  doctorId: string;
  hospitalId: string;
  conversationId?: string;
}

type ChatAckSuccess<T> = { success: true; data: T };
type ChatAckFailure = {
  success: false;
  error?: {
    message?: string;
    statusCode?: number;
  };
};

let chatSocket: Socket | null = null;

function getSocketBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  return API_BASE_URL.replace(/\/api\/?$/, "");
}

function createSocket() {
  const token = getAuthToken();

  return io(getSocketBaseUrl(), {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: token ? { token: `Bearer ${token}` } : undefined,
  });
}

export function getChatSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!chatSocket) {
    chatSocket = createSocket();
  }

  const token = getAuthToken();
  chatSocket.auth = token ? { token: `Bearer ${token}` } : {};

  return chatSocket;
}

export function connectChatSocket() {
  const socket = getChatSocket();
  if (!socket) return null;

  const token = getAuthToken();
  socket.auth = token ? { token: `Bearer ${token}` } : {};

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectChatSocket() {
  if (!chatSocket) return;
  chatSocket.disconnect();
}

export function mapSocketMessage(message: ChatMessagePayload): ChatMessage {
  return mapChatMessageFromApi(message);
}

function createSocketError(message: string, statusCode?: number) {
  return new ApiRequestError(message, { status: statusCode, path: "/chat/socket" });
}

export function emitChatEvent<TResponse, TPayload extends object = Record<string, unknown>>(
  event: string,
  payload: TPayload
) {
  const socket = connectChatSocket();

  if (!socket) {
    return Promise.reject(createSocketError("Chat socket is unavailable"));
  }

  return new Promise<TResponse>((resolve, reject) => {
    socket.emit(event, payload, (result: ChatAckSuccess<TResponse> | ChatAckFailure) => {
      if (result?.success) {
        resolve(result.data);
        return;
      }

      reject(
        createSocketError(
          result?.error?.message || "Chat socket request failed",
          result?.error?.statusCode
        )
      );
    });
  });
}

export function subscribeToConversation(
  payload: ChatConversationContext & { query?: Record<string, unknown> }
) {
  return emitChatEvent<ChatMessagesResponse, ChatConversationContext & { query?: Record<string, unknown> }>(
    CHAT_SOCKET_EVENTS.SUBSCRIBE,
    payload
  );
}

export function unsubscribeFromConversation(payload: ChatConversationContext) {
  return emitChatEvent<ChatConversationPayload, ChatConversationContext>(
    CHAT_SOCKET_EVENTS.UNSUBSCRIBE,
    payload
  );
}

export function createSocketMessage(payload: {
  doctorId: string;
  hospitalId: string;
  conversationId?: string;
  message: string;
  type: ChatMessageType;
}) {
  return emitChatEvent<
    ChatMessagePayload,
    {
      doctorId: string;
      hospitalId: string;
      conversationId?: string;
      message: string;
      type: ChatMessageType;
    }
  >(CHAT_SOCKET_EVENTS.MESSAGE_CREATE, payload);
}

export function updateSocketMessage(payload: { id: string; message: string }) {
  return emitChatEvent<ChatMessagePayload, { id: string; message: string }>(
    CHAT_SOCKET_EVENTS.MESSAGE_UPDATE,
    payload
  );
}

export function deleteSocketMessage(payload: { id: string }) {
  return emitChatEvent<ChatConversationPayload & { id: string }, { id: string }>(
    CHAT_SOCKET_EVENTS.MESSAGE_DELETE,
    payload
  );
}

export function markSocketConversationRead(payload: ChatConversationContext) {
  return emitChatEvent<ChatReadPayload, ChatConversationContext>(
    CHAT_SOCKET_EVENTS.CONVERSATION_READ,
    payload
  );
}

export function clearSocketConversation(payload: ChatConversationContext) {
  return emitChatEvent<ChatClearedPayload, ChatConversationContext>(
    CHAT_SOCKET_EVENTS.CONVERSATION_CLEAR,
    payload
  );
}
