export interface DoctorDirectoryItem {
  id: string;
  name: string;
  department: string;
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

export interface PatientTokenRecord {
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
  createdAt: string;
}

export const mockDepartments = [
  "Cardiology",
  "Dermatology",
  "General Medicine",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
] as const;

export const mockDoctors: DoctorDirectoryItem[] = [
  { id: "doc-101", name: "Dr. Asha Menon", department: "Cardiology" },
  { id: "doc-102", name: "Dr. Karthik Rao", department: "Dermatology" },
  { id: "doc-103", name: "Dr. Nisha Varma", department: "General Medicine" },
  { id: "doc-104", name: "Dr. Rahul Iyer", department: "Neurology" },
  { id: "doc-105", name: "Dr. Meera Sethi", department: "Orthopedics" },
  { id: "doc-106", name: "Dr. Vivek Anand", department: "Pediatrics" },
] as const;

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

export const mockDoctorSchedules: DoctorScheduleRecord[] = [
  {
    id: "schedule-101",
    doctorId: "doc-101",
    doctorName: "Dr. Asha Menon",
    department: "Cardiology",
    date: "2026-04-01",
    consultationTime: 15,
    slots: [
      { time: "10:00", isBooked: true },
      { time: "10:15", isBooked: false },
      { time: "10:30", isBooked: false },
      { time: "10:45", isBooked: false },
    ],
  },
  {
    id: "schedule-102",
    doctorId: "doc-103",
    doctorName: "Dr. Nisha Varma",
    department: "General Medicine",
    date: "2026-04-01",
    consultationTime: 30,
    slots: [
      { time: "11:00", isBooked: true },
      { time: "11:30", isBooked: true },
      { time: "12:00", isBooked: false },
    ],
  },
];

export const mockPatientTokens: PatientTokenRecord[] = [
  {
    id: "token-101",
    tokenNumber: 1,
    patientName: "Arjun Kumar",
    dob: "1992-08-14",
    bloodGroup: "B+",
    aadhaar: "458712369854",
    contact: "9876543210",
    department: "Cardiology",
    doctorName: "Dr. Asha Menon",
    date: "2026-04-01",
    time: "10:00",
    createdAt: "01/04/2026, 09:52 am",
  },
  {
    id: "token-102",
    tokenNumber: 1,
    patientName: "Meena Joseph",
    dob: "1988-11-02",
    bloodGroup: "O+",
    aadhaar: "",
    contact: "meena.joseph@email.com",
    department: "General Medicine",
    doctorName: "Dr. Nisha Varma",
    date: "2026-04-01",
    time: "11:00",
    createdAt: "01/04/2026, 10:18 am",
  },
  {
    id: "token-103",
    tokenNumber: 2,
    patientName: "Rohan Shah",
    dob: "2001-03-27",
    bloodGroup: "A-",
    aadhaar: "741258963147",
    contact: "rohan.shah@email.com",
    department: "General Medicine",
    doctorName: "Dr. Nisha Varma",
    date: "2026-04-01",
    time: "11:30",
    createdAt: "01/04/2026, 10:44 am",
  },
];
