"use client";

import * as React from "react";
import {
  Building2,
  CircleCheckBig,
  ClockArrowUp,
  CopyPlus,
  Fingerprint,
  Link2,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Avatar } from "@/components/data-display/Avatar";
import { OperationalDetailsModal } from "@/components/calls/OperationalDetailsModal";
import { Badge, Button, Card, FilterBar, Input, Table } from "@/components/ui";
import {
  useDashboardContext,
  PageHero,
  AdminUserEditModal,
  ApprovalActionGroup,
  ApprovalStatusBadge,
} from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import { formatDisplayDate } from "@/lib/utils";
import {
  type MockUser,
  type UserApprovalStatus,
} from "@/lib/auth-flow";
import { apiRequest, buildQuery } from "@/lib/api";
import {
  deleteAdminHospital,
  getSelectionsForDoctor,
  getDoctorSubscriptionSummary,
  removeHospitalSelection,
  submitHospitalSelections,
  type HospitalSelection,
  getAdminHospitals,
  updateAdminHospitalProfile,
  type DoctorSubscriptionSummary,
} from "@/lib/dashboard-data";
import { logger } from "@/lib/logger";
import { useCallStore } from "@/store/callStore";

type HospitalRow = Record<string, unknown> & MockUser;
type HospitalDirectoryItem = {
  id: string;
  userId?: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string;
  location?: string;
  displayLocation?: string;
  status: string;
};

type DoctorHospitalCopy = {
  accessRequestTitle: string;
  accessRequestDescription: string;
  hospitalIdLabel: string;
  hospitalIdPlaceholder: string;
  searchResultsEmpty?: string;
  selectedHospitalTitle?: string;
  searchHelper?: string;
  requestAccess: string;
  requestHint: string;
  requestUsage: string;
  progressLabel: string;
  pendingSidebarTitle: string;
  pendingSidebarDescription: string;
  pendingEmpty: string;
  approvedSectionTitle: string;
  approvedSectionDescription: string;
  approvedEmpty: string;
  hospitalIdCaption: string;
  activeAccess: string;
  accessActive: string;
  accessWaiting: string;
  copiedId: string;
  requestBlocked: string;
  invalidHospitalId: string;
  hospitalAlreadyRequested: string;
  requestSubmitted: string;
};

function splitLocation(location?: string | null) {
  const parts = (location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] || "",
    state: parts[1] || "",
    country: parts[2] || "",
  };
}

function getRequestDateLabel(requestedAt: string) {
  const formatted = formatDisplayDate(requestedAt);
  return formatted.replace(/ \d{2}:\d{2} (AM|PM)$/, "");
}

function normalizeHospitalLookupValue(value: string) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getHospitalCode(hospital: HospitalDirectoryItem) {
  const preferredId = String(hospital.userId || hospital.id || "").trim();
  const suffix = preferredId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
  return preferredId.toUpperCase().startsWith("HSP-") ? preferredId.toUpperCase() : `HSP-${suffix}`;
}

function matchesHospitalIdentifier(hospital: HospitalDirectoryItem, input: string) {
  const normalizedInput = normalizeHospitalLookupValue(input);
  if (!normalizedInput) return false;

  const identifiers = [
    hospital.id,
    hospital.userId,
    hospital.name,
    hospital.displayName,
    getHospitalCode(hospital),
  ]
    .filter(Boolean)
    .map((value) => normalizeHospitalLookupValue(value || ""));

  return identifiers.includes(normalizedInput);
}

function matchesHospitalSearch(hospital: HospitalDirectoryItem, input: string) {
  const term = normalizeHospitalLookupValue(input);
  if (!term) return false;

  const location = splitLocation(hospital.displayLocation || hospital.location);
  const haystack = [
    hospital.name,
    hospital.displayName,
    hospital.id,
    hospital.userId,
    getHospitalCode(hospital),
    location.city,
    location.state,
    location.country,
  ]
    .filter(Boolean)
    .map((value) => normalizeHospitalLookupValue(value || ""))
    .join(" ");

  return haystack.includes(term);
}

