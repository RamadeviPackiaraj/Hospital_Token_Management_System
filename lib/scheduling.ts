import {
  mockDoctorSchedules,
  mockDoctors,
  type DoctorDirectoryItem,
  type DoctorScheduleRecord,
  type DoctorScheduleSlot,
} from "@/lib/mock-data/scheduling";
import { format, isValid, parse } from "date-fns";

const STORAGE_KEY = "hospital-token-doctor-schedules";

export interface CreateDoctorScheduleInput {
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationTime: number;
}

export interface TokenAssignment {
  tokenNumber: number;
  doctorName: string;
  department: string;
  date: string;
  time: string;
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function getDoctorById(doctorId: string) {
  return mockDoctors.find((doctor) => doctor.id === doctorId) ?? null;
}

export function createSelectOptions(values: readonly string[]) {
  return values.map((value) => ({ label: value, value }));
}

export function createDoctorOptions(doctors: readonly DoctorDirectoryItem[]) {
  return doctors.map((doctor) => ({
    label: doctor.name,
    value: doctor.id,
  }));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateTimeSlots(startTime: string, endTime: string, consultationTime: number) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
    return [];
  }

  if (consultationTime <= 0 || endMinutes <= startMinutes) {
    return [];
  }

  const slots: DoctorScheduleSlot[] = [];

  for (let cursor = startMinutes; cursor + consultationTime <= endMinutes; cursor += consultationTime) {
    slots.push({
      time: minutesToTime(cursor),
      isBooked: false,
    });
  }

  return slots;
}

export function buildDoctorSchedule(input: CreateDoctorScheduleInput): DoctorScheduleRecord {
  return {
    id: `schedule-${Date.now()}`,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    department: input.department,
    date: input.date,
    consultationTime: input.consultationTime,
    slots: generateTimeSlots(input.startTime, input.endTime, input.consultationTime),
  };
}

export function getStoredDoctorSchedules() {
  if (typeof window === "undefined") {
    return mockDoctorSchedules;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDoctorSchedules));
    return mockDoctorSchedules;
  }

  try {
    const parsed = JSON.parse(storedValue) as DoctorScheduleRecord[];
    return Array.isArray(parsed) ? parsed : mockDoctorSchedules;
  } catch {
    return mockDoctorSchedules;
  }
}

export function persistDoctorSchedules(schedules: DoctorScheduleRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export function formatScheduleDate(value: string) {
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) return value;
  return format(parsed, "dd/MM/yyyy");
}

export function getScheduleCounts(schedule: DoctorScheduleRecord) {
  const booked = schedule.slots.filter((slot) => slot.isBooked).length;
  const available = schedule.slots.length - booked;

  return {
    booked,
    available,
    total: schedule.slots.length,
  };
}

export function assignFirstAvailableToken(
  schedules: DoctorScheduleRecord[],
  department: string,
  date: string
) {
  const updatedSchedules = schedules.map((schedule) => ({
    ...schedule,
    slots: schedule.slots.map((slot) => ({ ...slot })),
  }));

  const matchingSchedules = updatedSchedules
    .filter((schedule) => schedule.department === department && schedule.date === date)
    .sort((left, right) => {
      const leftFirstSlot = left.slots[0]?.time ?? "23:59";
      const rightFirstSlot = right.slots[0]?.time ?? "23:59";
      return leftFirstSlot.localeCompare(rightFirstSlot);
    });

  for (const schedule of matchingSchedules) {
    const slotIndex = schedule.slots.findIndex((slot) => !slot.isBooked);
    if (slotIndex === -1) continue;

    schedule.slots[slotIndex] = {
      ...schedule.slots[slotIndex],
      isBooked: true,
    };

    return {
      schedules: updatedSchedules,
      assignment: {
        tokenNumber: slotIndex + 1,
        doctorName: schedule.doctorName,
        department: schedule.department,
        date: schedule.date,
        time: schedule.slots[slotIndex].time,
      } satisfies TokenAssignment,
    };
  }

  return {
    schedules: updatedSchedules,
    assignment: null,
  };
}
