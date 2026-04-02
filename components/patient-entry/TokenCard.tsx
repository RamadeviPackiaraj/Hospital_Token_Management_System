"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { PatientTokenRecord, PatientTokenStatus } from "@/lib/mock-data/scheduling";
import { formatScheduleDate, formatTimeTo12Hour } from "@/lib/scheduling";
import { TokenStatusBadge } from "./TokenStatusBadge";

interface TokenCardProps {
  token: PatientTokenRecord;
  isUpdating?: boolean;
  onStatusChange: (tokenId: string, status: PatientTokenStatus) => void | Promise<void>;
}

export function TokenCard({
  token,
  isUpdating = false,
  onStatusChange,
}: TokenCardProps) {
  return (
    <article className="ui-card transition hover:border-[#0EA5A4]">
      <div className="flex flex-wrap items-start gap-2">
        <Badge
          status="info"
          className="px-2 py-1 text-xs font-medium"
        >
          Token #{token.tokenNumber}
        </Badge>
        <Badge
          status="info"
          className="px-2 py-1 text-xs font-medium"
        >
          {token.department}
        </Badge>
        <TokenStatusBadge status={token.status} />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="ui-card-title">{token.patientName}</p>
          <p className="mt-1 ui-card-body">{token.doctorName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-[#E2E8F0] pt-4">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 text-[#0EA5A4]" />
            <div>
              <p className="ui-meta">Date</p>
              <p className="mt-1 ui-card-body">{formatScheduleDate(token.date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 text-[#0EA5A4]" />
            <div>
              <p className="ui-meta">Time</p>
              <p className="mt-1 ui-card-body">{formatTimeTo12Hour(token.time)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E2E8F0] pt-4">
        {token.status === "NOT_STARTED" ? (
          <Button
            size="sm"
            onClick={() => void onStatusChange(token.id, "CALLING")}
            loading={isUpdating}
          >
            Call Patient
          </Button>
        ) : null}

        {token.status === "CALLING" ? (
          <Button
            size="sm"
            variant="success"
            onClick={() => void onStatusChange(token.id, "COMPLETED")}
            loading={isUpdating}
          >
            End Call
          </Button>
        ) : null}

        {token.status !== "NOT_STARTED" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void onStatusChange(token.id, "NOT_STARTED")}
            loading={isUpdating}
          >
            Reset
          </Button>
        ) : null}
      </div>
    </article>
  );
}
