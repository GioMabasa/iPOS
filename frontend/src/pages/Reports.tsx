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

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>

        <p className="mt-1 text-sm text-gray-500">
          View and analyze sales reports.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Period */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date Period
            </label>

            <select
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value as SalesReportParams["period"]);

                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="today">Today</option>

              <option value="yesterday">Yesterday</option>

              <option value="this_week">This Week</option>

              <option value="this_month">This Month</option>

              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Sold By */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sold By
            </label>

            <select
              value={userId}
              onChange={(event) => {
                const value = event.target.value;

                setUserId(value === "" ? "" : Number(value));
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Users</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as SalesReportParams["status"]);

                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="completed">Completed</option>

              <option value="voided">Voided</option>

              <option value="refunded">Refunded</option>

              <option value="all">All</option>
            </select>
          </div>

          {/* Sale Number */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sale Number
            </label>

            <input
              type="text"
              value={saleNumber}
              onChange={(event) => {
                setSaleNumber(event.target.value);
                setPage(1);
              }}
              placeholder="Search sale number"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Invoice Number
            </label>

            <input
              type="text"
              value={invoiceNumber}
              onChange={(event) => {
                setInvoiceNumber(event.target.value);
                setPage(1);
              }}
              placeholder="Search invoice number"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Product / Barcode */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product / Barcode
            </label>

            <input
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            {productSearchLoading && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                Searching...
              </div>
            )}

            {!productSearchLoading &&
              productSearch.trim() !== "" &&
              productId === "" &&
              productResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
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
                      className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500">
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
                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                  No products found.
                </div>
              )}
          </div>
        </div>

        {/* Custom Dates */}
        {period === "custom" && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date From
              </label>

              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date To
              </label>

              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Total Sales</p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {summaryLoading
              ? "Loading..."
              : formatCurrency(summary.total_sales)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Total COGS</p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {summaryLoading ? "Loading..." : formatCurrency(summary.total_cogs)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Gross Profit</p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {summaryLoading
              ? "Loading..."
              : formatCurrency(summary.gross_profit)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Gross Margin</p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {summaryLoading
              ? "Loading..."
              : `${summary.gross_margin.toFixed(2)}%`}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Total Transactions
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {summaryLoading
              ? "Loading..."
              : summary.transaction_count.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sales Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Date
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Sale Number
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Invoice Number
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Cashier
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading report...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No sales found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatDate(sale.sale_date)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {sale.sale_number}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {sale.invoice_number}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {sale.user?.name ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className="capitalize">{sale.status}</span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-600">
            {total > 0
              ? `Showing ${(page - 1) * perPage + 1}–${Math.min(
                  page * perPage,
                  total,
                )} of ${total}`
              : "Showing 0 of 0"}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {getPageNumbers().map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => goToPage(pageNumber)}
                disabled={loading}
                className={`rounded-md border px-3 py-2 text-sm ${
                  pageNumber === page
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === lastPage || loading}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
