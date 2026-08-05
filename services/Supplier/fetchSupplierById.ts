import axios from "../axios";
import { Supplier } from "../../types";

interface FetchSupplierByIdResponse {
  success: boolean;
  message: string;
  data: Supplier;
}

/**
 * Fetch a single supplier profile by ID via API
 * @param {string} supplierId - The supplier's ID
 * @returns {Promise<FetchSupplierByIdResponse>} Response from API
 */
export const fetchSupplierById = async (
  supplierId: string
): Promise<FetchSupplierByIdResponse> => {
  try {
    const response = await axios.get(`/supplier-profile/${supplierId}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching supplier by ID:", error);

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
