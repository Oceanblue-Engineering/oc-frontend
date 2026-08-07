import axios from "../axios";
import { Client } from "./fetchClients";

export interface AuditLog {
  _id: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "STATUS_CHANGE" | "LOG_ADDED";
  details: any;
  user: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchClientByIdResponse {
  success: boolean;
  message: string;
  data?: {
    client: Client;
    auditLogs: AuditLog[];
  };
}

export const fetchClientById = async (
  clientId: string
): Promise<FetchClientByIdResponse> => {
  try {
    const response = await axios.get(`/clients/${clientId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching client:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch client",
    };
  }
};
