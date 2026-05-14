"use client";

import { create } from "zustand";
import type { MockUser } from "@/lib/auth-flow";
import {
  createCall as createCallRequest,
  createCallMessageTemplate,
  deleteCallMessageTemplate,
  endCall as endCallRequest,
  getActiveCalls,
  getCallBootstrap,
  updateCallMessageTemplate,
} from "@/lib/call-api";
import {
  connectCallSocket,
  disconnectCallSocket,
  registerCallRealtimeHandlers,
} from "@/lib/call-realtime";
import type {
  ActiveCall,
  CallEndedBy,
  CallFinalStatus,
  CallLogEntry,
  HospitalCallTarget,
  OperationalMessageTemplate,
  StartCallPayload,
} from "@/lib/calls";

type CallStoreState = {
  activeCalls: ActiveCall[];
  callLogs: CallLogEntry[];
  doctorTargets: Record<string, HospitalCallTarget[]>;
  customMessagesByDoctor: Record<string, OperationalMessageTemplate[]>;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  bootstrapUserId: string | null;
  realtimeUserId: string | null;
  bootstrap: (currentUser: MockUser) => Promise<void>;
  connectRealtime: (currentUser: MockUser) => void;
  disconnectRealtime: () => void;
  reset: () => void;
  startCall: (payload: StartCallPayload) => Promise<ActiveCall | null>;
  endCall: (callId: string, endedBy: CallEndedBy, finalStatus?: CallFinalStatus) => Promise<void>;
  getMessagesForDoctor: (doctorId: string) => OperationalMessageTemplate[];
  getTargetsForDoctor: (doctorId: string) => HospitalCallTarget[];
  addCustomMessage: (
    doctorId: string,
    message: Pick<OperationalMessageTemplate, "label">
  ) => Promise<void>;
  updateCustomMessage: (
    doctorId: string,
    messageId: string,
    updates: Partial<Pick<OperationalMessageTemplate, "label">>
  ) => Promise<void>;
  deleteCustomMessage: (doctorId: string, messageId: string) => Promise<void>;
  reorderCustomMessage: (doctorId: string, messageId: string, direction: "up" | "down") => void;
};

function sortActiveCalls(calls: ActiveCall[]) {
  return [...calls].sort((left, right) => right.startedAt - left.startedAt);
}

function sortCallLogs(calls: CallLogEntry[]) {
  return [...calls].sort((left, right) => right.endedAt - left.endedAt);
}

const EMPTY_DOCTOR_MESSAGES: OperationalMessageTemplate[] = [];
const EMPTY_DOCTOR_TARGETS: HospitalCallTarget[] = [];

function createDefaultState() {
  return {
    activeCalls: [],
    callLogs: [],
    doctorTargets: {},
    customMessagesByDoctor: {},
    isLoading: false,
    isRealtimeConnected: false,
    bootstrapUserId: null,
    realtimeUserId: null,
  };
}

function upsertActiveCall(calls: ActiveCall[], nextCall: ActiveCall) {
  return sortActiveCalls([
    nextCall,
    ...calls.filter((call) => call.id !== nextCall.id),
  ]);
}

function removeActiveCall(calls: ActiveCall[], callId: string) {
  return calls.filter((call) => call.id !== callId);
}

function upsertCallLog(logs: CallLogEntry[], nextLog: CallLogEntry) {
  return sortCallLogs([
    nextLog,
    ...logs.filter((log) => log.id !== nextLog.id),
  ]);
}

function upsertDoctorMessage(
  messages: OperationalMessageTemplate[],
  nextMessage: OperationalMessageTemplate
) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex === -1) {
    return [...messages, nextMessage];
  }

  const nextMessages = [...messages];
  nextMessages[existingIndex] = nextMessage;
  return nextMessages;
}

function getDoctorMessages(
  customMessagesByDoctor: Record<string, OperationalMessageTemplate[]>,
  doctorId: string
) {
  return customMessagesByDoctor[doctorId] ?? EMPTY_DOCTOR_MESSAGES;
}

function getDoctorTargets(
  doctorTargets: Record<string, HospitalCallTarget[]>,
  doctorId: string
) {
  return doctorTargets[doctorId] ?? EMPTY_DOCTOR_TARGETS;
}

export function selectDoctorMessages(doctorId: string) {
  return (state: CallStoreState) => getDoctorMessages(state.customMessagesByDoctor, doctorId);
}

export function selectDoctorTargets(doctorId: string) {
  return (state: CallStoreState) => getDoctorTargets(state.doctorTargets, doctorId);
}

