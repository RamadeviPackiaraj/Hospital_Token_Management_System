"use client";

import * as React from "react";
import { MessageSquareMore, Stethoscope } from "lucide-react";
import { ChatContainer } from "@/components/chat";
import { useDashboardContext } from "@/components/dashboard";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Badge, Card } from "@/components/ui";
import { apiRequest, buildQuery } from "@/lib/api";
import {
  CHAT_SOCKET_EVENTS,
  clearSocketConversation,
  connectChatSocket,
  createSocketMessage,
  deleteSocketMessage,
  mapSocketMessage,
  markSocketConversationRead,
  subscribeToConversation,
  unsubscribeFromConversation,
  updateSocketMessage,
  type ChatClearedPayload,
  type ChatConversationContext,
  type ChatMessagePayload,
  type ChatReadPayload,
  type ChatSocketStatus,
} from "@/lib/chat-realtime";
import { CHAT_STORAGE_KEY, useChatStore } from "@/lib/chat-store";
import { getSelectionsForDoctor } from "@/lib/dashboard-data";
import { QUICK_MESSAGES, type ChatParticipant } from "@/lib/chat";
import type { AuthRole, MockUser } from "@/lib/auth-flow";

type ChatParticipantView = ChatParticipant;

type HospitalDirectoryItem = {
  id: string;
  userId?: string;
  name: string;
};

type HospitalDoctorRequest = {
  id?: string;
  userId?: string;
  name: string;
  department?: string;
  status: "pending" | "approved" | "rejected";
};

function getRoleCopy(role: Exclude<AuthRole, "admin">) {
  return role === "doctor"
    ? { empty: "No approved hospital connections are available yet." }
    : { empty: "No approved doctor connections are available yet." };
}

function getStatusVariant(status: ChatParticipant["status"]) {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "neutral";
}

function formatParticipantSubtitle(participant: ChatParticipant) {
  return `${participant.role === "doctor" ? "Doctor" : "Hospital"} | ${participant.subtitle}`;
}

function isApprovedParticipant(participant: ChatParticipant | null) {
  return participant?.status === "approved";
}

function getChatContext(
  role: Exclude<AuthRole, "admin">,
  currentUser: MockUser,
  participant: ChatParticipantView
): ChatConversationContext {
  return {
    doctorId: role === "doctor" ? currentUser.id : participant.id,
    hospitalId: role === "doctor" ? participant.id : currentUser.id,
  };
}

function createConversationPayload(
  context: ChatConversationContext,
  conversationId?: string
): ChatConversationContext {
  return {
    doctorId: context.doctorId,
    hospitalId: context.hospitalId,
    conversationId,
  };
}

function createSubscriptionPayload(
  context: ChatConversationContext,
  conversationId?: string
): ChatConversationContext & { query?: Record<string, unknown> } {
  return {
    doctorId: context.doctorId,
    hospitalId: context.hospitalId,
    conversationId,
    query: {
      conversationId,
      limit: 100,
    },
  };
}

function messageMatchesContext(
  message: {
    conversationId: string;
    doctorId?: string;
    hospitalId?: string;
    doctorUserId?: string;
    hospitalUserId?: string;
  },
  context: ChatConversationContext
) {
  const doctorMatches =
    message.doctorId === context.doctorId || message.doctorUserId === context.doctorId;
  const hospitalMatches =
    message.hospitalId === context.hospitalId || message.hospitalUserId === context.hospitalId;

  return doctorMatches && hospitalMatches;
}

