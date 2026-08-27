import api from "./api";

import type {
  Supplier,
  SupplierResponse,
  SingleSupplierResponse,
} from "../types/supplier";

export async function getSuppliers(): Promise<Supplier[]> {
  const response =
    await api.get<SupplierResponse>("/suppliers");

  return response.data.data;
}

export async function getSupplier(
  id: number,
): Promise<Supplier> {
  const response =
    await api.get<SingleSupplierResponse>(
      `/suppliers/${id}`,
    );

  return response.data.data;
}

export async function createSupplier(
  supplier: Omit<
    Supplier,
    "id" | "created_at" | "updated_at"
  >,
): Promise<Supplier> {
  const response =
    await api.post<SingleSupplierResponse>(
      "/suppliers",
      supplier,
    );

  return response.data.data;
}

export async function updateSupplier(
  id: number,
  supplier: Partial<Supplier>,
): Promise<Supplier> {
  const response =
    await api.put<SingleSupplierResponse>(
      `/suppliers/${id}`,
      supplier,
    );

  return response.data.data;
}

export async function deleteSupplier(
  id: number,
): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}