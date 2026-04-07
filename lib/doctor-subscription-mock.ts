import { apiRequest } from "@/lib/api";

export interface DoctorSubscriptionRecord {
  id: string;
  fullName: string;
  hospitalCount: number;
  ratePerHospital: number;
}

export async function getDoctorSubscriptionRecords() {
  const response = await apiRequest<{ items: DoctorSubscriptionRecord[] }>(
    "/admin/doctor-subscriptions"
  );
  return response.items || [];
}

export async function updateDoctorSubscriptionRate(doctorId: string, ratePerHospital: number) {
  if (!doctorId) {
    throw new Error("Doctor id is required");
  }
  const numericRate = Number(ratePerHospital);
  if (Number.isNaN(numericRate) || numericRate < 0) {
    throw new Error("Rate per hospital must be a non-negative number");
  }
  return apiRequest<DoctorSubscriptionRecord>(`/admin/doctor-subscriptions/${doctorId}`, {
    method: "PATCH",
    body: JSON.stringify({ ratePerHospital: numericRate }),
  });
}

export const fetchDoctorSubscriptionRecords = getDoctorSubscriptionRecords;
export const updateDoctorSubscription = updateDoctorSubscriptionRate;

export default {
  getDoctorSubscriptionRecords,
  updateDoctorSubscriptionRate,
};
