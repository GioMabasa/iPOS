import api from "./api";

import type {
  InventoryProduct,
  InventoryResponse,
  SingleInventoryResponse,
} from "../types/inventory";


/*
|--------------------------------------------------------------------------
| Get Current Inventory
|--------------------------------------------------------------------------
*/

export async function getInventory(): Promise<
  InventoryProduct[]
> {
  const response =
    await api.get<InventoryResponse>(
      "/inventory",
    );

  return response.data.data;
}


/*
|--------------------------------------------------------------------------
| Get Product Stock
|--------------------------------------------------------------------------
*/

export async function getProductStock(
  productId: number,
): Promise<InventoryProduct> {
  const response =
    await api.get<SingleInventoryResponse>(
      `/inventory/${productId}`,
    );

  return response.data.data;
}

