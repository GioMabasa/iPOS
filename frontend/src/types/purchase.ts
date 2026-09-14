import type { Product } from "./product";
import type { Supplier } from "./supplier";

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  quantity: string;
  unit_cost: string;
  total: string;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: number;
  supplier_id: number;
  received_by: number | null;
  purchase_number: string;
  purchase_date: string;
  reference_number: string | null;
  status: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  notes: string | null;
  supplier?: Supplier;
  items?: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseItemFormData {
  product_id: number;
  quantity: number;
  unit_cost: number;
}

export interface PurchaseFormData {
  supplier_id: number;
  purchase_date: string;
  reference_number: string;
  discount: number;
  tax: number;
  notes: string;
  items: PurchaseItemFormData[];
}

export interface PurchaseResponse {
  message: string;
  data: Purchase;
}

export interface PurchasePagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PurchaseListResponse {
  message: string;
  data: Purchase[];
  pagination: PurchasePagination;
}

export interface CreatePurchaseItemRequest {
  product_id: number;
  quantity: number;
  unit_cost: number;
}

export interface CreatePurchaseRequest {
  supplier_id: number;
  purchase_date: string;
  reference_number?: string | null;
  discount?: number;
  tax?: number;
  notes?: string | null;
  items: CreatePurchaseItemRequest[];
}

