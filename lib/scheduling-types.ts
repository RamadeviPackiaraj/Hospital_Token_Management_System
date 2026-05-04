export interface DoctorDirectoryItem {
  id: string;
  name: string;
  department: string;
  isApproved?: boolean;
}

export interface DoctorScheduleSlot {
  time: string;
  isBooked: boolean;
}

export interface DoctorScheduleRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  consultationTime: number;
  startTime?: string;
  endTime?: string;
  slots: DoctorScheduleSlot[];
}

export type PatientTokenStatus = "NOT_STARTED" | "CALLING" | "COMPLETED";

export interface PatientTokenRecord {
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
  status: PatientTokenStatus;
  createdAt: string;
}

export const consultationTimeOptions = [
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
] as const;

export const bloodGroupOptions = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
] as const;
