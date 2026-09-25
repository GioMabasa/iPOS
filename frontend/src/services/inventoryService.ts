import api from "./api";

import type {
  InventoryProduct,
  InventoryResponse,
  SingleInventoryResponse,
  InventoryTransactionResponse,
  InventoryHistoryResponse,
  GetInventoryParams,
} from "../types/inventory";

/*
|--------------------------------------------------------------------------
| Get Current Inventory
|--------------------------------------------------------------------------
*/

export async function getInventory(
  params: GetInventoryParams = {},
): Promise<InventoryResponse> {
  const response =
    await api.get<InventoryResponse>(
      "/inventory",
      {
        params,
      },
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Update Product Status
|--------------------------------------------------------------------------
*/

export async function updateProductStatus(
  productId: number,
  isActive: boolean,
) {
  const response =
    await api.patch(
      `/inventory/${productId}/status`,
      {
        is_active: isActive,
      },
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Get POS Products
|--------------------------------------------------------------------------
*/

export interface POSProduct {
  product_id: number;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string;
  selling_price: number | string;
  stock: number | string;
  minimum_stock: number | string;
  is_low_stock: boolean;
}

export interface POSProductResponse {
  data: POSProduct[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface GetPOSProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export async function getPOSProducts(
  params: GetPOSProductsParams = {},
): Promise<POSProductResponse> {
  const response =
    await api.get<POSProductResponse>(
      "/pos/products",
      {
        params,
      },
    );

  return response.data;
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

/*
|--------------------------------------------------------------------------
| Get Product Inventory Transactions
|--------------------------------------------------------------------------
*/

export async function getProductTransactions(
  productId: number,
  page: number = 1,
): Promise<InventoryTransactionResponse> {
  const response =
    await api.get<InventoryTransactionResponse>(
      `/inventory/${productId}/transactions`,
      {
        params: {
          page,
        },
      },
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Get Inventory History
|--------------------------------------------------------------------------
*/

export async function getInventoryHistory(
  type: "bad_order" | "adjustment",
  page: number = 1,
): Promise<InventoryHistoryResponse> {
  const response =
    await api.get<InventoryHistoryResponse>(
      "/inventory/history",
      {
        params: {
          type,
          page,
        },
      },
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Adjust Inventory
|--------------------------------------------------------------------------
*/

export async function adjustInventory(data: {
  product_id: number;
  type: "adjustment" | "bad_order";
  quantity: number;
  notes?: string;
}) {
  const response = await api.post("/inventory/adjust", data);

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Export Inventory
|--------------------------------------------------------------------------
*/

export interface ExportInventoryParams extends GetInventoryParams {
  format?: "xlsx" | "csv";
}

export async function exportInventory(
  params: ExportInventoryParams = {},
): Promise<Blob> {
  const token = localStorage.getItem("ipos_token");

  const response = await api.get<Blob>(
    "/inventory/export",
    {
      params,
      responseType: "blob",
      headers: {
        Authorization: token
          ? `Bearer ${token}`
          : "",
      },
    },
  );

  return response.data;
}



