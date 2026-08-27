import api from "./api";

import type {
  Category,
  CategoryResponse,
  SingleCategoryResponse,
} from "../types/category";

export async function getCategories(): Promise<Category[]> {
  const response =
    await api.get<CategoryResponse>("/categories");

  return response.data.data;
}

export async function getCategory(
  id: number,
): Promise<Category> {
  const response =
    await api.get<SingleCategoryResponse>(
      `/categories/${id}`,
    );

  return response.data.data;
}