const doctorHospitalCopy: Record<string, DoctorHospitalCopy> = {
  en: {
    accessRequestTitle: "Hospital Access Request",
    accessRequestDescription: "Enter a hospital ID or code to request secure organizational access.",
    hospitalIdLabel: "Search hospital",
    hospitalIdPlaceholder: "Search by hospital name, city, or HSP-1023",
    searchResultsEmpty: "No hospitals matched your search.",
    selectedHospitalTitle: "Selected hospital",
    searchHelper: "Search by hospital name, city/state, or hospital ID.",
    requestAccess: "Request Access",
    requestHint: "Approved hospitals move into active connections after review.",
    requestUsage: "Each approved or pending relationship uses one slot.",
    progressLabel: "Capacity usage",
    pendingSidebarTitle: "Pending Requests",
    pendingSidebarDescription: "Requests awaiting hospital or admin approval.",
    pendingEmpty: "No pending requests right now.",
    approvedSectionTitle: "Connected Hospitals",
    approvedSectionDescription: "Approved access relationships available for operational work.",
    approvedEmpty: "No approved hospital connections yet.",
    hospitalIdCaption: "Hospital ID",
    activeAccess: "Active access",
    accessActive: "Access active",
    accessWaiting: "Waiting for approval",
    copiedId: "Hospital ID copied",
    requestBlocked: "No remaining hospital slots available in this plan.",
    invalidHospitalId: "Hospital ID not found. Check the code and try again.",
    hospitalAlreadyRequested: "This hospital is already in your request queue.",
    requestSubmitted: "Hospital access request submitted.",
  },
  hi: {
    accessRequestTitle: "अस्पताल एक्सेस अनुरोध",
    accessRequestDescription: "सुरक्षित संगठनात्मक एक्सेस के लिए अस्पताल आईडी या कोड दर्ज करें।",
    hospitalIdLabel: "अस्पताल आईडी / कोड",
    hospitalIdPlaceholder: "HSP-1023",
    requestAccess: "एक्सेस अनुरोध भेजें",
    requestHint: "समीक्षा के बाद स्वीकृत अस्पताल सक्रिय कनेक्शन में दिखेंगे।",
    requestUsage: "हर स्वीकृत या लंबित संबंध एक स्लॉट उपयोग करता है।",
    progressLabel: "क्षमता उपयोग",
    pendingSidebarTitle: "लंबित अनुरोध",
    pendingSidebarDescription: "अस्पताल या एडमिन स्वीकृति की प्रतीक्षा कर रहे अनुरोध।",
    pendingEmpty: "अभी कोई लंबित अनुरोध नहीं है।",
    approvedSectionTitle: "कनेक्टेड अस्पताल",
    approvedSectionDescription: "स्वीकृत एक्सेस संबंध जिनके साथ आप काम कर सकते हैं।",
    approvedEmpty: "अभी कोई स्वीकृत अस्पताल कनेक्शन नहीं है।",
    hospitalIdCaption: "अस्पताल आईडी",
    activeAccess: "सक्रिय एक्सेस",
    accessActive: "एक्सेस सक्रिय",
    accessWaiting: "स्वीकृति की प्रतीक्षा",
    copiedId: "अस्पताल आईडी कॉपी की गई",
    requestBlocked: "इस प्लान में कोई स्लॉट शेष नहीं है।",
    invalidHospitalId: "अस्पताल आईडी नहीं मिली। कोड जांचकर फिर प्रयास करें।",
    hospitalAlreadyRequested: "यह अस्पताल पहले से आपकी अनुरोध सूची में है।",
    requestSubmitted: "अस्पताल एक्सेस अनुरोध भेज दिया गया है।",
  },
  ml: {
    accessRequestTitle: "ആശുപത്രി ആക്സസ് അഭ്യർത്ഥന",
    accessRequestDescription: "സുരക്ഷിത ആക്സസിന് ആശുപത്രി ഐഡിയോ കോഡോ നൽകുക.",
    hospitalIdLabel: "ആശുപത്രി ഐഡി / കോഡ്",
    hospitalIdPlaceholder: "HSP-1023",
    requestAccess: "ആക്സസ് അഭ്യർത്ഥിക്കുക",
    requestHint: "അംഗീകാരം ലഭിച്ച ശേഷം ആശുപത്രി സജീവ കണക്ഷനിലേക്ക് മാറും.",
    requestUsage: "ഓരോ ബാക്കി അല്ലെങ്കിൽ അംഗീകൃത ബന്ധവും ഒരു സ്ലോട്ട് ഉപയോഗിക്കും.",
    progressLabel: "ശേഷി ഉപയോഗം",
    pendingSidebarTitle: "ബാക്കി അഭ്യർത്ഥനകൾ",
    pendingSidebarDescription: "ആശുപത്രിയോ അഡ്മിനോ അംഗീകരിക്കാനുള്ള അഭ്യർത്ഥനകൾ.",
    pendingEmpty: "ഇപ്പോൾ ബാക്കി അഭ്യർത്ഥനകളില്ല.",
    approvedSectionTitle: "കണക്റ്റഡ് ആശുപത്രികൾ",
    approvedSectionDescription: "പ്രവർത്തന ഉപയോഗത്തിനുള്ള അംഗീകൃത ആക്സസ് ബന്ധങ്ങൾ.",
    approvedEmpty: "ഇപ്പോൾ അംഗീകൃത ആശുപത്രി ബന്ധങ്ങളില്ല.",
    hospitalIdCaption: "ആശുപത്രി ഐഡി",
    activeAccess: "സജീവ ആക്സസ്",
    accessActive: "ആക്സസ് സജീവം",
    accessWaiting: "അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു",
    copiedId: "ആശുപത്രി ഐഡി കോപ്പി ചെയ്തു",
    requestBlocked: "ഈ പ്ലാനിൽ ഇനി സ്ലോട്ടുകൾ ഇല്ല.",
    invalidHospitalId: "ആശുപത്രി ഐഡി കണ്ടെത്താനായില്ല. കോഡ് വീണ്ടും പരിശോധിക്കുക.",
    hospitalAlreadyRequested: "ഈ ആശുപത്രി ഇതിനകം നിങ്ങളുടെ അഭ്യർത്ഥന പട്ടികയിൽ ഉണ്ട്.",
    requestSubmitted: "ആശുപത്രി ആക്സസ് അഭ്യർത്ഥിച്ചു.",
  },
  ta: {
    accessRequestTitle: "மருத்துவமனை அணுகல் கோரிக்கை",
    accessRequestDescription: "பாதுகாப்பான அமைப்பு அணுகலுக்காக மருத்துவமனை ஐடி அல்லது குறியீட்டை உள்ளிடவும்.",
    hospitalIdLabel: "மருத்துவமனை ஐடி / குறியீடு",
    hospitalIdPlaceholder: "HSP-1023",
    requestAccess: "அணுகலை கோருங்கள்",
    requestHint: "ஒப்புதல் கிடைத்த பிறகு மருத்துவமனைகள் செயலில் உள்ள இணைப்புகளுக்கு மாற்றப்படும்.",
    requestUsage: "ஒவ்வொரு நிலுவை அல்லது ஒப்புதல் உறவும் ஒரு இடத்தை பயன்படுத்தும்.",
    progressLabel: "திறன் பயன்பாடு",
    pendingSidebarTitle: "நிலுவை கோரிக்கைகள்",
    pendingSidebarDescription: "மருத்துவமனை அல்லது நிர்வாக ஒப்புதலுக்காக காத்திருக்கும் கோரிக்கைகள்.",
    pendingEmpty: "இப்போது நிலுவை கோரிக்கைகள் இல்லை.",
    approvedSectionTitle: "இணைக்கப்பட்ட மருத்துவமனைகள்",
    approvedSectionDescription: "செயல்பாட்டிற்கு பயன்படுத்தக்கூடிய ஒப்புதல் பெற்ற அணுகல் இணைப்புகள்.",
    approvedEmpty: "இன்னும் ஒப்புதல் பெற்ற மருத்துவமனை இணைப்புகள் இல்லை.",
    hospitalIdCaption: "மருத்துவமனை ஐடி",
    activeAccess: "செயலில் உள்ள அணுகல்",
    accessActive: "அணுகல் செயலில் உள்ளது",
    accessWaiting: "ஒப்புதலுக்காக காத்திருக்கிறது",
    copiedId: "மருத்துவமனை ஐடி நகலெடுக்கப்பட்டது",
    requestBlocked: "இந்த திட்டத்தில் மீதமுள்ள இடங்கள் இல்லை.",
    invalidHospitalId: "மருத்துவமனை ஐடி கிடைக்கவில்லை. குறியீட்டை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    hospitalAlreadyRequested: "இந்த மருத்துவமனை ஏற்கனவே உங்கள் கோரிக்கை பட்டியலில் உள்ளது.",
    requestSubmitted: "மருத்துவமனை அணுகல் கோரிக்கை சமர்ப்பிக்கப்பட்டது.",
  },
};

