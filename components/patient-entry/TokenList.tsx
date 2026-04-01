"use client";

import { CalendarDays, Clock3, Stethoscope } from "lucide-react";
import { Card } from "@/components/scheduling";
import type { PatientTokenRecord } from "@/lib/mock-data/scheduling";
import { formatScheduleDate } from "@/lib/scheduling";

interface TokenListProps {
  tokens: PatientTokenRecord[];
}

export function TokenList({ tokens }: TokenListProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-[#0F172A]">Generated Tokens</h2>
          <p className="mt-1 text-sm text-[#64748B]">All patient tokens created during this session.</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm text-[#64748B]">
          {tokens.length} {tokens.length === 1 ? "token" : "tokens"}
        </div>
      </div>

      {tokens.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[#0EA5A4]">
            <CalendarDays className="size-5" />
          </div>
          <h3 className="mt-4 text-base font-medium text-[#0F172A]">No Tokens Generated Yet</h3>
          <p className="mt-1 text-sm text-[#64748B]">Create a new patient entry to see generated tokens appear here instantly.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => (
            <article
              key={token.id}
              className="rounded-xl border border-[#BFEFED] bg-[linear-gradient(180deg,#F9FEFE_0%,#FFFFFF_22%,#FFFFFF_100%)] p-4 shadow-[inset_0_1px_0_rgba(14,165,164,0.06)] transition hover:-translate-y-0.5 hover:border-[#0EA5A4] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full border border-[#99F6E4] bg-[#0EA5A4]/10 px-2 py-1 text-xs text-[#0EA5A4]">
                    Token #{token.tokenNumber}
                  </span>
                  <h3 className="mt-3 truncate text-base font-medium text-[#0F172A]">{token.patientName}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[#64748B]">
                    <Stethoscope className="size-4 text-[#0EA5A4]" />
                    <span className="truncate">{token.doctorName}</span>
                  </p>
                </div>
                <div className="rounded-full border border-[#D7F5F3] bg-[#F0FDFA] px-2.5 py-1 text-xs text-[#0EA5A4]">
                  {token.department}
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-[#E2E8F0] pt-4">
                <div className="flex items-center gap-3 rounded-lg border border-[#EEF7F7] bg-[#F8FAFC] px-3 py-2.5">
                  <CalendarDays className="size-4 text-[#0EA5A4]" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B]">Date</p>
                    <p className="text-sm text-[#0F172A]">{formatScheduleDate(token.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#EEF7F7] bg-[#F8FAFC] px-3 py-2.5">
                  <Clock3 className="size-4 text-[#0EA5A4]" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B]">Time</p>
                    <p className="text-sm text-[#0F172A]">{token.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#EEF7F7] bg-[#F8FAFC] px-3 py-2.5">
                  <Stethoscope className="size-4 text-[#0EA5A4]" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B]">Department</p>
                    <p className="truncate text-sm text-[#0F172A]">{token.department}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
