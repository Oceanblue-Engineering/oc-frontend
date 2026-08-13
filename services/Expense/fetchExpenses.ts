import axios from "../axios";

export interface LocationInfo {
  _id: string;
  type: string;
  locationCode: string;
  locationName: string;
  locationAddress: string;
  storefrontCode?: string;
  storefrontName?: string;
}

export interface AdminInfo {
  _id: string;
  name: string;
  role: string;
}

export interface Expense {
  _id: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  locationId: LocationInfo | null;
  adminId: AdminInfo | null;
  projectId?: { _id: string; siteName: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface FetchExpensesResponse {
  success: boolean;
  message: string;
  data: Expense[];
}

export const fetchExpenses = async (
  startDate?: string | null,
  endDate?: string | null,
  projectId?: string | null,
): Promise<FetchExpensesResponse> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (projectId) params.append("projectId", projectId);

    const url = `/expense${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch expenses",
      data: [],
    };
  }
};
