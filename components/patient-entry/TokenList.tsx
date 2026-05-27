"use client";

import * as React from "react";
import { ArrowUpDown, CalendarDays, Filter, Ticket } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Card } from "@/components/scheduling";
import { Button, Input, Select } from "@/components/ui";
import { SectionTitle, BodySecondary } from "@/components/ui/Typography";
import { Pagination } from "@/components/utility";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { localizeDepartmentName } from "@/lib/dynamic-localization";
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
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("token-desc");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageSize, setPageSize] = React.useState("9");
  const [currentPage, setCurrentPage] = React.useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

  const departmentOptions = React.useMemo(() => {
    const labelsByValue = new Map<string, string>();

    departments.forEach((department) => {
      if (department?.trim()) {
        labelsByValue.set(department, localizeDepartmentName(department));
      }
    });

    tokens.forEach((token) => {
      if (token.department?.trim()) {
          labelsByValue.set(token.department, localizeDepartmentName(token.department, token.displayDepartment));
      }
    });

    return [
      { label: t("patientEntry.allDepartments"), value: "all" },
      ...Array.from(labelsByValue.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([department, label]) => ({ label, value: department })),
    ];
  }, [departments, t, tokens]);

  const statusOptions = React.useMemo(
    () => [
      { label: "All Statuses", value: "all" },
      { label: t("patientEntry.pending"), value: "NOT_STARTED" },
      { label: t("patientEntry.calling"), value: "CALLING" },
      { label: t("patientEntry.completed"), value: "COMPLETED" },
    ],
    [t]
  );

  const sortOptions = React.useMemo(
    () => [
      { label: "Newest token first", value: "token-desc" },
      { label: "Oldest token first", value: "token-asc" },
      { label: "Latest time first", value: "time-desc" },
      { label: "Earliest time first", value: "time-asc" },
      { label: "Patient name A-Z", value: "patient-asc" },
      { label: "Patient name Z-A", value: "patient-desc" },
    ],
    []
  );

  const pageSizeOptions = React.useMemo(
    () => [
      { label: `6 ${t("patientEntry.tokens")}`, value: "6" },
      { label: `9 ${t("patientEntry.tokens")}`, value: "9" },
      { label: `12 ${t("patientEntry.tokens")}`, value: "12" },
      { label: `18 ${t("patientEntry.tokens")}`, value: "18" },
    ],
    [t]
  );

  const filteredTokens = React.useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();

    return tokens.filter((token) => {
      const matchesDepartment =
        selectedDepartment === "all" || token.department === selectedDepartment;
      const matchesStatus = selectedStatus === "all" || token.status === selectedStatus;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          token.patientName,
          token.displayPatientName,
          token.doctorName,
          token.displayDoctorName,
          token.department,
          token.displayDepartment,
          String(token.tokenNumber),
          `token ${token.tokenNumber}`,
          token.contact,
          token.aadhaar,
          token.bloodGroup,
          token.dob,
          token.date,
          token.time,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [debouncedSearchQuery, selectedDepartment, selectedStatus, tokens]);

  const sortedTokens = React.useMemo(() => {
    const sortable = [...filteredTokens];

    sortable.sort((left, right) => {
      const leftPatient = (left.displayPatientName || left.patientName || "").toLowerCase();
      const rightPatient = (right.displayPatientName || right.patientName || "").toLowerCase();
      const leftTokenNumber = Number(left.tokenNumber) || 0;
      const rightTokenNumber = Number(right.tokenNumber) || 0;
      const leftDateTime = `${left.date} ${left.time}`;
      const rightDateTime = `${right.date} ${right.time}`;

      switch (sortBy) {
        case "token-asc":
          return leftTokenNumber - rightTokenNumber;
        case "time-desc":
          return rightDateTime.localeCompare(leftDateTime);
        case "time-asc":
          return leftDateTime.localeCompare(rightDateTime);
        case "patient-asc":
          return leftPatient.localeCompare(rightPatient);
        case "patient-desc":
          return rightPatient.localeCompare(leftPatient);
        case "token-desc":
        default:
          return rightTokenNumber - leftTokenNumber;
      }
    });

    return sortable;
  }, [filteredTokens, sortBy]);

  const numericPageSize = Number(pageSize) || 9;
  const totalPages = Math.max(1, Math.ceil(sortedTokens.length / numericPageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = sortedTokens.length === 0 ? 0 : (safeCurrentPage - 1) * numericPageSize;
  const paginatedTokens = sortedTokens.slice(startIndex, startIndex + numericPageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedDepartment, selectedStatus, sortBy, pageSize]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <Card className="overflow-hidden border-[#D7EAF0] bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFEFF_100%)] p-0">
      <div className="border-b border-[#E2E8F0] px-4 py-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F0FDFA] text-[#0EA5A4]">
                <Ticket className="h-4 w-4" />
              </div>
              <SectionTitle>{t("patientEntry.generatedTokens")}</SectionTitle>
            </div>
            <BodySecondary>{t("patientEntry.generatedTokensDescription")}</BodySecondary>
          </div>

          <div className="rounded-[14px] border border-[#CFEAED] bg-[#FFFFFF] p-4 shadow-panel">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
              <div className="min-w-0 md:col-span-2 xl:col-span-4">
                <p className="mb-2 text-[12px] font-medium leading-5 text-[#64748B]">
                  Quickly find a patient, doctor, token, or contact
                </p>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by patient, doctor, token number, or contact"
                  className="border-[#CFEAED] bg-white"
                />
              </div>

              <div className="xl:col-span-2">
                <p className="mb-2 text-[12px] font-medium leading-4 text-[#0EA5A4]">{t("patientEntry.departmentFilter")}</p>
                <Select
                  value={selectedDepartment}
                  options={departmentOptions}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="border-[#CFEAED] bg-white hover:border-[#0EA5A4]"
                />
              </div>

              <div className="xl:col-span-2">
                <p className="mb-2 text-[12px] font-medium leading-4 text-[#0EA5A4]">Status Filter</p>
                <Select
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="border-[#CFEAED] bg-white hover:border-[#0EA5A4]"
                />
              </div>

              <div className="xl:col-span-2">
                <p className="mb-2 flex items-center gap-2 text-[12px] font-medium leading-4 text-[#0EA5A4]">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort By
                </p>
                <Select
                  value={sortBy}
                  options={sortOptions}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="border-[#CFEAED] bg-white hover:border-[#0EA5A4]"
                />
              </div>

              <div className="xl:col-span-2">
                <p className="mb-2 flex items-center gap-2 text-[12px] font-medium leading-4 text-[#0EA5A4]">
                  <Filter className="h-3.5 w-3.5" />
                  Page Size
                </p>
                <Select
                  value={pageSize}
                  options={pageSizeOptions}
                  onChange={(event) => setPageSize(event.target.value)}
                  className="border-[#CFEAED] bg-white hover:border-[#0EA5A4]"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end pt-1">
              <div className="inline-flex min-w-fit items-center gap-2 rounded-[10px] border border-[#CFEAED] bg-[#F0FDFA] px-4 py-2 ui-label text-[#0EA5A4]">
                <Ticket className="h-4 w-4" />
                {`Showing ${sortedTokens.length === 0 ? 0 : startIndex + 1}-${Math.min(startIndex + numericPageSize, sortedTokens.length)} of ${sortedTokens.length} tokens`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {sortedTokens.length === 0 ? (
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
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {paginatedTokens.map((token) => (
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

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 rounded-[14px] border border-[#D7EAF0] bg-[#FCFEFF] p-4 sm:flex-row sm:items-center sm:justify-between">
                <BodySecondary>{`Showing ${startIndex + 1}-${Math.min(startIndex + numericPageSize, sortedTokens.length)} of ${sortedTokens.length} tokens`}</BodySecondary>
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}
