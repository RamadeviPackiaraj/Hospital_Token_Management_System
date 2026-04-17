"use client";

import * as React from "react";
import { CalendarDays, Filter, Ticket } from "lucide-react";
import { Card } from "@/components/scheduling";
import { Select } from "@/components/ui";
import { SectionTitle, BodySecondary } from "@/components/ui/Typography";
import { type PatientTokenRecord, type PatientTokenStatus } from "@/lib/scheduling-types";
import { TokenCard } from "./TokenCard";

interface TokenListProps {
  tokens: PatientTokenRecord[];
  departments?: string[];
  updatingTokenId?: string | null;
  onStatusChange: (tokenId: string, status: PatientTokenStatus) => void | Promise<void>;
}

export function TokenList({
  tokens,
  departments = [],
  updatingTokenId = null,
  onStatusChange,
}: TokenListProps) {
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
    <Card className="overflow-hidden border-[#D7EAF0] bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFEFF_100%)] p-0">
      <div className="border-b border-[#E2E8F0] px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F0FDFA] text-[#0EA5A4]">
                <Ticket className="h-4 w-4" />
              </div>
              <SectionTitle>Generated Tokens</SectionTitle>
            </div>
            <BodySecondary>All patient tokens created during this session.</BodySecondary>
          </div>

          <div className="flex flex-col gap-3 rounded-[14px] border border-[#CFEAED] bg-[#FFFFFF] p-4 shadow-panel sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0EA5A4]">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] font-medium leading-4 text-[#0EA5A4]">Department Filter</p>
                  <BodySecondary className="mt-1">
                    {selectedDepartment === "all" ? "Showing tokens from every department" : `Showing ${selectedDepartment} tokens`}
                  </BodySecondary>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-56">
                <Select
                  value={selectedDepartment}
                  options={departmentOptions}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="border-[#CFEAED] bg-white hover:border-[#0EA5A4]"
                />
              </div>
              <div className="inline-flex min-w-fit items-center gap-2 rounded-[10px] border border-[#CFEAED] bg-[#F0FDFA] px-4 py-2 ui-label text-[#0EA5A4]">
                <Ticket className="h-4 w-4" />
                {filteredTokens.length} {filteredTokens.length === 1 ? "token" : "tokens"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {filteredTokens.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#CFEAED] bg-[#F8FAFC] p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#CFEAED] bg-[#FFFFFF] text-[#0EA5A4]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <SectionTitle>No Tokens Found</SectionTitle>
            <BodySecondary className="mt-2">
              {selectedDepartment === "all"
                ? "Create a new patient entry to see generated tokens appear here instantly."
                : `No tokens found for ${selectedDepartment}.`}
            </BodySecondary>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                isUpdating={updatingTokenId === token.id}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
