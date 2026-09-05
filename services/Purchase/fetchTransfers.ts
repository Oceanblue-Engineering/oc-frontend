import axios from "../axios";

export interface TransferLineItem {
  inventoryId: string;
  quantity: number;
  grnLineItemId: string;
  notes: string | null;
  _id: string;
}

export interface LocationSummary {
  _id: string;
  locationName: string;
  locationCode: string;
  type?: string;
  grnNumber?: string;
}

export interface TransferData {
  _id: string;
  transferNumber: string;
  sourceType: "GRN" | "Warehouse" | "Storefront" | string;
  sourceId: string | LocationSummary | any;
  destinationWarehouseId: string | LocationSummary | null;
  destinationStorefrontId: string | LocationSummary | null;
  lineItems: TransferLineItem[];
  status: string;
  transferDate: string;
  receivedDate: string | null;
  notes: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  transferredBy?: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface FetchTransfersResponse {
  success: boolean;
  message: string;
  data: TransferData[];
}

export const fetchTransfers = async (): Promise<FetchTransfersResponse> => {
  try {
    const response = await axios.get("/transfer");

    return response.data;
  } catch (error: any) {
    console.error("Error fetching transfers:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch transfers",
      data: [],
    };
  }
};
