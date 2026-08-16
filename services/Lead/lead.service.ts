import axios from "../axios";
import { LeadType } from "../../config/clientPipelines";

export interface Lead {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  leadType: LeadType;
  companyName?: string;
  businessName?: string;
  industry?: string;
  status: string;
  inquiryDate?: string;
  sourceChannel?: string;
  currentProblems?: string;
  desiredOutcome?: string;
  nextActionDate?: string;
  conversationLogs?: { text: string; date: string }[];
  createdAt?: string;
  updatedAt?: string;
}

interface FetchLeadsResponse {
  success: boolean;
  message: string;
  data: {
    clients: Lead[]; // Kept as 'clients' key to match UI list binding format
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface LeadDetailsResponse {
  success: boolean;
  message: string;
  data: {
    client: Lead;
    auditLogs: any[];
  };
}

export const fetchLeads = async (params?: {
  leadType?: LeadType;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<FetchLeadsResponse> => {
  try {
    let url = "/leads";
    const qs = new URLSearchParams();

    if (params?.leadType) qs.append("leadType", params.leadType);
    if (params?.search) qs.append("search", params.search);
    if (params?.status) qs.append("status", params.status);
    if (params?.page) qs.append("page", String(params.page));
    if (params?.limit) qs.append("limit", String(params.limit));

    if (qs.toString()) url += `?${qs.toString()}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch leads",
      data: { clients: [] },
    };
  }
};

export const createLead = async (payload: Partial<Lead>): Promise<{ success: boolean; message: string; data?: { lead: Lead } }> => {
  try {
    const response = await axios.post("/leads", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create lead");
  }
};

export const fetchLeadById = async (id: string): Promise<LeadDetailsResponse> => {
  try {
    const response = await axios.get(`/leads/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch lead details");
  }
};

export const updateLead = async (id: string, payload: Partial<Lead>): Promise<{ success: boolean; message: string; data?: { client: any; converted: boolean } }> => {
  try {
    const response = await axios.patch(`/leads/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update lead");
  }
};

export const addLeadLog = async (id: string, text: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(`/leads/${id}/log`, { text });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to add conversation log");
  }
};

export const deleteLead = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`/leads/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete lead");
  }
};
