import axios from "../axios";

export interface Worker {
  _id: string;
  name: string;
  phone: string;
  position?: string;
  dailyRate: number;
  telegramId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchWorkersResponse {
  success: boolean;
  message: string;
  data: {
    workers: Worker[];
  };
}

interface FetchWorkerByIdResponse {
  success: boolean;
  message: string;
  data: {
    worker: Worker;
  };
}

interface WorkerMutateResponse {
  success: boolean;
  message: string;
  data?: {
    worker: Worker;
  };
}

export const fetchWorkers = async (): Promise<FetchWorkersResponse> => {
  try {
    const response = await axios.get("/workers");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching workers:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch workers",
      data: { workers: [] },
    };
  }
};

export const fetchWorkerById = async (id: string): Promise<FetchWorkerByIdResponse> => {
  try {
    const response = await axios.get(`/workers/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching worker:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch worker",
      data: {} as any,
    };
  }
};

export const createWorker = async (data: Partial<Worker>): Promise<WorkerMutateResponse> => {
  try {
    const response = await axios.post("/workers", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating worker:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create worker",
    };
  }
};

export const updateWorker = async (id: string, data: Partial<Worker>): Promise<WorkerMutateResponse> => {
  try {
    const response = await axios.patch(`/workers/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating worker:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update worker",
    };
  }
};

export const deleteWorker = async (id: string): Promise<WorkerMutateResponse> => {
  try {
    const response = await axios.delete(`/workers/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting worker:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete worker",
    };
  }
};
