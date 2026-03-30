"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Stethoscope,
  Ticket,
  Users,
  WalletCards
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { DashboardProvider } from "@/components/dashboard";
import { Card } from "@/components/ui";
import {
  clearMockSession,
  formatRoleLabel,
  getAccessControlMessage,
  getCurrentSessionUser,
  getMockSession,
  type MockSession,
  type MockUser
} from "@/lib/auth-flow";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="size-4" /> },
  { label: "Users", href: "/dashboard/users", icon: <Users className="size-4" /> },
  { label: "Hospitals", href: "/dashboard/hospitals", icon: <Building2 className="size-4" /> },
  { label: "Doctors", href: "/dashboard/doctors", icon: <Stethoscope className="size-4" /> },
  { label: "Departments", href: "/dashboard/departments", icon: <Ticket className="size-4" /> },
  { label: "Subscriptions", href: "/dashboard/subscriptions", icon: <WalletCards className="size-4" /> }
] as const;

function pageMeta(pathname: string, role: MockUser["role"]) {
  if (pathname === "/dashboard/users") {
    return {
      title: role === "admin" ? "User Approval" : "Users",
      subtitle: role === "admin" ? "Approve registrations" : "Admin only"
    };
  }

  if (pathname === "/dashboard/hospitals") {
    return {
      title: role === "doctor" ? "Hospital Selection" : "Hospitals",
      subtitle: role === "doctor" ? "Select hospitals" : "Manage hospitals"
    };
  }

  if (pathname === "/dashboard/doctors") {
    return {
      title: role === "hospital" ? "Doctor Approval" : "Doctors",
      subtitle: role === "hospital" ? "Approve doctor requests" : "View doctors"
    };
  }

  if (pathname === "/dashboard/departments") {
    return {
      title: "Departments",
      subtitle: "Manage departments"
    };
  }

  if (pathname === "/dashboard/subscriptions") {
    return {
      title: "Subscriptions",
      subtitle: "Manage pricing"
    };
  }

  return {
    title: role === "admin" ? "Admin Dashboard" : role === "hospital" ? "Hospital Dashboard" : "Doctor Dashboard",
    subtitle:
      role === "admin"
        ? "Platform overview"
        : role === "hospital"
          ? "Hospital overview"
          : "Doctor overview"
  };
}

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = React.useState<MockSession | null>(null);
  const [currentUser, setCurrentUser] = React.useState<MockUser | null>(null);
  const [ready, setReady] = React.useState(false);

  const refreshSession = React.useCallback(() => {
    const nextSession = getMockSession();
    const nextUser = getCurrentSessionUser();
    setSession(nextSession);
    setCurrentUser(nextUser);
    setReady(true);
  }, []);

  React.useEffect(() => {
    refreshSession();
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
            <h1 className="text-xl font-medium text-[#0F172A]">Sign in required</h1>
            <p className="mt-2 text-sm text-[#64748B]">Sign in to continue</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/signin"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-xl border border-[#0EA5A4] bg-[#0EA5A4] px-4 text-sm font-medium text-white"
              >
                Sign In
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
            <h1 className="text-xl font-medium text-[#0F172A]">Access restricted</h1>
            <p className="mt-2 text-sm text-[#64748B]">{accessMessage}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-xl border border-[#0EA5A4] bg-[#0EA5A4] px-4 text-sm font-medium text-white"
                onClick={signOut}
              >
                Return to Sign In
              </button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const meta = pageMeta(pathname, currentUser.role);
  const visibleMenuItems = menuItems.filter((item) => {
    if (currentUser.role === "hospital") {
      return (
        item.href !== "/dashboard/users" &&
        item.href !== "/dashboard/hospitals" &&
        item.href !== "/dashboard/departments"
      );
    }

    if (currentUser.role === "doctor") {
      return (
        item.href !== "/dashboard/users" &&
        item.href !== "/dashboard/subscriptions" &&
        item.href !== "/dashboard/doctors" &&
        item.href !== "/dashboard/departments"
      );
    }

    return true;
  });

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
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Hospital Token</p>
                <p className="text-xs text-[#64748B]">Management System</p>
              </div>
            </div>
          ),
          items: visibleMenuItems.map((item) => ({
            ...item,
            active: pathname === item.href
          }))
        }}
        header={{
          title: meta.title,
          subtitle: meta.subtitle,
          user: {
            name: currentUser.fullName,
            role: formatRoleLabel(currentUser.role)
          },
          onLogout: signOut
        }}
      >
        {children}
      </DashboardLayout>
    </DashboardProvider>
  );
}
