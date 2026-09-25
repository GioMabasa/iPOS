import api from "./api";

import type {
  Purchase,
  PurchaseListResponse,
  PurchaseResponse,
  CreatePurchaseRequest,
} from "../types/purchase";

export type PurchasePeriod =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "this_year"
  | "custom";

export interface GetPurchasesFilters {
  search?: string;
  supplier_id?: number | "";
  period?: PurchasePeriod;
  start_date?: string;
  end_date?: string;
}

/*
|--------------------------------------------------------------------------
| Get Purchases
|--------------------------------------------------------------------------
*/

export async function getPurchases(
  page: number = 1,
  perPage: number = 20,
  filters: GetPurchasesFilters = {},
): Promise<PurchaseListResponse> {
  const response = await api.get<PurchaseListResponse>("/purchases", {
    params: {
      page,
      per_page: perPage,
      ...(filters.search
        ? {
            search: filters.search,
          }
        : {}),
      ...(filters.supplier_id
        ? {
            supplier_id: filters.supplier_id,
          }
        : {}),
      ...(filters.period && filters.period !== "all"
        ? {
            period: filters.period,
          }
        : {}),
      ...(filters.start_date
        ? {
            start_date: filters.start_date,
          }
        : {}),
      ...(filters.end_date
        ? {
            end_date: filters.end_date,
          }
        : {}),
    },
  });

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Get Single Purchase
|--------------------------------------------------------------------------
*/

export async function getPurchase(
  id: number,
): Promise<Purchase> {
  const response = await api.get<PurchaseResponse>(
    `/purchases/${id}`,
  );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Create Purchase
|--------------------------------------------------------------------------
*/

export async function createPurchase(
  payload: CreatePurchaseRequest,
): Promise<Purchase> {
  const response = await api.post<{ data: Purchase }>(
    "/purchases",
    payload,
  );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Export Purchases
|--------------------------------------------------------------------------
*/

export interface ExportPurchasesParams {
  period?: string;
  search?: string;
  supplier_id?: number;
  start_date?: string;
  end_date?: string;
}

export const exportPurchases = async (
  params?: ExportPurchasesParams
): Promise<Blob> => {
  const response = await api.get("/purchases/export", {
    params,
    responseType: "blob",
  });

  return response.data;
};