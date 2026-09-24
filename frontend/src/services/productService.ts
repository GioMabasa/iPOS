import api from "./api";

import type {
  Product,
  ProductListResponse,
  SingleProductResponse,
  GetProductsParams,
} from "../types/product";

import type {
  SyncProductSuppliersRequest,
} from "../types/productSupplier";

/*
|--------------------------------------------------------------------------
| Get Products
|--------------------------------------------------------------------------
*/

export async function getProducts(
  params: GetProductsParams = {},
): Promise<ProductListResponse> {
  const response = await api.get<ProductListResponse>(
    "/products",
    {
      params: {
        ...params,

        ...(params.is_active !== ""
          ? {
              is_active:
                params.is_active === true
                  ? 1
                  : params.is_active === false
                    ? 0
                    : undefined,
            }
          : {}),
      },
    },
  );

  return response.data;
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
| Get Product Inventory Details
|--------------------------------------------------------------------------
*/

export async function getProductInventoryDetails(
  id: number,
): Promise<
  Product & {
    stock: number;
    stock_value: number;
    cost: number;
    is_low_stock: boolean;
    supplier_cost_history: {
      supplier: string | null;
      cost_price: number;
      purchase_date: string | null;
    }[];
  }
> {
  const response = await api.get<{
    data: Product & {
      stock: number;
      stock_value: number;
      cost: number;
      is_low_stock: boolean;
      supplier_cost_history: {
        supplier: string | null;
        cost_price: number;
        purchase_date: string | null;
      }[];
    };
  }>(`/inventory/${id}`);

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
| Delete / Deactivate Product
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

/*
|--------------------------------------------------------------------------
| Export Products
|--------------------------------------------------------------------------
*/

export async function exportProducts(
  params: {
    search?: string;
    category_id?: number | "";
    is_active?: boolean | "";
  } = {},
): Promise<Blob> {
  const response = await api.get("/products/export", {
    params: {
      ...params,

      ...(params.is_active !== ""
        ? {
            is_active:
              params.is_active === true
                ? 1
                : params.is_active === false
                  ? 0
                  : undefined,
          }
        : {}),
    },

    responseType: "blob",
  });

  return response.data;
}