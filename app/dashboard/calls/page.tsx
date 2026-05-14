"use client";

import * as React from "react";
import { BellRing, PhoneCall, Volume2 } from "lucide-react";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { ActiveCallCard } from "@/components/calls/ActiveCallCard";
import { ActiveCallsList } from "@/components/calls/ActiveCallsList";
import { CallMessageSelector } from "@/components/calls/CallMessageSelector";
import { VoiceAlertBridge } from "@/components/voice-alerts/VoiceAlertBridge";
import { Card } from "@/components/ui";
import { useI18n } from "@/components/i18n";
import { logger } from "@/lib/logger";
import { selectDoctorMessages, selectDoctorTargets, useCallStore } from "@/store/callStore";

const callsPageCopy = {
  en: {
    doctorTitle: "Calls",
    doctorDescription: "Send a simple operational call from doctor to hospital.",
    messages: "Messages",
    active: "Active",
    completed: "Completed",
    noActiveTitle: "No Active Call",
    noActiveDescription: "Choose one message and start a call when needed.",
    startSuccess: "Call started successfully.",
    endSuccess: "Call ended successfully.",
    startError: "Unable to start the call.",
    endError: "Unable to end the call.",
    hospitalTitle: "Active Calls",
    hospitalDescription: "Monitor doctor requests and close calls after support is provided.",
    voiceAlerts: "Voice alerts",
    voiceOn: "On",
    emptyTitle: "No active calls",
    emptyDescription: "Doctor calls will appear here.",
    endLabel: "End Call",
  },
  ta: {
    doctorTitle: "அழைப்புகள்",
    doctorDescription: "மருத்துவரிடமிருந்து மருத்துவமனைக்கு எளிய செயல்பாட்டு அழைப்பை அனுப்பவும்.",
    messages: "செய்திகள்",
    active: "செயலில்",
    completed: "முடிந்தது",
    noActiveTitle: "செயலில் அழைப்பு இல்லை",
    noActiveDescription: "ஒரு செய்தியைத் தேர்வு செய்து தேவையானபோது அழைப்பைத் தொடங்கவும்.",
    startSuccess: "அழைப்பு வெற்றிகரமாக தொடங்கப்பட்டது.",
    endSuccess: "அழைப்பு வெற்றிகரமாக முடிக்கப்பட்டது.",
    startError: "அழைப்பை தொடங்க முடியவில்லை.",
    endError: "அழைப்பை முடிக்க முடியவில்லை.",
    hospitalTitle: "செயலில் உள்ள அழைப்புகள்",
    hospitalDescription: "மருத்துவர் கோரிக்கைகளை கண்காணித்து, உதவி வழங்கப்பட்ட பின் அழைப்புகளை முடிக்கவும்.",
    voiceAlerts: "குரல் அறிவிப்புகள்",
    voiceOn: "இயக்கம்",
    emptyTitle: "செயலில் அழைப்புகள் இல்லை",
    emptyDescription: "மருத்துவர் அழைப்புகள் இங்கு தோன்றும்.",
    endLabel: "அழைப்பை முடி",
  },
  hi: {
    doctorTitle: "कॉल",
    doctorDescription: "डॉक्टर से अस्पताल तक एक सरल संचालन कॉल भेजें।",
    messages: "संदेश",
    active: "सक्रिय",
    completed: "पूर्ण",
    noActiveTitle: "कोई सक्रिय कॉल नहीं",
    noActiveDescription: "एक संदेश चुनें और आवश्यकता होने पर कॉल शुरू करें।",
    startSuccess: "कॉल सफलतापूर्वक शुरू हो गई।",
    endSuccess: "कॉल सफलतापूर्वक समाप्त हो गई।",
    startError: "कॉल शुरू नहीं हो सकी।",
    endError: "कॉल समाप्त नहीं हो सकी।",
    hospitalTitle: "सक्रिय कॉल",
    hospitalDescription: "डॉक्टर अनुरोधों की निगरानी करें और सहायता के बाद कॉल बंद करें।",
    voiceAlerts: "वॉइस अलर्ट",
    voiceOn: "चालू",
    emptyTitle: "कोई सक्रिय कॉल नहीं",
    emptyDescription: "डॉक्टर कॉल यहां दिखाई देंगी।",
    endLabel: "कॉल समाप्त करें",
  },
  ml: {
    doctorTitle: "കോളുകൾ",
    doctorDescription: "ഡോക്ടറിൽ നിന്ന് ആശുപത്രിയിലേക്ക് ലളിതമായ പ്രവർത്തന കോൾ അയയ്ക്കുക.",
    messages: "സന്ദേശങ്ങൾ",
    active: "സജീവം",
    completed: "പൂർത്തിയായി",
    noActiveTitle: "സജീവ കോൾ ഇല്ല",
    noActiveDescription: "ഒരു സന്ദേശം തിരഞ്ഞെടുത്ത് ആവശ്യമുള്ളപ്പോൾ കോൾ ആരംഭിക്കുക.",
    startSuccess: "കോൾ വിജയകരമായി ആരംഭിച്ചു.",
    endSuccess: "കോൾ വിജയകരമായി അവസാനിപ്പിച്ചു.",
    startError: "കോൾ ആരംഭിക്കാനായില്ല.",
    endError: "കോൾ അവസാനിപ്പിക്കാനായില്ല.",
    hospitalTitle: "സജീവ കോളുകൾ",
    hospitalDescription: "ഡോക്ടർ അഭ്യർത്ഥനകൾ നിരീക്ഷിച്ച് സഹായം നൽകിയതിന് ശേഷം കോൾ അവസാനിപ്പിക്കുക.",
    voiceAlerts: "ശബ്ദ അലർട്ടുകൾ",
    voiceOn: "ഓൺ",
    emptyTitle: "സജീവ കോളുകളില്ല",
    emptyDescription: "ഡോക്ടർ കോളുകൾ ഇവിടെ കാണിക്കും.",
    endLabel: "കോൾ അവസാനിപ്പിക്കുക",
  },
} as const;

