import axios from "../axios";

export interface SupplierPaymentUser {
  _id: string;
  name: string;
  role: string;
}

export interface SupplierPayment {
  _id: string;
  purchasingId: string;
  supplierId?: string;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  addedBy: SupplierPaymentUser | string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FetchPurchasePaymentsResponse {
  success: boolean;
  message: string;
  data: SupplierPayment[];
}

export const fetchPurchasePayments = async (
  purchaseId: string
): Promise<FetchPurchasePaymentsResponse> => {
  try {
    const response = await axios.get(`/purchase/${purchaseId}/payments`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching purchase payments:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch purchase payment history",
      data: [],
    };
  }
};
