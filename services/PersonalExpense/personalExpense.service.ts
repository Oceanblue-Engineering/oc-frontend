import axios from "../axios";

export interface AdminInfo {
  _id: string;
  name: string;
  role: string;
}

export interface PersonalExpense {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: "cash" | "kpay" | "wavepay" | "ayapay" | "uabpay" | "bank_transfer" | "other";
  notes?: string;
  adminId: AdminInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalExpenseSummary {
  allTime: {
    totalAmount: number;
    count: number;
  };
  thisMonth: {
    totalAmount: number;
    count: number;
  };
  thisWeek: {
    totalAmount: number;
    count: number;
  };
  categoryBreakdown: {
    category: string;
    totalAmount: number;
    count: number;
  }[];
}

export interface FetchPersonalExpensesParams {
  startDate?: string | null;
  endDate?: string | null;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface FetchPersonalExpensesResponse {
  success: boolean;
  message: string;
  data: PersonalExpense[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

interface PersonalExpenseDetailResponse {
  success: boolean;
  message?: string;
  data: PersonalExpense;
}

interface PersonalExpenseSummaryResponse {
  success: boolean;
  data: PersonalExpenseSummary;
}

export interface CreatePersonalExpensePayload {
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  notes?: string;
}

export interface UpdatePersonalExpensePayload {
  title?: string;
  category?: string;
  amount?: number;
  date?: string;
  paymentMethod?: string;
  notes?: string;
}

export const fetchPersonalExpenses = async (
  params?: FetchPersonalExpensesParams
): Promise<FetchPersonalExpensesResponse> => {
  try {
    const urlParams = new URLSearchParams();
    if (params?.startDate) urlParams.append("startDate", params.startDate);
    if (params?.endDate) urlParams.append("endDate", params.endDate);
    if (params?.category && params.category !== "all") {
      urlParams.append("category", params.category);
    }
    if (params?.search) urlParams.append("search", params.search);
    if (params?.page) urlParams.append("page", String(params.page));
    if (params?.limit) urlParams.append("limit", String(params.limit));

    const url = `/personal-expense${
      urlParams.toString() ? `?${urlParams.toString()}` : ""
    }`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching personal expenses:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch personal expenses",
      data: [],
    };
  }
};

export const fetchPersonalExpenseSummary = async (): Promise<PersonalExpenseSummaryResponse> => {
  try {
    const response = await axios.get("/personal-expense/summary");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching personal expense summary:", error);
    return {
      success: false,
      data: {
        allTime: { totalAmount: 0, count: 0 },
        thisMonth: { totalAmount: 0, count: 0 },
        thisWeek: { totalAmount: 0, count: 0 },
        categoryBreakdown: [],
      },
    };
  }
};

export const createPersonalExpense = async (
  payload: CreatePersonalExpensePayload
): Promise<{ success: boolean; message: string; data?: PersonalExpense }> => {
  try {
    const response = await axios.post("/personal-expense", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error creating personal expense:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create personal expense",
    };
  }
};

export const updatePersonalExpense = async (
  id: string,
  payload: UpdatePersonalExpensePayload
): Promise<{ success: boolean; message: string; data?: PersonalExpense }> => {
  try {
    const response = await axios.patch(`/personal-expense/${id}`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error updating personal expense:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update personal expense",
    };
  }
};

export const deletePersonalExpense = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`/personal-expense/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting personal expense:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete personal expense",
    };
  }
};
