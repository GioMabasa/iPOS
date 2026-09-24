import { useEffect, useState } from "react";

import type { Sale } from "../types/sale";

import {
  getSalesReport,
  getSalesSummary,
  type SalesReportParams,
} from "../services/reportService";

import { getUsers, type User } from "../services/userService";

import { getProducts } from "../services/productService";
import type { Product } from "../types/product";

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | "">("");

  /*
  |--------------------------------------------------------------------------
  | Product Filter
  |--------------------------------------------------------------------------
  */

  const [productId, setProductId] = useState<number | "">("");
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Sales Summary
  |--------------------------------------------------------------------------
  */

  const [summary, setSummary] = useState({
    transaction_count: 0,
    total_sales: 0,
    total_cogs: 0,
    gross_profit: 0,
    gross_margin: 0,
  });

  const [summaryLoading, setSummaryLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [period, setPeriod] = useState<SalesReportParams["period"]>("today");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [status, setStatus] =
    useState<SalesReportParams["status"]>("completed");

  const [saleNumber, setSaleNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);

  /*
  |--------------------------------------------------------------------------
  | Load Users
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();

        setUsers(data);
      } catch (err) {
        console.error(err);

        setUsers([]);
      }
    };

    loadUsers();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Product Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const searchProducts = async () => {
      const search = productSearch.trim();

      if (!search || productId !== "") {
        setProductResults([]);
        return;
      }

      try {
        setProductSearchLoading(true);

        const response = await getProducts({
          search,
          is_active: true,
          per_page: 10,
        });

        setProductResults(response.data ?? []);
      } catch (err) {
        console.error(err);

        setProductResults([]);
      } finally {
        setProductSearchLoading(false);
      }
    };

    const timeout = window.setTimeout(() => {
      searchProducts();
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [productSearch, productId]);

  /*
  |--------------------------------------------------------------------------
  | Load Sales Report
  |--------------------------------------------------------------------------
  */

  const loadSalesReport = async () => {
    try {
      setLoading(true);
      setError("");

      const params: SalesReportParams = {
        period,
        user_id: userId === "" ? undefined : userId,
        product_id: productId === "" ? undefined : productId,
        status,
        sale_number: saleNumber || undefined,
        invoice_number: invoiceNumber || undefined,
        page,
        per_page: perPage,
      };

      if (period === "custom") {
        params.from = dateFrom;
        params.to = dateTo;
      }

      const response = await getSalesReport(params);

      setSales(response.data.data);
      setLastPage(response.data.last_page);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);

      setSales([]);
      setError("Failed to load sales report.");
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Sales Summary
  |--------------------------------------------------------------------------
  */

  const loadSalesSummary = async () => {
    try {
      setSummaryLoading(true);

      const params: SalesReportParams = {
        period,
        user_id: userId === "" ? undefined : userId,
        product_id: productId === "" ? undefined : productId,
        status,
        sale_number: saleNumber || undefined,
        invoice_number: invoiceNumber || undefined,
      };

      if (period === "custom") {
        params.from = dateFrom;
        params.to = dateTo;
      }

      const response = await getSalesSummary(params);

      setSummary({
        transaction_count: Number(response.data.transaction_count ?? 0),
        total_sales: Number(response.data.total_sales ?? 0),
        total_cogs: Number(response.data.total_cogs ?? 0),
        gross_profit: Number(response.data.gross_profit ?? 0),
        gross_margin: Number(response.data.gross_margin ?? 0),
      });
    } catch (err) {
      console.error(err);

      setSummary({
        transaction_count: 0,
        total_sales: 0,
        total_cogs: 0,
        gross_profit: 0,
        gross_margin: 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Report
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadSalesReport();
  }, [
    page,
    period,
    dateFrom,
    dateTo,
    userId,
    productId,
    status,
    saleNumber,
    invoiceNumber,
  ]);

  useEffect(() => {
    loadSalesSummary();
  }, [
    period,
    dateFrom,
    dateTo,
    userId,
    productId,
    status,
    saleNumber,
    invoiceNumber,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Clear Filters
  |--------------------------------------------------------------------------
  */

  const clearFilters = () => {
    setPeriod("today");
    setDateFrom("");
    setDateTo("");
    setUserId("");
    setProductId("");
    setProductSearch("");
    setProductResults([]);
    setStatus("completed");
    setSaleNumber("");
    setInvoiceNumber("");
    setPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > lastPage || newPage === page) {
      return;
    }

    setPage(newPage);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];

    for (let i = 1; i <= lastPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const formatCurrency = (value: number | string | undefined) => {
    const amount = Number(value ?? 0);

    return amount.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  const formatDate = (value: string) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusClass = (value: string) => {
    switch (value) {
      case "completed":
        return "border-green-100 bg-green-50 text-green-700";

      case "voided":
        return "border-red-100 bg-red-50 text-red-700";

      case "refunded":
        return "border-amber-100 bg-amber-50 text-amber-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const getStatusDotClass = (value: string) => {
    switch (value) {
      case "completed":
        return "bg-green-500";

      case "voided":
        return "bg-red-500";

      case "refunded":
        return "bg-amber-500";

      default:
        return "bg-slate-400";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 19V5" />
              <path d="M4 19h17" />
              <path d="M8 16v-5" />
              <path d="M12 16V8" />
              <path d="M16 16V5" />
              <path d="M20 16V10" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and analyze sales reports.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M7 12h10" />
              <path d="M10 18h4" />
            </svg>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Report Filters
            </h2>

            <p className="text-xs text-slate-500">
              Refine the sales report using the available filters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Period */}
          <div>
            <label
              htmlFor="report-period"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Date Period
            </label>

            <div className="relative">
              <select
                id="report-period"
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value as SalesReportParams["period"]);

                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom</option>
              </select>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Sold By */}
          <div>
            <label
              htmlFor="report-user"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Sold By
            </label>

            <div className="relative">
              <select
                id="report-user"
                value={userId}
                onChange={(event) => {
                  const value = event.target.value;

                  setUserId(value === "" ? "" : Number(value));
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">All Users</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="report-status"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Status
            </label>

            <div className="relative">
              <select
                id="report-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as SalesReportParams["status"]);

                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="completed">Completed</option>
                <option value="voided">Voided</option>
                <option value="refunded">Refunded</option>
                <option value="all">All</option>
              </select>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Sale Number */}
          <div>
            <label
              htmlFor="sale-number"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Sale Number
            </label>

            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <path d="M4 5h16v14H4z" />
                <path d="M8 9h8" />
                <path d="M8 13h5" />
              </svg>

              <input
                id="sale-number"
                type="text"
                value={saleNumber}
                onChange={(event) => {
                  setSaleNumber(event.target.value);
                  setPage(1);
                }}
                placeholder="Search sale number"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          {/* Invoice Number */}
          <div>
            <label
              htmlFor="invoice-number"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Invoice Number
            </label>

            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <path d="M6 3h9l3 3v15H6z" />
                <path d="M14 3v4h4" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>

              <input
                id="invoice-number"
                type="text"
                value={invoiceNumber}
                onChange={(event) => {
                  setInvoiceNumber(event.target.value);
                  setPage(1);
                }}
                placeholder="Search invoice number"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          {/* Product / Barcode */}
          <div className="relative">
            <label
              htmlFor="product-search"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Product / Barcode
            </label>

            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="1.5" />
                <path d="M7 8v8M10 8v8M13 8v8M16 8v8" />
              </svg>

              <input
                id="product-search"
                type="text"
                value={productSearch}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setProductId("");
                  setPage(1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && productResults.length === 1) {
                    const product = productResults[0];

                    setProductId(product.id);
                    setProductSearch(product.name);
                    setProductResults([]);
                    setPage(1);
                  }
                }}
                placeholder="Search product or scan barcode"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            {productSearchLoading && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500 shadow-lg">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                Searching...
              </div>
            )}

            {!productSearchLoading &&
              productSearch.trim() !== "" &&
              productId === "" &&
              productResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                  {productResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setProductId(product.id);
                        setProductSearch(product.name);
                        setProductResults([]);
                        setPage(1);
                      }}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-indigo-50/50"
                    >
                      <div className="font-semibold text-slate-900">
                        {product.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        SKU: {product.sku}
                        {product.barcode
                          ? ` • Barcode: ${product.barcode}`
                          : ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}

            {!productSearchLoading &&
              productSearch.trim() !== "" &&
              productId === "" &&
              productResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
                  No products found.
                </div>
              )}
          </div>
        </div>

        {/* Custom Dates */}
        {period === "custom" && (
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 text-indigo-600"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>

              <span className="text-xs font-semibold text-indigo-700">
                Custom Date Range
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="date-from"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Date From
                </label>

                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label
                  htmlFor="date-to"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Date To
                </label>

                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            Clear Filters
          </button>
        </div>
      </section>

      {/* Summary */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M4 19V5" />
              <path d="M4 19h17" />
              <path d="M8 16v-5" />
              <path d="M12 16V8" />
              <path d="M16 16V5" />
            </svg>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Sales Summary
            </h2>

            <p className="text-xs text-slate-500">
              Financial performance for the selected report filters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Sales */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Sales
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <div
                  className="text-lg font-bold leading-none"
                  aria-hidden="true"
                >
                  ₱
                </div>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {summaryLoading
                ? "Loading..."
                : formatCurrency(summary.total_sales)}
            </p>
          </div>

          {/* Total COGS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total COGS
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M4 6h16" />
                  <path d="M6 6v13h12V6" />
                  <path d="M9 6V4h6v2" />
                  <path d="M9 10v5M12 10v5M15 10v5" />
                </svg>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {summaryLoading
                ? "Loading..."
                : formatCurrency(summary.total_cogs)}
            </p>
          </div>

          {/* Gross Profit */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gross Profit
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M4 19V5" />
                  <path d="M4 19h17" />
                  <path d="M8 16v-3" />
                  <path d="M12 16V9" />
                  <path d="M16 16V6" />
                </svg>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {summaryLoading
                ? "Loading..."
                : formatCurrency(summary.gross_profit)}
            </p>
          </div>

          {/* Gross Margin */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gross Margin
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 14l3-3 2 2 4-5" />
                </svg>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {summaryLoading
                ? "Loading..."
                : `${summary.gross_margin.toFixed(2)}%`}
            </p>
          </div>

          {/* Total Transactions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Transactions
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M6 3h12v18H6z" />
                  <path d="M9 7h6M9 11h6M9 15h4" />
                </svg>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {summaryLoading
                ? "Loading..."
                : summary.transaction_count.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>

          <span>{error}</span>
        </div>
      )}

      {/* Sales Report */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M4 5h16v14H4z" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Sales Report
              </h2>

              <p className="text-xs text-slate-500">
                Detailed sales transactions for the selected filters.
              </p>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-500">
            {total.toLocaleString()} record{total !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Date
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Sale Number
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Invoice Number
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Cashier
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex min-h-[280px] flex-col items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                      <p className="mt-3 text-sm text-slate-500">
                        Loading report...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          className="h-7 w-7"
                          aria-hidden="true"
                        >
                          <path d="M4 5h16v14H4z" />
                          <path d="M8 9h8M8 13h8M8 17h5" />
                        </svg>
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-slate-900">
                        No sales found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        No sales match the selected report filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {formatDate(sale.sale_date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-semibold text-slate-900">
                        {sale.sale_number}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                      {sale.invoice_number}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                          {(sale.user?.name ?? "—").charAt(0).toUpperCase()}
                        </div>

                        <span className="text-sm text-slate-700">
                          {sale.user?.name ?? "—"}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          sale.status,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                            sale.status,
                          )}`}
                        />

                        <span className="capitalize">{sale.status}</span>
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-slate-500">
            {total > 0
              ? `Showing ${(page - 1) * perPage + 1}–${Math.min(
                  page * perPage,
                  total,
                )} of ${total}`
              : "Showing 0 of 0"}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>

              <span className="hidden sm:inline">Previous</span>
            </button>

            {getPageNumbers().map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => goToPage(pageNumber)}
                disabled={loading}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed ${
                  pageNumber === page
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === lastPage || loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
            >
              <span className="hidden sm:inline">Next</span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