export default function HospitalsPage() {
  const searchParams = useSearchParams();
  const { currentUser, refreshSession } = useDashboardContext();
  const { t, language } = useI18n();
  const doctorCopy = doctorHospitalCopy[language] || doctorHospitalCopy.en;
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("pending");
  const [sortOrder, setSortOrder] = React.useState("registered-desc");
  const [users, setUsers] = React.useState<MockUser[]>([]);
  const [rejectTarget, setRejectTarget] = React.useState<MockUser | null>(null);
  const [editTarget, setEditTarget] = React.useState<MockUser | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MockUser | null>(null);
  const [detailsTarget, setDetailsTarget] = React.useState<MockUser | null>(null);
  const [availableHospitals, setAvailableHospitals] = React.useState<HospitalDirectoryItem[]>([]);
  const [requests, setRequests] = React.useState<HospitalSelection[]>([]);
  const [hospitalIdInput, setHospitalIdInput] = React.useState("");
  const [selectedHospital, setSelectedHospital] = React.useState<HospitalDirectoryItem | null>(null);
  const [loadingDoctorView, setLoadingDoctorView] = React.useState(true);
  const [doctorError, setDoctorError] = React.useState("");
  const [submittingRequest, setSubmittingRequest] = React.useState(false);
  const [removingHospitalId, setRemovingHospitalId] = React.useState<string | null>(null);
  const [subscriptionSummary, setSubscriptionSummary] = React.useState<DoctorSubscriptionSummary | null>(null);
  const [actioningHospitalId, setActioningHospitalId] = React.useState<string | null>(null);
  const activeCalls = useCallStore((state) => state.activeCalls);
  const callLogs = useCallStore((state) => state.callLogs);

  React.useEffect(() => {
    if (currentUser.role !== "admin") return;

    getAdminHospitals()
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
  }, [currentUser.role]);

  React.useEffect(() => {
    const nextStatus = searchParams.get("status");
    setStatusFilter(
      nextStatus === "pending" || nextStatus === "approved" || nextStatus === "rejected"
        ? nextStatus
        : "pending"
    );
  }, [searchParams]);

  React.useEffect(() => {
    if (currentUser.role !== "doctor") return;

    let active = true;
    setLoadingDoctorView(true);
    setDoctorError("");

    Promise.all([
      apiRequest<{ items: HospitalDirectoryItem[] }>(
        `/hospitals${buildQuery({ status: "approved", limit: 100 })}`
      ),
      getSelectionsForDoctor(currentUser.id),
      getDoctorSubscriptionSummary(currentUser.id),
    ])
      .then(([hospitalResponse, doctorRequests, doctorSubscription]) => {
        if (!active) return;
        setAvailableHospitals(hospitalResponse.items || []);
        setRequests(doctorRequests);
        setSubscriptionSummary(doctorSubscription);
      })
      .catch((error) => {
        if (!active) return;
        setDoctorError(error instanceof Error ? error.message : "Unable to load hospitals.");
        setAvailableHospitals([]);
        setRequests([]);
        setSubscriptionSummary(null);
      })
      .finally(() => {
        if (!active) return;
        setLoadingDoctorView(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser.id, currentUser.role]);

  const hospitalRows: HospitalRow[] = users
    .filter((user) => user.role === "hospital")
    .filter((user) => {
      const matchesSearch =
        (user.displayHospitalName || user.hospitalName || user.fullName).toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.approvalStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .map((user) => ({ ...user }))
    .sort((left, right) => {
      const leftName = left.displayHospitalName || left.hospitalName || left.fullName;
      const rightName = right.displayHospitalName || right.hospitalName || right.fullName;
      if (sortOrder === "name-asc") return leftName.localeCompare(rightName);
      if (sortOrder === "name-desc") return rightName.localeCompare(leftName);
      if (sortOrder === "status-asc") return left.approvalStatus.localeCompare(right.approvalStatus);
      if (sortOrder === "status-desc") return right.approvalStatus.localeCompare(left.approvalStatus);
      if (sortOrder === "registered-asc") return (left.registrationDate || "").localeCompare(right.registrationDate || "");
      return (right.registrationDate || "").localeCompare(left.registrationDate || "");
    });

  const scopedHospitalDetailActiveCalls = detailsTarget
    ? activeCalls.filter(
        (call) =>
          call.hospitalId === detailsTarget.id ||
          call.hospitalName ===
            (detailsTarget.displayHospitalName || detailsTarget.hospitalName || detailsTarget.fullName)
      )
    : [];
  const scopedHospitalDetailLogs = detailsTarget
    ? callLogs
        .filter(
          (log) =>
            log.hospitalId === detailsTarget.id ||
            log.hospitalName ===
              (detailsTarget.displayHospitalName || detailsTarget.hospitalName || detailsTarget.fullName)
        )
        .slice(0, 6)
    : [];
  const scopedHospitalTimelineItems = [
    ...scopedHospitalDetailActiveCalls.map((call) => ({
      id: `hospital-active-${call.id}`,
      title: `${call.doctorName} raised ${call.messageLabel}`,
      description: `${call.department} department is waiting on hospital response.`,
      occurredAt: call.startedAt,
      tone: "active" as const,
    })),
    ...scopedHospitalDetailLogs.map((log) => ({
      id: `hospital-log-${log.id}`,
      title: `${log.messageLabel} ${log.finalStatus}`,
      description: `${log.doctorName} - ended by ${log.endedBy}.`,
      occurredAt: log.endedAt,
      tone: "resolved" as const,
    })),
  ].sort((left, right) => right.occurredAt - left.occurredAt);

  async function updateStatus(userId: string, status: UserApprovalStatus) {
    setActioningHospitalId(userId);

    try {
      await apiRequest(`/admin/hospitals/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });

  const hospitalDetailActiveCalls = detailsTarget
    ? activeCalls.filter((call) => call.hospitalId === detailsTarget.id || call.hospitalName === (detailsTarget.displayHospitalName || detailsTarget.hospitalName || detailsTarget.fullName))
    : [];
  const hospitalDetailLogs = detailsTarget
    ? callLogs.filter((log) => log.hospitalId === detailsTarget.id || log.hospitalName === (detailsTarget.displayHospitalName || detailsTarget.hospitalName || detailsTarget.fullName)).slice(0, 6)
    : [];
  const hospitalTimelineItems = [
    ...hospitalDetailActiveCalls.map((call) => ({
      id: `hospital-active-${call.id}`,
      title: `${call.doctorName} raised ${call.messageLabel}`,
      description: `${call.department} department is waiting on hospital response.`,
      occurredAt: call.startedAt,
      tone: "active" as const,
    })),
    ...hospitalDetailLogs.map((log) => ({
      id: `hospital-log-${log.id}`,
      title: `${log.messageLabel} ${log.finalStatus}`,
      description: `${log.doctorName} · ended by ${log.endedBy}.`,
      occurredAt: log.endedAt,
      tone: "resolved" as const,
    })),
  ].sort((left, right) => right.occurredAt - left.occurredAt);
      const updated = await getAdminHospitals();
      setUsers(updated);
      await refreshSession();
      logger.success(
        status === "approved" ? `${t("hospitals.hospital")} ${t("common.statuses.approved").toLowerCase()}.` : `${t("hospitals.hospital")} ${t("common.statuses.rejected").toLowerCase()}.`,
        {
        source: "hospitals.admin",
        data: { userId, status },
        toast: true,
        destructive: status === "rejected",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update hospital status.";
      logger.error("Unable to update the hospital status.", {
        source: "hospitals.admin",
        data: { userId, status, error: message },
        toast: true,
      });
    } finally {
      setActioningHospitalId(null);
    }
  }

  function confirmRejectHospital() {
    if (!rejectTarget) return;
    void updateStatus(rejectTarget.id, "rejected");
    setRejectTarget(null);
  }

  function handleSaveHospital(user: MockUser) {
    const normalizedUser = { ...user, hospitalName: user.fullName };

    void (async () => {
      try {
        if (editTarget && normalizedUser.approvalStatus !== editTarget.approvalStatus) {
          await apiRequest(`/admin/hospitals/${normalizedUser.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: normalizedUser.approvalStatus }),
          });
        }

        await updateAdminHospitalProfile(normalizedUser);
        const updated = await getAdminHospitals();
        setUsers(updated);
        setEditTarget(null);
        await refreshSession();
        logger.success("Hospital updated.", {
          source: "hospitals.admin",
          data: { userId: normalizedUser.id, emailChanged: editTarget?.email !== normalizedUser.email },
          toast: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update hospital.";
        logger.error("Unable to update hospital.", {
          source: "hospitals.admin",
          data: { userId: normalizedUser.id, error: message },
          toast: true,
        });
      }
    })();
  }

  function handleDeleteHospital() {
    if (!deleteTarget) {
      return;
    }

    void (async () => {
      try {
        await deleteAdminHospital(deleteTarget.id);
        const updated = await getAdminHospitals();
        setUsers(updated);
        logger.warn("Hospital deleted.", {
          source: "hospitals.admin",
          data: { userId: deleteTarget.id },
          toast: true,
          destructive: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete hospital.";
        logger.error("Unable to delete hospital.", {
          source: "hospitals.admin",
          data: { userId: deleteTarget.id, error: message },
          toast: true,
        });
      } finally {
        setDeleteTarget(null);
      }
    })();
  }

  async function handleSubmitRequest() {
    setSubmittingRequest(true);
    setDoctorError("");

    try {
      if (!(subscriptionSummary?.remainingHospitalSlots ?? 0)) {
        throw new Error(doctorCopy.requestBlocked);
      }

      const matchedHospital =
        selectedHospital ||
        availableHospitals.find((hospital) => matchesHospitalIdentifier(hospital, hospitalIdInput));

      if (!matchedHospital) {
        throw new Error(doctorCopy.invalidHospitalId);
      }

      const alreadyRequested = requests.some((request) => request.hospitalId === matchedHospital.id);
      if (alreadyRequested) {
        throw new Error(doctorCopy.hospitalAlreadyRequested);
      }

      const nextRequests = await submitHospitalSelections(currentUser.id, [matchedHospital.id]);
      const nextSubscriptionSummary = await getDoctorSubscriptionSummary(currentUser.id);
      setRequests(nextRequests);
      setSubscriptionSummary(nextSubscriptionSummary);
      setHospitalIdInput("");
      setSelectedHospital(null);
      logger.success(doctorCopy.requestSubmitted, {
        source: "hospitals.doctor",
        data: { hospitalId: matchedHospital.id, hospitalCode: getHospitalCode(matchedHospital) },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit hospital access request.";
      setDoctorError(message);
      logger.error("Unable to submit the hospital access request.", {
        source: "hospitals.doctor",
        data: { hospitalIdInput, error: message },
        toast: true,
      });
    } finally {
      setSubmittingRequest(false);
    }
  }

  function getRevertLabel(status: HospitalSelection["status"]) {
    if (status === "pending") return t("hospitals.cancelRequest");
    if (status === "approved") return t("hospitals.removeSelection");
    return t("hospitals.clearRejection");
  }

  async function handleRemoveSelection(hospitalId: string) {
    setRemovingHospitalId(hospitalId);
    setDoctorError("");

    try {
      const nextRequests = await removeHospitalSelection(currentUser.id, hospitalId);
      const nextSubscriptionSummary = await getDoctorSubscriptionSummary(currentUser.id);
      setRequests(nextRequests);
      setSubscriptionSummary(nextSubscriptionSummary);
      logger.success("Hospital selection reverted successfully.", {
        source: "hospitals.doctor",
        data: { hospitalId },
        toast: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to revert hospital selection.";
      setDoctorError(message);
      logger.error("Unable to revert the hospital selection.", {
        source: "hospitals.doctor",
        data: { hospitalId, error: message },
        toast: true,
      });
    } finally {
      setRemovingHospitalId(null);
    }
  }

  if (currentUser.role === "doctor") {
    const approvedRequests = requests.filter((request) => request.status === "approved");
    const pendingRequests = requests.filter((request) => request.status === "pending");
    const requestedHospitalIds = new Set(requests.map((request) => request.hospitalId));
    const usedSlots = subscriptionSummary?.usedHospitalSlots ?? approvedRequests.length + pendingRequests.length;
    const hospitalLimit = subscriptionSummary?.hospitalLimit ?? 1;
    const remainingSlots = Math.max(0, subscriptionSummary?.remainingHospitalSlots ?? hospitalLimit - usedSlots);
    const subscriptionAmount = subscriptionSummary?.ratePerHospital ?? 500;
    const usagePercent = hospitalLimit > 0 ? Math.min(100, Math.round((usedSlots / hospitalLimit) * 100)) : 0;
    const hospitalSearchResults = hospitalIdInput.trim()
      ? availableHospitals
          .filter((hospital) => !requestedHospitalIds.has(hospital.id))
          .filter((hospital) => matchesHospitalSearch(hospital, hospitalIdInput))
          .slice(0, 6)
      : [];
    const approvedHospitals = approvedRequests
      .map((request) => {
        const hospital = availableHospitals.find((item) => item.id === request.hospitalId);
        if (!hospital) return null;
        return { request, hospital };
      })
      .filter(Boolean) as Array<{ request: HospitalSelection; hospital: HospitalDirectoryItem }>;

    return (
      <div className="space-y-6">
        <PageHero
          title={t("hospitals.doctorTitle")}
          description={doctorCopy.accessRequestDescription}
          icon={<Building2 className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80"
          imageAlt={t("hospitals.doctorImageAlt")}
          stats={[
            { label: t("subscriptions.plan"), value: `Rs ${subscriptionAmount}` },
            { label: t("subscriptions.hospitalLimit"), value: `${hospitalLimit} ${t("hospitals.hospitals")}` },
            { label: t("common.remaining"), value: String(remainingSlots) },
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="space-y-4 border-[#DCE9EE] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                <CopyPlus className="size-5" />
              </div>
              <div className="space-y-1">
                <h2 className="ui-section-title">{doctorCopy.accessRequestTitle}</h2>
                <p className="ui-body-secondary">{doctorCopy.requestHint}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#E2E8F0] bg-[#FCFEFF] p-3">
                <p className="ui-meta">{t("hospitals.approvedCount")}</p>
                <p className="mt-2 text-[22px] font-medium leading-7 text-[#0F172A]">{approvedRequests.length}</p>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-[#FCFEFF] p-3">
                <p className="ui-meta">{t("hospitals.pendingCount")}</p>
                <p className="mt-2 text-[22px] font-medium leading-7 text-[#0F172A]">{pendingRequests.length}</p>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-[#FCFEFF] p-3">
                <p className="ui-meta">{doctorCopy.progressLabel}</p>
                <p className="mt-2 text-[22px] font-medium leading-7 text-[#0F172A]">{usagePercent}%</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_260px]">
              <div className="space-y-4">
                <label className="grid gap-2 text-sm text-[#0F172A]">
                  <span className="font-medium">{doctorCopy.hospitalIdLabel}</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                    <Input
                      value={hospitalIdInput}
                      onChange={(event) => {
                        setHospitalIdInput(event.target.value);
                        setSelectedHospital(null);
                      }}
                      placeholder={doctorCopy.hospitalIdPlaceholder}
                      className="border-[#D7E3EA] bg-white pl-10 shadow-sm"
                    />
                  </div>
                </label>

                <p className="ui-body-secondary">{doctorCopy.searchHelper || "Search by hospital name, city/state, or hospital ID."}</p>

                {hospitalIdInput.trim() ? (
                  <div className="rounded-lg border border-[#E2E8F0] bg-white">
                    {hospitalSearchResults.length ? (
                      <div className="divide-y divide-[#EEF4F7]">
                        {hospitalSearchResults.map((hospital) => {
                          const location = splitLocation(hospital.displayLocation || hospital.location);
                          const hospitalCode = getHospitalCode(hospital);

                          return (
                            <button
                              key={hospital.id}
                              type="button"
                              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#F8FAFC]"
                              onClick={() => {
                                setSelectedHospital(hospital);
                                setHospitalIdInput(hospital.displayName || hospital.name);
                              }}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#0F172A]">{hospital.displayName || hospital.name}</p>
                                <p className="mt-1 text-xs text-[#64748B]">
                                  {[location.city, location.state].filter(Boolean).join(", ") || t("hospitals.locationUnavailable")}
                                </p>
                              </div>
                              <span className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-[#0EA5A4]">
                                {hospitalCode}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-[#64748B]">
                        {doctorCopy.searchResultsEmpty || "No hospitals matched your search."}
                      </div>
                    )}
                  </div>
                ) : null}

                {selectedHospital ? (
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                        <Fingerprint className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748B]">
                          {doctorCopy.selectedHospitalTitle || "Selected hospital"}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-[#0F172A]">
                          {selectedHospital.displayName || selectedHospital.name}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#0EA5A4]">
                          {getHospitalCode(selectedHospital)}
                        </p>
                        <p className="mt-2 text-sm text-[#64748B]">
                          {[splitLocation(selectedHospital.displayLocation || selectedHospital.location).city, splitLocation(selectedHospital.displayLocation || selectedHospital.location).state]
                            .filter(Boolean)
                            .join(", ") || t("hospitals.locationUnavailable")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {doctorError ? <p className="ui-body text-[#EF4444]">{doctorError}</p> : null}

                <Button
                  size="sm"
                  className="px-4"
                  onClick={() => void handleSubmitRequest()}
                  loading={submittingRequest}
                  disabled={!selectedHospital && !hospitalIdInput.trim() || remainingSlots === 0}
                >
                  {doctorCopy.requestAccess}
                </Button>

                <p className="ui-body-secondary">{doctorCopy.requestUsage}</p>
              </div>

              <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <div className="flex items-center gap-2">
                  <WalletCards className="size-4 text-[#0EA5A4]" />
                  <p className="text-sm font-medium text-[#0F172A]">{doctorCopy.progressLabel}</p>
                </div>
                <div className="mt-4 h-2 rounded-full bg-[#D9F3F1]">
                  <div className="h-2 rounded-full bg-[#0EA5A4]" style={{ width: `${Math.max(usagePercent, 6)}%` }} />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-[#64748B]">
                    <span>{t("subscriptions.hospitalLimit")}</span>
                    <span className="font-medium text-[#0F172A]">{hospitalLimit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#64748B]">
                    <span>{t("subscriptions.used")}</span>
                    <span className="font-medium text-[#0F172A]">{usedSlots}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#64748B]">
                    <span>{t("common.remaining")}</span>
                    <span className="font-medium text-[#0F172A]">{remainingSlots}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 border-[#DCE9EE] p-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0EA5A4]">
                  <ClockArrowUp className="size-4" />
                </div>
                <h2 className="ui-section-title">{doctorCopy.pendingSidebarTitle}</h2>
              </div>
              <p className="ui-body-secondary">{doctorCopy.pendingSidebarDescription}</p>
            </div>

            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const hospital = availableHospitals.find((item) => item.id === request.hospitalId) || null;
                const hospitalCode = hospital ? getHospitalCode(hospital) : request.hospitalId;

                return (
                  <div key={request.id} className="rounded-lg border border-[#E2E8F0] bg-[#FFFBEB] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">
                          {hospital?.displayName || hospital?.name || request.hospitalName || t("hospitals.hospitalRequest")}
                        </p>
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#B45309]">{hospitalCode}</p>
                        <p className="ui-meta">{t("hospitals.requestedOn", { date: getRequestDateLabel(request.requestedAt) })}</p>
                        <p className="ui-meta">{doctorCopy.accessWaiting}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status="warning">{t("common.statuses.pending")}</Badge>
                        <button
                          type="button"
                          className="ui-icon-button"
                          disabled={submittingRequest || removingHospitalId === request.hospitalId}
                          onClick={() => void handleRemoveSelection(request.hospitalId)}
                          aria-label={getRevertLabel(request.status)}
                          title={getRevertLabel(request.status)}
                        >
                          {removingHospitalId === request.hospitalId ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loadingDoctorView && pendingRequests.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <p className="ui-body-secondary">{doctorCopy.pendingEmpty}</p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <Card className="border-[#DCE9EE] p-4 shadow-sm">
          <div className="flex items-start gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
              <Link2 className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="ui-section-title">{doctorCopy.approvedSectionTitle}</h2>
              <p className="ui-body-secondary">{doctorCopy.approvedSectionDescription}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {approvedHospitals.map(({ request, hospital }) => {
              const location = splitLocation(hospital.displayLocation || hospital.location);
              const hospitalCode = getHospitalCode(hospital);

              return (
                <div key={request.id} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
                          <Building2 className="size-4" />
                        </div>
                        <p className="truncate text-base font-semibold text-[#0F172A]">{hospital.displayName || hospital.name}</p>
                      </div>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-[#0EA5A4]">
                        {doctorCopy.hospitalIdCaption}: {hospitalCode}
                      </p>
                      <p className="mt-2 ui-meta">
                        {[location.city, location.state].filter(Boolean).join(", ") || t("hospitals.locationUnavailable")}
                      </p>
                    </div>
                    <Badge status="success">{doctorCopy.accessActive}</Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-[#0F172A]">
                      <CircleCheckBig className="size-4 text-[#22C55E]" />
                      <span>{doctorCopy.activeAccess}</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#0EA5A4] transition hover:text-[#0F766E]"
                      onClick={async () => {
                        await navigator.clipboard.writeText(hospitalCode);
                        logger.success(doctorCopy.copiedId, {
                          source: "hospitals.doctor",
                          data: { hospitalId: hospital.id, hospitalCode },
                          toast: true,
                        });
                      }}
                    >
                      <RotateCcw className="size-4" />
                      {doctorCopy.hospitalIdCaption}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!loadingDoctorView && approvedHospitals.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="ui-body-secondary">{doctorCopy.approvedEmpty}</p>
            </div>
          ) : null}
        </Card>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">{t("hospitals.fallbackModuleTitle")}</h2>
        <p className="mt-1 text-sm text-[#64748B]">{t("hospitals.fallbackModuleDescription")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title={t("hospitals.adminTitle")}
        description={t("hospitals.adminDescription")}
        icon={<ShieldCheck className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80"
        imageAlt={t("hospitals.adminImageAlt")}
        stats={[
          { label: t("common.statuses.pending"), value: String(users.filter((user) => user.role === "hospital" && user.approvalStatus === "pending").length) },
          { label: t("common.statuses.approved"), value: String(users.filter((user) => user.role === "hospital" && user.approvalStatus === "approved").length) },
          { label: t("common.statuses.rejected"), value: String(users.filter((user) => user.role === "hospital" && user.approvalStatus === "rejected").length) },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("hospitals.searchHospitalEmail")}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: t("common.statuses.pending"), value: "pending" },
          { label: t("common.statuses.approved"), value: "approved" },
          { label: t("common.statuses.rejected"), value: "rejected" },
          { label: t("common.statuses.allStatuses"), value: "all" },
        ]}
        sortValue={sortOrder}
        onSortChange={setSortOrder}
        sortOptions={[
          { label: "Registered: newest first", value: "registered-desc" },
          { label: "Registered: oldest first", value: "registered-asc" },
          { label: "Hospital: A to Z", value: "name-asc" },
          { label: "Hospital: Z to A", value: "name-desc" },
          { label: "Status: A to Z", value: "status-asc" },
          { label: "Status: Z to A", value: "status-desc" },
        ]}
      />

      <Card className="p-4">
        <Table<HospitalRow>
          columns={[
            {
              key: "profile",
              header: t("hospitals.profile"),
              sortable: true,
              sortValue: (row) => row.displayHospitalName || row.hospitalName || row.fullName,
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.displayHospitalName || row.hospitalName || row.fullName} size="sm" className="bg-[#F0FDFA] text-[#0EA5A4]" />
                  <div>
                    <p className="ui-section-title">{row.displayHospitalName || row.hospitalName || row.fullName}</p>
                    <p className="mt-1 ui-meta">{row.email}</p>
                    <p className="mt-1 ui-meta">{t("hospitals.hospitalAccount")}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "details",
              header: t("hospitals.details"),
              sortable: true,
              sortValue: (row) => row.displayCity || row.city || "",
              render: (row) => (
                <div className="space-y-1">
                  <p className="ui-body">{row.mobileNumber}</p>
                  <p className="ui-meta">{row.displayCity || row.city}, {row.displayState || row.state}</p>
                  <p className="ui-meta">{row.displayCountry || row.country}</p>
                  <Button variant="ghost" size="sm" className="mt-2 px-0 text-[#0EA5A4]" onClick={() => setDetailsTarget(row)}>
                    Operational details
                  </Button>
                </div>
              ),
            },
            {
              key: "registrationDate",
              header: t("hospitals.registered"),
              sortable: true,
              sortValue: (row) => row.registrationDate || "",
              render: (row) => (
                <div className="space-y-1">
                  <p className="ui-body">{formatDisplayDate(row.registrationDate || "")}</p>
                  <p className="ui-meta">{t("common.requestedRecently")}</p>
                </div>
              ),
            },
            {
              key: "approvalStatus",
              header: t("common.actions.status"),
              className: "min-w-[140px] align-middle",
              sortable: true,
              sortValue: (row) => row.approvalStatus,
              render: (row) => (
                <ApprovalStatusBadge
                  status={row.approvalStatus}
                  approvedLabel={t("common.statuses.approved")}
                  pendingLabel={t("common.statuses.pending")}
                  rejectedLabel={t("common.statuses.rejected")}
                />
              ),
            },
            {
              key: "actions",
              header: t("hospitals.actions"),
              className: "min-w-[320px] align-middle",
              headerClassName: "min-w-[320px]",
              render: (row) => (
                <ApprovalActionGroup
                  status={row.approvalStatus}
                  approveLabel={t("common.actions.approve")}
                  rejectLabel={t("common.actions.reject")}
                  editLabel={t("common.actions.edit")}
                  deleteLabel={t("common.actions.delete")}
                  itemName={row.displayHospitalName || row.hospitalName || row.fullName}
                  busy={actioningHospitalId === row.id}
                  onApprove={() => void updateStatus(row.id, "approved")}
                  onReject={() => setRejectTarget(row)}
                  onEdit={() => setEditTarget(row)}
                  onDelete={() => setDeleteTarget(row)}
                />
              ),
            },
          ]}
          data={hospitalRows}
          pageSize={6}
          stickyHeader
          emptyMessage={t("hospitals.noHospitalsFiltered")}
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(rejectTarget)}
        title={t("hospitals.rejectDialogTitle")}
        description={t("hospitals.rejectDialogDescription")}
        confirmLabel={t("hospitals.confirmReject")}
        cancelLabel={t("common.actions.cancel")}
        confirmVariant="danger"
        onConfirm={confirmRejectHospital}
        onCancel={() => setRejectTarget(null)}
      />
      <AdminUserEditModal
        open={Boolean(editTarget)}
        role="hospital"
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveHospital}
      />
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title={t("hospitals.deleteDialogTitle")}
        description={t("hospitals.deleteDialogDescription")}
        confirmLabel={t("common.actions.delete")}
        cancelLabel={t("common.actions.cancel")}
        confirmVariant="danger"
        onConfirm={handleDeleteHospital}
        onCancel={() => setDeleteTarget(null)}
      />
      <OperationalDetailsModal
        open={Boolean(detailsTarget)}
        title={`${detailsTarget?.displayHospitalName || detailsTarget?.hospitalName || detailsTarget?.fullName || "Hospital"} Operations`}
        onClose={() => setDetailsTarget(null)}
        activeCalls={scopedHospitalDetailActiveCalls}
        recentLogs={scopedHospitalDetailLogs}
        timelineItems={scopedHospitalTimelineItems}
      />
    </div>
  );
}
