import axios from "../axios";

interface DeleteTicketResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const deleteTicket = async (
  ticketId: string
): Promise<DeleteTicketResponse> => {
  try {
    const response = await axios.delete(`/tickets/${ticketId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting ticket:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete ticket",
    };
  }
};