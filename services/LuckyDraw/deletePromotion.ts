import axios from "../axios";

interface DeletePromotionResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Soft-delete a lucky draw promotion
 */
export const deletePromotion = async (
  promotionId: string
): Promise<DeletePromotionResponse> => {
  try {
    const response = await axios.delete(
      `/lucky-draw/promotions/${promotionId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting promotion:", error);

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
