import { apiRequest, buildQuery } from "@/lib/api";
import type {
  DoctorDirectoryItem,
  DoctorScheduleRecord,
  PatientTokenStatus,
  PatientTokenRecord,
} from "@/lib/scheduling-types";

export interface ScheduleDoctorDirectoryItem extends DoctorDirectoryItem {
  userId?: string;
  email?: string;
  phone?: string;
  status?: string;
  isApproved?: boolean;
}

interface ScheduleBootstrapResponse {
  hospital: {
    id: string;
    userId: string;
    name: string;
    departments: string[];
    status: string;
  };
  departments: string[];
  displayDepartments?: string[];
  doctors: ScheduleDoctorDirectoryItem[];
  consultationTimeOptions: number[];
  doctorAssignments?: Array<{
    doctorId: string;
    doctorName: string;
    displayDoctorName?: string;
    department: string;
    displayDepartment?: string;
  }>;
}

interface BackendScheduleRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  displayDoctorName?: string;
  department: string;
  displayDepartment?: string;
  date: string;
  consultationTime: number;
  startTime?: string;
  endTime?: string;
  slots: Array<{
    time: string;
    isBooked: boolean;
  }>;
}

interface BackendPatientTokenRecord {
  id: string;
  tokenNumber: number;
  patientName: string;
  displayPatientName?: string;
  dob: string;
  bloodGroup: string;
  aadhaar: string;
  contact: string;
  department: string;
  displayDepartment?: string;
  doctorName: string;
  displayDoctorName?: string;
  date: string;
  time: string;
  status?: string;
  createdAt?: string;
  createdAtDisplay?: string;
}

interface ScheduleSummary {
  date: string;
  totalSchedules: number;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
}

interface AssignTokenResponse {
  assignment: {
    tokenNumber: number;
    doctorName: string;
    department: string;
    date: string;
    time: string;
  };
  token: BackendPatientTokenRecord;
  schedule: BackendScheduleRecord;
}

export interface ScheduleListParams {
  date?: string;
  department?: string;
  doctorId?: string;
}

export interface CreateDoctorSchedulePayload {
  doctorId: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationTime: number;
}

export interface UpdateDoctorSchedulePayload extends CreateDoctorSchedulePayload {
  scheduleId: string;
}

export interface AssignPatientTokenPayload {
  patientName: string;
  dob: string;
  bloodGroup: string;
  aadhaar: string;
  contact: string;
  department: string;
  date?: string;
  doctorId?: string;
}

export interface UpdatePatientTokenStatusPayload {
  tokenId: string;
  status: PatientTokenStatus;
}

export interface UpdatePatientTokenPayload {
  tokenId: string;
  patientName: string;
  dob: string;
  bloodGroup: string;
  aadhaar: string;
  contact: string;
}

function normalizePatientTokenStatus(status?: string): PatientTokenStatus {
  if (status === "CALLING" || status === "COMPLETED") {
    return status;
  }

  return "NOT_STARTED";
}

function mapSchedule(record: BackendScheduleRecord): DoctorScheduleRecord {
  return {
    id: record.id,
    doctorId: record.doctorId,
    doctorName: record.doctorName,
    displayDoctorName: record.displayDoctorName || record.doctorName,
    department: record.department,
    displayDepartment: record.displayDepartment || record.department,
    date: record.date,
    consultationTime: record.consultationTime,
    startTime: record.startTime,
    endTime: record.endTime,
    slots: (record.slots || []).map((slot) => ({
      time: slot.time,
      isBooked: slot.isBooked,
    })),
  };
}

function mapBootstrapDoctor(doctor: ScheduleDoctorDirectoryItem): ScheduleDoctorDirectoryItem {
  return {
    ...doctor,
    id: doctor.userId || doctor.id,
    isApproved: doctor.isApproved ?? doctor.status === "approved",
  };
}

function mapToken(record: BackendPatientTokenRecord): PatientTokenRecord {
  return {
    id: record.id,
    tokenNumber: record.tokenNumber,
    patientName: record.patientName,
    displayPatientName: record.displayPatientName || record.patientName,
    dob: record.dob,
    bloodGroup: record.bloodGroup,
    aadhaar: record.aadhaar || "",
    contact: record.contact,
    department: record.department,
    displayDepartment: record.displayDepartment || record.department,
    doctorName: record.doctorName,
    displayDoctorName: record.displayDoctorName || record.doctorName,
    date: record.date,
    time: record.time,
    status: normalizePatientTokenStatus(record.status),
    createdAt: record.createdAtDisplay || record.createdAt || "",
  };
}

export async function getScheduleBootstrap() {
  const data = await apiRequest<ScheduleBootstrapResponse>("/doctor-schedules/bootstrap");
  return {
    ...data,
    doctors: (data.doctors || []).map(mapBootstrapDoctor),
  };
}

export async function getDoctorSchedules(params: ScheduleListParams = {}) {
  const data = await apiRequest<BackendScheduleRecord[]>(
    `/doctor-schedules${buildQuery({
      date: params.date,
      department: params.department,
      doctorId: params.doctorId,
    })}`
  );
  return (data || []).map(mapSchedule);
}

export async function createDoctorSchedule(payload: CreateDoctorSchedulePayload) {
  const data = await apiRequest<BackendScheduleRecord>("/doctor-schedules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapSchedule(data);
}

export async function updateDoctorSchedule(payload: UpdateDoctorSchedulePayload) {
  const data = await apiRequest<BackendScheduleRecord>(`/doctor-schedules/${payload.scheduleId}`, {
    method: "PATCH",
    body: JSON.stringify({
      doctorId: payload.doctorId,
      department: payload.department,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      consultationTime: payload.consultationTime,
    }),
  });
  return mapSchedule(data);
}

export async function deleteDoctorSchedule(scheduleId: string) {
  return apiRequest<{ success?: boolean; message?: string }>(`/doctor-schedules/${scheduleId}`, {
    method: "DELETE",
  });
}

export async function getScheduleSummary(date?: string) {
  return apiRequest<ScheduleSummary>(`/doctor-schedules/summary${buildQuery({ date })}`);
}

export async function getPatientTokens(params: ScheduleListParams = {}) {
  const data = await apiRequest<BackendPatientTokenRecord[]>(
    `/doctor-schedules/tokens${buildQuery({
      date: params.date,
      department: params.department,
      doctorId: params.doctorId,
    })}`
  );
  return (data || []).map(mapToken);
}

export async function assignPatientToken(payload: AssignPatientTokenPayload) {
  const data = await apiRequest<AssignTokenResponse>("/doctor-schedules/assign-token", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    assignment: data.assignment,
    token: mapToken(data.token),
    schedule: mapSchedule(data.schedule),
  };
}

export async function updatePatientTokenStatus(payload: UpdatePatientTokenStatusPayload) {
  const data = await apiRequest<BackendPatientTokenRecord>(
    `/doctor-schedules/tokens/${payload.tokenId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: payload.status }),
    }
  );

  return mapToken(data);
}

export async function updatePatientToken(payload: UpdatePatientTokenPayload) {
  const data = await apiRequest<BackendPatientTokenRecord>(
    `/doctor-schedules/tokens/${payload.tokenId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        patientName: payload.patientName,
        dob: payload.dob,
        bloodGroup: payload.bloodGroup,
        aadhaar: payload.aadhaar,
        contact: payload.contact,
      }),
    }
  );

  return mapToken(data);
}

export async function deletePatientToken(tokenId: string) {
  return apiRequest<{ id: string }>(`/doctor-schedules/tokens/${tokenId}`, {
    method: "DELETE",
  });
}
