export interface CreateSaleItemRequest {
  product_id: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customer_id?: number | null;
  sale_date: string;
  discount?: number;
  tax?: number;
  amount_paid: number;
  notes?: string | null;
  items: CreateSaleItemRequest[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number | string;
  unit_price: number | string;
  discount: number | string;
  total: number | string;
  total_cost?: number;
  gross_profit?: number;

  product?: {
    id: number;
    category_id?: number | null;
    name: string;
    sku: string;
    barcode?: string | null;
    description?: string | null;
    unit?: string;
    selling_price?: number | string;
    minimum_stock?: number | string;
    is_active?: boolean;
  };
}

export interface SaleCustomer {
  id: number;
  name: string;
  email?: string | null;
}

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  invoice_number: string;

  customer_id: number | null;
  user_id: number;

  sale_date: string;

  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;

  amount_paid: number | string;
  change_amount: number | string;

  status: string;
  notes: string | null;

  total_cost?: number;
  gross_profit?: number;
  gross_margin?: number;

  customer?: SaleCustomer | null;
  user?: SaleUser | null;

  items: SaleItem[];

  created_at?: string;
  updated_at?: string;
}

export interface SaleResponse {
  message: string;
  data: Sale;
}

