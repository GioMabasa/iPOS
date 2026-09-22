export interface ReceivableCustomer {
  id: number;
  name: string;
  business_type?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ReceivablePaymentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ReceivablePayment {
  id: number;
  sale_id: number;
  customer_id: number;
  payment_date: string;
  amount: number | string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  received_by: ReceivablePaymentUser | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReceivableItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number | string;
  refunded_quantity?: number | string;
  unit_price: number | string;
  discount: number | string;
  total: number | string;
  total_cost?: number;
  gross_profit?: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    barcode?: string | null;
    unit?: string;
  };
}

export type ReceivableStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "overdue";

export interface Receivable {
  id: number;
  sale_number: string;
  invoice_number: string;
  customer_id: number;
  customer: ReceivableCustomer | null;
  sale_date: string;
  due_date: string | null;
  term_months: number | null;
  total: number | string;
  paid: number | string;
  balance: number | string;
  status: ReceivableStatus;
}

export interface ReceivableDetail extends Receivable {
  items: ReceivableItem[];
  user: ReceivablePaymentUser | null;
  payments: ReceivablePayment[];
}

export interface ReceivablesResponse {
  message: string;
  data: Receivable[];
}

export interface ReceivableResponse {
  message: string;
  data: ReceivableDetail;
}

export interface CreateCustomerPaymentRequest {
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  notes?: string | null;
}

export interface CustomerPaymentResponse {
  message: string;
  data: {
    payment: ReceivablePayment;
    paid: number;
    balance: number;
    status: ReceivableStatus;
  };
}