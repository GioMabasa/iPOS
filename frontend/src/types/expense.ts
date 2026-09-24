export interface ExpenseCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreator {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  expense_category_id: number;
  expense_date: string;
  description: string;
  amount: string;
  payment_method: string;
  reference_no: string | null;
  notes: string | null;
  status: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  category: ExpenseCategory;
  creator: ExpenseCreator | null;
}

export interface ExpenseListResponse {
  current_page: number;
  data: Expense[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ExpenseFormData {
  expense_category_id: number;
  expense_date: string;
  description: string;
  amount: number;
  payment_method: string;
  reference_no?: string;
  notes?: string;
}

export interface ExpenseCategoryFormData {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface ExpenseCategoryListResponse {
  current_page: number;
  data: ExpenseCategory[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}