"use client";

import * as React from "react";
import { LayoutList, PencilLine, Save, Trash2, UserRoundCheck } from "lucide-react";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Button, Card, Input, Select, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import {
  addDepartment,
  deleteHospitalDepartmentAssignment,
  deleteDepartment,
  getApprovedDoctorsForHospital,
  getDepartments,
  getHospitalDepartmentAssignments,
  updateHospitalDepartmentAssignment,
  updateDepartment,
  upsertHospitalDepartmentAssignment,
  type DepartmentRecord,
  type HospitalDoctorDepartmentAssignment,
} from "@/lib/dashboard-data";
import { logger } from "@/lib/logger";

type DepartmentRow = Record<string, unknown> & DepartmentRecord;
type AssignmentRow = Record<string, unknown> & HospitalDoctorDepartmentAssignment;
type AssignmentDeleteTarget = {
  doctorId: string;
  doctorName: string;
  department: string;
};

export function SettingsDepartmentsContent() {
  const { currentUser } = useDashboardContext();
  const [departmentName, setDepartmentName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = React.useState<DepartmentRecord | null>(null);
  const [approvedDoctors, setApprovedDoctors] = React.useState<Array<{ id: string; fullName: string }>>([]);
  const [doctorId, setDoctorId] = React.useState("");
  const [selectedDepartment, setSelectedDepartment] = React.useState("");
  const [assignments, setAssignments] = React.useState<HospitalDoctorDepartmentAssignment[]>([]);
  const [editingAssignmentId, setEditingAssignmentId] = React.useState<string | null>(null);
  const [editingAssignmentDepartment, setEditingAssignmentDepartment] = React.useState("");
  const [assignmentDeleteTarget, setAssignmentDeleteTarget] = React.useState<AssignmentDeleteTarget | null>(null);

  React.useEffect(() => {
    getDepartments()
      .then((data) => {
        setDepartments(data);
        logger.info("Departments loaded successfully.", {
          source: "settings.departments",
          data: { count: data.length },
        });
      })
      .catch((error) => {
        setDepartments([]);
        logger.error("Unable to load departments.", {
          source: "settings.departments",
          data: { message: error instanceof Error ? error.message : String(error) },
          toast: true,
        });
      });
  }, []);

  React.useEffect(() => {
    if (currentUser.role !== "hospital") {
      return;
    }

    Promise.all([
      getApprovedDoctorsForHospital(currentUser.id).catch(() => []),
      getHospitalDepartmentAssignments(currentUser.id).catch(() => []),
    ])
      .then(([doctorData, assignmentData]) => {
        setApprovedDoctors(
          doctorData
            .filter((doctor) => doctor.approvalStatus === "approved")
            .map((doctor) => ({ id: doctor.id, fullName: doctor.fullName }))
        );
        setAssignments(assignmentData);
      })
      .catch(() => {
        setApprovedDoctors([]);
        setAssignments([]);
      });
  }, [currentUser.id, currentUser.role]);

  async function handleAddDepartment() {
    try {
      const updated = await addDepartment(departmentName);
      setDepartments(updated);
      logger.success("Department added successfully.", {
        source: "settings.departments",
        data: { name: departmentName, count: updated.length },
        toast: true,
      });
      setDepartmentName("");
    } catch (error) {
      logger.error("Unable to add the department.", {
        source: "settings.departments",
        data: { name: departmentName, error: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  async function handleSaveDepartment(id: string) {
    try {
      const updated = await updateDepartment(id, editingName);
      setDepartments(updated);
      logger.success("Department updated successfully.", {
        source: "settings.departments",
        data: { id, name: editingName },
        toast: true,
      });
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      logger.error("Unable to update the department.", {
        source: "settings.departments",
        data: { id, name: editingName, error: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  async function handleDeleteDepartment() {
    if (!deleteTarget) {
      return;
    }

    try {
      const updated = await deleteDepartment(deleteTarget.id);
      setDepartments(updated);
      if (currentUser.role === "hospital") {
        setAssignments((current) =>
          current.filter((assignment) => assignment.department !== deleteTarget.name)
        );
      }
      logger.warn("Department deleted.", {
        source: "settings.departments",
        data: { id: deleteTarget.id, name: deleteTarget.name },
        toast: true,
        destructive: true,
      });
      setDeleteTarget(null);
    } catch (error) {
      logger.error("Unable to delete the department.", {
        source: "settings.departments",
        data: { id: deleteTarget.id, name: deleteTarget.name, error: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  async function handleAssignDepartment() {
    if (!doctorId || !selectedDepartment) {
      return;
    }

    const doctor = approvedDoctors.find((item) => item.id === doctorId);
    const department = departments.find((item) => item.name === selectedDepartment);
    if (!doctor || !department) {
      return;
    }

    try {
      const assignment = assignments.some((item) => item.doctorId === doctorId)
        ? await updateHospitalDepartmentAssignment(currentUser.id, doctorId, department.id)
        : await upsertHospitalDepartmentAssignment(currentUser.id, doctorId, department.id);

      setAssignments((current) => {
        const hasExisting = current.some((item) => item.doctorId === doctorId);
        if (hasExisting) {
          return current.map((item) => (item.doctorId === doctorId ? assignment : item));
        }
        return [...current, assignment];
      });
      setDoctorId("");
      setSelectedDepartment("");
      logger.success("Doctor department assigned.", {
        source: "settings.departments.assignment",
        data: { doctorId, department: selectedDepartment, hospitalId: currentUser.id },
        toast: true,
      });
    } catch (error) {
      logger.error("Unable to assign the doctor department.", {
        source: "settings.departments.assignment",
        data: {
          doctorId,
          departmentId: department.id,
          error: error instanceof Error ? error.message : String(error),
        },
        toast: true,
      });
    }
  }

  async function handleRemoveAssignment(doctorIdToRemove: string) {
    try {
      await deleteHospitalDepartmentAssignment(currentUser.id, doctorIdToRemove);
      setAssignments((current) =>
        current.filter((assignment) => assignment.doctorId !== doctorIdToRemove)
      );
      if (editingAssignmentId === doctorIdToRemove) {
        setEditingAssignmentId(null);
        setEditingAssignmentDepartment("");
      }
      logger.warn("Doctor department assignment removed.", {
        source: "settings.departments.assignment",
        data: { doctorId: doctorIdToRemove, hospitalId: currentUser.id },
      });
    } catch (error) {
      logger.error("Unable to remove the doctor department assignment.", {
        source: "settings.departments.assignment",
        data: { doctorId: doctorIdToRemove, error: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  async function handleConfirmRemoveAssignment() {
    if (!assignmentDeleteTarget) {
      return;
    }

    await handleRemoveAssignment(assignmentDeleteTarget.doctorId);
    setAssignmentDeleteTarget(null);
  }

  function handleEditAssignment(assignment: HospitalDoctorDepartmentAssignment) {
    setEditingAssignmentId(assignment.doctorId);
    setEditingAssignmentDepartment(assignment.department);
  }

  function handleCancelAssignmentEdit() {
    setEditingAssignmentId(null);
    setEditingAssignmentDepartment("");
  }

  async function handleSaveAssignmentEdit(doctorIdToUpdate: string) {
    if (!editingAssignmentDepartment) {
      return;
    }

    const department = departments.find((item) => item.name === editingAssignmentDepartment);
    if (!department) {
      return;
    }

    try {
      const updatedAssignment = await updateHospitalDepartmentAssignment(
        currentUser.id,
        doctorIdToUpdate,
        department.id
      );
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.doctorId === doctorIdToUpdate ? updatedAssignment : assignment
        )
      );
      logger.success("Doctor department assignment updated.", {
        source: "settings.departments.assignment",
        data: { doctorId: doctorIdToUpdate, department: editingAssignmentDepartment, hospitalId: currentUser.id },
        toast: true,
      });
      handleCancelAssignmentEdit();
    } catch (error) {
      logger.error("Unable to update the doctor department assignment.", {
        source: "settings.departments.assignment",
        data: {
          doctorId: doctorIdToUpdate,
          departmentId: department.id,
          error: error instanceof Error ? error.message : String(error),
        },
        toast: true,
      });
    }
  }

  const departmentRows: DepartmentRow[] = departments.map((department) => ({ ...department }));
  const assignmentRows: AssignmentRow[] = assignments.map((assignment) => ({ ...assignment }));

  if (currentUser.role === "hospital") {
    return (
      <div className="space-y-6">
        <PageHero
          title="Departments"
          description="Map approved doctors to their own or other departments before doctor schedule allocation."
          icon={<LayoutList className="size-5" />}
          imageSrc="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80"
          imageAlt="Hospital hallway"
          stats={[
            { label: "Departments", value: String(departments.length) },
            { label: "Approved Doctors", value: String(approvedDoctors.length) },
            { label: "Assigned", value: String(assignments.length) },
          ]}
        />

        <Card className="p-4">
          <p className="mb-4 text-sm text-[#64748B]">
            Choose an approved doctor and assign the department that should be used for schedule allocation.
          </p>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
            <label className="grid gap-2 text-sm text-[#0F172A]">
              Doctor
              <Select
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
                options={approvedDoctors.map((doctor) => ({
                  label: doctor.fullName,
                  value: doctor.id,
                }))}
                placeholder="Select approved doctor"
              />
            </label>

            <label className="grid gap-2 text-sm text-[#0F172A]">
              Department
              <Select
                value={selectedDepartment}
                onChange={(event) => setSelectedDepartment(event.target.value)}
                options={departments.map((department) => ({
                  label: department.name,
                  value: department.name,
                }))}
                placeholder="Select department"
              />
            </label>

            <div className="flex items-end">
              <Button
                fullWidth
                className="h-10 rounded-md"
                leftIcon={<Save className="size-4" />}
                onClick={() => void handleAssignDepartment()}
                disabled={!doctorId || !selectedDepartment}
              >
                Save
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Table<AssignmentRow>
            columns={[
              {
                key: "doctorName",
                header: "Doctor",
                render: (row) => (
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#ECFEFF] text-[#0EA5A4]">
                      <UserRoundCheck className="size-4" />
                    </span>
                    <span>{row.doctorName}</span>
                  </div>
                ),
              },
              {
                key: "department",
                header: "Department",
                render: (row) =>
                  editingAssignmentId === row.doctorId ? (
                    <Select
                      value={editingAssignmentDepartment}
                      onChange={(event) => setEditingAssignmentDepartment(event.target.value)}
                      options={departments.map((department) => ({
                        label: department.name,
                        value: department.name,
                      }))}
                      placeholder="Select department"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-[#0F172A]">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-[#ECFEFF] text-[#0EA5A4]">
                        <LayoutList className="size-4" />
                      </span>
                      <span>{row.department}</span>
                    </div>
                  ),
              },
              {
                key: "actions",
                header: "Actions",
                className: "w-[220px]",
                render: (row) =>
                  editingAssignmentId === row.doctorId ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="h-10 rounded-lg"
                        leftIcon={<Save className="size-4" />}
                        onClick={() => void handleSaveAssignmentEdit(row.doctorId)}
                        disabled={!editingAssignmentDepartment.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10 rounded-lg"
                        leftIcon={<Trash2 className="size-4" />}
                        onClick={handleCancelAssignmentEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        className="focus-ring inline-flex h-9 items-center gap-1 rounded-md bg-[#0EA5A4] px-3 text-sm font-medium text-white transition hover:bg-[#0d9488]"
                        onClick={() => handleEditAssignment(row)}
                      >
                        <PencilLine className="size-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#EF4444] bg-transparent px-3 text-sm font-medium text-[#EF4444] transition hover:bg-red-50"
                        onClick={() =>
                          setAssignmentDeleteTarget({
                            doctorId: row.doctorId,
                            doctorName: row.doctorName,
                            department: row.department,
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </button>
                    </div>
                  ),
              },
            ]}
            data={assignmentRows}
            pageSize={6}
            emptyMessage="No doctor departments assigned yet."
          />
        </Card>

        <ConfirmationDialog
          open={Boolean(assignmentDeleteTarget)}
          title="Remove Assignment"
          description={
            assignmentDeleteTarget
              ? `Remove ${assignmentDeleteTarget.doctorName} from ${assignmentDeleteTarget.department}?`
              : "Remove this doctor department assignment?"
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={() => void handleConfirmRemoveAssignment()}
          onCancel={() => setAssignmentDeleteTarget(null)}
        />
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <Card className="p-4">
        <h2 className="text-base font-medium text-[#0F172A]">Department list</h2>
        <div className="mt-4 space-y-3">
          {departments.map((department) => (
            <div key={department.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-medium text-[#0F172A]">{department.name}</p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Department Management"
        description="Manage departments."
        icon={<LayoutList className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80"
        imageAlt="Hospital hallway"
        stats={[
          { label: "Departments", value: String(departments.length) },
          { label: "Editable", value: "Yes" },
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
          <label className="grid gap-2 text-sm text-[#0F172A]">
            Department Name
            <Input
              value={departmentName}
              onChange={(event) => setDepartmentName(event.target.value)}
              placeholder="Enter department name"
            />
          </label>

          <div className="flex items-end">
            <Button fullWidth className="h-10 rounded-md" onClick={() => void handleAddDepartment()} disabled={!departmentName.trim()}>
              Add Department
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <Table<DepartmentRow>
          columns={[
            {
              key: "name",
              header: "Department Name",
              render: (row) =>
                editingId === row.id ? (
                  <Input value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                ) : (
                  row.name
                ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "w-[220px]",
              render: (row) =>
                editingId === row.id ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="h-10 rounded-lg" leftIcon={<PencilLine className="size-4" />} onClick={() => void handleSaveDepartment(row.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="secondary" className="h-10 rounded-lg" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="focus-ring inline-flex h-9 items-center gap-1 rounded-md bg-[#0EA5A4] px-3 text-sm font-medium text-white transition hover:bg-[#0d9488]"
                      onClick={() => {
                        setEditingId(row.id);
                        setEditingName(row.name);
                      }}
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#EF4444] bg-transparent px-3 text-sm font-medium text-[#EF4444] transition hover:bg-red-50"
                      onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                ),
            },
          ]}
          data={departmentRows}
          pageSize={6}
          emptyMessage="No departments have been added yet."
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Department"
        description="Are you sure you want to delete this department? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => void handleDeleteDepartment()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
