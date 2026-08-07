import axios from "../axios";

interface DeleteTownshipResponse {
  success: boolean;
  message: string;
}

export const deleteTownship = async (
  townshipId: string
): Promise<DeleteTownshipResponse> => {
  try {
    const response = await axios.delete(`/townships/${townshipId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting township:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete township",
    };
  }
};
