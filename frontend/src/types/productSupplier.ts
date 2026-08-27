import type { Supplier } from "./supplier";

export interface ProductSupplier {
  id?: number;
  supplier_id: number;
  supplier_sku: string | null;
  cost_price: string;
  is_preferred: boolean;
  supplier?: Supplier;
}

export interface ProductSupplierPayload {
  supplier_id: number;
  supplier_sku: string | null;
  cost_price: string;
  is_preferred: boolean;
}

export interface SyncProductSuppliersRequest {
  suppliers: ProductSupplierPayload[];
}