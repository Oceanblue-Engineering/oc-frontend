import axios from "../axios";
import { Township } from "./fetchTownships";

interface CreateTownshipRequest {
  name: string;
  deliveryFee: number;
  isActive?: boolean;
}

interface CreateTownshipResponse {
  success: boolean;
  message: string;
  data?: {
    township: Township;
  };
}

export const createTownship = async (
  data: CreateTownshipRequest
): Promise<CreateTownshipResponse> => {
  try {
    const response = await axios.post("/townships", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating township:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create township",
    };
  }
};
