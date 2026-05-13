"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  PhoneCall,
  Ticket,
  Settings,
  Stethoscope,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { DashboardProvider } from "@/components/dashboard";
import { GlobalLanguageSwitcher, useI18n } from "@/components/i18n";
import { Card } from "@/components/ui";
import {
  clearMockSession,
  formatRoleLabel,
  getAccessControlMessage,
  getCurrentSessionUser,
  getMockSession,
  refreshSessionUser,
  type MockSession,
  type MockUser
} from "@/lib/auth-flow";
import type { SidebarItem } from "@/components/layout/Sidebar";

type AppShellLanguage = "en" | "hi" | "ml" | "ta";

const operationalNavCopy: Record<
  AppShellLanguage,
  {
    calls: string;
    callLogs: string;
    callsTitleDoctor: string;
    callsTitleHospital: string;
    callsSubtitleDoctor: string;
    callsSubtitleHospital: string;
    callLogsTitle: string;
    callLogsSubtitle: string;
    callMessagesTitle: string;
    callMessagesDescription: string;
  }
> = {
  en: {
    calls: "Calls",
    callLogs: "Call Logs",
    callsTitleDoctor: "Doctor Calls",
    callsTitleHospital: "Hospital Active Calls",
    callsSubtitleDoctor: "Manage operational call workflows with hospitals",
    callsSubtitleHospital: "Monitor and resolve doctor operational calls",
    callLogsTitle: "Call Logs",
    callLogsSubtitle: "Review operational audit history",
    callMessagesTitle: "Custom Call Messages",
    callMessagesDescription: "Manage doctor operational message templates",
  },
  hi: {
    calls: "कॉल्स",
    callLogs: "कॉल लॉग्स",
    callsTitleDoctor: "डॉक्टर कॉल्स",
    callsTitleHospital: "अस्पताल सक्रिय कॉल्स",
    callsSubtitleDoctor: "अस्पतालों के साथ परिचालन कॉल वर्कफ़्लो प्रबंधित करें",
    callsSubtitleHospital: "डॉक्टर परिचालन कॉल्स की निगरानी और समाधान करें",
    callLogsTitle: "कॉल लॉग्स",
    callLogsSubtitle: "परिचालन ऑडिट इतिहास देखें",
    callMessagesTitle: "कस्टम कॉल संदेश",
    callMessagesDescription: "डॉक्टर परिचालन संदेश टेम्पलेट प्रबंधित करें",
  },
  ml: {
    calls: "കോളുകൾ",
    callLogs: "കാൾ ലോഗുകൾ",
    callsTitleDoctor: "ഡോക്ടർ കോളുകൾ",
    callsTitleHospital: "ആശുപത്രി സജീവ കോളുകൾ",
    callsSubtitleDoctor: "ആശുപത്രികളുമായി പ്രവർത്തന കോൾ പ്രവാഹം നിയന്ത്രിക്കുക",
    callsSubtitleHospital: "ഡോക്ടർ പ്രവർത്തന കോളുകൾ നിരീക്ഷിച്ച് അവസാനിപ്പിക്കുക",
    callLogsTitle: "കാൾ ലോഗുകൾ",
    callLogsSubtitle: "പ്രവർത്തന ഓഡിറ്റ് ചരിത്രം പരിശോധിക്കുക",
    callMessagesTitle: "കസ്റ്റം കോൾ സന്ദേശങ്ങൾ",
    callMessagesDescription: "ഡോക്ടർ പ്രവർത്തന സന്ദേശ ടെംപ്ലേറ്റുകൾ നിയന്ത്രിക്കുക",
  },
  ta: {
    calls: "அழைப்புகள்",
    callLogs: "அழைப்பு பதிவுகள்",
    callsTitleDoctor: "மருத்துவர் அழைப்புகள்",
    callsTitleHospital: "மருத்துவமனை செயலில் உள்ள அழைப்புகள்",
    callsSubtitleDoctor: "மருத்துவமனைகளுடன் செயல்பாட்டு அழைப்பு பணிப்போக்கை நிர்வகிக்கவும்",
    callsSubtitleHospital: "மருத்துவர் செயல்பாட்டு அழைப்புகளை கண்காணித்து முடிக்கவும்",
    callLogsTitle: "அழைப்பு பதிவுகள்",
    callLogsSubtitle: "செயல்பாட்டு ஆய்வு வரலாற்றைப் பார்க்கவும்",
    callMessagesTitle: "தனிப்பயன் அழைப்பு செய்திகள்",
    callMessagesDescription: "மருத்துவர் செயல்பாட்டு செய்தி மாதிரிகளை நிர்வகிக்கவும்",
  },
};

