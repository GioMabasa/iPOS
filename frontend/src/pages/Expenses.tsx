import { useEffect, useRef, useState } from "react";

import {
  createExpense,
  exportExpenses,
  getExpense,
  getExpenseCategories,
  getExpenseSummary,
  getExpenses,
  updateExpense,
  voidExpense,
} from "../services/expenseService";

import type {
  Expense,
  ExpenseCategory,
  ExpenseFormData,
} from "../types/expense";

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPeriodDates = (period: string) => {
  const today = new Date();

  if (period === "today") {
    const date = getLocalDateString(today);

    return {
      dateFrom: date,
      dateTo: date,
    };
  }

  if (period === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const date = getLocalDateString(yesterday);

    return {
      dateFrom: date,
      dateTo: date,
    };
  }

  if (period === "this_week") {
    const start = new Date(today);
    const day = start.getDay();

    start.setDate(start.getDate() - day);

    return {
      dateFrom: getLocalDateString(start),
      dateTo: getLocalDateString(today),
    };
  }

  if (period === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      dateFrom: getLocalDateString(start),
      dateTo: getLocalDateString(today),
    };
  }

  if (period === "last_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);

    return {
      dateFrom: getLocalDateString(start),
      dateTo: getLocalDateString(end),
    };
  }

  if (period === "this_year") {
    const start = new Date(today.getFullYear(), 0, 1);

    return {
      dateFrom: getLocalDateString(start),
      dateTo: getLocalDateString(today),
    };
  }

  return {
    dateFrom: "",
    dateTo: "",
  };
};

const initialPeriodDates = getPeriodDates("this_month");

const emptyForm: ExpenseFormData = {
  expense_category_id: 0,
  expense_date: getLocalDateString(new Date()),
  description: "",
  amount: 0,
  payment_method: "Cash",
  reference_no: "",
  notes: "",
};

