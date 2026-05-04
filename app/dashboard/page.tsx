"use client";

import * as React from "react";
import {
  Building2,
  CalendarClock,
  Clock3,
  ShieldCheck,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import type { MockUser } from "@/lib/auth-flow";
import {
  getAdminDoctors,
  getAdminHospitals,
  getApprovedDoctorsForHospital,
  getSelectionsForDoctor,
  getSelectionsForHospital,
  type HospitalSelection,
} from "@/lib/dashboard-data";
import { getDoctorSchedules, getScheduleBootstrap, getScheduleSummary } from "@/lib/schedule-api";
import { todayDateString } from "@/lib/scheduling";

function SummaryCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="transition hover:border-[#0EA5A4]/40">
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="ui-label">{title}</p>
          <p className="mt-2 text-[20px] font-medium leading-7 text-[#0F172A]">{value}</p>
          <p className="mt-2 ui-body-secondary">{note}</p>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { currentUser } = useDashboardContext();
  const { language } = useI18n();
  const [adminDoctors, setAdminDoctors] = React.useState<MockUser[]>([]);
  const [adminHospitals, setAdminHospitals] = React.useState<MockUser[]>([]);
  const [hospitalSelections, setHospitalSelections] = React.useState<HospitalSelection[]>([]);
  const [doctorSelections, setDoctorSelections] = React.useState<HospitalSelection[]>([]);
  const [approvedDoctors, setApprovedDoctors] = React.useState<MockUser[]>([]);
  const [todayScheduleCount, setTodayScheduleCount] = React.useState(0);
  const [todayAvailableSlots, setTodayAvailableSlots] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const today = todayDateString();

    if (currentUser.role === "admin") {
      Promise.all([getAdminDoctors(), getAdminHospitals()])
        .then(([doctors, hospitals]) => {
          if (!active) return;
          setAdminDoctors(doctors);
          setAdminHospitals(hospitals);
        })
        .catch(() => {
          if (!active) return;
          setAdminDoctors([]);
          setAdminHospitals([]);
        });
    }

    if (currentUser.role === "hospital") {
      Promise.all([
        getSelectionsForHospital(currentUser.id).catch(() => []),
        getApprovedDoctorsForHospital(currentUser.id).catch(() => []),
        getScheduleBootstrap().catch(() => ({ doctors: [] })),
        getDoctorSchedules().catch(() => []),
        getScheduleSummary(today).catch(() => ({
          date: today,
          totalSchedules: 0,
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
        })),
      ])
        .then(([selections, doctors, bootstrap, schedules, summary]) => {
          if (!active) return;

          const selectionMap = new Map<string, HospitalSelection>();
          selections.forEach((selection) => {
            selectionMap.set(selection.doctorId, selection);
          });

          (bootstrap.doctors || []).forEach((doctor) => {
            const doctorId = doctor.userId || doctor.id;
            if (!doctorId || selectionMap.has(doctorId)) return;

            selectionMap.set(doctorId, {
              id: `${doctorId}:${currentUser.id}:approved-bootstrap`,
              doctorId,
              hospitalId: currentUser.id,
              status: "approved",
              requestedAt: today,
            });
          });

          schedules.forEach((schedule) => {
            const doctorId = schedule.doctorId;
            if (!doctorId || selectionMap.has(doctorId)) return;

            selectionMap.set(doctorId, {
              id: `${doctorId}:${currentUser.id}:approved-schedule`,
              doctorId,
              hospitalId: currentUser.id,
              status: "approved",
              requestedAt: today,
            });
          });

          const doctorMap = new Map<string, MockUser>();
          doctors.forEach((doctor) => {
            doctorMap.set(doctor.id, doctor);
          });

          (bootstrap.doctors || []).forEach((doctor) => {
            const doctorId = doctor.userId || doctor.id;
            if (!doctorId || doctorMap.has(doctorId)) return;

            doctorMap.set(doctorId, {
              id: doctorId,
              role: "doctor",
              fullName: doctor.name,
              mobileNumber: doctor.phone,
              email: doctor.email || "",
              department: doctor.department,
              approvalStatus: "approved",
              registrationDate: today,
            });
          });

          schedules.forEach((schedule) => {
            if (!schedule.doctorId || doctorMap.has(schedule.doctorId)) return;

            doctorMap.set(schedule.doctorId, {
              id: schedule.doctorId,
              role: "doctor",
              fullName: schedule.doctorName || "Doctor",
              email: "",
              department: schedule.department,
              approvalStatus: "approved",
              registrationDate: today,
            });
          });

          setHospitalSelections(Array.from(selectionMap.values()));
          setApprovedDoctors(Array.from(doctorMap.values()));
          setTodayScheduleCount(summary.totalSchedules || schedules.length || 0);
          setTodayAvailableSlots(
            summary.availableSlots ||
              schedules.reduce(
                (sum, schedule) => sum + schedule.slots.filter((slot) => !slot.isBooked).length,
                0
              ) ||
              0
          );
        });
    }

    if (currentUser.role === "doctor") {
      getSelectionsForDoctor(currentUser.id)
        .then((selections) => {
          if (!active) return;
          setDoctorSelections(selections);
        })
        .catch(() => {
          if (!active) return;
          setDoctorSelections([]);
        });
    }

    return () => {
      active = false;
    };
  }, [currentUser]);

  if (currentUser.role === "admin") {
    const copy = dashboardHomeCopy[language].admin;
    const hospitals = adminHospitals;
    const doctors = adminDoctors;
    const pendingDoctorApprovals = doctors.filter((user) => user.approvalStatus === "pending");
    const approvedDoctorsCount = doctors.filter((user) => user.approvalStatus === "approved");
    const pendingHospitalApprovals = hospitals.filter((user) => user.approvalStatus === "pending");
    const approvedHospitals = hospitals.filter((user) => user.approvalStatus === "approved");

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title={copy.totalDoctors}
            value={String(doctors.length)}
            note={copy.registeredDoctorAccounts}
            icon={<Stethoscope className="size-5" />}
          />
          <SummaryCard
            title={copy.pendingDoctorApprovals}
            value={String(pendingDoctorApprovals.length)}
            note={copy.awaitingAdminReview}
            icon={<Clock3 className="size-5" />}
          />
          <SummaryCard
            title={copy.approvedDoctors}
            value={String(approvedDoctorsCount.length)}
            note={copy.doctorAccountsApproved}
            icon={<ShieldCheck className="size-5" />}
          />
          <SummaryCard
            title={copy.totalHospitals}
            value={String(hospitals.length)}
            note={copy.registeredHospitalAccounts}
            icon={<Building2 className="size-5" />}
          />
          <SummaryCard
            title={copy.pendingHospitalApprovals}
            value={String(pendingHospitalApprovals.length)}
            note={copy.awaitingAdminReview}
            icon={<Clock3 className="size-5" />}
          />
          <SummaryCard
            title={copy.approvedHospitals}
            value={String(approvedHospitals.length)}
            note={copy.hospitalAccountsApproved}
            icon={<ShieldCheck className="size-5" />}
          />
        </section>
      </div>
    );
  }

  if (currentUser.role === "hospital") {
    const copy = dashboardHomeCopy[language].hospital;
    const pendingRequests = hospitalSelections.filter((selection) => selection.status === "pending");
    const approvedRequests = hospitalSelections.filter((selection) => selection.status === "approved");

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title={copy.doctorApproval}
            value={String(pendingRequests.length)}
            note={copy.approvedRequests(approvedRequests.length)}
            icon={<ShieldCheck className="size-5" />}
          />
          <SummaryCard
            title={copy.doctorSchedule}
            value={String(todayScheduleCount)}
            note={copy.activeDoctors(approvedDoctors.length)}
            icon={<CalendarClock className="size-5" />}
          />
          <SummaryCard
            title={copy.patientEntry}
            value={String(todayAvailableSlots)}
            note={copy.openSlots}
            icon={<Ticket className="size-5" />}
          />
        </section>
      </div>
    );
  }

  const approvedSelections = doctorSelections.filter((selection) => selection.status === "approved");
  const pendingSelections = doctorSelections.filter((selection) => selection.status === "pending");
  const copy = dashboardHomeCopy[language].doctor;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title={copy.selectedHospitals}
          value={String(doctorSelections.length)}
          note={copy.totalHospitalRequests}
          icon={<Building2 className="size-5" />}
        />
        <SummaryCard
          title={copy.approvedHospitals}
          value={String(approvedSelections.length)}
          note={copy.activeHospitalAccess}
          icon={<ShieldCheck className="size-5" />}
        />
        <SummaryCard
          title={copy.pendingRequests}
          value={String(pendingSelections.length)}
          note={copy.waitingForReview}
          icon={<Clock3 className="size-5" />}
        />
      </section>
    </div>
  );
}

