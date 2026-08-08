import axios from "../axios";

export interface Department {
  _id: string;
  name: string;
  isDeleted?: boolean;
}

interface FetchDepartmentsResponse {
  success: boolean;
  message: string;
  data: { departments: Department[] };
}

export const fetchDepartments = async (): Promise<FetchDepartmentsResponse> => {
  try {
    const response = await axios.get("/departments");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch departments",
      data: { departments: [] },
    };
  }
};