"use client";

import * as React from "react";
import { Listbox } from "@headlessui/react";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  FolderKanban,
  HeartPulse,
  Home,
  LayoutPanelTop,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Rows3,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TabletSmartphone,
  Users
} from "lucide-react";
import { MobileDrawer, Navbar, Sidebar, type NavItem } from "@/components/navigation";

type NavbarType =
  | "horizontal"
  | "sticky"
  | "floating"
  | "mega"
  | "tabs"
  | "vertical"
  | "collapsed"
  | "tree"
  | "mobile"
  | "bottom"
  | "combo";

type NavbarOption = {
  value: NavbarType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconWrap: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", iconTone: "sky" },
  {
    label: "Patients",
    icon: Users,
    iconTone: "blue",
    path: "/patients",
    badge: "18",
    children: [
      { label: "Add Patient", path: "/patients/add", iconTone: "emerald" },
      { label: "Patient List", path: "/patients/list", iconTone: "blue" },
      { label: "Care Teams", path: "/patients/teams", iconTone: "teal" }
    ]
  },
  {
    label: "Operations",
    icon: FolderKanban,
    iconTone: "amber",
    children: [
      { label: "Queue", path: "/operations/queue", icon: Activity, iconTone: "amber" },
      { label: "Scheduling", path: "/operations/schedule", icon: Calendar, iconTone: "violet" },
      { label: "Reports", path: "/operations/reports", icon: FileText, iconTone: "rose" }
    ]
  },
  {
    label: "Analytics",
    icon: BarChart3,
    iconTone: "indigo",
    path: "/analytics",
    featured: true,
    children: [
      { label: "Performance", path: "/analytics/performance", icon: BarChart3, iconTone: "indigo" },
      {
        label: "Patient Journey",
        icon: HeartPulse,
        iconTone: "rose",
        children: [
          { label: "Admissions", path: "/analytics/journey/admissions", iconTone: "rose" },
          { label: "Follow-ups", path: "/analytics/journey/follow-ups", iconTone: "fuchsia" }
        ]
      },
      {
        label: "Team Productivity",
        icon: Stethoscope,
        iconTone: "lime",
        children: [
          { label: "Daily Load", path: "/analytics/team/load", iconTone: "lime" },
          { label: "Coverage", path: "/analytics/team/coverage", iconTone: "emerald" }
        ]
      }
    ]
  },
  { label: "Messages", icon: MessageSquare, path: "/messages", iconTone: "fuchsia" },
  {
    label: "Admin",
    icon: ShieldCheck,
    iconTone: "teal",
    path: "/admin",
    children: [
      { label: "Permissions", path: "/admin/permissions", iconTone: "teal" },
      { label: "Audit Log", path: "/admin/audit", iconTone: "amber" }
    ]
  },
  { label: "Settings", icon: Settings, path: "/settings", iconTone: "violet" }
];

const navbarOptions: NavbarOption[] = [
  {
    value: "horizontal",
    label: "Horizontal Navbar",
    icon: LayoutPanelTop,
    iconWrap: "bg-sky-100 text-sky-600"
  },
  {
    value: "sticky",
    label: "Sticky Navbar",
    icon: Sparkles,
    iconWrap: "bg-blue-100 text-blue-600"
  },
  {
    value: "floating",
    label: "Floating Navbar",
    icon: TabletSmartphone,
    iconWrap: "bg-violet-100 text-violet-600"
  },
  {
    value: "mega",
    label: "Mega Menu",
    icon: Rows3,
    iconWrap: "bg-emerald-100 text-emerald-600"
  },
  {
    value: "tabs",
    label: "Tab Navbar",
    icon: MonitorSmartphone,
    iconWrap: "bg-indigo-100 text-indigo-600"
  },
  {
    value: "vertical",
    label: "Sidebar (Expanded)",
    icon: Rows3,
    iconWrap: "bg-teal-100 text-teal-600"
  },
  {
    value: "collapsed",
    label: "Sidebar (Collapsed)",
    icon: Rows3,
    iconWrap: "bg-fuchsia-100 text-fuchsia-600"
  },
  {
    value: "tree",
    label: "Tree Sidebar",
    icon: Rows3,
    iconWrap: "bg-lime-100 text-lime-700"
  },
  {
    value: "mobile",
    label: "Mobile Drawer",
    icon: Menu,
    iconWrap: "bg-rose-100 text-rose-600"
  },
  {
    value: "bottom",
    label: "Bottom Navigation",
    icon: LayoutPanelTop,
    iconWrap: "bg-amber-100 text-amber-700"
  },
  {
    value: "combo",
    label: "Top + Sidebar Combo",
    icon: LayoutPanelTop,
    iconWrap: "bg-cyan-100 text-cyan-700"
  }
];

