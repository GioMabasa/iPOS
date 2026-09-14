export interface InventoryProduct {
  product_id: number;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string;
  cost: number | string;
  selling_price: number | string;
  stock: number | string;
  stock_value: number | string;
  minimum_stock: number | string;
  is_low_stock: boolean;
  is_active: boolean;
}

export interface InventorySummary {
  total_products: number;
  total_stock: number;
  low_stock: number;
  out_of_stock: number;
  bad_orders: number;
  adjustments: number;
}

export interface InventoryResponse {
  data: InventoryProduct[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  summary: InventorySummary;
}

export interface GetInventoryParams {
  page?: number;
  per_page?: number;
  search?: string;
  stock_filter?:
    | "all"
    | "in_stock"
    | "low_stock"
    | "out_of_stock";
  product_status?:
    | "all"
    | "active"
    | "inactive";
}

export interface SingleInventoryResponse {
  data: InventoryProduct;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  type:
    | "purchase"
    | "sale"
    | "refund"
    | "bad_order"
    | "adjustment";
  quantity: number | string;
  unit_cost: number | string | null;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryHistoryTransaction
  extends InventoryTransaction {
  product: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  } | null;
}

export interface InventoryTransactionPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface InventoryTransactionResponse {
  data: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    data: InventoryTransaction[];
  };
}

export interface InventoryHistoryResponse {
  data: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    data: InventoryHistoryTransaction[];
  };
}

