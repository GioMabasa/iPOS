import api from "./api";

import type {
  Customer,
  CustomerRequest,
} from "../types/customer";

interface CustomerResponse {
  message: string;
  data: Customer;
}

interface CustomersResponse {
  message: string;
  data: Customer[];
}

export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get<CustomersResponse>("/customers");

  return response.data.data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const response = await api.get<CustomerResponse>(`/customers/${id}`);

  return response.data.data;
}

export async function createCustomer(
  data: CustomerRequest,
): Promise<Customer> {
  const response = await api.post<CustomerResponse>("/customers", data);

  return response.data.data;
}

export async function updateCustomer(
  id: number,
  data: CustomerRequest,
): Promise<Customer> {
  const response = await api.put<CustomerResponse>(
    `/customers/${id}`,
    data,
  );

  return response.data.data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`);
}