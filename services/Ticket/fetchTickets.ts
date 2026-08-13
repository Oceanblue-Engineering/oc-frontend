import axios from "../axios";

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  type?: "Retail Sale" | "Project";
  project_details?: {
    project_name?: string;
    time?: string;
    desc?: string;
    number_of_worker?: number;
    time_duration?: string;
    note?: string;
  };
  retail_details?: {
    deli_location?: string;
    deli_time?: string;
    number_of_people?: number;
    deli_expense?: number;
    note?: string;
  };
  status: "Open" | "In Progress" | "Pending" | "Resolved";
  priority: "Low" | "Medium" | "High";
  assigned_to?: { _id: string; name: string } | string | null;
  created_by: { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

interface FetchTicketsResponse {
  success: boolean;
  message: string;
  data: { tickets: Ticket[] };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchTickets = async (
  params?: {
    search?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    type?: string;
    page?: number;
    limit?: number;
  }
): Promise<FetchTicketsResponse> => {
  try {
    let url = "/tickets";
    const qs = new URLSearchParams();
    if (params?.search) qs.append("search", params.search);
    if (params?.status) qs.append("status", params.status);
    if (params?.priority) qs.append("priority", params.priority);
    if (params?.assigned_to) qs.append("assigned_to", params.assigned_to);
    if (params?.type) qs.append("type", params.type);
    if (params?.page) qs.append("page", String(params.page));
    if (params?.limit) qs.append("limit", String(params.limit));
    if (qs.toString()) url += `?${qs.toString()}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch tickets",
      data: { tickets: [] },
    };
  }
};