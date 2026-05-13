"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_CALL_MESSAGES, MOCK_ACTIVE_CALLS, MOCK_CALL_LOGS } from "@/data/mock-calls";
import type {
  ActiveCall,
  CallEndedBy,
  CallFinalStatus,
  CallLogEntry,
  OperationalMessageTemplate,
  StartCallPayload,
} from "@/lib/calls";

type CallStoreState = {
  activeCalls: ActiveCall[];
  callLogs: CallLogEntry[];
  customMessagesByDoctor: Record<string, OperationalMessageTemplate[]>;
  startCall: (payload: StartCallPayload) => ActiveCall;
  endCall: (callId: string, endedBy: CallEndedBy, finalStatus?: CallFinalStatus) => void;
  getMessagesForDoctor: (doctorId: string) => OperationalMessageTemplate[];
  addCustomMessage: (doctorId: string, message: Omit<OperationalMessageTemplate, "id" | "source">) => void;
  updateCustomMessage: (doctorId: string, messageId: string, updates: Partial<Pick<OperationalMessageTemplate, "label" | "priority">>) => void;
  deleteCustomMessage: (doctorId: string, messageId: string) => void;
  reorderCustomMessage: (doctorId: string, messageId: string, direction: "up" | "down") => void;
};

const MAX_DOCTOR_MESSAGES = 3;

function sortActiveCalls(calls: ActiveCall[]) {
  return [...calls].sort((left, right) => right.startedAt - left.startedAt);
}

function sortCallLogs(calls: CallLogEntry[]) {
  return [...calls].sort((left, right) => right.endedAt - left.endedAt);
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultMessageSet() {
  return DEFAULT_CALL_MESSAGES.map((message) => ({ ...message }));
}

function getDoctorManagedMessages(messagesByDoctor: Record<string, OperationalMessageTemplate[]>, doctorId: string) {
  const customMessages = messagesByDoctor[doctorId];
  if (customMessages?.length) {
    return customMessages.slice(0, MAX_DOCTOR_MESSAGES).map((message) => ({ ...message }));
  }

  return createDefaultMessageSet();
}

export const CALL_STORE_KEY = "call-workflow-storage";

export const useCallStore = create<CallStoreState>()(
  persist(
    (set, get) => ({
      activeCalls: MOCK_ACTIVE_CALLS,
      callLogs: MOCK_CALL_LOGS,
      customMessagesByDoctor: {},
      startCall: (payload) => {
        const nextCall: ActiveCall = {
          id: createId("call"),
          ...payload,
          startedAt: Date.now(),
          status: "active",
        };

        set((state) => ({
          activeCalls: sortActiveCalls([nextCall, ...state.activeCalls]),
        }));

        return nextCall;
      },
      endCall: (callId, endedBy, finalStatus = "completed") =>
        set((state) => {
          const matched = state.activeCalls.find((call) => call.id === callId);
          if (!matched) {
            return state;
          }

          const endedAt = Date.now();
          const nextLog: CallLogEntry = {
            ...matched,
            endedAt,
            endedBy,
            finalStatus,
            durationMs: Math.max(0, endedAt - matched.startedAt),
          };

          return {
            activeCalls: state.activeCalls.filter((call) => call.id !== callId),
            callLogs: sortCallLogs([nextLog, ...state.callLogs]),
          };
        }),
      getMessagesForDoctor: (doctorId) => getDoctorManagedMessages(get().customMessagesByDoctor, doctorId),
      addCustomMessage: (doctorId, message) =>
        set((state) => {
          const current = getDoctorManagedMessages(state.customMessagesByDoctor, doctorId).map((item) => ({
            ...item,
            source: "custom" as const,
          }));

          if (current.length >= MAX_DOCTOR_MESSAGES) {
            return state;
          }

          return {
            customMessagesByDoctor: {
              ...state.customMessagesByDoctor,
              [doctorId]: [
                ...current,
                {
                  id: createId("custom-call-message"),
                  label: message.label,
                  priority: message.priority,
                  source: "custom",
                },
              ],
            },
          };
        }),
      updateCustomMessage: (doctorId, messageId, updates) =>
        set((state) => {
          const baseMessages = getDoctorManagedMessages(state.customMessagesByDoctor, doctorId);
          const nextMessages = baseMessages.map((message) =>
            message.id === messageId ? { ...message, ...updates, source: "custom" as const } : { ...message, source: "custom" as const }
          );

          return {
            customMessagesByDoctor: {
              ...state.customMessagesByDoctor,
              [doctorId]: nextMessages,
            },
          };
        }),
      deleteCustomMessage: (doctorId, messageId) =>
        set((state) => {
          const baseMessages = getDoctorManagedMessages(state.customMessagesByDoctor, doctorId);
          const nextMessages = baseMessages
            .filter((message) => message.id !== messageId)
            .map((message) => ({ ...message, source: "custom" as const }));

          return {
            customMessagesByDoctor: {
              ...state.customMessagesByDoctor,
              [doctorId]: nextMessages,
            },
          };
        }),
      reorderCustomMessage: (doctorId, messageId, direction) =>
        set((state) => {
          const items = getDoctorManagedMessages(state.customMessagesByDoctor, doctorId).map((message) => ({
            ...message,
            source: "custom" as const,
          }));
          const currentIndex = items.findIndex((message) => message.id === messageId);
          if (currentIndex < 0) {
            return state;
          }

          const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
          if (targetIndex < 0 || targetIndex >= items.length) {
            return state;
          }

          const [item] = items.splice(currentIndex, 1);
          items.splice(targetIndex, 0, item);

          return {
            customMessagesByDoctor: {
              ...state.customMessagesByDoctor,
              [doctorId]: items,
            },
          };
        }),
    }),
    {
      name: CALL_STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeCalls: state.activeCalls,
        callLogs: state.callLogs,
        customMessagesByDoctor: state.customMessagesByDoctor,
      }),
    }
  )
);
