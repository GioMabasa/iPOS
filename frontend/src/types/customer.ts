/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

export interface Customer {
  id: number;
  name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/*
|--------------------------------------------------------------------------
| Customer Form Data
|--------------------------------------------------------------------------
|
| Used by the React form.
| Empty fields remain strings so controlled inputs stay simple.
|
*/

export interface CustomerFormData {
  name: string;
  business_type: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  is_active: boolean;
}

/*
|--------------------------------------------------------------------------
| Customer API Request
|--------------------------------------------------------------------------
|
| Used when sending data to Laravel.
| Optional text fields can be null.
|
*/

export interface CustomerRequest {
  name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
}

/*
|--------------------------------------------------------------------------
| Customer List Parameters
|--------------------------------------------------------------------------
*/

export type CustomerStatusFilter = "all" | "active" | "inactive";

export interface GetCustomersParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: CustomerStatusFilter;
}

/*
|--------------------------------------------------------------------------
| Customer Pagination
|--------------------------------------------------------------------------
*/

export interface CustomerPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/*
|--------------------------------------------------------------------------
| Customer List Response
|--------------------------------------------------------------------------
*/

export interface GetCustomersResponse {
  data: Customer[];

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