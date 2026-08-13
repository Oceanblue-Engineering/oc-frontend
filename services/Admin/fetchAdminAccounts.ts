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

export interface AdminAccount {
  _id: string;
  name: string;
  role: string;
  position?: string | null;
  dailyRate?: number;
  telegramChatId?: string | null;
  locationId: LocationInfo | null;
  lastActiveAt: string | null;
  softDeleted: boolean;
  deletedAt: string | null;
  updatedAt: string | null;
  createdAt: string;
}

interface FetchAdminAccountsResponse {
  success: boolean;
  message: string;
  data: {
    accounts: AdminAccount[];
  };
}

export const fetchAdminAccounts =
  async (role?: string): Promise<FetchAdminAccountsResponse> => {
    try {
      const url = role ? `/admin?role=${role}` : "/admin";
      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching admin accounts:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch admin accounts",
        data: {
          accounts: [],
        },
      };
    }
  };

