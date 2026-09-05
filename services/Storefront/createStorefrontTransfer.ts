import axios from "../axios";
import { TransferLineItem } from "../Warehouse/createWarehouseTransfer";

export interface CreateStorefrontTransferPayload {
  sourceType: "Storefront";
  sourceStorefrontId: string;
  destinationStorefrontId?: string;
  destinationWarehouseId?: string;
  lineItems: TransferLineItem[];
  transferDate?: string;
  notes?: string;
}

interface CreateStorefrontTransferResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createStorefrontTransfer = async (
  payload: CreateStorefrontTransferPayload
): Promise<CreateStorefrontTransferResponse> => {
  try {
    const response = await axios.post("/transfer", payload);
    return {
      success: true,
      message: "Transfer created successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error creating storefront transfer:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to create transfer",
    };
  }
};