const menuItems = [
  { labelKey: "dashboard.nav.dashboard", href: "/dashboard", icon: <LayoutDashboard className="size-4" /> },
  { labelKey: "dashboard.nav.doctors", href: "/dashboard/doctors", icon: <Stethoscope className="size-4" /> },
  { labelKey: "dashboard.nav.departments", href: "/dashboard/departments", icon: <Building2 className="size-4" /> },
  { labelKey: "dashboard.nav.doctorSchedule", href: "/dashboard/doctor-schedule", icon: <CalendarClock className="size-4" /> },
  { labelKey: "dashboard.nav.patientEntry", href: "/dashboard/patient-entry", icon: <Ticket className="size-4" /> },
  { labelKey: "dashboard.nav.hospitals", href: "/dashboard/hospitals", icon: <Building2 className="size-4" /> },
  { labelKey: "dashboard.nav.chat", href: "/dashboard/calls", icon: <PhoneCall className="size-4" /> },
  { labelKey: "dashboard.nav.chat", href: "/dashboard/call-logs", icon: <ClipboardList className="size-4" /> },
  { labelKey: "dashboard.nav.settings", href: "/dashboard/settings", icon: <Settings className="size-4" /> }
] as const satisfies Array<Omit<SidebarItem, "label"> & { labelKey: string }>;

