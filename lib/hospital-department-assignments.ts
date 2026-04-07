import { apiRequest } from "@/lib/api";

export interface HospitalDoctorDepartmentAssignment {
  doctorId: string;
  doctorName: string;
  department: string;
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

export async function deleteHospitalDepartmentAssignment(
  hospitalId: string,
  doctorId: string
) {
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

export default {
  getHospitalDepartmentAssignments,
  upsertHospitalDepartmentAssignment,
  updateHospitalDepartmentAssignment,
  deleteHospitalDepartmentAssignment,
};
