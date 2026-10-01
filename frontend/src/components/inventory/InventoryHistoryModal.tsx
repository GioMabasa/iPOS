import { useEffect, useMemo, useState } from "react";
import type { InventoryTransaction } from "../../types/inventory";

type HistoryType = "bad_order" | "adjustment";

type HistoryPeriod =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "custom";

interface InventoryHistoryModalProps {
  historyModalOpen: boolean;
  historyType: HistoryType | null;

  historyTransactions: InventoryTransaction[];
  historyLoading: boolean;
  historyError: string;

  historyPage: number;
  historyLastPage: number;
  historyTotal: number;

  closeHistory: () => void;

  loadHistory: (
    type: HistoryType,
    page: number,
    filters?: {
      period: HistoryPeriod;
      date_from?: string;
      date_to?: string;
      search?: string;
      direction?: "all" | "increase" | "decrease";
    },
  ) => void | Promise<void>;

  setHistoryPage: (page: number) => void;

  formatDate: (value: string) => string;
  formatQuantity: (value: string | number) => string;
  formatCurrency: (value: string | number) => string;

  formatReference: (transaction: InventoryTransaction) => string;

  getTransactionClass: (type: InventoryTransaction["type"]) => string;

  getTransactionLabel: (type: InventoryTransaction["type"]) => string;
}

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getToday = () => {
  return getLocalDateString();
};

