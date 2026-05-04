"use client";

import * as React from "react";
import { MessageSquareMore, Stethoscope } from "lucide-react";
import { ChatContainer } from "@/components/chat";
import { useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
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
import { type ChatParticipant } from "@/lib/chat";
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

function getStatusVariant(status: ChatParticipant["status"]) {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "neutral";
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
  const { language } = useI18n();
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
  const copy = chatCopy[language];
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
              subtitle: copy.approvedConnection,
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
          subtitle: doctor.department || copy.connectedDoctor,
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
        <p className="ui-section-title">{copy.moduleTitle}</p>
        <p className="mt-2 ui-body-secondary">{copy.moduleDescription}</p>
      </Card>
    );
  }

  const visibleMessages = currentMessages.filter((message) => {
    const matchesFilter = filter === "all" || (filter === "read" ? message.isRead : !message.isRead);
    const matchesSearch = !search.trim() || message.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isApproved = isApprovedParticipant(selectedParticipant);
  const unreadCount = currentMessages.filter((message) => message.sender !== role && !message.isRead).length;
  const emptyText = role === "doctor" ? copy.emptyDoctor : copy.emptyHospital;
  const disableReason =
    !isApproved && selectedParticipant ? copy.approvedOnlyMessage : "";

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0EA5A4]">
                <MessageSquareMore className="size-4" />
              </div>
              <p className="text-[16px] font-medium text-[#0F172A]">{copy.contacts}</p>
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
                        <p className="mt-1 text-[12px] text-[#64748B]">{formatParticipantSubtitle(participant, copy)}</p>
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

            {!participants.length ? <p className="ui-body-secondary">{emptyText}</p> : null}
          </div>
        </Card>

        {selectedParticipant ? (
          <ChatContainer
            title={currentUser.role === "doctor" ? copy.activityLogDoctor : copy.activityLogHospital}
            subtitle={copy.realtimeChatWith(selectedParticipant.name)}
            messages={visibleMessages}
            quickMessages={getQuickMessages(role, copy)}
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
            <p className="ui-body-secondary">{emptyText}</p>
          </Card>
        )}
      </div>

      <ConfirmationDialog
        open={Boolean(deleteTargetId)}
        title={copy.deleteMessage}
        description={copy.deleteMessageDescription}
        confirmLabel={copy.delete}
        cancelLabel={copy.cancel}
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmationDialog
        open={clearRequested}
        title={copy.clearConversation}
        description={copy.clearConversationDescription}
        confirmLabel={copy.clearChat}
        cancelLabel={copy.cancel}
        confirmVariant="danger"
        onConfirm={handleClearConversation}
        onCancel={() => setClearRequested(false)}
      />
    </>
  );
}

function formatParticipantSubtitle(
  participant: ChatParticipant,
  copy: (typeof chatCopy)[keyof typeof chatCopy]
) {
  return `${participant.role === "doctor" ? copy.doctorLabel : copy.hospitalLabel} | ${participant.subtitle}`;
}

function getQuickMessages(
  role: Exclude<AuthRole, "admin">,
  copy: (typeof chatCopy)[keyof typeof chatCopy]
) {
  return role === "doctor"
    ? [
        copy.quick.patientReady,
        copy.quick.reviewCompleted,
        copy.quick.prescriptionShared,
        copy.quick.roomUpdate,
        copy.quick.testsRequired,
        copy.quick.patientStable,
        copy.quick.dischargePlanned,
        copy.quick.urgentConsult,
        copy.quick.followUp,
        copy.quick.billingClearance,
        copy.quick.callBack,
      ]
    : [
        copy.quick.bedAssigned,
        copy.quick.needApproval,
        copy.quick.emergencyCase,
        copy.quick.scheduleUpdated,
        copy.quick.delayExpected,
        copy.quick.patientWaiting,
        copy.quick.labReportReady,
        copy.quick.ambulanceArrived,
        copy.quick.admissionConfirmed,
        copy.quick.pleaseConfirm,
      ];
}