const dashboardHomeCopy = {
  en: {
    admin: {
      totalDoctors: "Total Doctors",
      registeredDoctorAccounts: "Registered doctor accounts",
      pendingDoctorApprovals: "Pending Doctor Approvals",
      awaitingAdminReview: "Awaiting admin review",
      approvedDoctors: "Approved Doctors",
      doctorAccountsApproved: "Doctor accounts approved",
      totalHospitals: "Total Hospitals",
      registeredHospitalAccounts: "Registered hospital accounts",
      pendingHospitalApprovals: "Pending Hospital Approvals",
      approvedHospitals: "Approved Hospitals",
      hospitalAccountsApproved: "Hospital accounts approved",
    },
    hospital: {
      doctorApproval: "Doctor Approval",
      approvedRequests: (count: number) => `${count} approved requests`,
      doctorSchedule: "Doctor Schedule",
      activeDoctors: (count: number) => `${count} active doctors`,
      patientEntry: "Patient Entry",
      openSlots: "Open slots available for token generation",
    },
    doctor: {
      selectedHospitals: "Selected Hospitals",
      totalHospitalRequests: "Total hospital requests",
      approvedHospitals: "Approved Hospitals",
      activeHospitalAccess: "Active hospital access",
      pendingRequests: "Pending Requests",
      waitingForReview: "Waiting for review",
    },
  },
  hi: {
    admin: {
      totalDoctors: "कुल डॉक्टर",
      registeredDoctorAccounts: "पंजीकृत डॉक्टर खाते",
      pendingDoctorApprovals: "लंबित डॉक्टर स्वीकृतियाँ",
      awaitingAdminReview: "एडमिन समीक्षा की प्रतीक्षा में",
      approvedDoctors: "स्वीकृत डॉक्टर",
      doctorAccountsApproved: "स्वीकृत डॉक्टर खाते",
      totalHospitals: "कुल अस्पताल",
      registeredHospitalAccounts: "पंजीकृत अस्पताल खाते",
      pendingHospitalApprovals: "लंबित अस्पताल स्वीकृतियाँ",
      approvedHospitals: "स्वीकृत अस्पताल",
      hospitalAccountsApproved: "स्वीकृत अस्पताल खाते",
    },
    hospital: {
      doctorApproval: "डॉक्टर स्वीकृति",
      approvedRequests: (count: number) => `${count} स्वीकृत अनुरोध`,
      doctorSchedule: "डॉक्टर अनुसूची",
      activeDoctors: (count: number) => `${count} सक्रिय डॉक्टर`,
      patientEntry: "रोगी प्रविष्टि",
      openSlots: "टोकन जनरेशन के लिए खुले स्लॉट उपलब्ध हैं",
    },
    doctor: {
      selectedHospitals: "चयनित अस्पताल",
      totalHospitalRequests: "कुल अस्पताल अनुरोध",
      approvedHospitals: "स्वीकृत अस्पताल",
      activeHospitalAccess: "सक्रिय अस्पताल पहुँच",
      pendingRequests: "लंबित अनुरोध",
      waitingForReview: "समीक्षा की प्रतीक्षा में",
    },
  },
  ml: {
    admin: {
      totalDoctors: "ആകെ ഡോക്ടർമാർ",
      registeredDoctorAccounts: "രജിസ്റ്റർ ചെയ്ത ഡോക്ടർ അക്കൗണ്ടുകൾ",
      pendingDoctorApprovals: "ബാക്കി ഡോക്ടർ അംഗീകാരങ്ങൾ",
      awaitingAdminReview: "അഡ്മിൻ പരിശോധനയ്ക്കായി കാത്തിരിക്കുന്നു",
      approvedDoctors: "അംഗീകരിച്ച ഡോക്ടർമാർ",
      doctorAccountsApproved: "അംഗീകരിച്ച ഡോക്ടർ അക്കൗണ്ടുകൾ",
      totalHospitals: "ആകെ ആശുപത്രികൾ",
      registeredHospitalAccounts: "രജിസ്റ്റർ ചെയ്ത ആശുപത്രി അക്കൗണ്ടുകൾ",
      pendingHospitalApprovals: "ബാക്കി ആശുപത്രി അംഗീകാരങ്ങൾ",
      approvedHospitals: "അംഗീകരിച്ച ആശുപത്രികൾ",
      hospitalAccountsApproved: "അംഗീകരിച്ച ആശുപത്രി അക്കൗണ്ടുകൾ",
    },
    hospital: {
      doctorApproval: "ഡോക്ടർ അംഗീകാരം",
      approvedRequests: (count: number) => `${count} അംഗീകരിച്ച അഭ്യർത്ഥനകൾ`,
      doctorSchedule: "ഡോക്ടർ ഷെഡ്യൂൾ",
      activeDoctors: (count: number) => `${count} സജീവ ഡോക്ടർമാർ`,
      patientEntry: "രോഗി എൻട്രി",
      openSlots: "ടോക്കൺ സൃഷ്ടിക്കാനായി തുറന്ന സ്ലോട്ടുകൾ ലഭ്യമാണ്",
    },
    doctor: {
      selectedHospitals: "തിരഞ്ഞെടുത്ത ആശുപത്രികൾ",
      totalHospitalRequests: "ആകെ ആശുപത്രി അഭ്യർത്ഥനകൾ",
      approvedHospitals: "അംഗീകരിച്ച ആശുപത്രികൾ",
      activeHospitalAccess: "സജീവ ആശുപത്രി ആക്സസ്",
      pendingRequests: "ബാക്കി അഭ്യർത്ഥനകൾ",
      waitingForReview: "പരിശോധനയ്ക്കായി കാത്തിരിക്കുന്നു",
    },
  },
  ta: {
    admin: {
      totalDoctors: "மொத்த மருத்துவர்கள்",
      registeredDoctorAccounts: "பதிவுசெய்யப்பட்ட மருத்துவர் கணக்குகள்",
      pendingDoctorApprovals: "நிலுவையில் உள்ள மருத்துவர் ஒப்புதல்கள்",
      awaitingAdminReview: "நிர்வாகி பரிசீலனைக்காக காத்திருக்கிறது",
      approvedDoctors: "ஒப்புதல் பெற்ற மருத்துவர்கள்",
      doctorAccountsApproved: "ஒப்புதல் பெற்ற மருத்துவர் கணக்குகள்",
      totalHospitals: "மொத்த மருத்துவமனைகள்",
      registeredHospitalAccounts: "பதிவுசெய்யப்பட்ட மருத்துவமனை கணக்குகள்",
      pendingHospitalApprovals: "நிலுவையில் உள்ள மருத்துவமனை ஒப்புதல்கள்",
      approvedHospitals: "ஒப்புதல் பெற்ற மருத்துவமனைகள்",
      hospitalAccountsApproved: "ஒப்புதல் பெற்ற மருத்துவமனை கணக்குகள்",
    },
    hospital: {
      doctorApproval: "மருத்துவர் ஒப்புதல்",
      approvedRequests: (count: number) => `${count} ஒப்புதல் பெற்ற கோரிக்கைகள்`,
      doctorSchedule: "மருத்துவர் அட்டவணை",
      activeDoctors: (count: number) => `${count} செயலில் உள்ள மருத்துவர்கள்`,
      patientEntry: "நோயாளர் பதிவு",
      openSlots: "டோக்கன் உருவாக்கத்திற்கான காலியிடங்கள் உள்ளன",
    },
    doctor: {
      selectedHospitals: "தேர்ந்தெடுக்கப்பட்ட மருத்துவமனைகள்",
      totalHospitalRequests: "மொத்த மருத்துவமனை கோரிக்கைகள்",
      approvedHospitals: "ஒப்புதல் பெற்ற மருத்துவமனைகள்",
      activeHospitalAccess: "செயலில் உள்ள மருத்துவமனை அணுகல்",
      pendingRequests: "நிலுவை கோரிக்கைகள்",
      waitingForReview: "பரிசீலனைக்காக காத்திருக்கிறது",
    },
  },
} as const;
