import axios from "../axios";
import { SupplierPayment } from "./fetchPurchasePayments";

export interface CreatePurchasePaymentPayload {
  paidAmount: number;
  paymentMethod: string;
  notes?: string;
  paymentDate?: string;
}

export interface CreatePurchasePaymentResponse {
  success: boolean;
  message: string;
  data: SupplierPayment | null;
}

export const createPurchasePayment = async (
  purchaseId: string,
  payload: CreatePurchasePaymentPayload
): Promise<CreatePurchasePaymentResponse> => {
  try {
    const response = await axios.post(
      `/purchase/${purchaseId}/payment`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating purchase payment:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to add purchase payment",
      data: null,
    };
  }
};
