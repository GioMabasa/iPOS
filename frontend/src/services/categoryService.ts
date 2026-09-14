import api from "./api";

import type {
  Category,
  CategoryFormData,
  CategoryListResponse,
} from "../types/category";

/*
|--------------------------------------------------------------------------
| Get Categories
|--------------------------------------------------------------------------
*/

export async function getCategories(
  page: number = 1,
  search: string = "",
): Promise<CategoryListResponse> {
  const response = await api.get<CategoryListResponse>(
    "/categories",
    {
      params: {
        page,
        ...(search.trim()
          ? {
              search: search.trim(),
            }
          : {}),
      },
    },
  );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Get Single Category
|--------------------------------------------------------------------------
*/

export async function getCategory(
  id: number,
): Promise<Category> {
  const response = await api.get<{ data: Category }>(
    `/categories/${id}`,
  );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

export async function createCategory(
  data: CategoryFormData,
): Promise<Category> {
  const response = await api.post<{ data: Category }>(
    "/categories",
    data,
  );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
*/

export async function updateCategory(
  id: number,
  data: CategoryFormData,
): Promise<Category> {
  const response = await api.put<{ data: Category }>(
    `/categories/${id}`,
    data,
  );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Delete Category
|--------------------------------------------------------------------------
*/

export async function deleteCategory(
  id: number,
): Promise<void> {
  await api.delete(`/categories/${id}`);
}