export default function InventoryHistoryModal({
  historyModalOpen,
  historyType,

  historyTransactions,
  historyLoading,
  historyError,

  historyPage,
  historyLastPage,
  historyTotal,

  closeHistory,

  loadHistory,
  setHistoryPage,

  formatDate,
  formatQuantity,
  formatCurrency,

  formatReference,

  getTransactionClass,
  getTransactionLabel,
}: InventoryHistoryModalProps) {
  const [search, setSearch] = useState("");

  const [period, setPeriod] = useState<HistoryPeriod>("today");

  const [dateFrom, setDateFrom] = useState(getToday());

  const [dateTo, setDateTo] = useState(getToday());

  const [direction, setDirection] = useState<"all" | "increase" | "decrease">(
    "all",
  );

  const isAdjustmentHistory = historyType === "adjustment";

  useEffect(() => {
    if (!historyModalOpen || !historyType) return;

    const timer = window.setTimeout(() => {
      loadHistory(historyType, 1, {
        period,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search.trim() || undefined,
        direction: isAdjustmentHistory ? direction : "all",
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    historyModalOpen,
    historyType,
    search,
    period,
    dateFrom,
    dateTo,
    direction,
    isAdjustmentHistory,
  ]);

  const applyPeriod = (value: HistoryPeriod) => {
    setPeriod(value);

    if (value === "all") {
      setDateFrom("");
      setDateTo("");

      return;
    }

    const today = new Date();

    if (value === "today") {
      const date = getLocalDateString(today);

      setDateFrom(date);
      setDateTo(date);

      return;
    }

    if (value === "yesterday") {
      const yesterday = new Date(today);

      yesterday.setDate(yesterday.getDate() - 1);

      const date = getLocalDateString(yesterday);

      setDateFrom(date);
      setDateTo(date);

      return;
    }

    if (value === "this_week") {
      const day = today.getDay();

      const diffToMonday = day === 0 ? 6 : day - 1;

      const monday = new Date(today);

      monday.setDate(today.getDate() - diffToMonday);

      setDateFrom(getLocalDateString(monday));

      setDateTo(getLocalDateString(today));

      return;
    }

    if (value === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      setDateFrom(getLocalDateString(firstDay));

      setDateTo(getLocalDateString(today));

      return;
    }

    /*
     * Custom Range
     *
     * Keep the currently selected dates.
     * If dates are empty, initialize them
     * to today.
     */
    if (value === "custom") {
      if (!dateFrom || !dateTo) {
        const date = getLocalDateString(today);

        setDateFrom(date);
        setDateTo(date);
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    const transactions = Array.isArray(historyTransactions)
      ? historyTransactions
      : [];

    const normalizedSearch = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      // Search filter
      if (normalizedSearch) {
        const productName = String(
          transaction.product?.name ?? "",
        ).toLowerCase();

        const sku = String(transaction.product?.sku ?? "").toLowerCase();

        const notes = String(transaction.notes ?? "").toLowerCase();

        const reference = String(
          formatReference(transaction) ?? "",
        ).toLowerCase();

        const matchesSearch =
          productName.includes(normalizedSearch) ||
          sku.includes(normalizedSearch) ||
          notes.includes(normalizedSearch) ||
          reference.includes(normalizedSearch);

        if (!matchesSearch) {
          return false;
        }
      }

      // Date filter
      if (period !== "all") {
        const transactionDate = new Date(transaction.created_at);

        if (Number.isNaN(transactionDate.getTime())) {
          return false;
        }

        if (dateFrom) {
          const fromDate = new Date(`${dateFrom}T00:00:00`);

          if (transactionDate < fromDate) {
            return false;
          }
        }

        if (dateTo) {
          const toDate = new Date(`${dateTo}T23:59:59.999`);

          if (transactionDate > toDate) {
            return false;
          }
        }
      }

      // Direction filter — Adjustment only
      if (isAdjustmentHistory && direction !== "all") {
        const quantity = Number(transaction.quantity);

        if (direction === "increase" && quantity <= 0) {
          return false;
        }

        if (direction === "decrease" && quantity >= 0) {
          return false;
        }
      }

      return true;
    });
  }, [
    historyTransactions,
    search,
    period,
    dateFrom,
    dateTo,
    direction,
    isAdjustmentHistory,
    formatReference,
  ]);

  const hasActiveFilters =
    search.trim() !== "" || period !== "today" || direction !== "all";

  const resetFilters = () => {
    const today = getToday();

    setSearch("");
    setPeriod("today");
    setDateFrom(today);
    setDateTo(today);
    setDirection("all");
  };

  if (!historyModalOpen || !historyType) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="relative overflow-hidden border-b border-slate-200 px-5 py-4 sm:px-6">
          <div
            className={`absolute inset-x-0 top-0 h-1 ${
              historyType === "bad_order"
                ? "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500"
                : "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500"
            }`}
          />

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  historyType === "bad_order"
                    ? "bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-200"
                    : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200"
                }`}
              >
                {historyType === "bad_order" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3.75 21 19.5H3L12 3.75Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4.5M12 16.5h.007"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3.75v16.5M3.75 12h16.5"
                    />
                  </svg>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">
                  {historyType === "bad_order"
                    ? "Bad Order History"
                    : "Adjustment History"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {historyType === "bad_order"
                    ? "Inventory transactions recorded as bad orders."
                    : "Inventory transactions recorded as manual adjustments."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeHistory}
              disabled={historyLoading}
              aria-label="Close history"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6 6 18"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[calc(90vh-145px)] overflow-y-auto p-5 sm:p-6">
          {/* Error */}
          {historyError && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="mt-0.5 h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3.75 21 19.5H3L12 3.75Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4.5M12 16.5h.007"
                />
              </svg>

              <span>{historyError}</span>
            </div>
          )}

          {/* Filters */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M7 12h10M10 18h4"
                      />
                    </svg>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800">
                    Filter History
                  </h3>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Narrow down the transactions you want to review.
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:self-auto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L19.5 9"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 4.5V9h-4.5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4.5 15"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5V15H9"
                    />
                  </svg>
                  Reset Filters
                </button>
              )}
            </div>

            <div
              className={`grid gap-3 ${
                isAdjustmentHistory
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {/* Search */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Search
                </label>

                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  >
                    <circle cx="11" cy="11" r="6.5" />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16 16 4 4"
                    />
                  </svg>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Product, SKU, notes..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Period */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Period
                </label>

                <select
                  value={period}
                  onChange={(event) => {
                    applyPeriod(event.target.value as HistoryPeriod);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">All</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Direction */}
              {isAdjustmentHistory && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Direction
                  </label>

                  <select
                    value={direction}
                    onChange={(event) =>
                      setDirection(
                        event.target.value as "all" | "increase" | "decrease",
                      )
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="all">All Directions</option>
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
              )}
            </div>

            {/* Custom Date Range */}
            {period === "custom" && (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Date From
                  </label>

                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(event.target.value);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Date To
                  </label>

                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => {
                      setDateTo(event.target.value);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            )}

            {/* Filter Summary */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredTransactions.length}
                </span>{" "}
                transaction
                {filteredTransactions.length !== 1 ? "s" : ""} on this page
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                  {period === "all" && "All"}
                  {period === "today" && "Today"}
                  {period === "yesterday" && "Yesterday"}
                  {period === "this_week" && "This Week"}
                  {period === "this_month" && "This Month"}
                  {period === "custom" && "Custom Range"}
                </span>

                {hasActiveFilters && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Filters active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {historyLoading ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <p className="text-sm font-medium text-slate-600">
                  Loading history...
                </p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.25h13.5A1.25 1.25 0 0 1 20 6.5v11A1.25 1.25 0 0 1 18.75 18.75H5.25A1.25 1.25 0 0 1 4 17.5v-11a1.25 1.25 0 0 1 1.25-1.25Z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 9h8M8 12h8M8 15h5"
                    />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  {hasActiveFilters
                    ? "No transactions match the selected filters"
                    : "No inventory history found"}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1050px] text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Product
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        SKU
                      </th>

                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Unit Cost
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reference
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Notes
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((transaction) => {
                      const quantity = Number(transaction.quantity);

                      const displayQuantity =
                        transaction.type === "bad_order"
                          ? -Math.abs(quantity)
                          : quantity;

                      const quantityClass =
                        displayQuantity < 0
                          ? "text-red-600"
                          : displayQuantity > 0
                            ? "text-emerald-600"
                            : "text-slate-500";

                      const quantityPrefix =
                        displayQuantity > 0
                          ? "+"
                          : displayQuantity < 0
                            ? "-"
                            : "";

                      return (
                        <tr
                          key={transaction.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                            {formatDate(transaction.created_at)}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800">
                              {transaction.product?.name || "—"}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-medium text-slate-500">
                            {transaction.product?.sku || "—"}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getTransactionClass(
                                transaction.type,
                              )}`}
                            >
                              {getTransactionLabel(transaction.type)}
                            </span>
                          </td>

                          <td
                            className={`px-4 py-3.5 text-right font-semibold ${quantityClass}`}
                          >
                            {quantityPrefix}

                            {formatQuantity(Math.abs(displayQuantity))}
                          </td>

                          <td className="px-4 py-3.5 text-right text-slate-600">
                            {transaction.unit_cost == null
                              ? "—"
                              : formatCurrency(transaction.unit_cost)}
                          </td>

                          <td className="px-4 py-3.5 text-slate-600">
                            {formatReference(transaction)}
                          </td>

                          <td className="max-w-[280px] px-4 py-3.5 text-slate-600">
                            <span className="block truncate">
                              {transaction.notes || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* History Pagination */}
          {!historyLoading && historyLastPage > 1 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {historyTotal} transaction
                {historyTotal !== 1 ? "s" : ""}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => {
                    const nextPage = historyPage - 1;

                    setHistoryPage(nextPage);

                    loadHistory(historyType, nextPage, {
                      period,
                      date_from: dateFrom || undefined,
                      date_to: dateTo || undefined,
                      search: search.trim() || undefined,
                      direction: isAdjustmentHistory ? direction : "all",
                    });
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.5 18-6-6 6-6"
                    />
                  </svg>
                  Previous
                </button>

                <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                  Page {historyPage} of {historyLastPage}
                </span>

                <button
                  type="button"
                  disabled={historyPage >= historyLastPage}
                  onClick={() => {
                    const nextPage = historyPage + 1;

                    setHistoryPage(nextPage);

                    loadHistory(historyType, nextPage, {
                      period,
                      date_from: dateFrom || undefined,
                      date_to: dateTo || undefined,
                      search: search.trim() || undefined,
                      direction: isAdjustmentHistory ? direction : "all",
                    });
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m9.5 6 6 6-6 6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="hidden text-xs text-slate-500 sm:block">
            {period === "all"
              ? "Showing all inventory history."
              : period === "today"
                ? "Showing today's inventory history."
                : period === "yesterday"
                  ? "Showing yesterday's inventory history."
                  : period === "this_week"
                    ? "Showing this week's inventory history."
                    : period === "this_month"
                      ? "Showing this month's inventory history."
                      : "Showing the selected date range."}
          </div>

          <button
            type="button"
            onClick={closeHistory}
            disabled={historyLoading}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
