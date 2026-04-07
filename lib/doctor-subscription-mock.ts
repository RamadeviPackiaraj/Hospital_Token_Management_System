"use client";

export interface DoctorSubscriptionRecord {
  id: string;
  fullName: string;
  hospitalCount: number;
  ratePerHospital: number;
}

const STORAGE_KEY = "hospital_token_admin_doctor_subscriptions";

const defaultDoctorSubscriptions: DoctorSubscriptionRecord[] = [
  { id: "doc-101", fullName: "Dr A", hospitalCount: 3, ratePerHospital: 500 },
  { id: "doc-102", fullName: "Dr B", hospitalCount: 2, ratePerHospital: 500 },
  { id: "doc-103", fullName: "Dr C", hospitalCount: 1, ratePerHospital: 500 },
];

function cloneRecords(records: DoctorSubscriptionRecord[]) {
  return records.map((record) => ({ ...record }));
}

export async function getDoctorSubscriptionRecords(): Promise<DoctorSubscriptionRecord[]> {
  if (typeof window === "undefined") {
    return cloneRecords(defaultDoctorSubscriptions);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneRecords(defaultDoctorSubscriptions);
    }

    const parsed = JSON.parse(raw) as DoctorSubscriptionRecord[];
    return cloneRecords(parsed);
  } catch {
    return cloneRecords(defaultDoctorSubscriptions);
  }
}

export async function saveDoctorSubscriptionRecords(
  records: DoctorSubscriptionRecord[]
): Promise<DoctorSubscriptionRecord[]> {
  const next = cloneRecords(records);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return cloneRecords(next);
}
