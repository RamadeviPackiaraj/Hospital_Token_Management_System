export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalRecords: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export type SortOrder = "asc" | "desc";

export interface ServerListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  status?: string;
  department?: string;
  date?: string;
  source?: string;
  origin?: string;
  finalStatus?: string;
}

export function buildServerSort(sortBy?: string, sortOrder: SortOrder = "desc") {
  if (!sortBy) return undefined;
  return sortOrder === "desc" ? `-${sortBy}` : sortBy;
}
