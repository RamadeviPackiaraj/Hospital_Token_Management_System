"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/scheduling";
import { Select } from "@/components/ui";
import { SectionTitle, BodySecondary, Label } from "@/components/ui/Typography";
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
    <Card className="p-4">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <SectionTitle>Generated Tokens</SectionTitle>
          <BodySecondary className="mt-2">All patient tokens created during this session.</BodySecondary>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <div className="min-w-0">
            <Label>Department Filter</Label>
            <BodySecondary className="mt-1 text-[13px]">
              {selectedDepartment === "all" ? "Showing tokens from every department" : `Showing ${selectedDepartment} tokens`}
            </BodySecondary>
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
            <div className="inline-flex min-w-fit items-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2 text-[12px] font-semibold text-[#0EA5A4]">
              {filteredTokens.length} {filteredTokens.length === 1 ? "token" : "tokens"}
            </div>
          </div>
        </div>
      </div>

      {filteredTokens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[#0EA5A4]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <SectionTitle className="text-[16px]">No Tokens Found</SectionTitle>
          <BodySecondary className="mt-2 text-[14px]">
            {selectedDepartment === "all"
              ? "Create a new patient entry to see generated tokens appear here instantly."
              : `No tokens found for ${selectedDepartment}.`}
          </BodySecondary>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    </Card>
  );
}
