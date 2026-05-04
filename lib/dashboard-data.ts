import { apiRequest, buildQuery } from "@/lib/api";
import {
  mapAdminEntityToMockUser,
  type AdminEntityItem,
  type MockUser,
} from "@/lib/auth-flow";

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

export interface DoctorSubscriptionRecord {
  id: string;
  fullName: string;
  displayFullName?: string;
  hospitalCount: number;
  ratePerHospital: number;
}

export interface DoctorSubscriptionSummary {
  doctorId: string;
  userId: string;
  fullName: string;
  displayFullName?: string;
  ratePerHospital: number;
  hospitalLimit: number;
  usedHospitalSlots: number;
  remainingHospitalSlots: number;
  approvedHospitalCount: number;
  pendingHospitalCount: number;
  rejectedHospitalCount: number;
  currentTotal: number;
  projectedTotal: number;
}

export interface HospitalDoctorDepartmentAssignment {
  doctorId: string;
  doctorName: string;
  displayDoctorName?: string;
  department: string;
  displayDepartment?: string;
}

export interface HospitalSelection {
  id: string;
  doctorId: string;
  hospitalId: string;
  hospitalName?: string;
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
    `/admin/hospitals${buildQuery({ limit: 100 })}`
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
  const trimmed = defaultFee.trim();
  if (!trimmed) {
    throw new Error("Default fee is required");
  }

  const amount = Number(trimmed);
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error("Default fee must be a non-negative number");
  }
  await apiRequest("/admin/subscription/default", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  return getSubscriptionSettings();
}

export async function updateCustomHospitalFee(hospitalId: string, fee: string) {
  const trimmed = fee.trim();
  if (!trimmed) {
    throw new Error("Fee is required");
  }

  const amount = Number(trimmed);
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error("Fee must be a non-negative number");
  }
  await apiRequest("/admin/subscription/hospital", {
    method: "POST",
    body: JSON.stringify({ hospitalId, amount }),
  });
  return getSubscriptionSettings();
}

export async function getSelectionsForDoctor(doctorId: string) {
  const doctor = await apiRequest<{
    selected_hospitals: any[];
    approved_hospitals: any[];
    rejected_hospitals: any[];
  }>(
    `/doctors/${doctorId}`
  );

  const now = new Date().toISOString().slice(0, 10);
  const pending = (doctor.selected_hospitals || []).map((hospital) => ({
    id: `${doctorId}:${hospital.id}:pending`,
    doctorId,
    hospitalId: hospital.id,
    hospitalName: hospital.displayName || hospital.name,
    status: "pending" as const,
    requestedAt: now,
  }));

  const approved = (doctor.approved_hospitals || []).map((hospital) => ({
    id: `${doctorId}:${hospital.id}:approved`,
    doctorId,
    hospitalId: hospital.id,
    hospitalName: hospital.displayName || hospital.name,
    status: "approved" as const,
    requestedAt: now,
  }));

  const rejected = (doctor.rejected_hospitals || []).map((hospital) => ({
    id: `${doctorId}:${hospital.id}:rejected`,
    doctorId,
    hospitalId: hospital.id,
    hospitalName: hospital.displayName || hospital.name,
    status: "rejected" as const,
    requestedAt: now,
  }));

  return [...pending, ...approved, ...rejected];
}

