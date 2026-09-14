/*
|--------------------------------------------------------------------------
| Supplier
|--------------------------------------------------------------------------
*/

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/*
|--------------------------------------------------------------------------
| Supplier Form Data
|--------------------------------------------------------------------------
|
| Used by the React form.
| Empty fields remain strings so controlled inputs stay simple.
|
*/

export interface SupplierFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_number: string;
  notes: string;
  is_active: boolean;
}

/*
|--------------------------------------------------------------------------
| Supplier API Request
|--------------------------------------------------------------------------
|
| Used when sending data to Laravel.
| Optional text fields can be null.
|
*/

export interface SupplierRequest {
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  is_active: boolean;
}

/*
|--------------------------------------------------------------------------
| Supplier List Parameters
|--------------------------------------------------------------------------
*/

export type SupplierStatusFilter = "all" | "active" | "inactive";

export interface GetSuppliersParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: SupplierStatusFilter;
}

/*
|--------------------------------------------------------------------------
| Supplier Pagination
|--------------------------------------------------------------------------
*/

export interface SupplierPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/*
|--------------------------------------------------------------------------
| Supplier List Response
|--------------------------------------------------------------------------
*/

export interface GetSuppliersResponse {
  data: Supplier[];

  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;

  first_page_url: string;
  last_page_url: string;

  next_page_url: string | null;
  prev_page_url: string | null;

  links: {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }[];
}