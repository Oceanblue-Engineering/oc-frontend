import axios from "axios";

export interface ProjectToolAllocation {
  _id: string;
  projectId: string;
  toolId: {
    _id: string;
    name: string;
    category: string;
    serialNumber: string;
    totalQuantity: number;
  };
  allocatedQty: number;
  checkedOutQty: number;
  returnedQty: number;
  damagedQty: number;
  lostQty: number;
  notes: string;
  addedBy?: { _id: string; name: string };
  createdAt: string;
}

export interface AllocationSummary {
  totalAllocated: number;
  totalCheckedOut: number;
  totalReturned: number;
  totalDamaged: number;
  totalLost: number;
}

export const fetchAllocations = async (projectId: string): Promise<{ success: boolean; data: ProjectToolAllocation[]; summary: AllocationSummary }> => {
  const res = await axios.get(`/projects/${projectId}/tools`);
  return res.data;
};

export interface ToolAllocationItem {
  toolId: string;
  allocatedQty: number;
  notes?: string;
}

export const addAllocation = async (
  projectId: string,
  payload: {
    toolId?: string;
    allocatedQty?: number;
    notes?: string;
    tools?: ToolAllocationItem[];
  }
) => {
  const res = await axios.post(`/projects/${projectId}/tools`, payload);
  return res.data;
};

export const updateAllocation = async (
  allocationId: string,
  payload: { allocatedQty?: number; notes?: string }
) => {
  const res = await axios.put(`/projects/tools/${allocationId}`, payload);
  return res.data;
};

export const deleteAllocation = async (allocationId: string) => {
  const res = await axios.delete(`/projects/tools/${allocationId}`);
  return res.data;
};

export const fetchAllocationTransactions = async (allocationId: string, isReturned?: "true" | "false") => {
  const params = isReturned ? `?isReturned=${isReturned}` : "";
  const res = await axios.get(`/projects/tools/${allocationId}/transactions${params}`);
  return res.data;
};
