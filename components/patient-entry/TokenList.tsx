"use client";

import * as React from "react";
import { CalendarDays, Clock3, Stethoscope } from "lucide-react";
import { Card } from "@/components/scheduling";
import { Select } from "@/components/ui";
import type { PatientTokenRecord } from "@/lib/mock-data/scheduling";
import { formatScheduleDate } from "@/lib/scheduling";

interface TokenListProps {
  tokens: PatientTokenRecord[];
  departments?: string[];
}

export function TokenList({ tokens, departments = [] }: TokenListProps) {
  const [selectedDepartment, setSelectedDepartment] = React.useState("all");

  const departmentOptions = React.useMemo(() => {
    const values = new Set(
      [...departments, ...tokens.map((token) => token.department)].filter((value) => value?.trim())
    );

    return [
      { label: "All Departments", value: "all" },
      ...Array.from(values)
        .sort((left, right) => left.localeCompare(right))
        .map((department) => ({ label: department, value: department })),
    ];
  }, [departments, tokens]);

  const filteredTokens = React.useMemo(() => {
    if (selectedDepartment === "all") {
      return tokens;
    }

    return tokens.filter((token) => token.department === selectedDepartment);
  }, [selectedDepartment, tokens]);

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="ui-section-title">Generated Tokens</h2>
          <p className="mt-1 ui-body-secondary">All patient tokens created during this session.</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="min-w-0">
            <p className="ui-label text-[#0EA5A4]">Department Filter</p>
            <p className="mt-1 ui-body-secondary">
              {selectedDepartment === "all" ? "Showing tokens from every department" : `Showing ${selectedDepartment} tokens`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-56">
              <Select
                value={selectedDepartment}
                options={departmentOptions}
                onChange={(event) => setSelectedDepartment(event.target.value)}
                className="border-[#E2E8F0] bg-white hover:border-[#0EA5A4]"
              />
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#0EA5A4]">
              {filteredTokens.length} {filteredTokens.length === 1 ? "token" : "tokens"}
            </div>
          </div>
        </div>
      </div>

      {filteredTokens.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[#0EA5A4]">
            <CalendarDays className="size-5" />
          </div>
          <h3 className="mt-4 ui-card-title">No Tokens Found</h3>
          <p className="mt-1 ui-body-secondary">
            {selectedDepartment === "all"
              ? "Create a new patient entry to see generated tokens appear here instantly."
              : `No tokens found for ${selectedDepartment}.`}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTokens.map((token) => (
            <article
              key={token.id}
              className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#0EA5A4]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full border border-[#99F6E4] bg-[#0EA5A4]/10 px-2 py-1 text-xs text-[#0EA5A4]">
                    Token #{token.tokenNumber}
                  </span>
                  <h3 className="mt-3 truncate ui-card-title">{token.patientName}</h3>
                  <p className="mt-1 flex items-center gap-2 ui-body-secondary">
                    <Stethoscope className="size-4 text-[#0EA5A4]" />
                    <span className="truncate">{token.doctorName}</span>
                  </p>
                </div>
                <div className="rounded-full border border-[#D7F5F3] bg-[#F0FDFA] px-2.5 py-1 text-xs text-[#0EA5A4]">
                  {token.department}
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-[#E2E8F0] pt-4">
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3">
                  <CalendarDays className="size-4 text-[#0EA5A4]" />
                  <div className="min-w-0">
                    <p className="ui-meta">Date</p>
                    <p className="ui-body">{formatScheduleDate(token.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3">
                  <Clock3 className="size-4 text-[#0EA5A4]" />
                  <div className="min-w-0">
                    <p className="ui-meta">Time</p>
                    <p className="ui-body">{token.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3">
                  <Stethoscope className="size-4 text-[#0EA5A4]" />
                  <div className="min-w-0">
                    <p className="ui-meta">Department</p>
                    <p className="truncate ui-body">{token.department}</p>
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
