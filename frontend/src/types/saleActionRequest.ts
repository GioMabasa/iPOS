import type { Sale } from "./sale";

export interface SaleActionRequest {
  id: number;
  sale_id: number;
  requested_by: number;
  action_type: "void" | "refund";
  reason: string;
  status: "pending" | "approved" | "rejected";
  approved_by: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  approval_reason: string | null;
  created_at: string;
  updated_at: string;

  sale: Sale;

  requester: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "manager" | "cashier";
  };

  approver: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "manager" | "cashier";
  } | null;
}

export interface SaleActionRequestPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface SaleActionRequestListResponse {
  data: SaleActionRequest[];
  pagination: SaleActionRequestPagination;
}

