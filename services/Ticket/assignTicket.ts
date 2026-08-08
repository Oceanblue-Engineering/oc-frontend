import axios from "../axios";
import { Ticket } from "./fetchTickets";

interface AssignTicketResponse {
  success: boolean;
  message: string;
  data?: { ticket: Ticket };
}

export const assignTicket = async (
  ticketId: string,
  assignedTo: string | null
): Promise<AssignTicketResponse> => {
  try {
    const response = await axios.patch(`/tickets/${ticketId}/assign`, {
      assigned_to: assignedTo,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error assigning ticket:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to assign ticket",
    };
  }
};