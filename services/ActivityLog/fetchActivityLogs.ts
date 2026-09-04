import axios from "../axios";

export interface ActivityLogUser {
  _id: string | null;
  name: string;
  email: string;
  role: string;
}

export interface ActivityLog {
  _id: string;
  user: ActivityLogUser;
  method: "POST" | "PUT" | "PATCH" | "DELETE" | string;
  endpoint: string;
  module: string;
  action: string;
  statusCode: number;
  status: "SUCCESS" | "FAILED";
  requestBody?: any;
  requestParams?: any;
  requestQuery?: any;
  errorMessage?: string | null;
  ipAddress?: string;
  userAgent?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogStats {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  successfulLogs: number;
  failedLogs: number;
  methodBreakdown: {
    POST: number;
    PUT: number;
    PATCH: number;
    DELETE: number;
  };
  topUsers: Array<{
    _id: string;
    name: string;
    role: string;
    count: number;
  }>;
  topModules: Array<{
    _id: string;
    count: number;
  }>;
}

export interface ActivityLogPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface FetchActivityLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  method?: string;
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FetchActivityLogsResponse {
  success: boolean;
  message?: string;
  data: ActivityLog[];
  pagination: ActivityLogPagination;
}

export interface FetchActivityLogStatsResponse {
  success: boolean;
  data: ActivityLogStats;
}

export const fetchActivityLogs = async (
  params?: FetchActivityLogsParams
): Promise<FetchActivityLogsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.module && params.module !== "ALL") queryParams.append("module", params.module);
  if (params?.method && params.method !== "ALL") queryParams.append("method", params.method);
  if (params?.status && params.status !== "ALL") queryParams.append("status", params.status);
  if (params?.userId) queryParams.append("userId", params.userId);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const response = await axios.get(`/activity-logs?${queryParams.toString()}`);
  return response.data;
};

export const fetchActivityLogStats = async (): Promise<FetchActivityLogStatsResponse> => {
  const response = await axios.get("/activity-logs/stats");
  return response.data;
};
