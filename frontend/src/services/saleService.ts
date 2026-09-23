import api from "./api";

import type {
  CreateSaleRequest,
  SaleResponse,
  Sale,
} from "../types/sale";

export interface SalesPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface SalesSummary {
  total_transactions: number;
  total_items_sold: number;
  total_sales: number;
  total_cogs: number;
  gross_profit: number;
  total_void: number;
  total_refund: number;
}

export interface SalesListResponse {
  data: Sale[];
  pagination: SalesPagination;
  summary: SalesSummary;
}

export async function getSales(params?: {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  user_id?: number;
  page?: number;
}): Promise<SalesListResponse> {
  const response = await api.get("/sales", {
    params,
  });

  const pagination = response.data.data;

  return {
    data: pagination.data ?? [],
    pagination: {
      current_page: pagination.current_page ?? 1,
      last_page: pagination.last_page ?? 1,
      per_page: pagination.per_page ?? 20,
      total: pagination.total ?? 0,
      from: pagination.from ?? null,
      to: pagination.to ?? null,
    },
    summary: {
      total_transactions: response.data.summary?.total_transactions ?? 0,
      total_items_sold: response.data.summary?.total_items_sold ?? 0,
      total_sales: response.data.summary?.total_sales ?? 0,
      total_cogs: response.data.summary?.total_cogs ?? 0,
      gross_profit: response.data.summary?.gross_profit ?? 0,
      total_void: response.data.summary?.total_void ?? 0,
      total_refund: response.data.summary?.total_refund ?? 0,
    },
  };
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

export async function voidSale(id: number) {
  const response = await api.post(`/sales/${id}/void`);

  return response.data;
}

export async function refundSale(
  id: number,
  items: {
    sale_item_id: number;
    quantity: number;
  }[],
) {
  const response = await api.post(`/sales/${id}/refund`, {
    items,
  });

  return response.data;
}