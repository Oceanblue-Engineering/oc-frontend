import axios from "../axios";

export type DeliveryStatus =
  | "pending"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

interface UpdateOrderDeliveryStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateOrderDeliveryStatus = async (
  orderId: string,
  deliveryStatus: DeliveryStatus
): Promise<UpdateOrderDeliveryStatusResponse> => {
  try {
    const response = await axios.patch(`/order/${orderId}/delivery-status`, {
      deliveryStatus,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating order delivery status:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update delivery status",
    };
  }
};
