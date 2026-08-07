import axios from "../axios";
import { Client, LeadType } from "./fetchClients";

export interface UpdateClientRequest {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  leadType?: LeadType;
  companyName?: string;
  businessName?: string;
  industry?: string;
  status?: string;
  sourceChannel?: string;
  currentProblems?: string;
  desiredOutcome?: string;
  nextActionDate?: string;
  conversationLogs?: { text: string; date: string }[];
  projectId?: string;
  projectStartDate?: string;
  projectDeliveryDate?: string;
  deliverablesSummary?: string;
  purchasedServices?: {
    name: string;
    type: string;
    status: "pending" | "active" | "completed";
  }[];
}

interface UpdateClientResponse {
  success: boolean;
  message: string;
  data?: {
    client: Client;
  };
}

export const updateClient = async (
  clientId: string,
  data: UpdateClientRequest
): Promise<UpdateClientResponse> => {
  try {
    const response = await axios.patch(`/clients/${clientId}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating client:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update client",
    };
  }
};
