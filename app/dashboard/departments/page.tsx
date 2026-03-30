"use client";

import * as React from "react";
import { LayoutList, PencilLine, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Button, Card, Input, Table } from "@/components/ui";
import { useDashboardContext, PageHero } from "@/components/dashboard";
import {
  addDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
  type DepartmentRecord
} from "@/lib/dashboard-data";

type DepartmentRow = Record<string, unknown> & DepartmentRecord;

export default function DepartmentsPage() {
  const { currentUser } = useDashboardContext();
  const [departmentName, setDepartmentName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = React.useState<DepartmentRecord | null>(null);

  React.useEffect(() => {
    setDepartments(getDepartments());
  }, []);

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

  function handleAddDepartment() {
    setDepartments(addDepartment(departmentName));
    setDepartmentName("");
  }

  function handleSaveDepartment(id: string) {
    setDepartments(updateDepartment(id, editingName));
    setEditingId(null);
    setEditingName("");
  }

  function handleDeleteDepartment() {
    if (!deleteTarget) {
      return;
    }

    setDepartments(deleteDepartment(deleteTarget.id));
    setDeleteTarget(null);
  }

  const departmentRows: DepartmentRow[] = departments.map((department) => ({ ...department }));

  return (
    <div className="space-y-6">
      <PageHero
        title="Department Management"
        description="Manage departments"
        icon={<LayoutList className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80"
        imageAlt="Hospital hallway"
        stats={[
          { label: "Departments", value: String(departments.length) },
          { label: "Editable", value: "Yes" }
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
            <Button fullWidth className="h-10 rounded-md" onClick={handleAddDepartment} disabled={!departmentName.trim()}>
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
                )
            },
            {
              key: "actions",
              header: "Actions",
              className: "w-[220px]",
              render: (row) =>
                editingId === row.id ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="h-10 rounded-lg" leftIcon={<PencilLine className="size-4" />} onClick={() => handleSaveDepartment(row.id)}>
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
                )
            }
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
        onConfirm={handleDeleteDepartment}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
