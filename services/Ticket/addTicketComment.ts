import axios from "../axios";

interface AddTicketCommentResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const addTicketComment = async (
  ticketId: string,
  message: string
): Promise<AddTicketCommentResponse> => {
  try {
    const response = await axios.post(`/tickets/${ticketId}/comments`, { message });
    return response.data;
  } catch (error: any) {
    console.error("Error adding ticket comment:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to add ticket comment",
    };
  }
};