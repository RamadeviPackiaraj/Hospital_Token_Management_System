import { getMockUsers, type MockUser } from "@/lib/auth-flow";

export const DASHBOARD_DEPARTMENTS_KEY = "hospital_token_departments";
export const DASHBOARD_SUBSCRIPTIONS_KEY = "hospital_token_subscriptions";
export const HOSPITAL_SELECTIONS_KEY = "hospital_token_hospital_selections";

export interface DepartmentRecord {
  id: string;
  name: string;
}

export interface SubscriptionSettings {
  defaultFee: string;
  customFees: Array<{
    hospitalId: string;
    fee: string;
  }>;
}

export interface HospitalSelection {
  id: string;
  doctorId: string;
  hospitalId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

const defaultDepartments: DepartmentRecord[] = [
  { id: "dept-1", name: "Cardiology" },
  { id: "dept-2", name: "General" },
  { id: "dept-3", name: "Orthopedics" },
  { id: "dept-4", name: "ENT" }
];

const defaultSubscriptionSettings: SubscriptionSettings = {
  defaultFee: "2500",
  customFees: [
    { hospitalId: "hospital-1", fee: "3200" }
  ]
};

const defaultHospitalSelections: HospitalSelection[] = [
  {
    id: "selection-1",
    doctorId: "doctor-1",
    hospitalId: "hospital-1",
    status: "approved",
    requestedAt: "2026-03-20"
  },
  {
    id: "selection-2",
    doctorId: "doctor-2",
    hospitalId: "hospital-1",
    status: "pending",
    requestedAt: "2026-03-24"
  }
];

function getStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setStoredJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDepartments() {
  return getStoredJson<DepartmentRecord[]>(DASHBOARD_DEPARTMENTS_KEY, defaultDepartments);
}

export function addDepartment(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return getDepartments();

  const departments = getDepartments();
  const nextDepartments = [...departments, { id: createId("dept"), name: trimmed }];
  setStoredJson(DASHBOARD_DEPARTMENTS_KEY, nextDepartments);
  return nextDepartments;
}

export function updateDepartment(id: string, name: string) {
  const departments = getDepartments().map((department) =>
    department.id === id ? { ...department, name: name.trim() || department.name } : department
  );
  setStoredJson(DASHBOARD_DEPARTMENTS_KEY, departments);
  return departments;
}

export function deleteDepartment(id: string) {
  const departments = getDepartments().filter((department) => department.id !== id);
  setStoredJson(DASHBOARD_DEPARTMENTS_KEY, departments);
  return departments;
}

export function getSubscriptionSettings() {
  return getStoredJson<SubscriptionSettings>(DASHBOARD_SUBSCRIPTIONS_KEY, defaultSubscriptionSettings);
}

export function updateDefaultFee(defaultFee: string) {
  const settings = { ...getSubscriptionSettings(), defaultFee };
  setStoredJson(DASHBOARD_SUBSCRIPTIONS_KEY, settings);
  return settings;
}

export function updateCustomHospitalFee(hospitalId: string, fee: string) {
  const settings = getSubscriptionSettings();
  const customFees = settings.customFees.filter((item) => item.hospitalId !== hospitalId);

  if (fee.trim()) {
    customFees.push({ hospitalId, fee });
  }

  const nextSettings = { ...settings, customFees };
  setStoredJson(DASHBOARD_SUBSCRIPTIONS_KEY, nextSettings);
  return nextSettings;
}

export function getHospitalSelections() {
  return getStoredJson<HospitalSelection[]>(HOSPITAL_SELECTIONS_KEY, defaultHospitalSelections);
}

export function getHospitalNameById(hospitalId: string) {
  const hospital = getMockUsers().find((user) => user.id === hospitalId);
  return hospital?.hospitalName || hospital?.fullName || "Hospital";
}

export function getDoctorNameById(doctorId: string) {
  const doctor = getMockUsers().find((user) => user.id === doctorId);
  return doctor?.fullName || "Doctor";
}

export function submitHospitalSelections(doctorId: string, hospitalIds: string[]) {
  const existing = getHospitalSelections();
  const existingKeys = new Set(existing.map((item) => `${item.doctorId}:${item.hospitalId}`));
  const nextSelections = [...existing];

  hospitalIds.forEach((hospitalId) => {
    const key = `${doctorId}:${hospitalId}`;
    if (!existingKeys.has(key)) {
      nextSelections.push({
        id: createId("selection"),
        doctorId,
        hospitalId,
        status: "pending",
        requestedAt: new Date().toISOString().slice(0, 10)
      });
    }
  });

  setStoredJson(HOSPITAL_SELECTIONS_KEY, nextSelections);
  return nextSelections;
}

export function updateHospitalSelectionStatus(selectionId: string, status: HospitalSelection["status"]) {
  const selections = getHospitalSelections().map((selection) =>
    selection.id === selectionId ? { ...selection, status } : selection
  );
  setStoredJson(HOSPITAL_SELECTIONS_KEY, selections);
  return selections;
}

export function getSelectionsForDoctor(doctorId: string) {
  return getHospitalSelections().filter((selection) => selection.doctorId === doctorId);
}

export function getSelectionsForHospital(hospitalId: string) {
  return getHospitalSelections().filter((selection) => selection.hospitalId === hospitalId);
}

export function getApprovedDoctorsForHospital(hospitalId: string) {
  const approvedSelectionDoctorIds = new Set(
    getSelectionsForHospital(hospitalId)
      .filter((selection) => selection.status === "approved")
      .map((selection) => selection.doctorId)
  );

  return getMockUsers().filter((user) => approvedSelectionDoctorIds.has(user.id)) as MockUser[];
}