const chatCopy = {
  en: {
    emptyDoctor: "No approved hospital connections are available yet.",
    emptyHospital: "No approved doctor connections are available yet.",
    doctorLabel: "Doctor",
    hospitalLabel: "Hospital",
    approvedConnection: "Approved connection",
    connectedDoctor: "Connected doctor",
    moduleTitle: "Chat Module",
    moduleDescription: "Chat is available for doctor and hospital dashboards only.",
    approvedOnlyMessage: "Messaging is enabled only when the connection is approved.",
    contacts: "Contacts",
    activityLogDoctor: "Doctor Activity Log",
    activityLogHospital: "Hospital Activity Log",
    realtimeChatWith: (name: string) => `Realtime chat with ${name}`,
    deleteMessage: "Delete Message",
    deleteMessageDescription: "This will delete the message in the backend conversation.",
    clearConversation: "Clear Conversation",
    clearConversationDescription: "This will remove all messages in the current doctor-hospital conversation.",
    clearChat: "Clear chat",
    delete: "Delete",
    cancel: "Cancel",
    quick: {
      patientReady: "Patient is ready",
      reviewCompleted: "Review completed",
      prescriptionShared: "Prescription shared",
      roomUpdate: "Need room update",
      testsRequired: "Tests required",
      patientStable: "Patient stable",
      dischargePlanned: "Discharge planned",
      urgentConsult: "Urgent consult needed",
      followUp: "Follow-up required",
      billingClearance: "Need billing clearance",
      callBack: "Please call back",
      bedAssigned: "Bed assigned",
      needApproval: "Need approval",
      emergencyCase: "Emergency case",
      scheduleUpdated: "Schedule updated",
      delayExpected: "Delay expected",
      patientWaiting: "Patient waiting",
      labReportReady: "Lab report ready",
      ambulanceArrived: "Ambulance arrived",
      admissionConfirmed: "Admission confirmed",
      pleaseConfirm: "Please confirm",
    },
  },
  hi: {
    emptyDoctor: "अभी कोई स्वीकृत अस्पताल कनेक्शन उपलब्ध नहीं है।",
    emptyHospital: "अभी कोई स्वीकृत डॉक्टर कनेक्शन उपलब्ध नहीं है।",
    doctorLabel: "डॉक्टर",
    hospitalLabel: "अस्पताल",
    approvedConnection: "स्वीकृत कनेक्शन",
    connectedDoctor: "कनेक्टेड डॉक्टर",
    moduleTitle: "चैट मॉड्यूल",
    moduleDescription: "चैट केवल डॉक्टर और अस्पताल डैशबोर्ड के लिए उपलब्ध है।",
    approvedOnlyMessage: "मैसेजिंग केवल स्वीकृत कनेक्शन होने पर सक्षम है।",
    contacts: "संपर्क",
    activityLogDoctor: "डॉक्टर गतिविधि लॉग",
    activityLogHospital: "अस्पताल गतिविधि लॉग",
    realtimeChatWith: (name: string) => `${name} के साथ रीयलटाइम चैट`,
    deleteMessage: "संदेश हटाएँ",
    deleteMessageDescription: "यह बैकएंड वार्तालाप में संदेश को हटा देगा।",
    clearConversation: "वार्तालाप साफ़ करें",
    clearConversationDescription: "यह वर्तमान डॉक्टर-अस्पताल वार्तालाप के सभी संदेश हटा देगा।",
    clearChat: "चैट साफ़ करें",
    delete: "हटाएँ",
    cancel: "रद्द करें",
    quick: {
      patientReady: "रोगी तैयार है",
      reviewCompleted: "समीक्षा पूरी हुई",
      prescriptionShared: "प्रिस्क्रिप्शन साझा किया गया",
      roomUpdate: "कमरे का अपडेट चाहिए",
      testsRequired: "टेस्ट आवश्यक हैं",
      patientStable: "रोगी स्थिर है",
      dischargePlanned: "डिस्चार्ज की योजना है",
      urgentConsult: "तत्काल परामर्श चाहिए",
      followUp: "फॉलो-अप आवश्यक है",
      billingClearance: "बिलिंग क्लीयरेंस चाहिए",
      callBack: "कृपया वापस कॉल करें",
      bedAssigned: "बेड आवंटित किया गया",
      needApproval: "स्वीकृति चाहिए",
      emergencyCase: "आपातकालीन मामला",
      scheduleUpdated: "अनुसूची अपडेट की गई",
      delayExpected: "देरी की संभावना है",
      patientWaiting: "रोगी प्रतीक्षा कर रहा है",
      labReportReady: "लैब रिपोर्ट तैयार है",
      ambulanceArrived: "एम्बुलेंस आ गई",
      admissionConfirmed: "प्रवेश की पुष्टि हुई",
      pleaseConfirm: "कृपया पुष्टि करें",
    },
  },
  ml: {
    emptyDoctor: "അംഗീകരിച്ച ആശുപത്രി കണക്ഷനുകൾ ഇതുവരെ ലഭ്യമല്ല.",
    emptyHospital: "അംഗീകരിച്ച ഡോക്ടർ കണക്ഷനുകൾ ഇതുവരെ ലഭ്യമല്ല.",
    doctorLabel: "ഡോക്ടർ",
    hospitalLabel: "ആശുപത്രി",
    approvedConnection: "അംഗീകരിച്ച കണക്ഷൻ",
    connectedDoctor: "കണക്റ്റ് ചെയ്ത ഡോക്ടർ",
    moduleTitle: "ചാറ്റ് മോഡ്യൂൾ",
    moduleDescription: "ചാറ്റ് ഡോക്ടർ, ആശുപത്രി ഡാഷ്ബോർഡുകൾക്കായി മാത്രം ലഭ്യമാണ്.",
    approvedOnlyMessage: "കണക്ഷൻ അംഗീകരിച്ചാൽ മാത്രമേ സന്ദേശയയയ്ക്കൽ ലഭ്യമാകൂ.",
    contacts: "കോൺടാക്റ്റുകൾ",
    activityLogDoctor: "ഡോക്ടർ പ്രവർത്തന ലോഗ്",
    activityLogHospital: "ആശുപത്രി പ്രവർത്തന ലോഗ്",
    realtimeChatWith: (name: string) => `${name} ഒപ്പമുള്ള റിയൽടൈം ചാറ്റ്`,
    deleteMessage: "സന്ദേശം ഇല്ലാതാക്കുക",
    deleteMessageDescription: "ഇത് ബാക്ക്എൻഡ് സംഭാഷണത്തിലെ സന്ദേശം ഇല്ലാതാക്കും.",
    clearConversation: "സംഭാഷണം മായ്ക്കുക",
    clearConversationDescription: "ഇത് നിലവിലെ ഡോക്ടർ-ആശുപത്രി സംഭാഷണത്തിലെ എല്ലാ സന്ദേശങ്ങളും നീക്കും.",
    clearChat: "ചാറ്റ് മായ്ക്കുക",
    delete: "ഇല്ലാതാക്കുക",
    cancel: "റദ്ദാക്കുക",
    quick: {
      patientReady: "രോഗി തയ്യാറാണ്",
      reviewCompleted: "പരിശോധന പൂർത്തിയായി",
      prescriptionShared: "പ്രിസ്ക്രിപ്ഷൻ പങ്കിട്ടു",
      roomUpdate: "റൂം അപ്ഡേറ്റ് വേണം",
      testsRequired: "ടെസ്റ്റുകൾ ആവശ്യമാണ്",
      patientStable: "രോഗി സ്ഥിരതയിലാണ്",
      dischargePlanned: "ഡിസ്ചാർജ് പ്ലാൻ ചെയ്തു",
      urgentConsult: "തിടുക്കത്തിലുള്ള നിർദേശം വേണം",
      followUp: "ഫോളോ-അപ്പ് ആവശ്യമാണ്",
      billingClearance: "ബില്ലിംഗ് ക്ലിയറൻസ് വേണം",
      callBack: "ദയവായി തിരിച്ച് വിളിക്കുക",
      bedAssigned: "കിടക്ക നൽകിയിരിക്കുന്നു",
      needApproval: "അംഗീകാരം വേണം",
      emergencyCase: "അത്യാഹിത കേസ്",
      scheduleUpdated: "ഷെഡ്യൂൾ അപ്ഡേറ്റ് ചെയ്തു",
      delayExpected: "താമസം പ്രതീക്ഷിക്കുന്നു",
      patientWaiting: "രോഗി കാത്തിരിക്കുന്നു",
      labReportReady: "ലാബ് റിപ്പോർട്ട് തയ്യാറാണ്",
      ambulanceArrived: "ആംബുലൻസ് എത്തി",
      admissionConfirmed: "അഡ്മിഷൻ സ്ഥിരീകരിച്ചു",
      pleaseConfirm: "ദയവായി സ്ഥിരീകരിക്കുക",
    },
  },
  ta: {
    emptyDoctor: "இன்னும் ஒப்புதல் பெற்ற மருத்துவமனை இணைப்புகள் கிடைக்கவில்லை.",
    emptyHospital: "இன்னும் ஒப்புதல் பெற்ற மருத்துவர் இணைப்புகள் கிடைக்கவில்லை.",
    doctorLabel: "மருத்துவர்",
    hospitalLabel: "மருத்துவமனை",
    approvedConnection: "ஒப்புதல் பெற்ற இணைப்பு",
    connectedDoctor: "இணைக்கப்பட்ட மருத்துவர்",
    moduleTitle: "அரட்டை தொகுதி",
    moduleDescription: "அரட்டை மருத்துவர் மற்றும் மருத்துவமனை டாஷ்போர்ட்களுக்கு மட்டும் கிடைக்கும்.",
    approvedOnlyMessage: "இணைப்பு ஒப்புதல் பெற்றால் மட்டுமே செய்தி அனுப்ப முடியும்.",
    contacts: "தொடர்புகள்",
    activityLogDoctor: "மருத்துவர் செயல்பாட்டு பதிவு",
    activityLogHospital: "மருத்துவமனை செயல்பாட்டு பதிவு",
    realtimeChatWith: (name: string) => `${name} உடன் நேரடி அரட்டை`,
    deleteMessage: "செய்தியை நீக்கு",
    deleteMessageDescription: "இது பின்தள உரையாடலில் உள்ள செய்தியை நீக்கும்.",
    clearConversation: "உரையாடலை அழி",
    clearConversationDescription: "இது தற்போதைய மருத்துவர்-மருத்துவமனை உரையாடலின் அனைத்து செய்திகளையும் நீக்கும்.",
    clearChat: "அரட்டையை அழி",
    delete: "நீக்கு",
    cancel: "ரத்து செய்",
    quick: {
      patientReady: "நோயாளர் தயாராக உள்ளார்",
      reviewCompleted: "சரிபார்ப்பு முடிந்தது",
      prescriptionShared: "மருந்து சீட்டு பகிரப்பட்டது",
      roomUpdate: "அறை தகவல் புதுப்பிப்பு தேவை",
      testsRequired: "சோதனைகள் தேவையுள்ளது",
      patientStable: "நோயாளர் நிலையாக உள்ளார்",
      dischargePlanned: "விடுவிப்பு திட்டமிடப்பட்டது",
      urgentConsult: "அவசர ஆலோசனை தேவை",
      followUp: "பின்தொடர்பு தேவை",
      billingClearance: "பில்லிங் அனுமதி தேவை",
      callBack: "தயவு செய்து மீண்டும் அழைக்கவும்",
      bedAssigned: "படுக்கை ஒதுக்கப்பட்டது",
      needApproval: "ஒப்புதல் தேவை",
      emergencyCase: "அவசர நிலை வழக்கு",
      scheduleUpdated: "அட்டவணை புதுப்பிக்கப்பட்டது",
      delayExpected: "தாமதம் ஏற்படும் வாய்ப்பு",
      patientWaiting: "நோயாளர் காத்திருக்கிறார்",
      labReportReady: "ஆய்வு அறிக்கை தயாராக உள்ளது",
      ambulanceArrived: "ஆம்புலன்ஸ் வந்துவிட்டது",
      admissionConfirmed: "சேர்க்கை உறுதி செய்யப்பட்டது",
      pleaseConfirm: "தயவு செய்து உறுதிப்படுத்தவும்",
    },
  },
} as const;
