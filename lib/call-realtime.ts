"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, ApiRequestError, getAuthToken } from "@/lib/api";
import type { ActiveCall, CallLogEntry, OperationalMessageTemplate } from "@/lib/calls";

export const CALL_SOCKET_EVENTS = Object.freeze({
  CONNECTED: "call:connected",
  ERROR: "call:error",
  SUBSCRIBE: "call:subscribe",
  SUBSCRIBED: "call:subscribed",
  ACTIVE_LIST: "call:active:list",
  ACTIVE_RESULT: "call:active",
  LOG_LIST: "call:log:list",
  LOG_RESULT: "call:logs",
  EVENT_LIST: "call:event:list",
  EVENT_RESULT: "call:events",
  TEMPLATE_LIST: "call:message-template:list",
  TEMPLATE_RESULT: "call:message-templates",
  CREATE: "call:create",
  CREATED: "call:created",
  ACKNOWLEDGE: "call:acknowledge",
  UPDATED: "call:updated",
  END: "call:end",
  ENDED: "call:ended",
  EVENT_CREATED: "call:event:created",
  TEMPLATE_CREATE: "call:message-template:create",
  TEMPLATE_CREATED: "call:message-template:created",
  TEMPLATE_UPDATE: "call:message-template:update",
  TEMPLATE_UPDATED: "call:message-template:updated",
  TEMPLATE_DELETE: "call:message-template:delete",
  TEMPLATE_DELETED: "call:message-template:deleted",
} as const);

type CallAckSuccess<T> = { success: true; data: T };
type CallAckFailure = {
  success: false;
  error?: {
    message?: string;
    statusCode?: number;
  };
};

let callSocket: Socket | null = null;

function getCallSocketBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_CALL_SOCKET_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export function getCallSocketPath() {
  return process.env.NEXT_PUBLIC_CALL_SOCKET_PATH || "/call-socket.io";
}

function createSocket() {
  const token = getAuthToken();

  return io(getCallSocketBaseUrl(), {
    path: getCallSocketPath(),
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

export function getCallSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!callSocket) {
    callSocket = createSocket();
  }

  const token = getAuthToken();
  callSocket.auth = token ? { token: `Bearer ${token}` } : {};

  return callSocket;
}

export function connectCallSocket() {
  const socket = getCallSocket();
  if (!socket) return null;

  const token = getAuthToken();
  socket.auth = token ? { token: `Bearer ${token}` } : {};

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectCallSocket() {
  if (!callSocket) return;
  callSocket.disconnect();
}

function createSocketError(message: string, statusCode?: number) {
  return new ApiRequestError(message, { status: statusCode, path: "/calls/socket" });
}

export function emitCallEvent<TResponse, TPayload extends object = Record<string, unknown>>(
  event: string,
  payload: TPayload
) {
  const socket = connectCallSocket();

  if (!socket) {
    return Promise.reject(createSocketError("Call socket is unavailable"));
  }

  return new Promise<TResponse>((resolve, reject) => {
    socket.emit(event, payload, (result: CallAckSuccess<TResponse> | CallAckFailure) => {
      if (result?.success) {
        resolve(result.data);
        return;
      }

      reject(
        createSocketError(
          result?.error?.message || "Call socket request failed",
          result?.error?.statusCode
        )
      );
    });
  });
}

export type CallRealtimeHandlers = {
  onCreated?: (call: ActiveCall) => void;
  onUpdated?: (call: ActiveCall) => void;
  onEnded?: (call: CallLogEntry) => void;
  onTemplateCreated?: (template: OperationalMessageTemplate) => void;
  onTemplateUpdated?: (template: OperationalMessageTemplate) => void;
  onTemplateDeleted?: (payload: { id: string }) => void;
};

export function registerCallRealtimeHandlers(handlers: CallRealtimeHandlers) {
  const socket = connectCallSocket();
  if (!socket) {
    return () => {};
  }

  if (handlers.onCreated) {
    socket.on(CALL_SOCKET_EVENTS.CREATED, handlers.onCreated);
  }
  if (handlers.onUpdated) {
    socket.on(CALL_SOCKET_EVENTS.UPDATED, handlers.onUpdated);
  }
  if (handlers.onEnded) {
    socket.on(CALL_SOCKET_EVENTS.ENDED, handlers.onEnded);
  }
  if (handlers.onTemplateCreated) {
    socket.on(CALL_SOCKET_EVENTS.TEMPLATE_CREATED, handlers.onTemplateCreated);
  }
  if (handlers.onTemplateUpdated) {
    socket.on(CALL_SOCKET_EVENTS.TEMPLATE_UPDATED, handlers.onTemplateUpdated);
  }
  if (handlers.onTemplateDeleted) {
    socket.on(CALL_SOCKET_EVENTS.TEMPLATE_DELETED, handlers.onTemplateDeleted);
  }

  return () => {
    if (handlers.onCreated) {
      socket.off(CALL_SOCKET_EVENTS.CREATED, handlers.onCreated);
    }
    if (handlers.onUpdated) {
      socket.off(CALL_SOCKET_EVENTS.UPDATED, handlers.onUpdated);
    }
    if (handlers.onEnded) {
      socket.off(CALL_SOCKET_EVENTS.ENDED, handlers.onEnded);
    }
    if (handlers.onTemplateCreated) {
      socket.off(CALL_SOCKET_EVENTS.TEMPLATE_CREATED, handlers.onTemplateCreated);
    }
    if (handlers.onTemplateUpdated) {
      socket.off(CALL_SOCKET_EVENTS.TEMPLATE_UPDATED, handlers.onTemplateUpdated);
    }
    if (handlers.onTemplateDeleted) {
      socket.off(CALL_SOCKET_EVENTS.TEMPLATE_DELETED, handlers.onTemplateDeleted);
    }
  };
}
