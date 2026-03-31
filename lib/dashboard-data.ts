import { apiRequest, buildQuery } from "@/lib/api";
import { mapAdminEntityToMockUser, type MockUser } from "@/lib/auth-flow";

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

export async function getDepartments() {
  const data = await apiRequest<DepartmentRecord[]>("/departments");
  return data || [];
}

export async function addDepartment(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return getDepartments();
  await apiRequest("/departments", {
    method: "POST",
    body: JSON.stringify({ departmentName: trimmed }),
  });
  return getDepartments();
}

export async function updateDepartment(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return getDepartments();
  await apiRequest(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify({ departmentName: trimmed }),
  });
  return getDepartments();
}

export async function deleteDepartment(id: string) {
  await apiRequest(`/departments/${id}`, { method: "DELETE" });
  return getDepartments();
}

export async function getSubscriptionSettings() {
  const defaultSubscription = await apiRequest<{ amount: number }>("/admin/subscription/default");
  const hospitalsResponse = await apiRequest<{ items: Array<Record<string, unknown>> }>(
    `/admin/hospitals${buildQuery({ limit: 200 })}`
  );

  const customFees = (hospitalsResponse.items || [])
    .filter((item) => item && (item as any).subscription_amount != null)
    .map((item) => ({
      hospitalId: String((item as any).userId || (item as any).id),
      fee: String((item as any).subscription_amount),
    }))
    .filter((fee) => fee.fee !== "");

  return {
    defaultFee: String(defaultSubscription.amount ?? 0),
    customFees,
  } satisfies SubscriptionSettings;
}

export async function updateDefaultFee(defaultFee: string) {
  const amount = Number(defaultFee);
  if (Number.isNaN(amount)) {
    throw new Error("Default fee must be a number");
  }
  await apiRequest("/admin/subscription/default", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  return getSubscriptionSettings();
}

export async function updateCustomHospitalFee(hospitalId: string, fee: string) {
  const amount = Number(fee);
  if (Number.isNaN(amount)) {
    throw new Error("Fee must be a number");
  }
  await apiRequest("/admin/subscription/hospital", {
    method: "POST",
    body: JSON.stringify({ hospitalId, amount }),
  });
  return getSubscriptionSettings();
}

export async function getSelectionsForDoctor(doctorId: string) {
  const doctor = await apiRequest<{ selected_hospitals: any[]; approved_hospitals: any[] }>(
    `/doctors/${doctorId}`
  );

  const now = new Date().toISOString().slice(0, 10);
  const pending = (doctor.selected_hospitals || []).map((hospital) => ({
    id: `${doctorId}:${hospital.id}:pending`,
    doctorId,
    hospitalId: hospital.id,
    status: "pending" as const,
    requestedAt: now,
  }));

  const approved = (doctor.approved_hospitals || []).map((hospital) => ({
    id: `${doctorId}:${hospital.id}:approved`,
    doctorId,
    hospitalId: hospital.id,
    status: "approved" as const,
    requestedAt: now,
  }));

  return [...pending, ...approved];
}

export async function getSelectionsForHospital(hospitalId: string) {
  const pendingData = await apiRequest<{ doctors: any[] }>(
    `/hospitals/${hospitalId}/pending-doctors`
  );
  const approvedData = await apiRequest<{ doctors: any[] }>(
    `/hospitals/${hospitalId}/approved-doctors`
  );

  const now = new Date().toISOString().slice(0, 10);
  const pending = (pendingData.doctors || []).map((doctor) => ({
    id: `${doctor.userId}:${hospitalId}:pending`,
    doctorId: doctor.userId,
    hospitalId,
    status: "pending" as const,
    requestedAt: now,
  }));

  const approved = (approvedData.doctors || []).map((doctor) => ({
    id: `${doctor.userId}:${hospitalId}:approved`,
    doctorId: doctor.userId,
    hospitalId,
    status: "approved" as const,
    requestedAt: now,
  }));

  return [...pending, ...approved];
}

export async function getApprovedDoctorsForHospital(hospitalId: string) {
  const approvedData = await apiRequest<{ doctors: any[] }>(
    `/hospitals/${hospitalId}/approved-doctors`
  );

  return (approvedData.doctors || []).map(
    (doctor): MockUser => ({
      id: doctor.userId,
      role: "doctor",
      fullName: doctor.name,
      mobileNumber: doctor.phone,
      email: doctor.email,
      department: doctor.department,
      approvalStatus: "approved",
      registrationDate: new Date().toISOString().slice(0, 10),
    })
  );
}

export async function submitHospitalSelections(doctorId: string, hospitalIds: string[]) {
  for (const hospitalId of hospitalIds) {
    await apiRequest(`/doctors/${doctorId}/select-hospital`, {
      method: "POST",
      body: JSON.stringify({ hospitalId }),
    });
  }

  return getSelectionsForDoctor(doctorId);
}

export async function updateHospitalSelectionStatus(selectionId: string, status: "approved" | "rejected") {
  const [doctorId, hospitalId] = selectionId.split(":");
  if (!doctorId || !hospitalId) {
    throw new Error("Invalid selection identifier");
  }

  const endpoint =
    status === "approved"
      ? `/hospitals/${hospitalId}/approve-doctor`
      : `/hospitals/${hospitalId}/reject-doctor`;

  await apiRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify({ doctorId }),
  });

  return getSelectionsForHospital(hospitalId);
}

export async function getHospitalNameById(hospitalId: string) {
  const hospital = await apiRequest<{ name: string }>(`/hospitals/${hospitalId}`);
  return hospital?.name || "Hospital";
}

export async function getDoctorNameById(doctorId: string) {
  const doctor = await apiRequest<{ name: string }>(`/doctors/${doctorId}`);
  return doctor?.name || "Doctor";
}

export async function getAdminHospitals() {
  const response = await apiRequest<{ items: any[] }>(
    `/admin/hospitals${buildQuery({ limit: 200 })}`
  );
  return (response.items || []).map(mapAdminEntityToMockUser);
}

export async function getAdminDoctors() {
  const response = await apiRequest<{ items: any[] }>(
    `/admin/doctors${buildQuery({ limit: 200 })}`
  );
  return (response.items || []).map(mapAdminEntityToMockUser);
}
