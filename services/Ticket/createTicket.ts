import axios from "../axios";
import { Ticket } from "./fetchTickets";

interface CreateTicketRequest {
  title: string;
  description: string;
  priority?: string;
  type?: string;
  project_details?: {
    project_name?: string;
    time?: string;
    desc?: string;
    number_of_worker?: number;
    time_duration?: string;
    note?: string;
  };
}

interface CreateTicketResponse {
  success: boolean;
  message: string;
  data?: { ticket: Ticket };
}

export const createTicket = async (
  data: CreateTicketRequest
): Promise<CreateTicketResponse> => {
  try {
    const response = await axios.post("/tickets", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create ticket",
    };
  }
};