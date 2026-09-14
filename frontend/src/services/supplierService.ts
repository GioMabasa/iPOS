import api from "./api";

import type {
  GetSuppliersParams,
  GetSuppliersResponse,
  Supplier,
  SupplierRequest,
} from "../types/supplier";

/*
|--------------------------------------------------------------------------
| Get Suppliers
|--------------------------------------------------------------------------
|
| Supports:
| - Pagination
| - Server-side search
| - All / Active / Inactive filter
|
*/

export async function getSuppliers(
  params: GetSuppliersParams = {},
): Promise<GetSuppliersResponse> {
  const response = await api.get<GetSuppliersResponse>("/suppliers", {
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 20,

      ...(params.search?.trim()
        ? {
            search: params.search.trim(),
          }
        : {}),

      ...(params.status && params.status !== "all"
        ? {
            status: params.status,
          }
        : {}),
    },
  });

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Create Supplier
|--------------------------------------------------------------------------
*/

export async function createSupplier(
  data: SupplierRequest,
): Promise<Supplier> {
  const response = await api.post<{ data: Supplier }>("/suppliers", data);

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Update Supplier
|--------------------------------------------------------------------------
*/

export async function updateSupplier(
  id: number,
  data: SupplierRequest,
): Promise<Supplier> {
  const response = await api.put<{ data: Supplier }>(
    `/suppliers/${id}`,
    data,
  );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Delete Supplier
|--------------------------------------------------------------------------
*/

export async function deleteSupplier(id: number): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}