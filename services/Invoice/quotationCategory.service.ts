import axios from "../axios";

export interface QuotationCategoryItem {
  _id?: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isDefault?: boolean;
}

export interface QuotationCategoriesResponse {
  success: boolean;
  data: QuotationCategoryItem[];
  message?: string;
}

export const fetchQuotationCategories = async (): Promise<QuotationCategoriesResponse> => {
  try {
    const res = await axios.get("/quotation-categories");
    return res.data;
  } catch (error) {
    console.error("Error fetching quotation categories:", error);
    throw error;
  }
};

export const createQuotationCategory = async (
  name: string,
  description?: string
): Promise<{ success: boolean; data: QuotationCategoryItem; message?: string }> => {
  try {
    const res = await axios.post("/quotation-categories", {
      name,
      description,
    });
    return res.data;
  } catch (error) {
    console.error("Error creating quotation category:", error);
    throw error;
  }
};

export const deleteQuotationCategory = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await axios.delete(`/quotation-categories/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting quotation category:", error);
    throw error;
  }
};
