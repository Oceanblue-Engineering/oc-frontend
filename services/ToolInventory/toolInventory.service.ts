import axios from "axios";

const API = "";

export interface ToolItem {
  _id: string;
  name: string;
  category: string;
  serialNumber: string;
  totalQuantity: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolTransaction {
  _id: string;
  toolId: { _id: string; name: string; category: string };
  allocationId: string;
  workerId: { _id: string; name: string; phone: string; position: string };
  projectId: { _id: string; siteName: string; customer: string };
  issuedBy?: { _id: string; name: string };
  quantity: number;
  checkedOutAt: string;
  expectedReturnAt?: string | null;
  returnedAt?: string | null;
  returnedQty: number;
  damagedQty: number;
  lostQty: number;
  notes: string;
  createdAt: string;
}

export interface CheckoutPayload {
  allocationId: string;
  workerId: string;
  quantity: number;
  expectedReturnAt?: string | null;
}

export interface CheckinPayload {
  transactionId: string;
  returnedQty: number;
  damagedQty: number;
  lostQty: number;
  notes?: string;
}

export interface ToolFilters {
  status?: string;
  category?: string;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionFilters {
  projectId?: string;
  workerId?: string;
  toolId?: string;
  allocationId?: string;
  isReturned?: "true" | "false";
  page?: number;
  limit?: number;
}

export const searchTools = async (q: string) => {
  const res = await axios.get(`${API}/tools/search?q=${encodeURIComponent(q)}`);
  return res.data;
};

export const fetchTools = async (filters?: ToolFilters) => {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  const res = await axios.get(`${API}/tools?${params}`);
  return res.data;
};

export const fetchToolById = async (id: string) => {
  const res = await axios.get(`${API}/tools/${id}`);
  return res.data;
};

export const createTool = async (data: Partial<ToolItem>) => {
  const res = await axios.post(`${API}/tools`, data);
  return res.data;
};

export const updateTool = async (id: string, data: Partial<ToolItem>) => {
  const res = await axios.put(`${API}/tools/${id}`, data);
  return res.data;
};

export const deleteTool = async (id: string) => {
  const res = await axios.delete(`${API}/tools/${id}`);
  return res.data;
};

export const checkoutTool = async (payload: CheckoutPayload) => {
  const res = await axios.post(`${API}/tools/checkout`, payload);
  return res.data;
};

export const checkinTool = async (payload: CheckinPayload) => {
  const res = await axios.post(`${API}/tools/checkin`, payload);
  return res.data;
};

export const fetchOverdueTools = async (projectId?: string) => {
  const params = projectId ? `?projectId=${projectId}` : "";
  const res = await axios.get(`${API}/tools/overdue${params}`);
  return res.data;
};

export const fetchTransactions = async (filters?: TransactionFilters) => {
  const params = new URLSearchParams();
  if (filters?.projectId) params.append("projectId", filters.projectId);
  if (filters?.workerId) params.append("workerId", filters.workerId);
  if (filters?.toolId) params.append("toolId", filters.toolId);
  if (filters?.allocationId) params.append("allocationId", filters.allocationId);
  if (filters?.isReturned !== undefined) params.append("isReturned", filters.isReturned);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  const res = await axios.get(`${API}/tools/transactions?${params}`);
  return res.data;
};
