import axios from "../axios";
import { Worker } from "../Worker/worker.service";

export interface Project {
  _id: string;
  siteName: string;
  description?: string;
  customer: string;
  startDate?: string;
  endDate?: string;
  status: string;
  workers?: (string | Worker)[];
  createdAt?: string;
  updatedAt?: string;
}

interface FetchProjectsResponse {
  success: boolean;
  message: string;
  data: {
    clients: Project[]; // keeps 'clients' key to match UI page table binding format
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface ProjectDetailsResponse {
  success: boolean;
  message: string;
  data: {
    client: Project;
  };
}

export const fetchProjects = async (params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<FetchProjectsResponse> => {
  try {
    let url = "/projects";
    const qs = new URLSearchParams();

    if (params?.search) qs.append("search", params.search);
    if (params?.status) qs.append("status", params.status);
    if (params?.page) qs.append("page", String(params.page));
    if (params?.limit) qs.append("limit", String(params.limit));

    if (qs.toString()) url += `?${qs.toString()}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch projects",
      data: { clients: [] },
    };
  }
};

export const createProject = async (payload: Partial<Project>): Promise<{ success: boolean; message: string; data?: { project: Project } }> => {
  try {
    const response = await axios.post("/projects", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create project");
  }
};

export const fetchProjectById = async (id: string): Promise<ProjectDetailsResponse> => {
  try {
    const response = await axios.get(`/projects/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch project details");
  }
};

export const updateProject = async (id: string, payload: Partial<Project>): Promise<{ success: boolean; message: string; data?: { client: Project } }> => {
  try {
    const response = await axios.patch(`/projects/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update project");
  }
};

export const deleteProject = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`/projects/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete project");
  }
};
