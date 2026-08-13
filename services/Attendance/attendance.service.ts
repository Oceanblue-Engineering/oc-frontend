import axios from "../axios";

export interface AttendanceRecord {
  _id?: string;
  projectId: string;
  userId: {
    _id: string;
    name: string;
    role: string;
    position?: string | null;
    dailyRate: number;
  };
  date: string;
  status: "present" | "half_day" | "absent" | "overtime_only";
  shift: "day" | "night" | "full_day";
  overtimeWage: number;
  dailyWageEarned: number;
  notes?: string;
}

export interface AttendanceSummaryItem {
  _id: string;
  workerName: string;
  role: string;
  position?: string | null;
  dailyRate: number;
  totalDaysPresent: number;
  totalHalfDays: number;
  totalDaysAbsent: number;
  totalOvertimeWage: number;
  totalWageEarned: number;
}

export interface BulkAttendanceRecordInput {
  userId: string;
  status: "present" | "half_day" | "absent" | "overtime_only";
  shift: "day" | "night" | "full_day";
  overtimeWage: number;
  notes: string;
}

interface FetchAttendanceResponse {
  success: boolean;
  message: string;
  data: AttendanceRecord[];
}

interface SaveBulkAttendanceResponse {
  success: boolean;
  message: string;
}

interface FetchAttendanceSummaryResponse {
  success: boolean;
  message: string;
  data: AttendanceSummaryItem[];
}

export const fetchAttendance = async (
  projectId: string,
  date: string
): Promise<FetchAttendanceResponse> => {
  try {
    const response = await axios.get(
      `/projects/${projectId}/attendance?date=${date}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch attendance records.",
      data: [],
    };
  }
};

export const saveBulkAttendance = async (
  projectId: string,
  date: string,
  records: BulkAttendanceRecordInput[]
): Promise<SaveBulkAttendanceResponse> => {
  try {
    const response = await axios.post(`/projects/${projectId}/attendance/bulk`, {
      date,
      records,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error saving bulk attendance:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to save attendance records.",
    };
  }
};

export const fetchAttendanceSummary = async (
  projectId: string
): Promise<FetchAttendanceSummaryResponse> => {
  try {
    const response = await axios.get(`/projects/${projectId}/attendance/summary`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching attendance summary:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch attendance summary.",
      data: [],
    };
  }
};
