"use client";

import { Avatar } from "@/components/data-display/Avatar";
import { Card } from "@/components/scheduling/Card";
import type { DoctorScheduleRecord } from "@/lib/mock-data/scheduling";
import { formatScheduleDate, formatScheduleTime, getScheduleCounts } from "@/lib/scheduling";

interface ScheduleListProps {
  schedules: DoctorScheduleRecord[];
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-[#0F172A]">Scheduled Doctors</h2>
          <p className="text-sm text-[#64748B]">Card list of saved doctor availability.</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#64748B]">
          {schedules.length} records
        </div>
      </div>

      <div className="my-4 border-t border-[#E2E8F0]" />

      <div className="grid gap-4">
        {schedules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-sm text-[#64748B]">No schedules added yet.</p>
          </div>
        ) : null}

        {schedules.length > 0 ? (
          <div className="hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3 md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)] md:gap-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748B]">Doctor</p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748B]">Date</p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748B]">Time Range</p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748B]">Slots</p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748B]">Available</p>
          </div>
        ) : null}

        {schedules.map((schedule) => {
          const counts = getScheduleCounts(schedule);
          const startTime = schedule.startTime ?? schedule.slots[0]?.time ?? "--";
          const endTime =
            schedule.endTime ?? schedule.slots[schedule.slots.length - 1]?.time ?? "--";

          return (
            <div
              key={schedule.id}
              className="grid gap-4 rounded-lg border border-[#E2E8F0] bg-white p-4 transition hover:border-[#0EA5A4] hover:shadow-sm md:grid-cols-[minmax(0,1.7fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)] md:items-center md:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={schedule.doctorName}
                  size="sm"
                  className="bg-[#F0FDFA] font-medium text-[#0EA5A4]"
                />
                <div className="min-w-0">
                  <p className="text-base font-medium text-[#0F172A]">{schedule.doctorName}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{schedule.department}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#64748B] md:hidden">Date</p>
                <p className="mt-1 text-sm text-[#0F172A]">{formatScheduleDate(schedule.date)}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] md:hidden">Time Range</p>
                <p className="mt-1 text-sm text-[#0F172A]">
                  {formatScheduleTime(startTime)} - {formatScheduleTime(endTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] md:hidden">Slots</p>
                <p className="mt-1 text-sm text-[#0F172A]">{counts.total}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] md:hidden">Available</p>
                <div className="mt-1 inline-flex rounded-full bg-[#F0FDFA] px-2.5 py-1 text-sm text-[#0EA5A4]">
                  {counts.available}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
