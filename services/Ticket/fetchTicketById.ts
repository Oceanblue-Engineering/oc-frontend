import axios from "../axios";
import { Ticket } from "./fetchTickets";

export interface TicketComment {
  _id: string;
  ticket_id: string;
  user_id: { _id: string; name: string };
  message: string;
  createdAt?: string;
}

export interface TicketHistoryLog {
  _id: string;
  ticket_id: string;
  user_id: { _id: string; name: string };
  action_performed: string;
  createdAt?: string;
}

interface FetchTicketByIdResponse {
  success: boolean;
  message: string;
  data?: {
    ticket: Ticket;
    comments: TicketComment[];
    history: TicketHistoryLog[];
  };
}

export const fetchTicketById = async (
  ticketId: string
): Promise<FetchTicketByIdResponse> => {
  try {
    const response = await axios.get(`/tickets/${ticketId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch ticket",
    };
  }
};