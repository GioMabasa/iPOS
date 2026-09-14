import type { Category } from "./category";

export interface ProductSupplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  is_active: boolean;

  pivot?: {
    supplier_sku: string | null;
    cost_price: string;
    is_preferred: boolean;
  };

  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  unit: string;
  selling_price: string;
  minimum_stock: string;
  is_active: boolean;

  category?: Category | null;
  suppliers?: ProductSupplier[];

  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  current_page: number;
  data: Product[];

  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;

  links: {
    url: string | null;
    label: string;
    active: boolean;
    page?: number | null;
  }[];

  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface SingleProductResponse {
  data: Product;
}

export interface GetProductsParams {
  page?: number;
  search?: string;
  category_id?: number | "";
  is_active?: boolean | "";
  per_page?: number;
}