import { apiRequest, buildQuery } from "@/lib/api";
import type {
  DoctorDirectoryItem,
  DoctorScheduleRecord,
  PatientTokenRecord,
} from "@/lib/mock-data/scheduling";

export interface ScheduleDoctorDirectoryItem extends DoctorDirectoryItem {
  userId?: string;
  email?: string;
  phone?: string;
  status?: string;
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
  doctors: ScheduleDoctorDirectoryItem[];
  consultationTimeOptions: number[];
}

interface BackendScheduleRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
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
  dob: string;
  bloodGroup: string;
  aadhaar: string;
  contact: string;
  department: string;
  doctorName: string;
  date: string;
  time: string;
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

function mapSchedule(record: BackendScheduleRecord): DoctorScheduleRecord {
  return {
    id: record.id,
    doctorId: record.doctorId,
    doctorName: record.doctorName,
    department: record.department,
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
  };
}

function mapToken(record: BackendPatientTokenRecord): PatientTokenRecord {
  return {
    id: record.id,
    tokenNumber: record.tokenNumber,
    patientName: record.patientName,
    dob: record.dob,
    bloodGroup: record.bloodGroup,
    aadhaar: record.aadhaar || "",
    contact: record.contact,
    department: record.department,
    doctorName: record.doctorName,
    date: record.date,
    time: record.time,
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
