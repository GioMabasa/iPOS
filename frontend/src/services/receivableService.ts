import api from "./api";

import type {
  CreateCustomerPaymentRequest,
  CustomerPaymentResponse,
  Receivable,
  ReceivableResponse,
  ReceivablesResponse,
} from "../types/receivable";

export async function getReceivables(): Promise<Receivable[]> {
  const response = await api.get<ReceivablesResponse>("/receivables");

  return response.data.data;
}

export async function getReceivable(
  id: number,
): Promise<ReceivableResponse["data"]> {
  const response = await api.get<ReceivableResponse>(
    `/receivables/${id}`,
  );

  return response.data.data;
}

export async function createCustomerPayment(
  id: number,
  data: CreateCustomerPaymentRequest,
): Promise<CustomerPaymentResponse["data"]> {
  const response = await api.post<CustomerPaymentResponse>(
    `/receivables/${id}/payments`,
    data,
  );

  return response.data.data;
}