import axios from "../axios";

export interface DeliveryAnalytics {
  totals: {
    totalOrders: number;
    totalRevenue: number;
  };
  byTownship: {
    townshipName: string;
    orders: number;
    revenue: number;
  }[];
  byStatus: Record<string, number>;
}

interface FetchDeliveryAnalyticsResponse {
  success: boolean;
  message: string;
  data?: DeliveryAnalytics;
}

export const fetchDeliveryAnalytics = async (): Promise<FetchDeliveryAnalyticsResponse> => {
  try {
    const response = await axios.get("/delivery-analytics");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching delivery analytics:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch delivery analytics",
    };
  }
};