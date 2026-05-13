"use client";

import { Languages, LayoutList, MessageSquarePlus, WalletCards } from "lucide-react";
import { SettingsNavCard, useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";

const callMessageCopy = {
  en: {
    title: "Custom Call Messages",
    description: "Manage doctor operational message templates for the call workflow.",
  },
  hi: {
    title: "कस्टम कॉल संदेश",
    description: "कॉल वर्कफ़्लो के लिए डॉक्टर परिचालन संदेश टेम्पलेट प्रबंधित करें।",
  },
  ml: {
    title: "കസ്റ്റം കോൾ സന്ദേശങ്ങൾ",
    description: "കോൾ പ്രവാഹത്തിനായുള്ള ഡോക്ടർ പ്രവർത്തന സന്ദേശ ടെംപ്ലേറ്റുകൾ നിയന്ത്രിക്കുക.",
  },
  ta: {
    title: "தனிப்பயன் அழைப்பு செய்திகள்",
    description: "அழைப்பு பணிப்போக்கிற்கான மருத்துவர் செயல்பாட்டு செய்தி மாதிரிகளை நிர்வகிக்கவும்.",
  },
} as const;

export default function SettingsPage() {
  const { currentUser } = useDashboardContext();
  const { t, language } = useI18n();
  const showAdminSettings = currentUser.role === "admin";
  const showDoctorCallSettings = currentUser.role === "doctor";
  const copy = callMessageCopy[language as keyof typeof callMessageCopy] || callMessageCopy.en;

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <SettingsNavCard
        href="/dashboard/settings/language"
        icon={<Languages className="size-5" />}
        title={t("settings.languageTitle")}
        description={t("settings.languageDescription")}
      />

      {showAdminSettings ? (
        <>
          <SettingsNavCard
            href="/dashboard/settings/departments"
            icon={<LayoutList className="size-5" />}
            title={t("settings.departments")}
            description={t("settings.departmentsDescription")}
          />
          <SettingsNavCard
            href="/dashboard/settings/subscriptions"
            icon={<WalletCards className="size-5" />}
            title={t("settings.subscriptions")}
            description={t("settings.subscriptionsDescription")}
          />
        </>
      ) : null}

      {showDoctorCallSettings ? (
        <SettingsNavCard
          href="/dashboard/settings/call-messages"
          icon={<MessageSquarePlus className="size-5" />}
          title={copy.title}
          description={copy.description}
        />
      ) : null}
    </section>
  );
}
