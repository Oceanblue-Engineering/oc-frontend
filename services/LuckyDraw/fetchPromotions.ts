import axios from "../axios";

export interface LuckyDrawPromotion {
  _id: string;
  promotionName: string;
  ticketName: string;
  inventoryId: {
    _id: string;
    productName: string;
    productCode?: string;
    sellingPrice?: number;
  } | null;
  redemptionPrice: number;
  quantityPerRedeem: number;
  isActive: boolean;
  storefrontId: {
    _id: string;
    locationName: string;
    locationCode: string;
  } | null;
  createdBy: {
    _id: string;
    name: string;
  } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FetchPromotionsResponse {
  success: boolean;
  message: string;
  data: { promotions: LuckyDrawPromotion[] };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Fetch lucky draw promotions from API
 * @param isActive - Optional filter for active/inactive promotions
 * @param page - Page number
 * @param limit - Items per page
 */
export const fetchPromotions = async (
  isActive?: boolean,
  page: number = 1,
  limit: number = 10
): Promise<FetchPromotionsResponse> => {
  try {
    const params: Record<string, string> = { 
      page: String(page),
      limit: String(limit)
    };
    if (isActive !== undefined) {
      params.isActive = String(isActive);
    }
    const response = await axios.get("/lucky-draw/promotions", { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching promotions:", error);

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
