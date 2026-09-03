import axios from "../axios";
import type { Language } from "../../context/LanguageContext";

// TypeScript interfaces for API responses
export interface ProjectExpense {
  _id: string;
  projectId?: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  adminId?: {
    _id?: string;
    name: string;
    role?: string;
  };
  locationId?: {
    _id?: string;
    locationName: string;
    locationCode?: string;
  };
  // Legacy aliases
  expenseDate?: string;
  expenseType?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectExpensesResponse {
  success: boolean;
  message: string;
  data: {
    expenses: ProjectExpense[];
    summary: {
      totalExpenses: number;
      byCategory: Record<string, number>;
      monthlyTotals: Array<{
        month: string;
        total: number;
      }>;
      expenseCount: number;
    };
  };
}

export interface WorkerPayroll {
  _id: string;
  name: string;
  position: string;
  dailyRate: number;
  hoursWorked: number;
  totalWage: number;
  attendanceCount: number;
}

export interface ProjectPayrollSummaryResponse {
  success: boolean;
  message: string;
  data: {
    workers: WorkerPayroll[];
    summary: {
      totalWorkers: number;
      totalHoursWorked: number;
      totalPayroll: number;
      avgDailyRate: number;
      byPosition: Record<string, number>;
      attendanceRecordCount: number;
    };
  };
}

export interface ProjectFinancialSummary {
  project: {
    _id: string;
    siteName: string;
    description: string;
    customer: string;
    startDate: string;
    endDate: string;
    status: string;
    workers: Array<{
      _id: string;
      name: string;
      position: string;
      dailyRate: number;
    }>;
  };
  financials: {
    totalExpenses: number;
    totalPayroll: number;
    totalCost: number;
    estimatedRevenue: number;
    estimatedProfit: number;
    profitMargin: number;
    expenseCount: number;
    attendanceCount: number;
  };
  timeline: {
    daysElapsed: number;
    daysRemaining: number;
    percentComplete: number;
  };
}

export interface ProjectFinancialSummaryResponse {
  success: boolean;
  message: string;
  data: ProjectFinancialSummary;
}

// Get project expenses API call
export const fetchProjectExpenses = async (
  projectId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    groupBy?: "category" | "month";
  }
): Promise<ProjectExpensesResponse> => {
  try {
    const params: Record<string, string> = {};
    if (options?.startDate) params.startDate = options.startDate;
    if (options?.endDate) params.endDate = options.endDate;
    if (options?.groupBy) params.groupBy = options.groupBy;

    const response = await axios.get(`/projects/${projectId}/expenses`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching project expenses:", error);
    throw error;
  }
};

// Get project payroll summary API call
export const fetchProjectPayrollSummary = async (
  projectId: string,
  month?: string
): Promise<ProjectPayrollSummaryResponse> => {
  try {
    const params: Record<string, string> = {};
    if (month) params.month = month;

    const response = await axios.get(`/projects/${projectId}/payroll-summary`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching project payroll summary:", error);
    throw error;
  }
};

// Get project financial summary API call
export const fetchProjectFinancialSummary = async (
  projectId: string
): Promise<ProjectFinancialSummaryResponse> => {
  try {
    const response = await axios.get(`/projects/${projectId}/financial-summary`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching project financial summary:", error);
    throw error;
  }
};

// Utility function to format currency — standard MMK currency format
export const formatCurrency = (amount: number, language?: Language): string => {
  const num = Math.floor(Number(amount) || 0);
  return `${num.toLocaleString("en-US")} MMK`;
};

// Utility function to format percentage
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};