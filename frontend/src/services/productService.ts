import api from "./api";

import type {
  Product,
  ProductResponse,
  SingleProductResponse,
} from "../types/product";

import type {
  SyncProductSuppliersRequest,
} from "../types/productSupplier";

/*
|--------------------------------------------------------------------------
| Get Products
|--------------------------------------------------------------------------
*/

export async function getProducts(): Promise<Product[]> {
  const response =
    await api.get<ProductResponse>("/products");

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Get Single Product
|--------------------------------------------------------------------------
*/

export async function getProduct(
  id: number,
): Promise<Product> {
  const response =
    await api.get<SingleProductResponse>(
      `/products/${id}`,
    );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Create Product
|--------------------------------------------------------------------------
*/

export async function createProduct(
  product: Omit<
    Product,
    | "id"
    | "created_at"
    | "updated_at"
    | "category"
    | "suppliers"
  >,
): Promise<Product> {
  const response =
    await api.post<SingleProductResponse>(
      "/products",
      product,
    );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Update Product
|--------------------------------------------------------------------------
*/

export async function updateProduct(
  id: number,
  product: Partial<Product>,
): Promise<Product> {
  const response =
    await api.put<SingleProductResponse>(
      `/products/${id}`,
      product,
    );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Delete Product
|--------------------------------------------------------------------------
*/

export async function deleteProduct(
  id: number,
): Promise<void> {
  await api.delete(`/products/${id}`);
}

/*
|--------------------------------------------------------------------------
| Sync Product Suppliers
|--------------------------------------------------------------------------
*/

export async function syncProductSuppliers(
  productId: number,
  data: SyncProductSuppliersRequest,
): Promise<Product> {
  const response =
    await api.post<SingleProductResponse>(
      `/products/${productId}/suppliers`,
      data,
    );

  return response.data.data;
}