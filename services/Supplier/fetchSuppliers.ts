import axios from "../axios";
import { Supplier } from "../../types";

interface FetchSuppliersResponse {
  success: boolean;
  message: string;
  data: Supplier[];
}

/**
 * Fetch all supplier profiles via API
 * @param {boolean} isDeleted - Optional: Set to true to fetch soft-deleted suppliers
 * @returns {Promise<FetchSuppliersResponse>} Response from API
 */
export const fetchSuppliers = async (
  isDeleted?: boolean,
  search?: string
): Promise<FetchSuppliersResponse> => {
  try {
    const params = new URLSearchParams();
    if (isDeleted !== undefined) {
      params.append("isDeleted", String(isDeleted));
    }
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    const queryString = params.toString();
    const url = `/supplier-profile${queryString ? `?${queryString}` : ""}`;
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching suppliers:", error);

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
