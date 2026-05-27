"use client";

import { apiRequest } from "@/lib/api";
import { buildQuery } from "@/lib/api";
import { buildServerSort, type PaginatedResponse, type ServerListParams } from "@/lib/pagination";
import type { ActiveCall, CallLogEntry, HospitalCallTarget, OperationalMessageTemplate } from "@/lib/calls";

export interface CallBootstrapData {
  targets: HospitalCallTarget[];
  messages: OperationalMessageTemplate[];
  activeCalls: ActiveCall[];
  callLogs: CallLogEntry[];
}

export function getCallBootstrap() {
  return apiRequest<CallBootstrapData>("/calls/bootstrap");
}

export function getCallTargets() {
  return apiRequest<HospitalCallTarget[]>("/calls/targets");
}

export function getCallMessageTemplates() {
  return apiRequest<OperationalMessageTemplate[]>("/calls/message-templates");
}

export function createCallMessageTemplate(payload: {
  label: string;
}) {
  return apiRequest<OperationalMessageTemplate>("/calls/message-templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCallMessageTemplate(
  templateId: string,
  payload: {
    label: string;
  }
) {
  return apiRequest<OperationalMessageTemplate>(`/calls/message-templates/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCallMessageTemplate(templateId: string) {
  return apiRequest<{ id: string }>(`/calls/message-templates/${templateId}`, {
    method: "DELETE",
  });
}

export function getActiveCalls() {
  return apiRequest<ActiveCall[]>("/calls/active");
}

export function getCallLogs() {
  return apiRequest<CallLogEntry[]>("/calls/logs");
}

export function getCallLogsPage(params: ServerListParams = {}) {
  return apiRequest<PaginatedResponse<CallLogEntry>>(
    `/calls/logs${buildQuery({
      page: params.page,
      limit: params.limit,
      department: params.department,
      search: params.search,
      date: params.date,
      finalStatus: params.finalStatus,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      sort: buildServerSort(params.sortBy, params.sortOrder),
    })}`
  );
}

export function createCall(payload: {
  hospitalId: string;
  messageId?: string;
  messageLabel?: string;
  priority?: OperationalMessageTemplate["priority"];
}) {
  return apiRequest<ActiveCall>("/calls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function endCall(payload: {
  callId: string;
  finalStatus?: CallLogEntry["finalStatus"];
  endedBy?: CallLogEntry["endedBy"] | "system";
}) {
  return apiRequest<CallLogEntry>(`/calls/${payload.callId}/end`, {
    method: "PATCH",
    body: JSON.stringify({
      finalStatus: payload.finalStatus,
      endedBy: payload.endedBy,
    }),
  });
}
