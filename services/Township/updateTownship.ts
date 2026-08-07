import axios from "../axios";
import { Township } from "./fetchTownships";

interface UpdateTownshipRequest {
  name?: string;
  deliveryFee?: number;
  isActive?: boolean;
}

interface UpdateTownshipResponse {
  success: boolean;
  message: string;
  data?: {
    township: Township;
  };
}

export const updateTownship = async (
  townshipId: string,
  data: UpdateTownshipRequest
): Promise<UpdateTownshipResponse> => {
  try {
    const response = await axios.patch(`/townships/${townshipId}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating township:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update township",
    };
  }
};
