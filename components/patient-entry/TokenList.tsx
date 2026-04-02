"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/scheduling";
import { Select } from "@/components/ui";
import { type PatientTokenRecord, type PatientTokenStatus } from "@/lib/mock-data/scheduling";
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
            <div className="ui-card-chip text-[#0EA5A4]">
              {filteredTokens.length} {filteredTokens.length === 1 ? "token" : "tokens"}
            </div>
          </div>
        </div>
      </div>

      {filteredTokens.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
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
