"use client";

import * as React from "react";
import { MessageSquareMore, Stethoscope } from "lucide-react";
import { ChatContainer } from "@/components/chat";
import { useDashboardContext } from "@/components/dashboard";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Badge, Card } from "@/components/ui";
import { apiRequest, buildQuery } from "@/lib/api";
import { CHAT_STORAGE_KEY, useChatStore } from "@/lib/chat-store";
import { getSelectionsForDoctor } from "@/lib/dashboard-data";
import {
  QUICK_MESSAGES,
  getFallbackParticipants,
  getSharedConversationId,
  type ChatParticipant,
} from "@/lib/chat";
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
    ? {
        empty: "No hospitals linked yet. Showing mock chat data until backend chat is connected.",
      }
    : {
        empty: "No doctors linked yet. Showing mock chat data until backend chat is connected.",
      };
}

function getStatusVariant(status: ChatParticipant["status"]) {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "neutral";
}

function formatParticipantSubtitle(participant: ChatParticipant) {
  if (participant.status === "mock") return participant.subtitle;
  return `${participant.role === "doctor" ? "Doctor" : "Hospital"} | ${participant.subtitle}`;
}

function isApprovedParticipant(participant: ChatParticipant | null) {
  return participant?.status === "approved" || participant?.status === "mock";
}

function getActorDisplayName(role: Exclude<AuthRole, "admin">, currentUser: MockUser) {
  if (role === "hospital") {
    return currentUser.hospitalName || currentUser.fullName || currentUser.id;
  }

  return currentUser.fullName || currentUser.id;
}

function getConversationKey(
  role: Exclude<AuthRole, "admin">,
  currentUser: MockUser,
  participant: ChatParticipantView
) {
  return getSharedConversationId(
    role,
    getActorDisplayName(role, currentUser),
    participant.role,
    participant.name || participant.id
  );
}

export default function DashboardChatPage() {
  const { currentUser } = useDashboardContext();
  const [participants, setParticipants] = React.useState<ChatParticipantView[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "read" | "unread">("all");
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const editMessage = useChatStore((state) => state.editMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const markConversationAsRead = useChatStore((state) => state.markConversationAsRead);

  const role: Exclude<AuthRole, "admin"> | null = currentUser.role === "admin" ? null : currentUser.role;
  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId) ?? null;
  const selectedConversationId =
    role && selectedParticipant ? getConversationKey(role, currentUser, selectedParticipant) : "";

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
            apiRequest<{ items: HospitalDirectoryItem[] }>(`/hospitals${buildQuery({ status: "approved", limit: 100 })}`),
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
          setParticipants(approvedParticipants.length ? approvedParticipants : getFallbackParticipants(activeRole));
          return;
        }

        const approvedResponse = await apiRequest<{ doctors: Array<Omit<HospitalDoctorRequest, "status">> }>(
          `/hospitals/${currentUser.id}/approved-doctors`
        );

        const approvedParticipants = (approvedResponse.doctors || []).map((doctor) => ({
          id: doctor.userId || doctor.id || doctor.name,
          name: doctor.name,
          role: "doctor" as const,
          subtitle: doctor.department || "Connected doctor",
          status: "approved" as const,
        }));

        if (!active) return;
        setParticipants(approvedParticipants.length ? approvedParticipants : getFallbackParticipants(activeRole));
      } catch {
        if (!active) return;
        setParticipants(getFallbackParticipants(activeRole));
      }
    }

    void loadParticipants();

    return () => {
      active = false;
    };
  }, [currentUser.id, role]);

  React.useEffect(() => {
    if (!role || !participants.length) return;

    setSelectedParticipantId((current) => {
      if (current && participants.some((participant) => participant.id === current)) {
        return current;
      }

      return participants[0]?.id || "";
    });
  }, [participants, role]);

  const currentMessages = React.useMemo(() => {
    if (!selectedConversationId) return [];
    return messages.filter((message) => message.conversationId === selectedConversationId);
  }, [messages, selectedConversationId]);

  React.useEffect(() => {
    if (!role || !selectedConversationId) return;
    markConversationAsRead(selectedConversationId, role);
  }, [currentMessages, markConversationAsRead, role, selectedConversationId]);

  function sendMessage(message: string, type: "quick" | "manual") {
    if (!role || !selectedParticipant || !message.trim() || !isApprovedParticipant(selectedParticipant)) return;

    addMessage({
      conversationId: selectedConversationId,
      sender: role,
      message: message.trim(),
      type,
    });
    setDraft("");
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    deleteMessage(deleteTargetId);
    setDeleteTargetId(null);
  }

  function handleSaveEdit(messageId: string, value: string) {
    editMessage(messageId, value);
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
    const matchesFilter =
      filter === "all" || (filter === "read" ? message.isRead : !message.isRead);
    const matchesSearch = !search.trim() || message.message.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const copy = getRoleCopy(role);
  const isApproved = isApprovedParticipant(selectedParticipant);
  const unreadCount = currentMessages.filter((message) => message.sender !== role && !message.isRead).length;
  const disableReason =
    !isApproved && selectedParticipant
      ? "Messaging is enabled only when the hospital connection is approved."
      : "";

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
              const participantConversationId = role ? getConversationKey(role, currentUser, participant) : "";
              const participantUnreadCount = messages.filter(
                (message) =>
                  message.conversationId === participantConversationId &&
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
            subtitle={`Shared frontend chat with ${selectedParticipant.name}`}
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
        description="This frontend-only delete removes the message from the shared chat store."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
}
