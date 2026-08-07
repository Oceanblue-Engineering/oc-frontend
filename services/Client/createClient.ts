import axios from "../axios";
import { Client, LeadType } from "./fetchClients";

export interface CreateClientRequest {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  leadType?: LeadType;
  companyName?: string;
  businessName?: string;
  industry?: string;
  sourceChannel?: string;
  currentProblems?: string;
  desiredOutcome?: string;
  inquiryDate?: string;
}

interface CreateClientResponse {
  success: boolean;
  message: string;
  data?: {
    client: Client;
  };
}

export const createClient = async (
  data: CreateClientRequest
): Promise<CreateClientResponse> => {
  try {
    const response = await axios.post("/clients", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating client:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create client",
    };
  }
};