let realtimeCleanup: (() => void) | null = null;

async function materializePredefinedMessages(
  messages: OperationalMessageTemplate[],
  overrides: Partial<Record<string, Pick<OperationalMessageTemplate, "label"> | null>> = {}
) {
  const nextDefinitions = messages
    .map((message) => {
      const override = overrides[message.id];
      if (override === null) {
        return null;
      }

      return {
        label: override?.label || message.label,
      };
    })
    .filter(Boolean) as Array<Pick<OperationalMessageTemplate, "label">>;

  const createdTemplates: OperationalMessageTemplate[] = [];
  for (const definition of nextDefinitions) {
    const created = await createCallMessageTemplate(definition);
    createdTemplates.push(created);
  }

  return createdTemplates;
}

export const useCallStore = create<CallStoreState>()((set, get) => ({
  ...createDefaultState(),

  bootstrap: async (currentUser) => {
    set({ isLoading: true });

    try {
      const data = await getCallBootstrap();
      set((state) => ({
        ...state,
        isLoading: false,
        bootstrapUserId: currentUser.id,
        activeCalls: sortActiveCalls(data.activeCalls || []),
        callLogs: sortCallLogs(data.callLogs || []),
        doctorTargets:
          currentUser.role === "doctor"
            ? {
                ...state.doctorTargets,
                [currentUser.id]: data.targets || [],
              }
            : state.doctorTargets,
        customMessagesByDoctor:
          currentUser.role === "doctor"
            ? {
                ...state.customMessagesByDoctor,
                [currentUser.id]: data.messages || [],
              }
            : state.customMessagesByDoctor,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  connectRealtime: (currentUser) => {
    if (typeof window === "undefined") return;
    if (get().realtimeUserId === currentUser.id && get().isRealtimeConnected) {
      return;
    }

    if (realtimeCleanup) {
      realtimeCleanup();
      realtimeCleanup = null;
    }

    connectCallSocket();

    realtimeCleanup = registerCallRealtimeHandlers({
      onCreated: (call) =>
        set((state) => ({
          activeCalls: upsertActiveCall(state.activeCalls, call),
        })),
      onUpdated: (call) =>
        set((state) => ({
          activeCalls: upsertActiveCall(state.activeCalls, call),
        })),
      onEnded: (call) =>
        set((state) => ({
          activeCalls: removeActiveCall(state.activeCalls, call.id),
          callLogs: upsertCallLog(state.callLogs, call),
        })),
      onTemplateCreated: (template) => {
        if (currentUser.role !== "doctor") return;
        set((state) => ({
          customMessagesByDoctor: {
            ...state.customMessagesByDoctor,
            [currentUser.id]: upsertDoctorMessage(
              getDoctorMessages(state.customMessagesByDoctor, currentUser.id),
              template
            ),
          },
        }));
      },
      onTemplateUpdated: (template) => {
        if (currentUser.role !== "doctor") return;
        set((state) => ({
          customMessagesByDoctor: {
            ...state.customMessagesByDoctor,
            [currentUser.id]: getDoctorMessages(state.customMessagesByDoctor, currentUser.id).map((message) =>
              message.id === template.id ? template : message
            ),
          },
        }));
      },
      onTemplateDeleted: ({ id }) => {
        if (currentUser.role !== "doctor") return;
        set((state) => ({
          customMessagesByDoctor: {
            ...state.customMessagesByDoctor,
            [currentUser.id]: getDoctorMessages(state.customMessagesByDoctor, currentUser.id).filter(
              (message) => message.id !== id
            ),
          },
        }));
      },
    });

    set({
      isRealtimeConnected: true,
      realtimeUserId: currentUser.id,
    });

    void getActiveCalls()
      .then((calls) => {
        set((state) => ({
          activeCalls: sortActiveCalls(
            calls.reduce((nextCalls, call) => upsertActiveCall(nextCalls, call), state.activeCalls)
          ),
        }));
      })
      .catch(() => {
        // Realtime is the primary path; this sync just backfills calls created during startup.
      });
  },

  disconnectRealtime: () => {
    if (realtimeCleanup) {
      realtimeCleanup();
      realtimeCleanup = null;
    }

    disconnectCallSocket();
    set({
      isRealtimeConnected: false,
      realtimeUserId: null,
    });
  },

  reset: () => {
    if (realtimeCleanup) {
      realtimeCleanup();
      realtimeCleanup = null;
    }

    disconnectCallSocket();
    set(createDefaultState());
  },

  startCall: async (payload) => {
    const nextCall = await createCallRequest({
      hospitalId: payload.hospitalId,
      messageId: payload.messageId,
      messageLabel: payload.messageLabel,
      priority: payload.priority,
    });

    if (nextCall) {
      set((state) => ({
        activeCalls: upsertActiveCall(state.activeCalls, nextCall),
      }));
    }

    return nextCall;
  },

  endCall: async (callId, endedBy, finalStatus = "completed") => {
    const nextLog = await endCallRequest({
      callId,
      endedBy,
      finalStatus,
    });

    if (!nextLog) {
      return;
    }

    set((state) => ({
      activeCalls: removeActiveCall(state.activeCalls, callId),
      callLogs: upsertCallLog(state.callLogs, nextLog),
    }));
  },

  getMessagesForDoctor: (doctorId) => getDoctorMessages(get().customMessagesByDoctor, doctorId),

  getTargetsForDoctor: (doctorId) => getDoctorTargets(get().doctorTargets, doctorId),

  addCustomMessage: async (doctorId, message) => {
    const created = await createCallMessageTemplate({
      label: message.label,
    });

    set((state) => ({
      customMessagesByDoctor: {
        ...state.customMessagesByDoctor,
        [doctorId]: upsertDoctorMessage(getDoctorMessages(state.customMessagesByDoctor, doctorId), created),
      },
    }));
  },

  updateCustomMessage: async (doctorId, messageId, updates) => {
    const current = getDoctorMessages(get().customMessagesByDoctor, doctorId).find(
      (message) => message.id === messageId
    );
    if (!current) {
      return;
    }

    if (current.source === "predefined") {
      const baseMessages = getDoctorMessages(get().customMessagesByDoctor, doctorId);
      const materialized = await materializePredefinedMessages(baseMessages, {
        [messageId]: {
          label: updates.label || current.label,
        },
      });

      set((state) => ({
        customMessagesByDoctor: {
          ...state.customMessagesByDoctor,
          [doctorId]: materialized,
        },
      }));
      return;
    }

    // Optimistic update for custom messages
    const optimisticUpdated = {
      ...current,
      label: updates.label || current.label,
    };
    set((state) => ({
      customMessagesByDoctor: {
        ...state.customMessagesByDoctor,
        [doctorId]: getDoctorMessages(state.customMessagesByDoctor, doctorId).map((message) =>
          message.id === messageId ? optimisticUpdated : message
        ),
      },
    }));

    try {
      const updated = await updateCallMessageTemplate(messageId, {
        label: updates.label || current.label,
      });

      // Update with server response
      set((state) => ({
        customMessagesByDoctor: {
          ...state.customMessagesByDoctor,
          [doctorId]: getDoctorMessages(state.customMessagesByDoctor, doctorId).map((message) =>
            message.id === messageId ? updated : message
          ),
        },
      }));
    } catch (error) {
      // Revert on failure
      set((state) => ({
        customMessagesByDoctor: {
          ...state.customMessagesByDoctor,
          [doctorId]: getDoctorMessages(state.customMessagesByDoctor, doctorId).map((message) =>
            message.id === messageId ? current : message
          ),
        },
      }));
      throw error;
    }
  },

  deleteCustomMessage: async (doctorId, messageId) => {
    const current = getDoctorMessages(get().customMessagesByDoctor, doctorId).find(
      (message) => message.id === messageId
    );
    if (!current) {
      return;
    }

    if (current.source === "predefined") {
      const baseMessages = getDoctorMessages(get().customMessagesByDoctor, doctorId);
      const materialized = await materializePredefinedMessages(baseMessages, {
        [messageId]: null,
      });

      set((state) => ({
        customMessagesByDoctor: {
          ...state.customMessagesByDoctor,
          [doctorId]: materialized,
        },
      }));
      return;
    }

    // Optimistic update for custom messages
    set((state) => ({
      customMessagesByDoctor: {
        ...state.customMessagesByDoctor,
        [doctorId]: getDoctorMessages(state.customMessagesByDoctor, doctorId).filter(
          (message) => message.id !== messageId
        ),
      },
    }));

    try {
      await deleteCallMessageTemplate(messageId);
    } catch (error) {
      // Revert on failure
      set((state) => ({
        customMessagesByDoctor: {
          ...state.customMessagesByDoctor,
          [doctorId]: upsertDoctorMessage(getDoctorMessages(state.customMessagesByDoctor, doctorId), current),
        },
      }));
      throw error;
    }
  },

  reorderCustomMessage: (_doctorId, _messageId, _direction) => {
    // Backend currently preserves insertion order. Reordering is intentionally left as a no-op for now.
  },
}));
