export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
}

export interface CategoryPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface CategoryListResponse {
  message: string;
  data: Category[];
  pagination: CategoryPagination;
}