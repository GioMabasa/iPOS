import api from "./api";

import type {
  CreateSaleRequest,
  SaleResponse,
} from "../types/sale";

/*
|--------------------------------------------------------------------------
| Create Sale
|--------------------------------------------------------------------------
*/

export async function createSale(
  data: CreateSaleRequest,
): Promise<SaleResponse> {
  const response = await api.post<SaleResponse>(
    "/sales",
    data,
  );

  return response.data;
}