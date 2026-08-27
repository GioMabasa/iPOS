export interface InventoryProduct {
  product_id: number;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string;

  cost_price: number | string;
  selling_price: number | string;

  stock: number | string;
  minimum_stock: number | string;

  is_low_stock: boolean;
}

export interface InventoryResponse {
  data: InventoryProduct[];
}

export interface SingleInventoryResponse {
  data: InventoryProduct;
}

