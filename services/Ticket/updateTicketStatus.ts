import axios from "../axios";
import { Ticket } from "./fetchTickets";

interface UpdateTicketStatusResponse {
  success: boolean;
  message: string;
  data?: { ticket: Ticket };
}

export const updateTicketStatus = async (
  ticketId: string,
  status: string
): Promise<UpdateTicketStatusResponse> => {
  try {
    const response = await axios.patch(`/tickets/${ticketId}/status`, { status });
    return response.data;
  } catch (error: any) {
    console.error("Error updating ticket status:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update ticket status",
    };
  }
};