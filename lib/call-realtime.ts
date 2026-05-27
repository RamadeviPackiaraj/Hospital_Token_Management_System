"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, ApiRequestError } from "@/lib/api";
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
let callSocketConnecting = false;
let lastConnectionError: Error | null = null;
let lastDisconnectTime = 0;
const RECONNECT_COOLDOWN_MS = 500; // Prevent rapid reconnect cycles

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

function logConnectionDebug(message: string, data?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[SocketIO] ${message}`, data);
  }
}

function createSocket() {
  const baseUrl = getCallSocketBaseUrl();
  const path = getCallSocketPath();
  
  logConnectionDebug("Creating socket", { baseUrl, path });

  const socket = io(baseUrl, {
    path,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ["websocket"],
    withCredentials: true,
    // Production-ready options to ensure single instance
    forceNew: false,  // Use existing connection if available
    multiplex: true,  // Allow multiple connections from same client
  });

  socket.on("connect", () => {
    callSocketConnecting = false;
    lastConnectionError = null;
    logConnectionDebug("Socket connected successfully");
  });

  socket.on("connect_error", (error: Error) => {
    callSocketConnecting = false;
    lastConnectionError = error;
    logConnectionDebug("Socket connection error", {
      message: error.message,
      type: error.constructor.name,
      code: (error as any).code,
    });
  });

  socket.on("disconnect", (reason: string) => {
    callSocketConnecting = false;
    // Only track as disconnection for cooldown if it was an active disconnect
    // (not "io client disconnect" which is intentional)
    if (reason !== "io client disconnect") {
      lastDisconnectTime = Date.now();
    }
    logConnectionDebug("Socket disconnected", { reason });
  });

  socket.on("error", (error: unknown) => {
    callSocketConnecting = false;
    logConnectionDebug("Socket error event", error);
  });

  return socket;
}

export function getCallSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!callSocket) {
    callSocket = createSocket();
  }

  return callSocket;
}

export function connectCallSocket() {
  const socket = getCallSocket();
  if (!socket) return null;

  // CRITICAL: Prevent rapid reconnect cycles (React Strict Mode protection)
  const timeSinceLastDisconnect = Date.now() - lastDisconnectTime;
  if (timeSinceLastDisconnect < RECONNECT_COOLDOWN_MS && callSocketConnecting) {
    logConnectionDebug("Reconnect cooldown active, skipping duplicate connection", {
      timeSinceLastDisconnect,
      cooldownMs: RECONNECT_COOLDOWN_MS,
    });
    return socket;
  }

  // Only connect if not already connected or connecting
  if (!socket.connected && !callSocketConnecting) {
    callSocketConnecting = true;
    logConnectionDebug("Attempting to connect socket");
    socket.connect();
  }

  return socket;
}

export function disconnectCallSocket() {
  if (!callSocket) return;

  // CRITICAL: Prevent disconnect during active handshake
  // Socket.io requires full connection cycle to avoid "closed before established" error
  if (callSocketConnecting) {
    logConnectionDebug("Socket still connecting, deferring disconnect");
    
    // Wait for connection to complete or timeout, then disconnect
    const maxRetries = 5;
    let retries = 0;
    const defer = setInterval(() => {
      retries++;
      if (!callSocketConnecting || retries >= maxRetries) {
        clearInterval(defer);
        if (callSocket?.connected) {
          callSocketConnecting = false;
          lastDisconnectTime = Date.now();
          logConnectionDebug("Deferred disconnect now executing");
          callSocket.disconnect();
        }
      }
    }, 100);
    return;
  }

  callSocketConnecting = false;
  lastDisconnectTime = Date.now();
  
  // Only disconnect if actually connected to avoid state conflicts
  if (callSocket.connected) {
    logConnectionDebug("Disconnecting socket");
    callSocket.disconnect();
  } else {
    logConnectionDebug("Socket not connected, skipping disconnect");
  }
}

export function isCallSocketConnected(): boolean {
  return callSocket?.connected ?? false;
}

export function getLastConnectionError(): Error | null {
  return lastConnectionError;
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
    const error = createSocketError(
      "Call socket is unavailable. Backend server may not be running on port 8000.",
      503
    );
    logConnectionDebug("Socket unavailable for event", { event, error });
    return Promise.reject(error);
  }

  if (!socket.connected) {
    logConnectionDebug("Socket not connected, attempting to emit anyway", { event });
  }

  return new Promise<TResponse>((resolve, reject) => {
    // Set up a timeout for the response
    const timeout = setTimeout(() => {
      logConnectionDebug("Socket emit timed out", { event });
      reject(
        createSocketError(
          `Call socket request timeout for event: ${event}. Backend may be unresponsive.`,
          504
        )
      );
    }, 15000); // 15 second timeout

    socket.emit(event, payload, (result: CallAckSuccess<TResponse> | CallAckFailure) => {
      clearTimeout(timeout);

      if (result?.success) {
        logConnectionDebug("Socket emit succeeded", { event });
        resolve(result.data);
        return;
      }

      const errorMessage = result?.error?.message || `Call socket request failed for event: ${event}`;
      logConnectionDebug("Socket emit failed", { event, error: errorMessage });

      reject(
        createSocketError(errorMessage, result?.error?.statusCode || 500)
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
    logConnectionDebug("Cannot register handlers - socket unavailable");
    return () => {};
  }

  logConnectionDebug("Registering realtime handlers", {
    handlers: Object.keys(handlers),
  });

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

  // Return cleanup function
  return () => {
    logConnectionDebug("Unregistering realtime handlers");
    
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
