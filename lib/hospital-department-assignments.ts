"use client";

export interface HospitalDoctorDepartmentAssignment {
  doctorId: string;
  doctorName: string;
  department: string;
}

function storageKey(hospitalId: string) {
  return `hospital_token_department_assignments_${hospitalId}`;
}

export function getHospitalDepartmentAssignments(hospitalId: string) {
  if (typeof window === "undefined") {
    return [] as HospitalDoctorDepartmentAssignment[];
  }

  try {
    const raw = window.localStorage.getItem(storageKey(hospitalId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HospitalDoctorDepartmentAssignment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHospitalDepartmentAssignments(
  hospitalId: string,
  assignments: HospitalDoctorDepartmentAssignment[]
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(hospitalId), JSON.stringify(assignments));
}
