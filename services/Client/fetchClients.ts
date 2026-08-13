import axios from "../axios";

export type LeadType = "sales" | "service";

export interface Client {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  leadType?: LeadType;
  companyName?: string;
  businessName?: string;
  industry?: string;
  isPostSale: boolean;
  status: string;
  inquiryDate?: string;
  sourceChannel?: string;
  currentProblems?: string;
  desiredOutcome?: string;
  nextActionDate?: string;
  conversationLogs?: { text: string; date: string }[];
  projectId?: string;
  projectStartDate?: string;
  projectDeliveryDate?: string;
  deliverablesSummary?: string;
  purchasedServices?: {
    name: string;
    type: string;
    status: "pending" | "active" | "completed";
  }[];
  creditPersonId?: string | { _id: string; name: string; phone: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchClientsResponse {
  success: boolean;
  message: string;
  data: {
    clients: Client[];
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchClients = async (
  params?: {
    isPostSale?: boolean;
    leadType?: LeadType;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<FetchClientsResponse> => {
  try {
    let url = "/clients";
    const qs = new URLSearchParams();

    if (params?.leadType) qs.append("leadType", params.leadType);
    if (params?.search) qs.append("search", params.search);
    if (params?.status) qs.append("status", params.status);
    if (params?.page) qs.append("page", String(params.page));
    if (params?.limit) qs.append("limit", String(params.limit));

    if (qs.toString()) url += `?${qs.toString()}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch clients",
      data: { clients: [] },
    };
  }
};
