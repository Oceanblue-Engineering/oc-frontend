import axios from "../axios";
import { Ticket } from "./fetchTickets";

interface CreateTicketRequest {
  title: string;
  description: string;
  priority?: string;
  department_id?: string;
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