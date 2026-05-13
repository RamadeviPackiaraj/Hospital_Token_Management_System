"use client";

import * as React from "react";
import { PhoneCall, Volume2 } from "lucide-react";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { ActiveCallCard } from "@/components/calls/ActiveCallCard";
import { ActiveCallsList } from "@/components/calls/ActiveCallsList";
import { CallMessageSelector } from "@/components/calls/CallMessageSelector";
import { VoiceAlertBridge } from "@/components/voice-alerts/VoiceAlertBridge";
import { Card } from "@/components/ui";
import { MOCK_HOSPITAL_TARGETS } from "@/data/mock-calls";
import { useI18n } from "@/components/i18n";
import { useCallStore } from "@/store/callStore";

export default function CallsPage() {
  const { currentUser } = useDashboardContext();
  const { language } = useI18n();
  const activeCalls = useCallStore((state) => state.activeCalls);
  const startCall = useCallStore((state) => state.startCall);
  const endCall = useCallStore((state) => state.endCall);
  const getMessagesForDoctor = useCallStore((state) => state.getMessagesForDoctor);

  const [targetHospitalId, setTargetHospitalId] = React.useState(MOCK_HOSPITAL_TARGETS[0]?.id || "");
  const doctorMessages = getMessagesForDoctor(currentUser.id).slice(0, 3);

  const [selectedMessageId, setSelectedMessageId] = React.useState(doctorMessages[0]?.id || "");

  React.useEffect(() => {
    if (!doctorMessages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId(doctorMessages[0]?.id || "");
    }
  }, [doctorMessages, selectedMessageId]);

  const currentDoctorCall = activeCalls.find((call) => call.doctorId === currentUser.id);
  const targetHospital =
    MOCK_HOSPITAL_TARGETS.find((hospital) => hospital.id === targetHospitalId) || MOCK_HOSPITAL_TARGETS[0];
  const selectedMessage = doctorMessages.find((message) => message.id === selectedMessageId) || doctorMessages[0];
  const hospitalActiveCalls = activeCalls;
  const completedCalls = useCallStore((state) => state.callLogs.filter((log) => log.finalStatus === "completed").length);

  function handleStartCall() {
    if (!selectedMessage || !targetHospital || currentUser.role !== "doctor" || currentDoctorCall) {
      return;
    }

    startCall({
      doctorId: currentUser.id,
      doctorName: currentUser.displayFullName || currentUser.fullName,
      department: currentUser.displayDepartment || currentUser.department || "General Medicine",
      hospitalId: targetHospital.id,
      hospitalName: targetHospital.name,
      messageId: selectedMessage.id,
      messageLabel: selectedMessage.label,
      priority: selectedMessage.priority,
    });
  }

  if (currentUser.role === "doctor") {
    return (
      <section className="space-y-6">
        <PageHero
          title="Calls"
          description="Send a simple operational call from doctor to hospital."
          icon={<PhoneCall className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
          imageAlt="Doctor operational calls"
          stats={[
            { label: "Messages", value: String(doctorMessages.length) },
            { label: "Active", value: currentDoctorCall ? "1" : "0" },
            { label: "Completed", value: String(completedCalls) },
          ]}
        />

        <div className="space-y-6">
          <CallMessageSelector
            targetHospitalId={targetHospitalId}
            onTargetHospitalChange={setTargetHospitalId}
            targetHospitalOptions={MOCK_HOSPITAL_TARGETS.map((hospital) => ({
              label: `${hospital.name}, ${hospital.city}`,
              value: hospital.id,
            }))}
            selectedMessageId={selectedMessageId}
            onSelectedMessageChange={setSelectedMessageId}
            availableMessages={doctorMessages}
            canStart={Boolean(selectedMessage && targetHospital && !currentDoctorCall)}
            onStart={handleStartCall}
            canEnd={Boolean(currentDoctorCall)}
            onEnd={() => {
              if (currentDoctorCall) {
                endCall(currentDoctorCall.id, "doctor");
              }
            }}
          />

          {currentDoctorCall ? (
            <ActiveCallCard call={currentDoctorCall} />
          ) : (
            <Card className="p-4 shadow-sm">
              <p className="text-base font-medium text-[#0F172A]">No Active Call</p>
              <p className="mt-1 text-sm text-[#64748B]">Choose one message and start a call when needed.</p>
            </Card>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHero
        title="Active Calls"
        description="Monitor doctor requests and close calls after support is provided."
        icon={<Volume2 className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
        imageAlt="Hospital active calls"
        stats={[
          { label: "Active", value: String(hospitalActiveCalls.length) },
          { label: "Completed", value: String(completedCalls) },
          { label: "Voice alerts", value: "On" },
        ]}
      />
      <VoiceAlertBridge activeCalls={activeCalls} language={language} />
      <ActiveCallsList
        calls={hospitalActiveCalls}
        emptyTitle="No active calls"
        emptyDescription="Doctor calls will appear here."
        onEnd={(callId) => endCall(callId, "hospital")}
      />
    </section>
  );
}