function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  const [summary, setSummary] = useState({
    total_expenses: 0,
    recorded_expenses: 0,
    voided_expenses: 0,
    expense_transactions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [period, setPeriod] = useState("this_month");
  const [dateFrom, setDateFrom] = useState(initialPeriodDates.dateFrom);
  const [dateTo, setDateTo] = useState(initialPeriodDates.dateTo);

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);

  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [voidTarget, setVoidTarget] = useState<Expense | null>(null);

  const isFirstSearchEffect = useRef(true);

  const loadExpenses = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await getExpenses({
        page,
        per_page: 10,
        search: search.trim() || undefined,
        expense_category_id: categoryFilter
          ? Number(categoryFilter)
          : undefined,
        payment_method: paymentMethodFilter || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      setExpenses(response.data);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setTotal(response.total);
      setFrom(response.from);
      setTo(response.to);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      setLoadingSummary(true);

      const response = await getExpenseSummary({
        search: search.trim() || undefined,
        expense_category_id: categoryFilter
          ? Number(categoryFilter)
          : undefined,
        payment_method: paymentMethodFilter || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      setSummary(response);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load expense summary.",
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getExpenseCategories({
        per_page: 100,
        is_active: true,
      });

      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load expense categories.", err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadExpenses(1);
    loadSummary();
  }, []);

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      loadExpenses(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    search,
    categoryFilter,
    paymentMethodFilter,
    statusFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    if (period === "custom") {
      return;
    }

    const dates = getPeriodDates(period);

    setDateFrom(dates.dateFrom);
    setDateTo(dates.dateTo);
  }, [period]);

  useEffect(() => {
    if (!dateFrom && !dateTo) {
      return;
    }

    const timeout = setTimeout(() => {
      loadSummary();
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    search,
    categoryFilter,
    paymentMethodFilter,
    statusFilter,
    dateFrom,
    dateTo,
  ]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);

    if (value === "custom") {
      return;
    }

    const dates = getPeriodDates(value);

    setDateFrom(dates.dateFrom);
    setDateTo(dates.dateTo);
  };

  const openCreateModal = () => {
    setEditingExpense(null);

    setFormData({
      ...emptyForm,
      expense_date: getLocalDateString(new Date()),
      expense_category_id: categories[0]?.id ?? 0,
    });

    setError("");
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);

    setFormData({
      expense_category_id: expense.expense_category_id,
      expense_date: expense.expense_date,
      description: expense.description,
      amount: Number(expense.amount),
      payment_method: expense.payment_method,
      reference_no: expense.reference_no || "",
      notes: expense.notes || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingExpense(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    setError("");

    if (!formData.expense_category_id) {
      setError("Please select an expense category.");
      return;
    }

    if (!formData.expense_date) {
      setError("Please select an expense date.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter an expense description.");
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!formData.payment_method.trim()) {
      setError("Please select a payment method.");
      return;
    }

    try {
      setSaving(true);

      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          ...formData,
          description: formData.description.trim(),
          reference_no: formData.reference_no?.trim() || "",
          notes: formData.notes?.trim() || "",
        });

        setSuccessMessage("Expense updated successfully.");
      } else {
        await createExpense({
          ...formData,
          description: formData.description.trim(),
          reference_no: formData.reference_no?.trim() || "",
          notes: formData.notes?.trim() || "",
        });

        setSuccessMessage("Expense created successfully.");
      }

      setShowModal(false);
      setEditingExpense(null);
      setFormData(emptyForm);

      await loadExpenses(editingExpense ? currentPage : 1);
      await loadSummary();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = async (expense: Expense) => {
    try {
      setLoadingDetails(true);
      setError("");

      const details = await getExpense(expense.id);
      setViewingExpense(details);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load expense details.",
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleVoid = async () => {
    if (!voidTarget) {
      return;
    }

    try {
      setVoiding(true);
      setError("");

      await voidExpense(voidTarget.id);

      setVoidTarget(null);
      setSuccessMessage("Expense voided successfully.");

      await loadExpenses(currentPage);
      await loadSummary();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to void expense.");
    } finally {
      setVoiding(false);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > lastPage || page === currentPage) {
      return;
    }

    loadExpenses(page);
  };

  const formatAmount = (amount: string | number) => {
    return Number(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");

      const blob = await exportExpenses({
        period,
        search: search.trim() || undefined,
        expense_category_id: categoryFilter
          ? Number(categoryFilter)
          : undefined,
        payment_method: paymentMethodFilter || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "expenses.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to export expenses.");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "—";
    }

    const dateOnly = date.split("T")[0];

    const [year, month, day] = dateOnly.split("-").map(Number);

    if (!year || !month || !day) {
      return "—";
    }

    return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const updateField = <K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Expense Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage business operating expenses.
          </p>
        </div>
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
              />
            </svg>

            {exporting ? "Exporting..." : "Export Expenses to Spreadsheet"}
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14M5 12h14"
              />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Period */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" ry="2" />
                  <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Expense Period
                </p>

                <p className="text-xs text-gray-500">
                  View expenses and summary for a selected period.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="min-w-[190px] rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Period</option>
            </select>

            {period === "custom" && (
              <>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <span className="hidden text-sm font-medium text-gray-400 sm:block">
                  to
                </span>

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Expenses */}
        <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 transition group-hover:scale-110" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Expenses
              </p>

              <div className="mt-2">
                {loadingSummary ? (
                  <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    ₱{formatAmount(summary.total_expenses)}
                  </p>
                )}
              </div>

              <p className="mt-2 text-xs font-medium text-indigo-600">
                Recorded expenses
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl font-bold text-indigo-600">
              ₱
            </div>
          </div>
        </div>

        {/* Recorded Expenses */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-50 transition group-hover:scale-110" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Recorded Expenses
              </p>

              <div className="mt-2">
                {loadingSummary ? (
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    {summary.recorded_expenses.toLocaleString("en-PH")}
                  </p>
                )}
              </div>

              <p className="mt-2 text-xs font-medium text-emerald-600">
                Active expense records
              </p>
            </div>

            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Voided Expenses */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-50 transition group-hover:scale-110" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Voided Expenses
              </p>

              <div className="mt-2">
                {loadingSummary ? (
                  <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    ₱{formatAmount(summary.voided_expenses)}
                  </p>
                )}
              </div>

              <p className="mt-2 text-xs font-medium text-amber-600">
                Voided transaction value
              </p>
            </div>

            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Expense Transactions */}
        <div className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-50 transition group-hover:scale-110" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Expense Transactions
              </p>

              <div className="mt-2">
                {loadingSummary ? (
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    {summary.expense_transactions.toLocaleString("en-PH")}
                  </p>
                )}
              </div>

              <p className="mt-2 text-xs font-medium text-purple-600">
                Recorded + voided
              </p>
            </div>

            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
                />
                <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
            />
            <circle cx="12" cy="12" r="9" />
          </svg>

          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01"
            />
            <circle cx="12" cy="12" r="9" />
          </svg>

          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </div>

          <p className="text-sm font-semibold text-gray-900">Expense Filters</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
          {/* Search */}
          <div className="relative xl:col-span-2">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or reference..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Payment Method */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
            <option value="Check">Check</option>
            <option value="Other">Other</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Status</option>
            <option value="Recorded">Recorded</option>
            <option value="Voided">Voided</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>

                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="transition hover:bg-indigo-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                      {formatDate(expense.expense_date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                      {expense.category?.name || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="max-w-xs">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {expense.description}
                        </p>

                        {expense.reference_no && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            Ref: {expense.reference_no}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                      {expense.payment_method}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900">
                      ₱{formatAmount(expense.amount)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-center">
                      {expense.status === "Voided" ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Recorded
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(expense)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                            />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
                          View
                        </button>

                        {expense.status !== "Voided" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(expense)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463l-4.5 1.125 1.125-4.5L16.862 3.487z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.75 5.25l3 3"
                                />
                              </svg>
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setVoidTarget(expense)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 3h6m-7.5 3h9M6 6l1 14h10l1-14M10 10v6m4-6v6"
                                />
                              </svg>
                              Void
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{from}</span>{" "}
              to <span className="font-medium text-gray-700">{to}</span> of{" "}
              <span className="font-medium text-gray-700">{total}</span>{" "}
              expenses
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600">
                Page {currentPage} of {lastPage}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Header */}
            <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-5">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/60" />
              <div className="absolute -bottom-12 left-1/3 h-24 w-24 rounded-full bg-violet-100/50" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V5m0 14v-3m7-4h-3M8 12H5m13.364-4.364-2.121 2.121M7.757 16.243l-2.121 2.121m0-12.728 2.121 2.121m10.607 10.607-2.121-2.121"
                      />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {editingExpense ? "Edit Expense" : "Add Expense"}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {editingExpense
                        ? "Update the expense information."
                        : "Record a new business expense."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="relative rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-600 disabled:opacity-50"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[75vh] overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Expense Category
                  </label>

                  <select
                    value={formData.expense_category_id || ""}
                    onChange={(e) =>
                      updateField("expense_category_id", Number(e.target.value))
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Expense Date
                  </label>

                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) =>
                      updateField("expense_date", e.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description <span className="text-rose-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="e.g. Monthly store rent"
                    disabled={saving}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      !formData.description.trim()
                        ? "border-slate-300 focus:border-indigo-500 focus:ring-indigo-50"
                        : "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-50"
                    }`}
                  />

                  <p className="mt-1.5 text-xs text-slate-500">
                    Provide a clear description of the expense.
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Amount <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                      ₱
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.amount || ""}
                      onChange={(e) =>
                        updateField("amount", Number(e.target.value))
                      }
                      disabled={saving}
                      placeholder="0.00"
                      className={`w-full rounded-xl border bg-white py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        Number(formData.amount) <= 0
                          ? "border-slate-300 focus:border-indigo-500 focus:ring-indigo-50"
                          : "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-50"
                      }`}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      updateField("payment_method", e.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="Check">Check</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Reference */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Reference No.{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={formData.reference_no || ""}
                    onChange={(e) =>
                      updateField("reference_no", e.target.value)
                    }
                    placeholder="e.g. OR-001234"
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Notes{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={3}
                    placeholder="Additional notes..."
                    disabled={saving}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-5 py-4">
              <p className="text-xs text-slate-500">
                <span className="text-rose-500">*</span> Required fields
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !formData.description.trim() ||
                    Number(formData.amount) <= 0
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                >
                  {saving
                    ? "Saving..."
                    : editingExpense
                      ? "Update Expense"
                      : "Save Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:rounded-3xl">
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-4 py-4 text-white sm:px-5 sm:py-5">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 sm:h-32 sm:w-32" />
              <div className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-white/5 sm:h-28 sm:w-28" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 sm:h-9 sm:w-9 sm:rounded-xl">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.05 1.852-2.248A48.424 48.424 0 0112 2.25c2.005 0 3.968.125 5.852.358C18.899 2.558 19.5 3.5 19.5 4.757z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                        Expense Details
                      </h2>

                      <p className="mt-0.5 truncate text-xs text-indigo-100 sm:mt-1 sm:text-sm">
                        {viewingExpense.reference_no
                          ? `Reference No. ${viewingExpense.reference_no}`
                          : `Expense #${viewingExpense.id}`}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingExpense(null)}
                  className="shrink-0 rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/20 sm:rounded-xl sm:p-2"
                >
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-10">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
                  <p className="text-sm font-medium text-slate-500">
                    Loading details...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Scrollable Content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
                  <div className="space-y-3.5 sm:space-y-5">
                    {/* Status */}
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                          Status
                        </p>

                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-700 sm:text-sm">
                          Transaction Status
                        </p>
                      </div>

                      {viewingExpense.status === "Voided" ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 ring-1 ring-red-200 sm:px-3 sm:py-1.5 sm:text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 sm:px-3 sm:py-1.5 sm:text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Recorded
                        </span>
                      )}
                    </div>

                    {/* Date & Category */}
                    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                          Date
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-800 sm:mt-1.5 sm:text-sm">
                          {formatDate(viewingExpense.expense_date)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                          Category
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-800 sm:mt-1.5 sm:text-sm">
                          {viewingExpense.category?.name || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 sm:rounded-2xl sm:p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 sm:text-xs">
                        Description
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-800 sm:mt-1.5 sm:text-sm sm:leading-6">
                        {viewingExpense.description}
                      </p>
                    </div>

                    {/* Amount & Payment */}
                    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 sm:rounded-2xl sm:p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 sm:text-xs">
                          Amount
                        </p>

                        <p className="mt-1 text-lg font-extrabold tracking-tight text-emerald-700 sm:text-xl">
                          ₱{formatAmount(viewingExpense.amount)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 sm:rounded-2xl sm:p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 sm:text-xs">
                          Payment Method
                        </p>

                        <p className="mt-1 truncate text-xs font-bold text-violet-700 sm:mt-1.5 sm:text-sm">
                          {viewingExpense.payment_method}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {viewingExpense.notes && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 sm:rounded-2xl sm:p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 sm:text-xs">
                          Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700 sm:mt-1.5 sm:text-sm sm:leading-6">
                          {viewingExpense.notes}
                        </p>
                      </div>
                    )}

                    {/* Created By */}
                    <div className="flex items-center gap-3 border-t border-slate-100 pt-3 sm:pt-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 sm:h-9 sm:w-9">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                          Created By
                        </p>

                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 sm:text-sm">
                          {viewingExpense.creator?.name || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5 sm:py-4">
                  <button
                    type="button"
                    onClick={() => setViewingExpense(null)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] sm:px-5 sm:py-2.5 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Void Confirmation */}
      {voidTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2 text-red-600">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01"
                    />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Void Expense
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Are you sure you want to void this expense? This record will
                    be preserved for audit and reporting purposes.
                  </p>

                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {voidTarget.description}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      ₱{formatAmount(voidTarget.amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setVoidTarget(null)}
                disabled={voiding}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleVoid}
                disabled={voiding}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {voiding ? "Voiding..." : "Void Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
