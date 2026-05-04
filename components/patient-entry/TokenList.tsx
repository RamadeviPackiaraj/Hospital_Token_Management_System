"use client";

import * as React from "react";
import { CalendarDays, Filter, Ticket } from "lucide-react";
import { useI18n } from "@/components/i18n";
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
  onEdit: (tokenId: string) => void | Promise<void>;
  onDelete: (tokenId: string) => void | Promise<void>;
}

export function TokenList({
  tokens,
  departments = [],
  updatingTokenId = null,
  onStatusChange,
  onEdit,
  onDelete,
}: TokenListProps) {
  const { t } = useI18n();
  const [selectedDepartment, setSelectedDepartment] = React.useState("all");

  const departmentOptions = React.useMemo(() => {
    const labelsByValue = new Map<string, string>();

    departments.forEach((department) => {
      if (department?.trim()) {
        labelsByValue.set(department, department);
      }
    });

    tokens.forEach((token) => {
      if (token.department?.trim()) {
        labelsByValue.set(token.department, token.displayDepartment || token.department);
      }
    });

    return [
      { label: t("patientEntry.allDepartments"), value: "all" },
      ...Array.from(labelsByValue.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([department, label]) => ({ label, value: department })),
    ];
  }, [departments, t, tokens]);

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
              <SectionTitle>{t("patientEntry.generatedTokens")}</SectionTitle>
            </div>
            <BodySecondary>{t("patientEntry.generatedTokensDescription")}</BodySecondary>
          </div>

          <div className="flex flex-col gap-3 rounded-[14px] border border-[#CFEAED] bg-[#FFFFFF] p-4 shadow-panel sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0EA5A4]">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] font-medium leading-4 text-[#0EA5A4]">{t("patientEntry.departmentFilter")}</p>
                  <BodySecondary className="mt-1">
                    {selectedDepartment === "all"
                      ? t("patientEntry.everyDepartment")
                      : t("patientEntry.selectedDepartment", {
                          department:
                            departmentOptions.find((option) => option.value === selectedDepartment)?.label ||
                            selectedDepartment,
                        })}
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
                {filteredTokens.length} {filteredTokens.length === 1 ? t("patientEntry.token") : t("patientEntry.tokens")}
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
            <SectionTitle>{t("patientEntry.noTokens")}</SectionTitle>
            <BodySecondary className="mt-2">
              {selectedDepartment === "all"
                ? t("patientEntry.createFirst")
                : t("patientEntry.noTokensForDepartment", {
                    department:
                      departmentOptions.find((option) => option.value === selectedDepartment)?.label ||
                      selectedDepartment,
                  })}
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
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
