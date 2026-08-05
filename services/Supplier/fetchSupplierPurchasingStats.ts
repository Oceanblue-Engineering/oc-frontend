import axios from "../axios";
import { ApiPurchaseOrder } from "../../types";

export interface SupplierPurchasingStatistics {
  totalPurchasedAmount: number;
  totalPaidAmount: number;
  totalDebt: number;
}

export interface FetchSupplierPurchasingStatsResponse {
  success: boolean;
  message: string;
  data: {
    statistics: SupplierPurchasingStatistics;
    purchaseOrders: ApiPurchaseOrder[];
  };
}

/**
 * Fetch purchasing statistics and purchase orders for a specific supplier by ID
 * @param {string} supplierId - The supplier's ID
 * @returns {Promise<FetchSupplierPurchasingStatsResponse>} Response from API
 */
export const fetchSupplierPurchasingStats = async (
  supplierId: string
): Promise<FetchSupplierPurchasingStatsResponse> => {
  try {
    const response = await axios.get(
      `/supplier-profile/${supplierId}/purchasing-stats`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching supplier purchasing stats:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers &&
        String(error.response.headers["content-type"] || "").includes("text/html")
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
