import axios from "../axios";

export interface ProjectTask {
  _id: string;
  projectId: string;
  taskName: string;
  date: string;
  category: string;
  remark: string;
  status: "completed" | "in-progress" | "pending";
  createdBy?: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectTaskPayload {
  taskName: string;
  date: string;
  category: string;
  remark?: string;
  status?: string;
}

export interface UpdateProjectTaskPayload {
  taskName?: string;
  date?: string;
  category?: string;
  remark?: string;
  status?: string;
}

export interface ProjectTasksResponse {
  success: boolean;
  message?: string;
  data: {
    tasks: ProjectTask[];
  };
}

export interface SingleProjectTaskResponse {
  success: boolean;
  message?: string;
  data: {
    task: ProjectTask;
  };
}

export const fetchProjectTasks = async (
  projectId: string,
  params?: { category?: string; search?: string }
): Promise<ProjectTasksResponse> => {
  try {
    const response = await axios.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching project tasks:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load project tasks",
      data: { tasks: [] },
    };
  }
};

export const createProjectTask = async (
  projectId: string,
  payload: CreateProjectTaskPayload
): Promise<SingleProjectTaskResponse> => {
  try {
    const response = await axios.post(`/projects/${projectId}/tasks`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error creating project task:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create project task"
    );
  }
};

export const updateProjectTask = async (
  taskId: string,
  payload: UpdateProjectTaskPayload
): Promise<SingleProjectTaskResponse> => {
  try {
    const response = await axios.put(`/projects/tasks/${taskId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error updating project task:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update project task"
    );
  }
};

export const deleteProjectTask = async (
  taskId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`/projects/tasks/${taskId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting project task:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete project task"
    );
  }
};
