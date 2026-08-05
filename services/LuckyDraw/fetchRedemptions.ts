import axios from "../axios";

export interface LuckyDrawRedemption {
  _id: string;
  redemptionNumber: string;
  promotionId: {
    _id: string;
    promotionName: string;
    ticketName: string;
    redemptionPrice: number;
  } | null;
  inventoryId: {
    _id: string;
    productName: string;
    productCode?: string;
  } | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  storefrontId: {
    _id: string;
    locationName: string;
    locationCode: string;
  } | null;
  ticketCode: string | null;
  customerName: string | null;
  redeemedBy: {
    _id: string;
    name: string;
  } | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FetchRedemptionsResponse {
  success: boolean;
  message: string;
  data: { redemptions: LuckyDrawRedemption[] };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Fetch lucky draw redemptions with optional date and search filters
 */
export const fetchRedemptions = async (
  startDate?: string | null,
  endDate?: string | null,
  search?: string | null
): Promise<FetchRedemptionsResponse> => {
  try {
    const params: Record<string, string> = { limit: "100" };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (search) params.search = search;

    const response = await axios.get("/lucky-draw/redemptions", { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching redemptions:", error);

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
