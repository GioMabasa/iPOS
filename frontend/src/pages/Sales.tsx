import { useEffect, useRef, useState } from "react";
import type { Sale, SaleItem } from "../types/sale";
import {
  getSales,
  voidSale,
  refundSale,
  exportSales,
} from "../services/saleService";

import { getUsers } from "../services/userService";
import {
  createVoidRequest,
  createRefundRequest,
  getSaleActionRequests,
} from "../services/saleActionRequestService";
import { useAuth } from "../context/AuthContext";
import type { SaleActionRequest } from "../types/saleActionRequest";

type SaleCost = {
  id: number;
  sale_item_id: number;
  inventory_transaction_id: number;
  quantity: number | string;
  reversed_quantity: number | string;
  unit_cost: number | string;
  total_cost: number | string;
  inventory_transaction?: {
    id: number;
    product_id: number;
    type: string;
    quantity: number | string;
    unit_cost: number | string;
    reference_type?: string | null;
    reference_id?: number | null;
    notes?: string | null;
  };
};

type SaleItemWithCosts = SaleItem & {
  costs?: SaleCost[];
};

export default function Sales() {
  const { user } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [users, setUsers] = useState<
    { id: number; name: string; role: string }[]
  >([]);

  const [datePreset, setDatePreset] = useState("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCogs, setTotalCogs] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);
  const [totalVoid, setTotalVoid] = useState(0);
  const [totalRefund, setTotalRefund] = useState(0);

  const [grossMargin, setGrossMargin] = useState(0);
  const [cashSales, setCashSales] = useState(0);
  const [chargeSales, setChargeSales] = useState(0);

  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalTax, setTotalTax] = useState(0);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [requestAction, setRequestAction] = useState<"void" | "refund" | null>(
    null,
  );

  const [myActionRequests, setMyActionRequests] = useState<SaleActionRequest[]>(
    [],
  );

  const [requestReason, setRequestReason] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const [refundQuantities, setRefundQuantities] = useState<
    Record<number, number>
  >({});

  // Auto-highlight the entire field value when focused.
  const selectAllOnFocus = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    event.currentTarget.select();
  };

  const getDateRange = () => {
    if (datePreset === "all") {
      return {
        date_from: undefined,
        date_to: undefined,
      };
    }

    if (datePreset === "custom") {
      return {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
    }

    const today = new Date();

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    if (datePreset === "today") {
      const date = formatLocalDate(today);

      return {
        date_from: date,
        date_to: date,
      };
    }

    if (datePreset === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const date = formatLocalDate(yesterday);

      return {
        date_from: date,
        date_to: date,
      };
    }

    if (datePreset === "this_week") {
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();

      const diff = day === 0 ? 6 : day - 1;

      startOfWeek.setDate(startOfWeek.getDate() - diff);

      return {
        date_from: formatLocalDate(startOfWeek),
        date_to: formatLocalDate(today),
      };
    }

    if (datePreset === "this_month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      return {
        date_from: formatLocalDate(startOfMonth),
        date_to: formatLocalDate(today),
      };
    }

    if (datePreset === "last_month") {
      const startOfLastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );

      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      return {
        date_from: formatLocalDate(startOfLastMonth),
        date_to: formatLocalDate(endOfLastMonth),
      };
    }

    return {
      date_from: undefined,
      date_to: undefined,
    };
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const dateRange = getDateRange();

      const response = await getSales({
        search: search.trim() || undefined,
        status: status || undefined,
        payment_method:
          paymentMethod === ""
            ? undefined
            : (paymentMethod as "cash" | "charge"),
        date_from: dateRange.date_from,
        date_to: dateRange.date_to,
        user_id: selectedUserId === "" ? undefined : Number(selectedUserId),
        page,
      });

      setSales(response.data);
      setLastPage(response.pagination.last_page);
      setTotalTransactions(response.pagination.total);

      setTotalItemsSold(response.summary.total_items_sold);
      setTotalSales(response.summary.total_sales);
      setTotalCogs(response.summary.total_cogs);
      setGrossProfit(response.summary.gross_profit);
      setTotalVoid(response.summary.total_void ?? 0);
      setTotalRefund(response.summary.total_refund ?? 0);
      setCashSales(response.summary.cash_sales);
      setChargeSales(response.summary.charge_sales ?? 0);

      setTotalDiscount(response.summary.total_discount ?? 0);
      setTotalTax(response.summary.total_tax ?? 0);

      setGrossMargin(response.summary.gross_margin ?? 0);
    } catch (err) {
      console.error(err);
      setError("Unable to load sales.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (user?.role !== "admin" && user?.role !== "manager") {
      return;
    }

    try {
      const response = await getUsers();

      setUsers(response);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyActionRequests = async () => {
    if (user?.role !== "cashier") {
      return;
    }

    try {
      const response = await getSaleActionRequests();

      setMyActionRequests(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSales();

    function handleSaleCompleted() {
      void loadSales();
    }

    window.addEventListener("ipos:sale-completed", handleSaleCompleted);

    return () => {
      window.removeEventListener("ipos:sale-completed", handleSaleCompleted);
    };
  }, [
    page,
    status,
    paymentMethod,
    selectedUserId,
    datePreset,
    dateFrom,
    dateTo,
    search,
  ]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "manager") {
      loadUsers();
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "cashier") {
      loadMyActionRequests();
    }
  }, [user?.role]);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPaymentMethod("");
    setSelectedUserId("");
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setError("");

      const dateRange = getDateRange();

      const blob = await exportSales({
        search: search.trim() || undefined,
        status: status || undefined,
        payment_method:
          paymentMethod === ""
            ? undefined
            : (paymentMethod as "cash" | "charge"),
        date_from: dateRange.date_from,
        date_to: dateRange.date_to,
        user_id: selectedUserId === "" ? undefined : Number(selectedUserId),
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-${new Date().toISOString().slice(0, 10)}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Unable to export sales.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    setPage(1);

    if (value !== "custom") {
      setDateFrom("");
      setDateTo("");
    }
  };

  const formatCurrency = (value: number | string) => {
    return `₱${Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusLabel = (value: string) => {
    switch (value) {
      case "completed":
        return "Completed";
      case "refunded":
        return "Refunded";
      case "voided":
        return "Voided";
      default:
        return value;
    }
  };

  const getStatusClass = (value: string) => {
    switch (value) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
      case "refunded":
        return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
      case "voided":
        return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200";
    }
  };

  const getReference = (cost: SaleCost) => {
    const transaction = cost.inventory_transaction;

    if (!transaction) {
      return "—";
    }

    if (transaction.notes) {
      return transaction.notes;
    }

    if (transaction.reference_type && transaction.reference_id) {
      return `${transaction.reference_type} #${transaction.reference_id}`;
    }

    return `Inventory Transaction #${transaction.id}`;
  };

  const getLatestSaleActionRequest = (saleId: number) => {
    return myActionRequests.find((request) => request.sale_id === saleId);
  };

  const getRequestActionLabel = (value: string) => {
    switch (value) {
      case "void":
        return "Void";
      case "refund":
        return "Refund";
      default:
        return value;
    }
  };

  const getRequestActionClass = (value: string) => {
    switch (value) {
      case "void":
        return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
      case "refund":
        return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200";
    }
  };

  const getRequestStatusLabel = (value: string) => {
    switch (value) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return value;
    }
  };

  const getRequestStatusClass = (value: string) => {
    switch (value) {
      case "pending":
        return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
      case "approved":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
      case "rejected":
        return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200";
    }
  };

  const openRequestModal = (action: "void" | "refund") => {
    setRequestAction(action);
    setRequestReason("");
    setRequestError("");
    setRequestSuccess("");

    if (action === "refund" && selectedSale) {
      const quantities: Record<number, number> = {};

      selectedSale.items.forEach((item) => {
        quantities[item.id] = 0;
      });

      setRefundQuantities(quantities);
    } else {
      setRefundQuantities({});
    }
  };

  const closeRequestModal = () => {
    if (requestLoading) {
      return;
    }

    setRequestAction(null);
    setRequestReason("");
    setRequestError("");
    setRequestSuccess("");
    setRefundQuantities({});
  };

  const handleDirectAction = async (action: "void" | "refund") => {
    if (!selectedSale) {
      return;
    }

    if (action === "void") {
      const confirmed = window.confirm(
        `Are you sure you want to void sale ${selectedSale.sale_number}?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setRequestLoading(true);
        setRequestError("");
        setRequestSuccess("");

        await voidSale(selectedSale.id);

        setRequestSuccess("Sale voided successfully.");

        await loadSales();

        setTimeout(() => {
          setSelectedSale(null);
          setRequestSuccess("");
        }, 1000);
      } catch (err: any) {
        console.error(err);

        const message = err?.response?.data?.message ?? "Unable to void sale.";

        setRequestError(message);
      } finally {
        setRequestLoading(false);
      }

      return;
    }

    const refundItems = selectedSale.items
      .map((item) => {
        const requestedQuantity = Number(refundQuantities[item.id] ?? 0);
        const refundedQuantity = Number(item.refunded_quantity ?? 0);
        const remainingQuantity = Number(item.quantity) - refundedQuantity;

        return {
          sale_item_id: item.id,
          quantity: Math.min(requestedQuantity, remainingQuantity),
        };
      })
      .filter((item) => item.quantity > 0);

    if (refundItems.length === 0) {
      setRequestError("Please select at least one item to refund.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to refund the selected items from sale ${selectedSale.sale_number}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRequestLoading(true);
      setRequestError("");
      setRequestSuccess("");

      await refundSale(selectedSale.id, refundItems);

      setRequestSuccess("Refund processed successfully.");

      await loadSales();

      setTimeout(() => {
        setSelectedSale(null);
        setRequestAction(null);
        setRequestReason("");
        setRequestSuccess("");
        setRefundQuantities({});
      }, 1000);
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ?? "Unable to process refund.";

      setRequestError(message);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    if (!selectedSale || !requestAction) {
      return;
    }

    if (!requestReason.trim()) {
      setRequestError("Reason is required.");
      return;
    }

    if (requestAction === "refund") {
      const refundItems = selectedSale.items
        .map((item) => {
          const requestedQuantity = Number(refundQuantities[item.id] ?? 0);
          const refundedQuantity = Number(item.refunded_quantity ?? 0);
          const remainingQuantity = Number(item.quantity) - refundedQuantity;

          return {
            sale_item_id: item.id,
            quantity: Math.min(requestedQuantity, remainingQuantity),
          };
        })
        .filter((item) => item.quantity > 0);

      if (refundItems.length === 0) {
        setRequestError("Please select at least one item to refund.");
        return;
      }

      try {
        setRequestLoading(true);
        setRequestError("");
        setRequestSuccess("");

        await createRefundRequest(
          selectedSale.id,
          requestReason.trim(),
          refundItems,
        );

        setRequestSuccess(
          "Refund request submitted successfully. Waiting for Manager/Admin approval.",
        );

        await loadSales();
        await loadMyActionRequests();

        setTimeout(() => {
          setRequestAction(null);
          setRequestReason("");
          setRequestSuccess("");
          setRefundQuantities({});
        }, 1200);
      } catch (err: any) {
        console.error(err);

        const message =
          err?.response?.data?.message ??
          err?.response?.data?.errors?.items?.[0] ??
          err?.response?.data?.errors?.reason?.[0] ??
          "Unable to submit refund request.";

        setRequestError(message);
      } finally {
        setRequestLoading(false);
      }

      return;
    }

    try {
      setRequestLoading(true);
      setRequestError("");
      setRequestSuccess("");

      await createVoidRequest(selectedSale.id, requestReason.trim());

      setRequestSuccess(
        "Void request submitted successfully. Waiting for Manager/Admin approval.",
      );

      await loadSales();
      await loadMyActionRequests();

      setTimeout(() => {
        setRequestAction(null);
        setRequestReason("");
        setRequestSuccess("");
        setRefundQuantities({});
      }, 1200);
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.reason?.[0] ??
        "Unable to submit void request.";

      setRequestError(message);
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                    d="M3 3v18h18"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7 15 3-3 3 2 5-6"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Sales
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View completed, refunded, and voided sales transactions.
                </p>
              </div>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 border border-emerald-200"
            >
              {exportLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4Z"
                    />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
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
                      d="M12 3v12"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8 11 4 4 4-4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 21h14"
                    />
                  </svg>
                  Export Sales to Spreadsheet
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                  d="M4 6h16M7 12h10M10 18h4"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Sales Filters
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Search and filter transaction records.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            {/* Search */}
            <div className="relative lg:col-span-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4.5 w-4.5"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m20 20-4-4"
                  />
                </svg>
              </div>

              <input
                type="text"
                value={search}
                onFocus={selectAllOnFocus}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search sale, invoice, customer, cashier..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 lg:col-span-2"
            >
              <option value="">All Types</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
              <option value="voided">Voided</option>
            </select>

            {/* Payment Method */}
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 lg:col-span-2"
            >
              <option value="">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="charge">Charge</option>
            </select>

            {/* User */}
            {(user?.role === "admin" || user?.role === "manager") && (
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  );
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 lg:col-span-2"
              >
                <option value="">All Users</option>

                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}

            {/* Date Preset */}
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 lg:col-span-2"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {datePreset === "custom" && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  From
                </label>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  To
                </label>

                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
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
                  d="M3 6h18M9 6V4h6v2M8 10v7M12 10v7M16 10v7M5 6l1 15h12l1-15"
                />
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* My Requests - Cashier Only */}
      {user?.role === "cashier" && myActionRequests.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
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
                    d="M8 7h8M8 11h5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  My Requests
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Track your Void and Refund approval requests.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadMyActionRequests}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
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
                  d="M20 11a8 8 0 0 0-14.9-4M4 5v4h4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 13a8 8 0 0 0 14.9 4M20 19v-4h-4"
                />
              </svg>
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sale #
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice #
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requested
                  </th>
                </tr>
              </thead>

              <tbody>
                {myActionRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {request.sale?.sale_number ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {request.sale?.invoice_number ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRequestActionClass(
                          request.action_type,
                        )}`}
                      >
                        {getRequestActionLabel(request.action_type)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-800">
                      {formatCurrency(request.sale?.total ?? 0)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRequestStatusClass(
                          request.status,
                        )}`}
                      >
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(request.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
            {myActionRequests.some(
              (request) => request.status === "pending",
            ) && (
              <div className="flex items-start gap-3 text-sm text-amber-700">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16h.01"
                    />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>

                <p>
                  You have a pending request waiting for Manager/Admin approval.
                </p>
              </div>
            )}

            {myActionRequests.some(
              (request) => request.status === "rejected",
            ) && (
              <div className="mt-2 flex items-start gap-3 text-sm text-red-600">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m9 9 6 6M15 9l-6 6"
                    />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>

                <p>
                  Some of your requests were rejected. Check the request details
                  in the table above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Sales */}
        <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Sales</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(totalSales)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600">
              ₱
            </div>
          </div>
        </div>

        {/* Total COGS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total COGS</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(totalCogs)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
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
                  d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4 7.5 8 4.5 8-4.5M12 12v9"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Gross Profit</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                {formatCurrency(grossProfit)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
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
                  d="M3 17h18"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 14.5 9 10l3 3 7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Gross Margin */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Gross Margin</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                {Number(grossMargin).toFixed(2)}%
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
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
                  d="M7 17 17 7"
                />
                <circle cx="7.5" cy="7.5" r="2.5" />
                <circle cx="16.5" cy="16.5" r="2.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cash Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Cash Sales</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(cashSales)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Charge Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Charge Sales</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(chargeSales)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 9h10M7 13h5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Outstanding Balance
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-orange-600">
                {formatCurrency(outstandingBalance)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7v5l3 2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Transactions
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {totalTransactions.toLocaleString()}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
                  d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 8h8M8 12h8M8 16h5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Items Sold
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {totalItemsSold.toLocaleString()}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
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
                  d="m4 7 8-4 8 4-8 4-8-4Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4 12 8 4 8-4M4 17l8 4 8-4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Void */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Void</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {totalVoid.toLocaleString()}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 9 6 6M15 9l-6 6"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Refund */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Refund</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {totalRefund.toLocaleString()}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
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
                  d="M20 12a8 8 0 1 1-2.34-5.66"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 5v5h-5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Discount */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Discount
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(totalDiscount)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
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
                  d="m7 7 10 10"
                />
                <circle cx="7.5" cy="7.5" r="2.5" />
                <circle cx="16.5" cy="16.5" r="2.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Tax */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Tax</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(totalTax)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
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
                  d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 9h8M8 13h3M14 13h2M8 17h2M13 17h3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <svg
                className="h-6 w-6 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M12 3a9 9 0 0 1 9 9h-2.5a6.5 6.5 0 0 0-6.5-6.5V3Z"
                />
              </svg>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading sales...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait while the transactions are being loaded.
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
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
                  d="M12 9v4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 17h.01"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            <p className="mt-4 text-sm font-semibold text-red-700">
              Unable to load sales
            </p>

            <p className="mt-1 text-xs text-slate-400">{error}</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
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
                  d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 9h8M8 13h5"
                />
              </svg>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No sales found.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sale #
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice #
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sold By
                  </th>

                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payment Method
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    COGS
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Gross Profit
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Margin
                  </th>

                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {sale.sale_number}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-slate-600">{sale.invoice_number}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap font-medium text-slate-700">
                        {formatDate(sale.sale_date)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                          {(sale.user?.name ?? "—").charAt(0).toUpperCase()}
                        </div>

                        <span className="whitespace-nowrap text-slate-600">
                          {sale.user?.name ?? "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          sale.payment_method === "cash"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                            : "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            sale.payment_method === "cash"
                              ? "bg-emerald-500"
                              : "bg-orange-500"
                          }`}
                        />
                        {sale.payment_method === "cash" ? "Cash" : "Charge"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatCurrency(sale.total_cost ?? 0)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(sale.gross_profit ?? 0)}
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-700">
                      {Number(sale.gross_margin ?? 0).toFixed(2)}%
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          sale.status,
                        )}`}
                      >
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
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
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                          />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && lastPage > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {totalTransactions.toLocaleString()}
              </span>{" "}
              transaction
              {totalTransactions !== 1 ? "s" : ""}
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    d="m15 18-6-6 6-6"
                  />
                </svg>
                Previous
              </button>

              <span className="whitespace-nowrap rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-slate-600">
                Page{" "}
                <span className="font-semibold text-slate-900">{page}</span> of{" "}
                <span className="font-semibold text-slate-900">{lastPage}</span>
              </span>

              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    d="m9 18 6-6-6-6"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Sale Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                      d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 9h8M8 13h5"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Sale Details
                  </h2>

                  <p className="truncate text-xs text-slate-400 sm:text-sm">
                    {selectedSale.sale_number} • {selectedSale.invoice_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                disabled={requestLoading}
                aria-label="Close"
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
                    d="m7 7 10 10M17 7 7 17"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(92vh-145px)] overflow-y-auto">
              <div className="space-y-6 p-5 sm:p-6">
                {/* Sale Information */}
                <div>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Sale Information
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Basic information about this transaction.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Sale #
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedSale.sale_number}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Invoice #
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {selectedSale.invoice_number}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Date
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(selectedSale.sale_date)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Cashier
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {selectedSale.user?.name ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Type
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          selectedSale.status,
                        )}`}
                      >
                        {getStatusLabel(selectedSale.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <circle cx="12" cy="8" r="3" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 20a7 7 0 0 1 14 0"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Customer
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-slate-800">
                        {selectedSale.customer?.name ?? "Walk-in Customer"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Items
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Products included in this sale.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50/70">
                          <tr className="border-b border-slate-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Product
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Qty
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Unit Price
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Discount
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedSale.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 last:border-b-0"
                            >
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-slate-800">
                                  {item.product?.name ?? "Unknown Product"}
                                </div>

                                {item.product?.sku && (
                                  <div className="mt-0.5 text-xs text-slate-400">
                                    SKU: {item.product.sku}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-right text-slate-600">
                                {Number(item.quantity)}
                              </td>

                              <td className="px-4 py-3.5 text-right text-slate-600">
                                {formatCurrency(item.unit_price)}
                              </td>

                              <td className="px-4 py-3.5 text-right text-slate-600">
                                {formatCurrency(item.discount)}
                              </td>

                              <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* FIFO Cost Breakdown */}
                <div>
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
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
                          d="M4 7h16M4 12h16M4 17h10"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        FIFO Cost Breakdown
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Inventory cost layers used for this sale.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(selectedSale.items as SaleItemWithCosts[]).map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {item.product?.name ?? "Unknown Product"}
                          </div>

                          {item.product?.sku && (
                            <div className="mt-0.5 text-xs text-slate-400">
                              SKU: {item.product.sku}
                            </div>
                          )}
                        </div>

                        {item.costs && item.costs.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-100">
                                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Qty
                                  </th>

                                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Unit Cost
                                  </th>

                                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Total Cost
                                  </th>

                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Reference
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {item.costs.map((cost) => (
                                  <tr
                                    key={cost.id}
                                    className="border-b border-slate-100 last:border-b-0"
                                  >
                                    <td className="px-4 py-3 text-right text-slate-600">
                                      {Number(cost.quantity)}
                                    </td>

                                    <td className="px-4 py-3 text-right text-slate-600">
                                      {formatCurrency(cost.unit_cost)}
                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                      {formatCurrency(cost.total_cost)}
                                    </td>

                                    <td className="px-4 py-3 text-left text-slate-500">
                                      {getReference(cost)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="px-4 py-4 text-sm text-slate-400">
                            No FIFO cost records found.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                          d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 9h8M8 13h4"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Transaction Summary
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Financial breakdown of this sale.
                      </p>
                    </div>
                  </div>

                  <div className="ml-auto w-full max-w-md space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(selectedSale.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(selectedSale.discount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Tax</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(selectedSale.tax)}
                      </span>
                    </div>

                    <div className="my-3 border-t border-slate-200" />

                    <div className="flex justify-between gap-4 text-base">
                      <span className="font-semibold text-slate-800">
                        Total
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(selectedSale.total)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">COGS</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(selectedSale.total_cost ?? 0)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="font-medium text-emerald-600">
                        Gross Profit
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(selectedSale.gross_profit ?? 0)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Gross Margin</span>
                      <span className="font-semibold text-slate-700">
                        {Number(selectedSale.gross_margin ?? 0).toFixed(2)}%
                      </span>
                    </div>

                    <div className="my-3 border-t border-slate-200" />

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Amount Paid</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(selectedSale.amount_paid)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Change</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(selectedSale.change_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedSale.notes && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
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
                            d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 9h8M8 13h6"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Notes
                        </p>

                        <p className="mt-1 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                          {selectedSale.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {/* Cashier - Request Approval */}
                {user?.role === "cashier" &&
                  selectedSale.status === "completed" &&
                  (() => {
                    const actionRequest = getLatestSaleActionRequest(
                      selectedSale.id,
                    );

                    if (actionRequest?.status === "pending") {
                      return (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          {actionRequest.action_type === "void"
                            ? "Void Request Pending"
                            : "Refund Request Pending"}
                        </span>
                      );
                    }

                    if (actionRequest?.status === "rejected") {
                      return (
                        <>
                          <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Request Rejected
                          </span>

                          <button
                            type="button"
                            onClick={() => openRequestModal("void")}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m9 9 6 6M15 9l-6 6"
                              />
                            </svg>
                            Void
                          </button>

                          <button
                            type="button"
                            onClick={() => openRequestModal("refund")}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
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
                                d="M20 12a8 8 0 1 1-2.34-5.66"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 5v5h-5"
                              />
                            </svg>
                            Refund
                          </button>
                        </>
                      );
                    }

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => openRequestModal("void")}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m9 9 6 6M15 9l-6 6"
                            />
                          </svg>
                          Void
                        </button>

                        <button
                          type="button"
                          onClick={() => openRequestModal("refund")}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
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
                              d="M20 12a8 8 0 1 1-2.34-5.66"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M20 5v5h-5"
                            />
                          </svg>
                          Refund
                        </button>
                      </>
                    );
                  })()}

                {/* Manager/Admin - Direct Actions */}
                {(user?.role === "admin" || user?.role === "manager") &&
                  selectedSale.status === "completed" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDirectAction("void")}
                        disabled={requestLoading}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m9 9 6 6M15 9l-6 6"
                          />
                        </svg>
                        Void
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestAction("refund");
                          setRequestReason("");
                          setRequestError("");
                          setRequestSuccess("");

                          const quantities: Record<number, number> = {};

                          selectedSale.items.forEach((item) => {
                            quantities[item.id] = 0;
                          });

                          setRefundQuantities(quantities);
                        }}
                        disabled={requestLoading}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                            d="M20 12a8 8 0 1 1-2.34-5.66"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 5v5h-5"
                          />
                        </svg>
                        Refund
                      </button>
                    </>
                  )}

                {requestSuccess && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
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
                        d="m5 12 4 4L19 6"
                      />
                    </svg>
                    {requestSuccess}
                  </span>
                )}

                {requestError && !requestAction && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200">
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
                        d="M12 9v4"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 17h.01"
                      />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    {requestError}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                disabled={requestLoading}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void / Refund Modal */}
      {selectedSale && requestAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    requestAction === "void"
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {requestAction === "void" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m9 9 6 6M15 9l-6 6"
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
                        d="M20 12a8 8 0 1 1-2.34-5.66"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 5v5h-5"
                      />
                    </svg>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    {user?.role === "cashier"
                      ? requestAction === "void"
                        ? "Request Void Approval"
                        : "Request Refund Approval"
                      : requestAction === "void"
                        ? "Void Sale"
                        : "Refund Sale"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    {user?.role === "cashier"
                      ? "Submit this request to a Manager or Admin for approval."
                      : requestAction === "void"
                        ? "Confirm that you want to void this completed sale."
                        : "Select the items and quantities to refund."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRequestModal}
                disabled={requestLoading}
                aria-label="Close"
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
                    d="m7 7 10 10M17 7 7 17"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(92vh-145px)] overflow-y-auto">
              <div className="space-y-5 p-5 sm:p-6">
                {/* Transaction Summary */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Sale #
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedSale.sale_number}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Amount
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(selectedSale.total)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Action
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        requestAction === "void"
                          ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
                      }`}
                    >
                      {requestAction === "void" ? "Void" : "Refund"}
                    </span>
                  </div>
                </div>

                {/* Refund Items */}
                {requestAction === "refund" && (
                  <div>
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
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
                            d="M20 12a8 8 0 1 1-2.34-5.66"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 5v5h-5"
                          />
                        </svg>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Items to Refund
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Enter the quantity to refund for each item.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full text-sm">
                          <thead className="bg-slate-50/70">
                            <tr className="border-b border-slate-100">
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Product
                              </th>

                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Sold
                              </th>

                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Refunded
                              </th>

                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Remaining
                              </th>

                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Refund Qty
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {selectedSale.items.map((item) => {
                              const soldQuantity = Number(item.quantity);
                              const refundedQuantity = Number(
                                item.refunded_quantity ?? 0,
                              );
                              const remainingQuantity = Math.max(
                                0,
                                soldQuantity - refundedQuantity,
                              );

                              const refundQuantity = Number(
                                refundQuantities[item.id] ?? 0,
                              );

                              return (
                                <tr
                                  key={item.id}
                                  className="border-b border-slate-100 last:border-b-0"
                                >
                                  <td className="px-4 py-3.5">
                                    <div className="font-semibold text-slate-800">
                                      {item.product?.name ?? "Unknown Product"}
                                    </div>

                                    {item.product?.sku && (
                                      <div className="mt-0.5 text-xs text-slate-400">
                                        SKU: {item.product.sku}
                                      </div>
                                    )}
                                  </td>

                                  <td className="px-4 py-3.5 text-right text-slate-600">
                                    {soldQuantity}
                                  </td>

                                  <td className="px-4 py-3.5 text-right text-slate-500">
                                    {refundedQuantity}
                                  </td>

                                  <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                                    {remainingQuantity}
                                  </td>

                                  <td className="px-4 py-3.5 text-right">
                                    {remainingQuantity > 0 ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max={remainingQuantity}
                                        step="0.001"
                                        value={refundQuantity}
                                        onFocus={selectAllOnFocus}
                                        onChange={(e) => {
                                          const value = Number(e.target.value);

                                          setRefundQuantities((current) => ({
                                            ...current,
                                            [item.id]: Math.max(
                                              0,
                                              Math.min(
                                                value || 0,
                                                remainingQuantity,
                                              ),
                                            ),
                                          }));
                                        }}
                                        disabled={requestLoading}
                                        className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-right text-sm font-medium text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
                                      />
                                    ) : (
                                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400">
                                        Fully Refunded
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason - Cashier Request Only */}
                {user?.role === "cashier" && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Reason
                      </label>

                      <span className="text-xs text-slate-400">
                        {requestReason.length}/1000
                      </span>
                    </div>

                    <textarea
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      onFocus={selectAllOnFocus}
                      rows={4}
                      maxLength={1000}
                      placeholder="Enter reason for this request..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      disabled={requestLoading}
                    />
                  </div>
                )}

                {requestError && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
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
                          d="M12 9v4"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 17h.01"
                        />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </div>

                    <p className="pt-0.5">{requestError}</p>
                  </div>
                )}

                {requestSuccess && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
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
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    </div>

                    <p className="pt-0.5">{requestSuccess}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeRequestModal}
                disabled={requestLoading}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {user?.role === "cashier" ? (
                <button
                  type="button"
                  onClick={handleRequestSubmit}
                  disabled={
                    requestLoading ||
                    !requestReason.trim() ||
                    (requestAction === "refund" &&
                      !Object.values(refundQuantities).some(
                        (quantity) => Number(quantity) > 0,
                      ))
                  }
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    requestAction === "void"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {requestLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M12 3a9 9 0 0 1 9 9h-2.5a6.5 6.5 0 0 0-6.5-6.5V3Z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
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
                          d="M12 16V4"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8 8 4-4 4 4"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 20h14"
                        />
                      </svg>
                      Request Approval
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDirectAction("refund")}
                  disabled={
                    requestLoading ||
                    !Object.values(refundQuantities).some(
                      (quantity) => Number(quantity) > 0,
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {requestLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M12 3a9 9 0 0 1 9 9h-2.5a6.5 6.5 0 0 0-6.5-6.5V3Z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
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
                          d="M20 12a8 8 0 1 1-2.34-5.66"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20 5v5h-5"
                        />
                      </svg>
                      Process Refund
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