function pageMeta(pathname: string, role: MockUser["role"], t: (key: string) => string, copy: (typeof operationalNavCopy)[AppShellLanguage]) {
  if (pathname === "/dashboard/hospitals") {
    return {
      title: role === "doctor" ? t("dashboard.meta.hospitalSelection") : t("dashboard.meta.hospitals"),
      subtitle: role === "doctor" ? t("dashboard.meta.selectHospitals") : t("dashboard.meta.approveHospitalRegistrations")
    };
  }

  if (pathname === "/dashboard/doctors") {
    return {
      title: role === "hospital" ? t("dashboard.meta.doctorApproval") : t("dashboard.meta.doctors"),
      subtitle: role === "hospital" ? t("dashboard.meta.approveDoctorRequests") : t("dashboard.meta.approveDoctorRegistrations")
    };
  }

  if (pathname === "/dashboard/doctor-schedule") {
    return {
      title: t("dashboard.meta.doctorSchedule"),
      subtitle: t("dashboard.meta.manageDoctorAvailability")
    };
  }

  if (pathname === "/dashboard/patient-entry") {
    return {
      title: t("dashboard.meta.patientEntry"),
      subtitle: t("dashboard.meta.allocateTokens")
    };
  }

  if (pathname === "/dashboard/calls") {
    return {
      title: role === "doctor" ? copy.callsTitleDoctor : copy.callsTitleHospital,
      subtitle: role === "doctor" ? copy.callsSubtitleDoctor : copy.callsSubtitleHospital
    };
  }

  if (pathname === "/dashboard/call-logs") {
    return {
      title: copy.callLogsTitle,
      subtitle: copy.callLogsSubtitle
    };
  }

  if (pathname === "/dashboard/settings/departments" || pathname === "/dashboard/departments") {
    return {
      title: t("dashboard.meta.departments"),
      subtitle: t("dashboard.meta.assignDoctors")
    };
  }

  if (pathname === "/dashboard/settings/subscriptions" || pathname === "/dashboard/subscriptions") {
    return {
      title: t("dashboard.meta.subscriptions"),
      subtitle: t("dashboard.meta.managePricing")
    };
  }

  if (pathname === "/dashboard/settings/subscriptions/hospitals") {
    return {
      title: t("dashboard.meta.hospitalSubscriptions"),
      subtitle: t("dashboard.meta.manageHospitalPricing")
    };
  }

  if (pathname === "/dashboard/settings/subscriptions/doctors") {
    return {
      title: t("dashboard.meta.doctorSubscriptions"),
      subtitle: t("dashboard.meta.manageDoctorPricing")
    };
  }

  if (pathname === "/dashboard/settings/language") {
    return {
      title: t("settings.languageTitle"),
      subtitle: t("settings.languageDescription")
    };
  }

  if (pathname === "/dashboard/settings/call-messages") {
    return {
      title: copy.callMessagesTitle,
      subtitle: copy.callMessagesDescription
    };
  }

  if (pathname === "/dashboard/settings") {
    return {
      title: t("dashboard.meta.settings"),
      subtitle: t("dashboard.meta.managePlatformSettings")
    };
  }

  return {
    title:
      role === "admin"
        ? t("dashboard.meta.adminDashboard")
        : role === "hospital"
          ? t("dashboard.meta.hospitalDashboard")
          : t("dashboard.meta.doctorDashboard"),
    subtitle:
      role === "admin"
        ? t("dashboard.meta.platformOverview")
        : role === "hospital"
          ? t("dashboard.meta.hospitalOverview")
          : t("dashboard.meta.doctorOverview")
  };
}

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useI18n();
  const [session, setSession] = React.useState<MockSession | null>(null);
  const [currentUser, setCurrentUser] = React.useState<MockUser | null>(null);
  const [ready, setReady] = React.useState(false);

  const refreshSession = React.useCallback(async () => {
    const nextSession = getMockSession();
    const nextUser = getCurrentSessionUser();
    setSession(nextSession);
    setCurrentUser(nextUser);
    setReady(true);

    if (!nextSession) return;

    try {
      const freshUser = await refreshSessionUser();
      if (freshUser) {
        setCurrentUser(freshUser);
      }
    } catch {
      // Ignore refresh failures; cached session is still usable.
    }
  }, []);

  React.useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signOut = React.useCallback(() => {
    clearMockSession();
    setSession(null);
    setCurrentUser(null);
    router.push("/signin");
  }, [router]);

  if (!ready) {
    return <main className="min-h-screen bg-[#F8FAFC]" />;
  }

  if (!session || !currentUser) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md p-4 text-center">
            <h1 className="text-xl font-medium text-[#0F172A]">{t("dashboard.header.signInRequired")}</h1>
            <p className="mt-2 text-sm text-[#64748B]">{t("dashboard.header.signInToContinue")}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/signin"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-[#0EA5A4] bg-[#0EA5A4] px-4 text-sm font-medium text-white"
              >
                {t("dashboard.header.signIn")}
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const accessMessage = getAccessControlMessage(currentUser.approvalStatus);
  if (accessMessage) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md p-4 text-center">
            <h1 className="text-xl font-medium text-[#0F172A]">{t("dashboard.header.accessRestricted")}</h1>
            <p className="mt-2 text-sm text-[#64748B]">{accessMessage}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-[#0EA5A4] bg-[#0EA5A4] px-4 text-sm font-medium text-white"
                onClick={signOut}
              >
                {t("dashboard.header.returnToSignIn")}
              </button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const operationalCopy = operationalNavCopy[language as AppShellLanguage] || operationalNavCopy.en;
  const meta = pageMeta(pathname, currentUser.role, t, operationalCopy);
  const visibleMenuItems = menuItems.filter((item) => {
    if (currentUser.role === "hospital") {
      return (
        item.href !== "/dashboard/hospitals"
      );
    }

    if (currentUser.role === "doctor") {
      return (
        item.href !== "/dashboard/departments" &&
        item.href !== "/dashboard/doctors" &&
        item.href !== "/dashboard/doctor-schedule" &&
        item.href !== "/dashboard/patient-entry"
      );
    }

    if (currentUser.role === "admin") {
      return (
        item.href !== "/dashboard/departments" &&
        item.href !== "/dashboard/doctor-schedule" &&
        item.href !== "/dashboard/patient-entry" &&
        item.href !== "/dashboard/calls"
      );
    }

    return true;
  });

  const settingsChildren: SidebarItem[] = [
    {
      href: "/dashboard/settings/language",
      label: t("settings.languageTitle"),
      active: pathname === "/dashboard/settings/language",
    },
    ...(currentUser.role === "admin"
      ? [
          {
            href: "/dashboard/settings/departments",
            label: t("settings.departments"),
            active: pathname === "/dashboard/settings/departments",
          },
          {
            href: "/dashboard/settings/subscriptions",
            label: t("settings.subscriptions"),
            active:
              pathname === "/dashboard/settings/subscriptions" ||
              pathname === "/dashboard/settings/subscriptions/hospitals" ||
              pathname === "/dashboard/settings/subscriptions/doctors",
          },
        ]
      : []),
    ...(currentUser.role === "doctor"
      ? [
          {
            href: "/dashboard/settings/call-messages",
            label: operationalCopy.callMessagesTitle,
            active: pathname === "/dashboard/settings/call-messages",
          },
        ]
      : []),
  ];

  return (
    <DashboardProvider
      value={{
        session,
        currentUser,
        refreshSession,
        signOut
      }}
    >
      <DashboardLayout
        sidebar={{
          brand: (
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{t("dashboard.header.brandTitle")}</p>
                <p className="text-xs text-[#64748B]">{t("dashboard.header.brandSubtitle")}</p>
              </div>
            </div>
          ),
          items: visibleMenuItems.map((item) => ({
            href: item.href,
            icon: item.icon,
            label:
              item.href === "/dashboard/calls"
                ? operationalCopy.calls
                : item.href === "/dashboard/call-logs"
                  ? operationalCopy.callLogs
                  : t(item.labelKey),
            children: item.href === "/dashboard/settings" ? settingsChildren : undefined,
            active:
              pathname === item.href ||
              (item.href === "/dashboard/departments" &&
                (pathname === "/dashboard/departments" || pathname === "/dashboard/settings/departments")) ||
              (item.href === "/dashboard/settings" && pathname.startsWith("/dashboard/settings"))
          }))
        }}
        header={{
          title: meta.title,
          subtitle: meta.subtitle,
          actions: <GlobalLanguageSwitcher compact />,
          user: {
            name: currentUser.fullName,
            role: t(`dashboard.roles.${currentUser.role}`) || formatRoleLabel(currentUser.role)
          },
          onLogout: signOut
        }}
      >
        {children}
      </DashboardLayout>
    </DashboardProvider>
  );
}
