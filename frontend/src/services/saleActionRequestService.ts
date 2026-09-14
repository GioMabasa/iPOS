import api from "./api";

import type {
  SaleActionRequest,
  SaleActionRequestListResponse,
} from "../types/saleActionRequest";

/*
|--------------------------------------------------------------------------
| Get Sale Action Requests
|--------------------------------------------------------------------------
*/

export async function getSaleActionRequests(params?: {
  status?: "pending" | "approved" | "rejected";
  action_type?: "void" | "refund";
  page?: number;
}): Promise<SaleActionRequestListResponse> {
  const response = await api.get("/sales/action-requests", {
    params,
  });

  const pagination = response.data.data;

  return {
    data: pagination.data ?? [],
    pagination: {
      current_page: pagination.current_page ?? 1,
      last_page: pagination.last_page ?? 1,
      per_page: pagination.per_page ?? 20,
      total: pagination.total ?? 0,
      from: pagination.from ?? null,
      to: pagination.to ?? null,
    },
  };
}

/*
|--------------------------------------------------------------------------
| Approve Sale Action Request
|--------------------------------------------------------------------------
*/

export async function approveSaleActionRequest(
  id: number,
  approvalReason?: string,
): Promise<SaleActionRequest> {
  const response = await api.post(
    `/sales/action-requests/${id}/approve`,
    {
      approval_reason: approvalReason || null,
    },
  );

  return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Reject Sale Action Request
|--------------------------------------------------------------------------
*/

export async function rejectSaleActionRequest(
  id: number,
  approvalReason: string,
): Promise<SaleActionRequest> {
  const response = await api.post(
    `/sales/action-requests/${id}/reject`,
    {
      approval_reason: approvalReason,
    },
  );

  return response.data.data;
}


export async function createVoidRequest(
  saleId: number,
  reason: string,
): Promise<SaleActionRequest> {
  const response = await api.post(
    `/sales/${saleId}/void-request`,
    {
      reason,
    },
  );

  return response.data.data;
}

export async function createRefundRequest(
  saleId: number,
  reason: string,
): Promise<SaleActionRequest> {
  const response = await api.post(
    `/sales/${saleId}/refund-request`,
    {
      reason,
    },
  );

  return response.data.data;
}
