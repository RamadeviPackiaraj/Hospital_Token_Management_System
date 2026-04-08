import {
  getDoctorSubscriptionRecords as fetchDoctorSubscriptionRecordsFromApi,
  updateDoctorSubscriptionRate,
  type DoctorSubscriptionRecord,
} from "@/lib/dashboard-data";

export type { DoctorSubscriptionRecord };

export async function getDoctorSubscriptionRecords(): Promise<DoctorSubscriptionRecord[]> {
  return fetchDoctorSubscriptionRecordsFromApi();
}

export async function saveDoctorSubscriptionRecords(
  records: DoctorSubscriptionRecord[]
): Promise<DoctorSubscriptionRecord[]> {
  await Promise.all(
    records.map((record) => updateDoctorSubscriptionRate(record.id, record.ratePerHospital))
  );

  return fetchDoctorSubscriptionRecordsFromApi();
}

export const fetchDoctorSubscriptionRecords = getDoctorSubscriptionRecords;
export const updateDoctorSubscription = updateDoctorSubscriptionRate;

export default {
  getDoctorSubscriptionRecords,
  saveDoctorSubscriptionRecords,
  updateDoctorSubscriptionRate,
};
