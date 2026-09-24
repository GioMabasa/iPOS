import api from "./api";

import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryFormData,
  ExpenseFormData,
  ExpenseListResponse,
  ExpenseCategoryListResponse,
} from "../types/expense";

export interface GetExpensesParams {
  search?: string;
  expense_category_id?: number;
  payment_method?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export const getExpenses = async (
  params?: GetExpensesParams
): Promise<ExpenseListResponse> => {
  const response = await api.get<ExpenseListResponse>("/expenses", {
    params,
  });

  return response.data;
};

export const getExpense = async (id: number): Promise<Expense> => {
  const response = await api.get<Expense>(`/expenses/${id}`);

  return response.data;
};

export const createExpense = async (
  data: ExpenseFormData
): Promise<Expense> => {
  const response = await api.post<{ expense: Expense }>("/expenses", data);

  return response.data.expense;
};

export const updateExpense = async (
  id: number,
  data: ExpenseFormData
): Promise<Expense> => {
  const response = await api.put<{ expense: Expense }>(
    `/expenses/${id}`,
    data
  );

  return response.data.expense;
};

export const voidExpense = async (id: number): Promise<Expense> => {
  const response = await api.post<{ expense: Expense }>(
    `/expenses/${id}/void`
  );

  return response.data.expense;
};

export interface ExpenseSummary {
  total_expenses: number;
  recorded_expenses: number;
  voided_expenses: number;
  expense_transactions: number;
}

export const getExpenseSummary = async (
  params?: {
    date_from?: string;
    date_to?: string;
  }
): Promise<ExpenseSummary> => {
  const response = await api.get<ExpenseSummary>("/expenses/summary", {
    params,
  });

  return response.data;
};

export interface GetExpenseCategoriesParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export const getExpenseCategories = async (
  params?: GetExpenseCategoriesParams
): Promise<ExpenseCategoryListResponse> => {
  const response = await api.get<ExpenseCategoryListResponse>(
    "/expense-categories",
    {
      params,
    }
  );

  return response.data;
};

export const createExpenseCategory = async (
  data: ExpenseCategoryFormData
): Promise<ExpenseCategory> => {
  const response = await api.post<{
    category: ExpenseCategory;
  }>("/expense-categories", data);

  return response.data.category;
};

export const updateExpenseCategory = async (
  id: number,
  data: ExpenseCategoryFormData
): Promise<ExpenseCategory> => {
  const response = await api.put<{
    category: ExpenseCategory;
  }>(`/expense-categories/${id}`, data);

  return response.data.category;
};

export const deleteExpenseCategory = async (
  id: number
): Promise<void> => {
  await api.delete(`/expense-categories/${id}`);
};