export default function CallsPage() {
  const { currentUser } = useDashboardContext();
  const { language } = useI18n();
  const copy = callsPageCopy[language] || callsPageCopy.en;
  const activeCalls = useCallStore((state) => state.activeCalls);
  const startCall = useCallStore((state) => state.startCall);
  const endCall = useCallStore((state) => state.endCall);
  const doctorMessages = useCallStore(React.useMemo(() => selectDoctorMessages(currentUser.id), [currentUser.id]));
  const targetHospitals = useCallStore(React.useMemo(() => selectDoctorTargets(currentUser.id), [currentUser.id]));

  const [targetHospitalId, setTargetHospitalId] = React.useState(targetHospitals[0]?.id || "");

  React.useEffect(() => {
    if (!targetHospitals.some((hospital) => hospital.id === targetHospitalId)) {
      setTargetHospitalId(targetHospitals[0]?.id || "");
    }
  }, [targetHospitalId, targetHospitals]);

  const doctorActiveCalls = activeCalls.filter((call) => call.doctorId === currentUser.id);
  const targetHospital = targetHospitals.find((hospital) => hospital.id === targetHospitalId) || targetHospitals[0];
  const hospitalActiveCalls = activeCalls;
  const completedCalls = useCallStore((state) => state.callLogs.filter((log) => log.finalStatus === "completed").length);
  const activeCallsByMessageId = Object.fromEntries(
    doctorActiveCalls
      .filter((call) => call.hospitalId === targetHospital?.id)
      .map((call) => [call.messageId, call] as const)
  );

  async function handleStartCall(messageId: string) {
    const selectedMessage = doctorMessages.find((message) => message.id === messageId);
    if (!selectedMessage || !targetHospital || currentUser.role !== "doctor") {
      return;
    }

    const existingCall = doctorActiveCalls.find(
      (call) => call.hospitalId === targetHospital.id && call.messageId === messageId
    );
    if (existingCall) {
      return;
    }

    try {
      await startCall({
        doctorId: currentUser.id,
        doctorName: currentUser.displayFullName || currentUser.fullName,
        department: currentUser.displayDepartment || currentUser.department || "General Medicine",
        hospitalId: targetHospital.id,
        hospitalName: targetHospital.name,
        messageId: selectedMessage.id,
        messageLabel: selectedMessage.label,
        priority: selectedMessage.priority,
      });
      logger.success(copy.startSuccess, {
        source: "calls.page",
        toast: true,
      });
    } catch (error) {
      logger.error(copy.startError, {
        source: "calls.page",
        data: { message: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  async function handleEndCall(callId: string, endedBy: "doctor" | "hospital") {
    try {
      await endCall(callId, endedBy);
      logger.success(copy.endSuccess, {
        source: "calls.page",
        toast: true,
      });
    } catch (error) {
      logger.error(copy.endError, {
        source: "calls.page",
        data: { callId, endedBy, message: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  if (currentUser.role === "doctor") {
    return (
      <section className="space-y-6">
        <PageHero
          title={copy.doctorTitle}
          description="Run many operational alerts at the same time. Each message row has its own call on and call end controls, live status, and timer."
          icon={<PhoneCall className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
          imageAlt="Doctor operational calls"
          stats={[
            { label: copy.messages, value: String(doctorMessages.length) },
            { label: copy.active, value: String(doctorActiveCalls.length) },
            { label: copy.completed, value: String(completedCalls) },
          ]}
        />

        <div className="space-y-6">
          <CallMessageSelector
            targetHospitalId={targetHospitalId}
            onTargetHospitalChange={setTargetHospitalId}
            targetHospitalOptions={targetHospitals.map((hospital) => ({
              label: `${hospital.name}, ${hospital.city}`,
              value: hospital.id,
            }))}
            availableMessages={doctorMessages}
            activeCallsByMessageId={activeCallsByMessageId}
            language={language}
            onStartMessage={(messageId) => {
              void handleStartCall(messageId);
            }}
            onEndMessage={(messageId) => {
              const currentDoctorCall = activeCallsByMessageId[messageId];
              if (currentDoctorCall) {
                void handleEndCall(currentDoctorCall.id, "doctor");
              }
            }}
          />

          {doctorActiveCalls.length ? (
            <div className="grid gap-4">
              {doctorActiveCalls.map((call) => (
                <ActiveCallCard key={call.id} call={call} language={language} />
              ))}
            </div>
          ) : (
            <Card className="p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB] shadow-sm">
                  <BellRing className="size-5" />
                </span>
                <div>
                  <p className="text-base font-medium text-[#0F172A]">{copy.noActiveTitle}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{copy.noActiveDescription}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHero
        title={copy.hospitalTitle}
        description={copy.hospitalDescription}
        icon={<Volume2 className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
        imageAlt="Hospital active calls"
        stats={[
          { label: copy.active, value: String(hospitalActiveCalls.length) },
          { label: copy.completed, value: String(completedCalls) },
          { label: copy.voiceAlerts, value: copy.voiceOn },
        ]}
      />
      <VoiceAlertBridge activeCalls={activeCalls} language={language} />
      <ActiveCallsList
        calls={hospitalActiveCalls}
        language={language}
        emptyTitle={copy.emptyTitle}
        emptyDescription={copy.emptyDescription}
        endLabel={copy.endLabel}
        onEnd={(callId) => {
          void handleEndCall(callId, "hospital");
        }}
      />
    </section>
  );
}
