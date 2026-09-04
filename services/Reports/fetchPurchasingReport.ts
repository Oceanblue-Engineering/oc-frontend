import axios from "../axios";

export interface PurchasingSummary {
  totalPurchasedAmount: number;
  totalPaidAmount: number;
  totalRemainingBalance: number;
  totalPOCount: number;
  pendingPOCount: number;
  confirmedPOCount: number;
  arrivedPOCount: number;
  completedPOCount: number;
}

export interface ProductQuantityItem {
  _id: string;
  productName: string;
  productCode: string;
  totalPurchaseQuantity: number;
  totalReceivedQuantity: number;
  totalCost: number;
  avgBuyingPrice: number;
  poOccurrences: number;
}

export interface ProductQuantitiesBreakdown {
  totalOrderedQuantity: number;
  totalReceivedQuantity: number;
  uniqueProductsCount: number;
  products: ProductQuantityItem[];
}

export interface SupplierPurchaseItem {
  _id: string;
  supplierName: string;
  supplierPhone?: string;
  poCount: number;
  totalPurchased: number;
  totalPaid: number;
  remainingBalance: number;
}

export interface ProfitLossAnalysis {
  totalRevenue: number;
  totalPurchasingCost: number;
  totalExpenses: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  profitMargin: number;
  status: "PROFIT" | "LOSS";
  orderCount: number;
  expenseCount: number;
}

export interface RecentPurchasePO {
  _id: string;
  poNumber: string;
  supplierId: {
    _id: string;
    supplierName: string;
    supplierPhone?: string;
  };
  products: Array<{
    _id: string;
    productName: string;
    productCode: string;
    buyingPrice: number;
    purchaseQuantity: number;
    receivedQuantity: number;
  }>;
  status: string;
  note?: string;
  totalAmount: number;
  paidAmount: number;
  paymentType: string;
  dueDate?: string | null;
  createdAt: string;
}

export interface PurchasingReportData {
  summary: PurchasingSummary;
  productQuantities: ProductQuantitiesBreakdown;
  supplierBreakdown: SupplierPurchaseItem[];
  profitLoss: ProfitLossAnalysis;
  recentPurchases: RecentPurchasePO[];
  filter: {
    startDate?: string | null;
    endDate?: string | null;
  };
}

export interface PurchasingReportResponse {
  success: boolean;
  message?: string;
  data: PurchasingReportData;
}

export interface FetchPurchasingReportParams {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  status?: string;
}

export const fetchPurchasingReport = async (
  params?: FetchPurchasingReportParams
): Promise<PurchasingReportResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.supplierId && params.supplierId !== "ALL") queryParams.append("supplierId", params.supplierId);
  if (params?.status && params.status !== "ALL") queryParams.append("status", params.status);

  const url = `/purchasing/report?${queryParams.toString()}`;
  const response = await axios.get(url);
  return response.data;
};