function Brand({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
        NX
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-slate-950">{title}</p>
        <p className="truncate text-sm text-slate-500">Dashboard navigation</p>
      </div>
    </div>
  );
}

function TopActions() {
  return (
    <>
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Search"
      >
        <Search className="size-4" />
      </button>
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
      </button>
    </>
  );
}

function NavbarSelector({
  value,
  onChange
}: {
  value: NavbarOption;
  onChange: (option: NavbarOption) => void;
}) {
  const Icon = value.icon;

  return (
    <div className="w-full max-w-3xl px-4">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="flex w-full items-center gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 text-left shadow-[0_20px_60px_rgba(148,163,184,0.15)]">
            <div className={`flex size-16 shrink-0 items-center justify-center rounded-3xl ${value.iconWrap}`}>
              <Icon className="size-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Navbar Type
              </p>
              <p className="truncate pt-2 text-2xl font-semibold text-slate-950">{value.label}</p>
            </div>
            <ChevronDown className="size-6 shrink-0 text-slate-400" />
          </Listbox.Button>

          <Listbox.Options className="absolute left-0 right-0 top-[calc(100%+1rem)] z-50 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_rgba(148,163,184,0.22)]">
            <div className="max-h-[24rem] overflow-y-auto">
              {navbarOptions.map((option) => {
                const OptionIcon = option.icon;

                return (
                  <Listbox.Option key={option.value} value={option} as={React.Fragment}>
                    {({ active, selected }) => (
                      <button
                        type="button"
                        className={`flex w-full items-center gap-4 rounded-[1.5rem] px-4 py-4 text-left transition ${
                          active ? "bg-slate-50" : ""
                        } ${selected ? "bg-blue-50" : ""}`}
                      >
                        <div
                          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${option.iconWrap}`}
                        >
                          <OptionIcon className="size-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {option.label}
                          </p>
                        </div>
                        {selected ? <Check className="size-5 text-blue-600" /> : null}
                      </button>
                    )}
                  </Listbox.Option>
                );
              })}
            </div>
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}

function TopNavbarShell({
  type,
  title,
  activePath
}: {
  type: "horizontal" | "sticky" | "floating" | "mega" | "tabs";
  title: string;
  activePath: string;
}) {
  const variant = type === "horizontal" ? "horizontal" : type;

  return (
    <div className={type === "floating" ? "w-full bg-gray-50 px-4 py-4 sm:px-6" : "w-full"}>
      <Navbar
        items={navItems}
        brand={<Brand title={title} />}
        activePath={activePath}
        variant={variant}
        actions={<TopActions />}
        className="w-full"
        navbarClassName={
          type === "floating"
            ? "w-full rounded-2xl border-b border-slate-200 bg-white shadow-sm"
            : "w-full rounded-none border-x-0 border-t-0 shadow-none"
        }
        colors={{
          primary: "#2563eb",
          accent: "rgba(219,234,254,0.95)",
          hover: "rgba(37,99,235,0.12)",
          background: "rgba(255,255,255,0.98)",
          text: "#0f172a",
          muted: "#475569",
          border: "rgba(226,232,240,0.95)"
        }}
      />
    </div>
  );
}

function SidebarShell({
  title,
  activePath,
  collapsed = false,
  tree = false
}: {
  title: string;
  activePath: string;
  collapsed?: boolean;
  tree?: boolean;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div
        className={`hidden border-r border-slate-200 bg-white lg:block ${
          collapsed ? "w-24" : "w-72"
        }`}
      >
        <Sidebar
          items={navItems}
          brand={<Brand title={title} />}
          activePath={activePath}
          collapsed={collapsed}
          iconOnly={collapsed}
          tree={tree}
          className="h-screen min-h-screen w-full rounded-none border-0 shadow-none"
          colors={{
            primary: "#2563eb",
            accent: "rgba(219,234,254,0.95)",
            hover: "rgba(37,99,235,0.12)",
            background: "rgba(255,255,255,0.98)",
            text: "#0f172a",
            muted: "#475569",
            border: "rgba(226,232,240,0.95)"
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="w-full border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Brand title={title} />
            <MobileDrawer
              items={navItems}
              brand={<Brand title={title} />}
              activePath={activePath}
              title="Navigation"
              colors={{
                primary: "#2563eb",
                accent: "rgba(219,234,254,0.95)",
                hover: "rgba(37,99,235,0.12)",
                background: "rgba(255,255,255,0.98)",
                text: "#0f172a",
                muted: "#475569",
                border: "rgba(226,232,240,0.95)"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileShell() {
  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Brand title="Mobile Drawer" />
        <MobileDrawer
          items={navItems}
          brand={<Brand title="Drawer Menu" />}
          activePath="/patients/list"
          title="Navigation drawer"
          className="lg:!block"
          previewDesktop
          triggerClassName="bg-white shadow-sm"
          colors={{
            primary: "#2563eb",
            accent: "rgba(219,234,254,0.95)",
            hover: "rgba(37,99,235,0.12)",
            background: "rgba(255,255,255,0.98)",
            text: "#0f172a",
            muted: "#475569",
            border: "rgba(226,232,240,0.95)"
          }}
        />
      </div>
    </div>
  );
}

function BottomShell() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="w-full border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center px-4 text-sm font-medium text-slate-500 sm:px-6">
          Bottom Navigation Preview
        </div>
      </div>
      <Navbar
        items={navItems.slice(0, 5)}
        activePath="/analytics"
        layout="bottom"
        variant="bottom"
        colors={{
          primary: "#2563eb",
          accent: "rgba(219,234,254,0.95)",
          hover: "rgba(37,99,235,0.12)",
          background: "rgba(255,255,255,0.98)",
          text: "#0f172a",
          muted: "#475569",
          border: "rgba(226,232,240,0.95)"
        }}
      />
    </div>
  );
}

function ComboShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        items={navItems}
        brand={<Brand title="Top + Sidebar Combo" />}
        activePath="/operations/schedule"
        layout="combo"
        variant="horizontal"
        className="w-full"
        navbarClassName="w-full rounded-none border-x-0 border-t-0 shadow-none"
        sidebarClassName="rounded-none border-y-0 border-l-0 shadow-none"
        colors={{
          primary: "#2563eb",
          accent: "rgba(219,234,254,0.95)",
          hover: "rgba(37,99,235,0.12)",
          background: "rgba(255,255,255,0.98)",
          text: "#0f172a",
          muted: "#475569",
          border: "rgba(226,232,240,0.95)"
        }}
      />
    </div>
  );
}

function renderNavbar(type: NavbarType) {
  switch (type) {
    case "horizontal":
      return <TopNavbarShell type="horizontal" title="Horizontal Navbar" activePath="/patients/list" />;
    case "sticky":
      return <TopNavbarShell type="sticky" title="Sticky Navbar" activePath="/operations/queue" />;
    case "floating":
      return <TopNavbarShell type="floating" title="Floating Navbar" activePath="/analytics/team/load" />;
    case "mega":
      return <TopNavbarShell type="mega" title="Mega Menu" activePath="/analytics/performance" />;
    case "tabs":
      return <TopNavbarShell type="tabs" title="Tab Navbar" activePath="/" />;
    case "vertical":
      return <SidebarShell title="Vertical Sidebar" activePath="/patients/add" />;
    case "collapsed":
      return <SidebarShell title="Collapsed Sidebar" activePath="/settings" collapsed />;
    case "tree":
      return <SidebarShell title="Tree Sidebar" activePath="/analytics/journey/follow-ups" tree />;
    case "mobile":
      return <MobileShell />;
    case "bottom":
      return <BottomShell />;
    case "combo":
      return <ComboShell />;
  }
}

export default function Page() {
  const [type, setType] = React.useState<NavbarType>("horizontal");
  const selectedOption =
    navbarOptions.find((option) => option.value === type) ?? navbarOptions[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavbar(type)}

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-3xl">
          <NavbarSelector value={selectedOption} onChange={(option) => setType(option.value)} />
        </div>
      </div>
    </div>
  );
}
