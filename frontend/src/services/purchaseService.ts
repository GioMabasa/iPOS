import api from "./api";

import type {
  Purchase,
  PurchaseListResponse,
  PurchaseResponse,
  CreatePurchaseRequest,
} from "../types/purchase";

/*
|--------------------------------------------------------------------------
| Get Purchases
|--------------------------------------------------------------------------
*/

export async function getPurchases(
  page: number = 1,
  perPage: number = 20,
): Promise<PurchaseListResponse> {
  const response = await api.get<PurchaseListResponse>("/purchases", {
    params: {
      page,
      per_page: perPage,
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