export default function DashboardChatPage() {
  const { currentUser } = useDashboardContext();
  const [participants, setParticipants] = React.useState<ChatParticipantView[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "read" | "unread">("all");
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [clearRequested, setClearRequested] = React.useState(false);
  const [socketStatus, setSocketStatus] = React.useState<ChatSocketStatus>("idle");

  const messages = useChatStore((state) => state.messages);
  const replaceConversationMessages = useChatStore((state) => state.replaceConversationMessages);
  const upsertMessage = useChatStore((state) => state.upsertMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const markConversationAsRead = useChatStore((state) => state.markConversationAsRead);
  const clearConversation = useChatStore((state) => state.clearConversation);

  const role: Exclude<AuthRole, "admin"> | null = currentUser.role === "admin" ? null : currentUser.role;
  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId) ?? null;
  const selectedContext =
    role && selectedParticipant && isApprovedParticipant(selectedParticipant)
      ? getChatContext(role, currentUser, selectedParticipant)
      : null;

  const currentMessages = React.useMemo(() => {
    if (!selectedContext) return [];

    return messages.filter((message) => messageMatchesContext(message, selectedContext));
  }, [messages, selectedContext]);

  const selectedConversationId = currentMessages[0]?.conversationId || "";

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStore = () => {
      void useChatStore.persist.rehydrate();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== CHAT_STORAGE_KEY) return;
      syncStore();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncStore();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  React.useEffect(() => {
    if (!role) return;

    const activeRole = role;
    let active = true;

    async function loadParticipants() {
      try {
        if (activeRole === "doctor") {
          const [directory, selections] = await Promise.all([
            apiRequest<{ items: HospitalDirectoryItem[] }>(
              `/hospitals${buildQuery({ status: "approved", limit: 100 })}`
            ),
            getSelectionsForDoctor(currentUser.id),
          ]);

          const hospitalNameMap = new Map<string, string>(
            (directory.items || []).flatMap((hospital) => {
              const keys = [hospital.id, hospital.userId].filter(Boolean) as string[];
              return keys.map((key) => [key, hospital.name] as const);
            })
          );

          const approvedParticipants = selections
            .filter((selection) => selection.status === "approved")
            .map((selection) => ({
              id: selection.hospitalId,
              name: selection.hospitalName || hospitalNameMap.get(selection.hospitalId) || "Hospital",
              role: "hospital" as const,
              subtitle: "Approved connection",
              status: "approved" as const,
            }));

          if (!active) return;
          setParticipants(approvedParticipants);
          return;
        }

        const approvedResponse = await apiRequest<{ doctors: Array<Omit<HospitalDoctorRequest, "status">> }>(
          `/hospitals/${currentUser.id}/approved-doctors`
        );

        const approvedParticipants = (approvedResponse.doctors || []).map((doctor) => ({
          id: doctor.id || doctor.userId || doctor.name,
          name: doctor.name,
          role: "doctor" as const,
          subtitle: doctor.department || "Connected doctor",
          status: "approved" as const,
        }));

        if (!active) return;
        setParticipants(approvedParticipants);
      } catch {
        if (!active) return;
        setParticipants([]);
      }
    }

    void loadParticipants();

    return () => {
      active = false;
    };
  }, [currentUser.id, role]);

  React.useEffect(() => {
    if (!participants.length) {
      setSelectedParticipantId("");
      return;
    }

    const selectedExists = participants.some((participant) => participant.id === selectedParticipantId);
    if (!selectedExists) {
      setSelectedParticipantId(participants[0]?.id || "");
    }
  }, [participants, selectedParticipantId]);

  React.useEffect(() => {
    if (!role) return;

    const socket = connectChatSocket();
    if (!socket) return;

    const handleConnect = () => setSocketStatus("connected");
    const handleDisconnect = () => setSocketStatus("disconnected");
    const handleError = () => setSocketStatus("error");
    const handleMessageCreated = (payload: ChatMessagePayload) => upsertMessage(mapSocketMessage(payload));
    const handleMessageUpdated = (payload: ChatMessagePayload) => upsertMessage(mapSocketMessage(payload));
    const handleMessageDeleted = (payload: { id: string }) => removeMessage(payload.id);
    const handleReadUpdated = (payload: ChatReadPayload) => {
      markConversationAsRead(
        payload.conversationId,
        payload.readerRole,
        payload.readAt ? new Date(payload.readAt).getTime() : Date.now()
      );
    };
    const handleConversationCleared = (payload: ChatClearedPayload) => {
      clearConversation(payload.conversationId);
    };

    setSocketStatus(socket.connected ? "connected" : "connecting");
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);
    socket.on(CHAT_SOCKET_EVENTS.ERROR, handleError);
    socket.on(CHAT_SOCKET_EVENTS.MESSAGE_CREATED, handleMessageCreated);
    socket.on(CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(CHAT_SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(CHAT_SOCKET_EVENTS.CONVERSATION_READ_UPDATED, handleReadUpdated);
    socket.on(CHAT_SOCKET_EVENTS.CONVERSATION_CLEARED, handleConversationCleared);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.off(CHAT_SOCKET_EVENTS.ERROR, handleError);
      socket.off(CHAT_SOCKET_EVENTS.MESSAGE_CREATED, handleMessageCreated);
      socket.off(CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(CHAT_SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(CHAT_SOCKET_EVENTS.CONVERSATION_READ_UPDATED, handleReadUpdated);
      socket.off(CHAT_SOCKET_EVENTS.CONVERSATION_CLEARED, handleConversationCleared);
    };
  }, [clearConversation, markConversationAsRead, removeMessage, role, upsertMessage]);

  React.useEffect(() => {
    if (!selectedContext || !selectedParticipant || !isApprovedParticipant(selectedParticipant)) return;

    const context: ChatConversationContext = {
      doctorId: selectedContext.doctorId,
      hospitalId: selectedContext.hospitalId,
    };
    let active = true;
    const socket = connectChatSocket();
    if (!socket) return;

    async function subscribe() {
      try {
        setSocketStatus((current) => (current === "connected" ? current : "connecting"));
        const payload = createSubscriptionPayload(context, selectedConversationId || undefined);
        const data = await subscribeToConversation(payload);

        if (!active) return;
        replaceConversationMessages(
          data.conversationId,
          data.items.map((item) => mapSocketMessage(item))
        );
      } catch (error) {
        console.error("Failed to subscribe to conversation:", error);
        setSocketStatus("error");
      }
    }

    const handleConnect = () => {
      void subscribe();
    };

    socket.on("connect", handleConnect);
    if (socket.connected) {
      void subscribe();
    }

    return () => {
      active = false;
      socket.off("connect", handleConnect);
      const payload = createConversationPayload(context, selectedConversationId || undefined);
      void unsubscribeFromConversation(payload).catch(() => undefined);
    };
  }, [replaceConversationMessages, selectedContext, selectedConversationId, selectedParticipant]);

  React.useEffect(() => {
    if (!role || !selectedContext || !selectedConversationId) return;

    const context = createConversationPayload(selectedContext, selectedConversationId);
    const hasUnreadIncoming = currentMessages.some((message) => message.sender !== role && !message.isRead);
    if (!hasUnreadIncoming) return;

    void markSocketConversationRead(context).catch((error) => {
      console.error("Failed to mark conversation as read:", error);
    });
  }, [currentMessages, role, selectedContext, selectedConversationId]);

  function sendMessage(message: string, type: "quick" | "manual") {
    if (!selectedContext || !selectedParticipant || !message.trim() || !isApprovedParticipant(selectedParticipant)) {
      return;
    }

    const context = createConversationPayload(selectedContext, selectedConversationId || undefined);

    void createSocketMessage({
      ...context,
      message: message.trim(),
      type,
    }).catch((error) => {
      console.error("Failed to send message:", error);
    });

    setDraft("");
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;

    void deleteSocketMessage({ id: deleteTargetId }).catch((error) => {
      console.error("Failed to delete message:", error);
    });
    setDeleteTargetId(null);
  }

  function handleSaveEdit(messageId: string, value: string) {
    void updateSocketMessage({ id: messageId, message: value }).catch((error) => {
      console.error("Failed to update message:", error);
    });
  }

  function handleClearConversation() {
    if (!selectedContext || !selectedConversationId) return;

    const context = createConversationPayload(selectedContext, selectedConversationId);

    void clearSocketConversation(context).catch((error) => {
      console.error("Failed to clear conversation:", error);
    });

    setClearRequested(false);
  }

  if (!role) {
    return (
      <Card className="p-4">
        <p className="ui-section-title">Chat Module</p>
        <p className="mt-2 ui-body-secondary">Chat is available for doctor and hospital dashboards only.</p>
      </Card>
    );
  }

  const visibleMessages = currentMessages.filter((message) => {
    const matchesFilter = filter === "all" || (filter === "read" ? message.isRead : !message.isRead);
    const matchesSearch = !search.trim() || message.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const copy = getRoleCopy(role);
  const isApproved = isApprovedParticipant(selectedParticipant);
  const unreadCount = currentMessages.filter((message) => message.sender !== role && !message.isRead).length;
  const disableReason =
    !isApproved && selectedParticipant ? "Messaging is enabled only when the connection is approved." : "";

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0EA5A4]">
                <MessageSquareMore className="size-4" />
              </div>
              <p className="text-[16px] font-medium text-[#0F172A]">Contacts</p>
            </div>
            <Badge variant="neutral">{participants.length}</Badge>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {participants.map((participant) => {
              const participantContext = getChatContext(role, currentUser, participant);
              const participantUnreadCount = messages.filter(
                (message) =>
                  messageMatchesContext(message, participantContext) &&
                  message.sender !== role &&
                  !message.isRead
              ).length;

              return (
                <button
                  key={participant.id}
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left transition ${
                    selectedParticipantId === participant.id
                      ? "border-[#0EA5A4] bg-[#F0FDFA]"
                      : "border-[#E2E8F0] bg-white hover:border-[#0EA5A4]"
                  }`}
                  onClick={() => setSelectedParticipantId(participant.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0EA5A4]">
                        <Stethoscope className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-medium text-[#0F172A]">{participant.name}</p>
                        <p className="mt-1 text-[12px] text-[#64748B]">{formatParticipantSubtitle(participant)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {participantUnreadCount ? <Badge variant="warning">{participantUnreadCount}</Badge> : null}
                      <Badge variant={getStatusVariant(participant.status)}>{participant.status}</Badge>
                    </div>
                  </div>
                </button>
              );
            })}

            {!participants.length ? <p className="ui-body-secondary">{copy.empty}</p> : null}
          </div>
        </Card>

        {selectedParticipant ? (
          <ChatContainer
            title={`${currentUser.role === "doctor" ? "Doctor" : "Hospital"} Activity Log`}
            subtitle={`Realtime chat with ${selectedParticipant.name}`}
            messages={visibleMessages}
            quickMessages={QUICK_MESSAGES[role]}
            currentSender={role}
            draft={draft}
            onDraftChange={setDraft}
            onSendManual={() => sendMessage(draft, "manual")}
            onSendQuick={(message) => sendMessage(message, "quick")}
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            onDelete={setDeleteTargetId}
            onSaveEdit={handleSaveEdit}
            disabled={!isApproved}
            disabledMessage={disableReason}
            unreadCount={unreadCount}
            socketStatus={socketStatus}
            onClear={selectedConversationId ? () => setClearRequested(true) : undefined}
            clearDisabled={!selectedConversationId || !currentMessages.length}
          />
        ) : (
          <Card className="flex min-h-[560px] items-center justify-center p-4">
            <p className="ui-body-secondary">{copy.empty}</p>
          </Card>
        )}
      </div>

      <ConfirmationDialog
        open={Boolean(deleteTargetId)}
        title="Delete Message"
        description="This will delete the message in the backend conversation."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmationDialog
        open={clearRequested}
        title="Clear Conversation"
        description="This will remove all messages in the current doctor-hospital conversation."
        confirmLabel="Clear chat"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleClearConversation}
        onCancel={() => setClearRequested(false)}
      />
    </>
  );
}
