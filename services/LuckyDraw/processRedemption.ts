import axios from "../axios";

export interface ProcessRedemptionPayload {
  promotionId: string;
  storefrontId: string;
  quantity?: number;
  ticketCode?: string;
  customerName?: string;
  note?: string;
}

interface ProcessRedemptionResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Process a lucky draw redemption (deducts stock atomically on the backend)
 */
export const processRedemption = async (
  payload: ProcessRedemptionPayload
): Promise<ProcessRedemptionResponse> => {
  try {
    const response = await axios.post("/lucky-draw/redemptions", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error processing redemption:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        String(error.response.headers["content-type"]).includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`
        );
      }

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }

      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
