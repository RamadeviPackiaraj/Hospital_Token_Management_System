"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/data-display/Avatar";
import { Card } from "@/components/scheduling/Card";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/utility";
import type { DoctorScheduleRecord } from "@/lib/scheduling-types";
import { formatScheduleDate, formatScheduleTime, getScheduleCounts } from "@/lib/scheduling";

interface ScheduleListProps {
  schedules: DoctorScheduleRecord[];
  pageSize?: number;
  editingScheduleId?: string | null;
  deletingScheduleId?: string | null;
  onEdit?: (schedule: DoctorScheduleRecord) => void;
  onDelete?: (schedule: DoctorScheduleRecord) => void | Promise<void>;
}

export function ScheduleList({
  schedules,
  pageSize = 5,
  editingScheduleId = null,
  deletingScheduleId = null,
  onEdit,
  onDelete,
}: ScheduleListProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(schedules.length / pageSize));

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedSchedules = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return schedules.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, schedules]);

  const startRecord = schedules.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, schedules.length);
  const showPagination = schedules.length > pageSize;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="ui-section-title">Scheduled Doctors</h2>
          <p className="ui-body-secondary">Card list of saved doctor availability.</p>
        </div>
        <div className="ui-card-chip">
          {schedules.length} records
        </div>
      </div>

      <div className="my-4 ui-card-divider" />

      <div className="grid gap-4">
        {schedules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="ui-body-secondary">No schedules added yet.</p>
          </div>
        ) : null}

        {schedules.length > 0 ? (
          <div className="hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_minmax(220px,1.1fr)] md:gap-4">
            <p className="ui-table-header">Doctor</p>
            <p className="ui-table-header">Date</p>
            <p className="ui-table-header">Time Range</p>
            <p className="ui-table-header">Slots</p>
            <p className="ui-table-header">Available</p>
            <p className="ui-table-header">Actions</p>
          </div>
        ) : null}

        {paginatedSchedules.map((schedule) => {
          const counts = getScheduleCounts(schedule);
          const startTime = schedule.startTime ?? schedule.slots[0]?.time ?? "--";
          const endTime =
            schedule.endTime ?? schedule.slots[schedule.slots.length - 1]?.time ?? "--";

          return (
            <div
              key={schedule.id}
              className="grid gap-4 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-panel transition hover:border-[#0EA5A4] md:grid-cols-[minmax(0,1.7fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_minmax(220px,1.1fr)] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={schedule.doctorName}
                  size="sm"
                  className="bg-[#F0FDFA] font-medium text-[#0EA5A4]"
                />
                <div className="min-w-0">
                  <p className="ui-card-title">{schedule.doctorName}</p>
                  <p className="mt-1 ui-body-secondary">{schedule.department}</p>
                </div>
              </div>
              <div>
                <p className="ui-meta md:hidden">Date</p>
                <p className="mt-1 ui-card-body">{formatScheduleDate(schedule.date)}</p>
              </div>
              <div>
                <p className="ui-meta md:hidden">Time Range</p>
                <p className="mt-1 ui-card-body">
                  {formatScheduleTime(startTime)} - {formatScheduleTime(endTime)}
                </p>
              </div>
              <div>
                <p className="ui-meta md:hidden">Slots</p>
                <p className="mt-1 ui-card-body">{counts.total}</p>
              </div>
              <div>
                <p className="ui-meta md:hidden">Available</p>
                <div className="mt-1 inline-flex rounded-full bg-[#F0FDFA] px-2.5 py-1 text-xs font-medium text-[#0EA5A4]">
                  {counts.available}
                </div>
              </div>
              <div className="min-w-0">
                <p className="ui-meta md:hidden">Actions</p>
                <div className="mt-1 flex items-center gap-2 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant={editingScheduleId === schedule.id ? "secondary" : "primary"}
                    className="h-9 rounded-md"
                    leftIcon={<Pencil className="size-4" />}
                    onClick={() => onEdit?.(schedule)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="dangerOutline"
                    className="h-9 rounded-md"
                    leftIcon={<Trash2 className="size-4" />}
                    loading={deletingScheduleId === schedule.id}
                    onClick={() => void onDelete?.(schedule)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {showPagination ? (
          <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="ui-body-secondary">
              Showing {startRecord}-{endRecord} of {schedules.length} records
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
