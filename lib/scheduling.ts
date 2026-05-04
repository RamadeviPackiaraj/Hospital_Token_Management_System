import type {
  DoctorDirectoryItem,
  DoctorScheduleRecord,
  DoctorScheduleSlot,
} from "@/lib/scheduling-types";
import { format, isValid, parse } from "date-fns";

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

export function createSelectOptions(values: readonly string[], displayByValue: Record<string, string> = {}) {
  return values.map((value) => ({ label: displayByValue[value] || value, value }));
}

export function createDoctorOptions(doctors: readonly DoctorDirectoryItem[]) {
  return doctors.map((doctor) => ({
    label: doctor.displayName || doctor.name,
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

export function formatScheduleDate(value: string) {
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) return value;
  return format(parsed, "dd/MM/yyyy");
}

export function formatTimeTo12Hour(value: string) {
  const parsed = parse(value, "HH:mm", new Date());
  if (!isValid(parsed)) return value;
  return format(parsed, "hh:mm a");
}

export function formatScheduleTime(value: string) {
  return formatTimeTo12Hour(value);
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
