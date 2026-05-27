"use client";

import * as React from "react";
import { Lock, Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/data-display/Avatar";
import { useI18n } from "@/components/i18n";
import { Card } from "@/components/scheduling/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/utility";
import { localizeDepartmentName } from "@/lib/dynamic-localization";
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
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [openLockedScheduleId, setOpenLockedScheduleId] = React.useState<string | null>(null);
  const lockedStatusRef = React.useRef<HTMLDivElement | null>(null);
  const normalizedSearch = search.trim().toLowerCase();

  React.useEffect(() => {
    if (!openLockedScheduleId) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!lockedStatusRef.current?.contains(event.target as Node)) {
        setOpenLockedScheduleId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openLockedScheduleId]);

  const filteredSchedules = React.useMemo(() => {
    if (!normalizedSearch) {
      return schedules;
    }

    return schedules.filter((schedule) => {
      const doctorName = schedule.displayDoctorName || schedule.doctorName;
      const department = localizeDepartmentName(schedule.department, schedule.displayDepartment);
      const haystack = [
        doctorName,
        schedule.doctorName,
        schedule.displayDoctorName,
        schedule.department,
        schedule.displayDepartment,
        department,
        schedule.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, schedules]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / pageSize));

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedSchedules = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSchedules.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredSchedules, pageSize]);

  const startRecord = filteredSchedules.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredSchedules.length);
  const showPagination = filteredSchedules.length > pageSize;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="ui-section-title">{t("schedule.scheduledDoctors")}</h2>
          <p className="ui-body-secondary">{t("schedule.savedAvailability")}</p>
        </div>
        <div className="ui-card-chip">
          {schedules.length} {t("schedule.records")}
        </div>
      </div>

      <div className="my-4 ui-card-divider" />

      <div className="grid gap-4">
        <div className="max-w-xl">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by doctor, department, or date"
          />
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="ui-body-secondary">
              {normalizedSearch ? `No schedules found for "${search.trim()}".` : t("schedule.noSchedules")}
            </p>
          </div>
        ) : null}

        {filteredSchedules.length > 0 ? (
          <div className="hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_minmax(220px,1.1fr)] md:gap-4">
            <p className="ui-table-header">{t("schedule.doctor")}</p>
            <p className="ui-table-header">{t("schedule.date")}</p>
            <p className="ui-table-header">{t("schedule.timeRange")}</p>
            <p className="ui-table-header">{t("schedule.slots")}</p>
            <p className="ui-table-header">{t("schedule.available")}</p>
            <p className="ui-table-header">{t("schedule.actions")}</p>
          </div>
        ) : null}

        {paginatedSchedules.map((schedule) => {
          const counts = getScheduleCounts(schedule);
          const startTime = schedule.startTime ?? schedule.slots[0]?.time ?? "--";
          const endTime =
            schedule.endTime ?? schedule.slots[schedule.slots.length - 1]?.time ?? "--";
          const doctorName = schedule.displayDoctorName || schedule.doctorName;
          const department = localizeDepartmentName(schedule.department, schedule.displayDepartment);
          const canManageSchedule = schedule.slots.every((slot) => !slot.isBooked);
          const isLockedMessageOpen = openLockedScheduleId === schedule.id;

          return (
            <div
              key={schedule.id}
              className="grid gap-4 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-panel transition hover:border-[#0EA5A4] md:grid-cols-[minmax(0,1.7fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_minmax(220px,1.1fr)] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={doctorName}
                  size="sm"
                  className="bg-[#F0FDFA] font-medium text-[#0EA5A4]"
                />
                <div className="min-w-0">
                  <p className="ui-card-title">{doctorName}</p>
                  <p className="mt-1 ui-body-secondary">{department}</p>
                </div>
              </div>
              <div>
                <p className="ui-meta md:hidden">{t("schedule.date")}</p>
                <p className="mt-1 ui-card-body">{formatScheduleDate(schedule.date)}</p>
              </div>
              <div>
                <p className="ui-meta md:hidden">{t("schedule.timeRange")}</p>
                <p className="mt-1 ui-card-body">
                  {formatScheduleTime(startTime)} - {formatScheduleTime(endTime)}
                </p>
              </div>
              <div>
                <p className="ui-meta md:hidden">{t("schedule.slots")}</p>
                <p className="mt-1 ui-card-body">{counts.total}</p>
              </div>
              <div>
                <p className="ui-meta md:hidden">{t("schedule.available")}</p>
                <div className="mt-1 inline-flex rounded-full bg-[#F0FDFA] px-2.5 py-1 text-xs font-medium text-[#0EA5A4]">
                  {counts.available}
                </div>
              </div>
              <div className="relative min-w-0" ref={isLockedMessageOpen ? lockedStatusRef : undefined}>
                <p className="ui-meta md:hidden">{t("schedule.actions")}</p>
                {canManageSchedule ? (
                  <div className="mt-1 flex items-center gap-2 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant={editingScheduleId === schedule.id ? "secondary" : "primary"}
                      className="h-9 rounded-md"
                      leftIcon={<Pencil className="size-4" />}
                      onClick={() => onEdit?.(schedule)}
                    >
                      {t("common.actions.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="dangerOutline"
                      className="h-9 rounded-md"
                      leftIcon={<Trash2 className="size-4" />}
                      loading={deletingScheduleId === schedule.id}
                      onClick={() => void onDelete?.(schedule)}
                    >
                      {t("common.actions.delete")}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-[#D5DBE3] bg-[#F8FAFC] px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#334155] transition hover:border-[#94A3B8] hover:bg-[#F1F5F9]"
                      onClick={() =>
                        setOpenLockedScheduleId((current) =>
                          current === schedule.id ? null : schedule.id
                        )
                      }
                      aria-expanded={isLockedMessageOpen}
                      aria-label="Show locked status details"
                    >
                      <Lock className="size-3.5" />
                      <span>Locked</span>
                    </button>

                    {isLockedMessageOpen ? (
                      <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-md border border-[#CBD5E1] bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#475569]">
                          Locked Status
                        </p>
                        <p className="mt-2 text-sm leading-5 text-[#334155]">
                          Locked after token creation
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {showPagination ? (
          <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="ui-body-secondary">
              {t("schedule.showingRecords", {
                start: startRecord,
                end: endRecord,
                total: filteredSchedules.length,
              })}
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
