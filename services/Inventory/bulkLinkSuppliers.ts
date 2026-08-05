import axios from "../axios";

export interface BulkLinkSuppliersPayload {
  productIds: string[];
  supplierIds: string[];
}

export interface BulkLinkSuppliersResponse {
  success: boolean;
  message: string;
  matchedCount?: number;
  modifiedCount?: number;
  data?: any;
}

/**
 * Bulk link products to suppliers
 * @param {BulkLinkSuppliersPayload} payload - Payload containing productIds and supplierIds arrays
 * @returns {Promise<BulkLinkSuppliersResponse>} Response from API
 */
export const bulkLinkSuppliers = async (
  payload: BulkLinkSuppliersPayload
): Promise<BulkLinkSuppliersResponse> => {
  try {
    const response = await axios.post("/inventory/bulk-link-suppliers", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error bulk linking suppliers:", error);

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

/**
 * Bulk unlink products from suppliers
 * @param {BulkLinkSuppliersPayload} payload - Payload containing productIds and supplierIds arrays
 * @returns {Promise<BulkLinkSuppliersResponse>} Response from API
 */
export const bulkUnlinkSuppliers = async (
  payload: BulkLinkSuppliersPayload
): Promise<BulkLinkSuppliersResponse> => {
  try {
    const response = await axios.post("/inventory/bulk-unlink-suppliers", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error bulk unlinking suppliers:", error);

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
