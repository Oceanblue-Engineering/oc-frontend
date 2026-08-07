import axios from "../axios";

export interface Township {
  _id: string;
  name: string;
  deliveryFee: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchTownshipsResponse {
  success: boolean;
  message: string;
  data: {
    townships: Township[];
  };
}

export const fetchTownships = async (
  isActive?: boolean
): Promise<FetchTownshipsResponse> => {
  try {
    const url = isActive !== undefined ? `/townships?isActive=${isActive}` : "/townships";
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching townships:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch townships",
      data: { townships: [] },
    };
  }
};
