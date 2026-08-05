import axios from "../axios";

export interface UpdatePromotionPayload {
  promotionName?: string;
  ticketName?: string;
  inventoryId?: string;
  redemptionPrice?: number;
  quantityPerRedeem?: number;
  isActive?: boolean;
  storefrontId?: string | null;
}

interface UpdatePromotionResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Update an existing lucky draw promotion
 */
export const updatePromotion = async (
  promotionId: string,
  payload: UpdatePromotionPayload
): Promise<UpdatePromotionResponse> => {
  try {
    const response = await axios.patch(
      `/lucky-draw/promotions/${promotionId}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating promotion:", error);

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
