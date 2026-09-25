import axios from "../axios";
import { Order } from "./fetchOrders";

export interface UpdateEntireOrderPayload {
  storefrontId?: string;
  ordersProducts: {
    inventoryId: string;
    quantity: number;
    unitPrice?: number;
  }[];
  subTotal: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  paymentType: "paid" | "credit";
  paymentMethod: string;
  note?: string;
  orderDate?: string;
  creditPersonId?: string | null;
  deliveryDetails?: {
    township?: string | null;
    townshipName?: string;
    deliveryFee?: number;
    recipientName?: string;
    recipientPhone?: string;
    deliveryAddress?: string;
  };
}

export interface UpdateEntireOrderResponse {
  success: boolean;
  message: string;
  data?: Order;
}

export const updateEntireOrder = async (
  orderId: string,
  payload: UpdateEntireOrderPayload
): Promise<UpdateEntireOrderResponse> => {
  try {
    const response = await axios.patch<UpdateEntireOrderResponse>(
      `/order/${orderId}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("updateEntireOrder error:", error);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to update order",
    };
  }
};
