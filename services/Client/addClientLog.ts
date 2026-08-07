import axios from "../axios";
import { Client } from "./fetchClients";

interface AddClientLogResponse {
  success: boolean;
  message: string;
  data?: {
    client: Client;
  };
}

export const addClientLog = async (
  clientId: string,
  text: string
): Promise<AddClientLogResponse> => {
  try {
    const response = await axios.post(`/clients/${clientId}/logs`, { text });
    return response.data;
  } catch (error: any) {
    console.error("Error adding client log:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add log",
    };
  }
};