export async function getSelectionsForHospital(hospitalId: string) {
  const pendingData = await apiRequest<{ doctors: any[] }>(
    `/hospitals/${hospitalId}/pending-doctors`
  );
  const approvedData = await apiRequest<{ doctors: any[] }>(
    `/hospitals/${hospitalId}/approved-doctors`
  );
  const rejectedData = await apiRequest<{ doctors: any[] }>(
    `/hospitals/${hospitalId}/rejected-doctors`
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

  const rejected = (rejectedData.doctors || []).map((doctor) => ({
    id: `${doctor.userId}:${hospitalId}:rejected`,
    doctorId: doctor.userId,
    hospitalId,
    status: "rejected" as const,
    requestedAt: now,
  }));

  return [...pending, ...approved, ...rejected];
}

export async function getApprovedDoctorsForHospital(hospitalId: string) {
  const approvedData = await apiRequest<{ doctors: any[] }>(
    `/hospitals/${hospitalId}/approved-doctors`
  );

  return (approvedData.doctors || []).map(
    (doctor): MockUser => ({
      id: String(doctor.id || doctor._id || doctor.userId || ""),
      role: "doctor",
      fullName: doctor.name,
      displayFullName: doctor.displayName || doctor.name,
      mobileNumber: doctor.phone,
      email: doctor.email,
      department: doctor.department,
      displayDepartment: doctor.displayDepartment || doctor.department,
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

export async function removeHospitalSelection(doctorId: string, hospitalId: string) {
  await apiRequest(`/doctors/${doctorId}/select-hospital/${hospitalId}`, {
    method: "DELETE",
  });

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
    `/admin/hospitals${buildQuery({ limit: 100 })}`
  );
  return (response.items || []).map(mapAdminEntityToMockUser);
}

export async function getAdminDoctors() {
  const response = await apiRequest<{ items: any[] }>(
    `/admin/doctors${buildQuery({ limit: 100 })}`
  );
  return (response.items || []).map(mapAdminEntityToMockUser);
}

function setIfNotBlank(payload: Record<string, unknown>, key: string, value: string | undefined) {
  if (value == null) return;
  const trimmed = value.trim();
  if (trimmed) {
    payload[key] = trimmed;
  }
}

function buildLocation(user: MockUser) {
  const parts = [user.city, user.state, user.country].map((value) => value?.trim()).filter(Boolean);
  return parts.join(", ");
}

export async function updateAdminDoctorProfile(user: MockUser) {
  const payload: Record<string, unknown> = {};

  setIfNotBlank(payload, "name", user.fullName);
  setIfNotBlank(payload, "phone", user.mobileNumber);
  setIfNotBlank(payload, "department", user.department);
  setIfNotBlank(payload, "gender", user.gender);
  setIfNotBlank(payload, "specialization", user.specialization);
  setIfNotBlank(payload, "medicalRegistrationId", user.medicalRegistrationId);
  setIfNotBlank(payload, "blood_group", user.bloodGroup);

  if (Object.keys(payload).length === 0) {
    return null;
  }

  const updated = await apiRequest<AdminEntityItem>(`/admin/doctors/${user.id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return mapAdminEntityToMockUser(updated);
}

export async function updateAdminHospitalProfile(user: MockUser) {
  const payload: Record<string, unknown> = {};

  setIfNotBlank(payload, "name", user.hospitalName || user.fullName);
  setIfNotBlank(payload, "phone", user.mobileNumber);

  const location = buildLocation(user);
  if (location) {
    payload.location = location;
  }

  if (user.department && user.department.trim()) {
    payload.departments = [user.department.trim()];
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  const updated = await apiRequest<AdminEntityItem>(`/admin/hospitals/${user.id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return mapAdminEntityToMockUser(updated);
}

export async function deleteAdminDoctor(userId: string) {
  if (!userId) {
    throw new Error("Doctor id is required");
  }
  await apiRequest(`/admin/doctors/${userId}`, { method: "DELETE" });
}

export async function deleteAdminHospital(userId: string) {
  if (!userId) {
    throw new Error("Hospital id is required");
  }
  await apiRequest(`/admin/hospitals/${userId}`, { method: "DELETE" });
}

export async function requestAdminUserEmailChange(userId: string, email: string) {
  const trimmed = email.trim();
  if (!userId) {
    throw new Error("User id is required");
  }
  if (!trimmed) {
    throw new Error("Email is required");
  }
  await apiRequest(`/admin/users/${userId}/email-change`, {
    method: "POST",
    body: JSON.stringify({ email: trimmed }),
  });
}

export async function verifyAdminUserEmailChange(userId: string, otp: string) {
  const trimmed = otp.trim();
  if (!userId) {
    throw new Error("User id is required");
  }
  if (!trimmed) {
    throw new Error("OTP is required");
  }
  return apiRequest<{ id: string; email: string }>(`/admin/users/${userId}/email-change/verify`, {
    method: "POST",
    body: JSON.stringify({ otp: trimmed }),
  });
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

export async function getDoctorSubscriptionSummary(doctorId: string) {
  if (!doctorId) {
    throw new Error("Doctor id is required");
  }

  return apiRequest<DoctorSubscriptionSummary>(`/doctors/${doctorId}/subscription-summary`);
}

export async function getHospitalDepartmentAssignments(hospitalId: string) {
  if (!hospitalId) {
    throw new Error("Hospital id is required");
  }
  const response = await apiRequest<{ items: HospitalDoctorDepartmentAssignment[] }>(
    `/hospitals/${hospitalId}/department-assignments`
  );
  return response.items || [];
}

export async function upsertHospitalDepartmentAssignment(
  hospitalId: string,
  doctorId: string,
  departmentId: string
) {
  if (!hospitalId) {
    throw new Error("Hospital id is required");
  }
  if (!doctorId) {
    throw new Error("Doctor id is required");
  }
  if (!departmentId) {
    throw new Error("Department id is required");
  }
  return apiRequest<HospitalDoctorDepartmentAssignment>(
    `/hospitals/${hospitalId}/department-assignments`,
    {
      method: "POST",
      body: JSON.stringify({ doctorId, departmentId }),
    }
  );
}

export async function updateHospitalDepartmentAssignment(
  hospitalId: string,
  doctorId: string,
  departmentId: string
) {
  if (!hospitalId) {
    throw new Error("Hospital id is required");
  }
  if (!doctorId) {
    throw new Error("Doctor id is required");
  }
  if (!departmentId) {
    throw new Error("Department id is required");
  }
  return apiRequest<HospitalDoctorDepartmentAssignment>(
    `/hospitals/${hospitalId}/department-assignments/${doctorId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ departmentId }),
    }
  );
}

export async function deleteHospitalDepartmentAssignment(hospitalId: string, doctorId: string) {
  if (!hospitalId) {
    throw new Error("Hospital id is required");
  }
  if (!doctorId) {
    throw new Error("Doctor id is required");
  }
  return apiRequest<{ success: boolean }>(
    `/hospitals/${hospitalId}/department-assignments/${doctorId}`,
    {
      method: "DELETE",
    }
  );
}
