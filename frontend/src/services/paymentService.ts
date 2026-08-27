import api from "./api";

export interface CreateSaleItem {
  product_id: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customer_id?: number | null;
  sale_date: string;
  discount?: number;
  tax?: number;
  amount_paid: number;
  notes?: string | null;
  items: CreateSaleItem[];
}

export interface SaleResponse {
  message: string;
  data: unknown;
}

export async function createSale(
  data: CreateSaleRequest,
): Promise<SaleResponse> {
  const response = await api.post<SaleResponse>(
    "/sales",
    data,
  );

  return response.data;
}