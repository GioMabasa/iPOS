import { useEffect, useRef, useState } from "react";

import SuccessMessage from "../components/SuccessMessage";
import ErrorMessage from "../components/ErrorMessage";
import ExpenseHeader from "../components/expenses/ExpenseHeader";
import ExpensePeriod from "../components/expenses/ExpensePeriod";
import ExpenseFilters from "../components/expenses/ExpenseFilters";
import ExpenseTable from "../components/expenses/ExpenseTable";
import ExpenseFormModal from "../components/expenses/ExpenseFormModal";
import ExpenseViewModal from "../components/expenses/ExpenseViewModal";
import ExpenseVoidModal from "../components/expenses/ExpenseVoidModal";
import ExpenseSummaryCards from "../components/expenses/ExpenseSummaryCards";

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

  const loadExpenses = async (page = 1, isFiltering = false) => {
    try {
      if (!isFiltering) {
        setLoading(true);
      }

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
      if (!isFiltering) {
        setLoading(false);
      }
    }
  };

  const loadSummary = async (isFiltering = false) => {
    try {
      if (!isFiltering) {
        setLoadingSummary(true);
      }

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
      if (!isFiltering) {
        setLoadingSummary(false);
      }
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
      loadExpenses(1, true);
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
      loadSummary(true);
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
      <ExpenseHeader
        exporting={exporting}
        onExport={handleExport}
        onAddExpense={openCreateModal}
      />
      {/* Period */}
      <ExpensePeriod
        period={period}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPeriodChange={handlePeriodChange}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />
      {/* Summary Cards */}
      <ExpenseSummaryCards
        summary={summary}
        loadingSummary={loadingSummary}
        formatAmount={formatAmount}
      />
      {/* Messages */}
      <SuccessMessage
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        title="Expense Saved"
      />
      <ErrorMessage
        message={error}
        onClose={() => setError("")}
        duration={3000}
      />
      {/* Filters */}
      <ExpenseFilters
        search={search}
        categoryFilter={categoryFilter}
        paymentMethodFilter={paymentMethodFilter}
        statusFilter={statusFilter}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        onStatusChange={setStatusFilter}
      />
      {/* Table */}
      <ExpenseTable
        expenses={expenses}
        loading={loading}
        total={total}
        from={from}
        to={to}
        currentPage={Number(currentPage)}
        lastPage={Number(lastPage)}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onView={openViewModal}
        onEdit={openEditModal}
        onVoid={setVoidTarget}
        onPageChange={(page) => goToPage(page)}
      />

      {/* Add/Edit Modal */}
      <ExpenseFormModal
        showModal={showModal}
        editingExpense={!!editingExpense}
        saving={saving}
        formData={formData}
        categories={categories}
        onClose={closeModal}
        onSave={handleSave}
        onUpdateField={updateField}
      />
      {/* View Modal */}
      <ExpenseViewModal
        expense={viewingExpense}
        loadingDetails={loadingDetails}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onClose={() => setViewingExpense(null)}
      />
      {/* Void Confirmation */}
      <ExpenseVoidModal
        expense={voidTarget}
        voiding={voiding}
        formatAmount={formatAmount}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoid}
      />
    </div>
  );
}

export default Expenses;
