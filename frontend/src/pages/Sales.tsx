import { useEffect, useRef, useState } from "react";
import type { Sale, SaleItem } from "../types/sale";
import { getSales } from "../services/saleService";
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

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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
  }, [page, status, selectedUserId, datePreset, dateFrom, dateTo, search]);

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
    setSelectedUserId("");
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
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
        return "bg-green-100 text-green-700";
      case "refunded":
        return "bg-yellow-100 text-yellow-700";
      case "voided":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
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
        return "bg-red-100 text-red-700";
      case "refund":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
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
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
        <p className="text-sm text-gray-500">
          View completed, refunded, and voided sales transactions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {totalTransactions.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Items Sold</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {totalItemsSold.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {formatCurrency(totalSales)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total COGS</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {formatCurrency(totalCogs)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Gross Profit</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrency(grossProfit)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Void</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {totalVoid.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Refund</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {totalRefund.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          value={search}
          onFocus={selectAllOnFocus}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search sale, invoice, customer, cashier..."
          className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 md:flex-1"
        />

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="voided">Voided</option>
        </select>

        {(user?.role === "admin" || user?.role === "manager") && (
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(
                e.target.value === "" ? "" : Number(e.target.value),
              );
              setPage(1);
            }}
            className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Users</option>

            {users.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={datePreset}
          onChange={(e) => handleDatePresetChange(e.target.value)}
          className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="custom">Custom</option>
        </select>

        {datePreset === "custom" && (
          <>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
          </>
        )}

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      {/* My Requests - Cashier Only */}
      {user?.role === "cashier" && myActionRequests.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                My Requests
              </h2>

              <p className="text-sm text-gray-500">
                Track your Void and Refund approval requests.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMyActionRequests}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Sale #
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Invoice #
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Type
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Requested
                  </th>
                </tr>
              </thead>

              <tbody>
                {myActionRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {request.sale?.sale_number ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {request.sale?.invoice_number ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRequestActionClass(
                          request.action_type,
                        )}`}
                      >
                        {getRequestActionLabel(request.action_type)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(request.sale?.total ?? 0)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRequestStatusClass(
                          request.status,
                        )}`}
                      >
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(request.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t px-5 py-4">
            {myActionRequests.some(
              (request) => request.status === "pending",
            ) && (
              <p className="text-sm text-yellow-700">
                You have a pending request waiting for Manager/Admin approval.
              </p>
            )}

            {myActionRequests.some(
              (request) => request.status === "rejected",
            ) && (
              <p className="mt-1 text-sm text-red-600">
                Some of your requests were rejected. Check the request details
                in the table above.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading sales...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : sales.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No sales found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Sale #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Sold By
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    COGS
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Gross Profit
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Margin
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {sale.sale_number}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {sale.invoice_number}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(sale.sale_date)}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {sale.user?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(sale.total)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatCurrency(sale.total_cost ?? 0)}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatCurrency(sale.gross_profit ?? 0)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {Number(sale.gross_margin ?? 0).toFixed(2)}%
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          sale.status,
                        )}`}
                      >
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
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
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-gray-500">
              {totalTransactions} transaction
              {totalTransactions !== 1 ? "s" : ""}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {page} of {lastPage}
              </span>

              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Sale Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Sale Details
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedSale.sale_number}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Sale Information */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div>
                  <p className="text-xs text-gray-500">Sale #</p>
                  <p className="font-medium">{selectedSale.sale_number}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Invoice #</p>
                  <p className="font-medium">{selectedSale.invoice_number}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">
                    {formatDate(selectedSale.sale_date)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Cashier</p>
                  <p className="font-medium">
                    {selectedSale.user?.name ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      selectedSale.status,
                    )}`}
                  >
                    {getStatusLabel(selectedSale.status)}
                  </span>
                </div>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedSale.customer?.name ?? "Walk-in Customer"}
                </p>
              </div>

              {/* Items */}
              <div>
                <h3 className="mb-3 text-base font-semibold text-gray-800">
                  Items
                </h3>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Discount</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedSale.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {item.product?.name ?? "Unknown Product"}
                            </div>

                            {item.product?.sku && (
                              <div className="text-xs text-gray-500">
                                SKU: {item.product.sku}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {Number(item.quantity)}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {formatCurrency(item.unit_price)}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {formatCurrency(item.discount)}
                          </td>

                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FIFO Cost Breakdown */}
              <div>
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-800">
                    FIFO Cost Breakdown
                  </h3>
                  <p className="text-xs text-gray-500">
                    Inventory cost layers used for this sale.
                  </p>
                </div>

                <div className="space-y-4">
                  {(selectedSale.items as SaleItemWithCosts[]).map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-lg border"
                    >
                      <div className="border-b bg-gray-50 px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {item.product?.name ?? "Unknown Product"}
                        </div>

                        {item.product?.sku && (
                          <div className="text-xs text-gray-500">
                            SKU: {item.product.sku}
                          </div>
                        )}
                      </div>

                      {item.costs && item.costs.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">
                                  Unit Cost
                                </th>
                                <th className="px-4 py-3 text-right">
                                  Total Cost
                                </th>
                                <th className="px-4 py-3 text-left">
                                  Reference
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {item.costs.map((cost) => (
                                <tr
                                  key={cost.id}
                                  className="border-b last:border-b-0"
                                >
                                  <td className="px-4 py-3 text-right">
                                    {Number(cost.quantity)}
                                  </td>

                                  <td className="px-4 py-3 text-right">
                                    {formatCurrency(cost.unit_cost)}
                                  </td>

                                  <td className="px-4 py-3 text-right font-medium">
                                    {formatCurrency(cost.total_cost)}
                                  </td>

                                  <td className="px-4 py-3 text-left text-gray-600">
                                    {getReference(cost)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="px-4 py-4 text-sm text-gray-500">
                          No FIFO cost records found.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span>{formatCurrency(selectedSale.discount)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(selectedSale.tax)}</span>
                  </div>

                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedSale.total)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">COGS</span>
                    <span>{formatCurrency(selectedSale.total_cost ?? 0)}</span>
                  </div>

                  <div className="flex justify-between font-medium text-green-600">
                    <span>Gross Profit</span>
                    <span>
                      {formatCurrency(selectedSale.gross_profit ?? 0)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Gross Margin</span>
                    <span>
                      {Number(selectedSale.gross_margin ?? 0).toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Amount Paid</span>
                    <span>{formatCurrency(selectedSale.amount_paid)}</span>
                  </div>

                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Change</span>
                    <span>{formatCurrency(selectedSale.change_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedSale.notes && (
                <div>
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {selectedSale.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="flex items-center gap-2">
                {user?.role === "cashier" &&
                  selectedSale.status === "completed" &&
                  (() => {
                    const actionRequest = getLatestSaleActionRequest(
                      selectedSale.id,
                    );

                    if (actionRequest?.status === "pending") {
                      return (
                        <span className="rounded-lg bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
                          {actionRequest.action_type === "void"
                            ? "Void Request Pending"
                            : "Refund Request Pending"}
                        </span>
                      );
                    }

                    if (actionRequest?.status === "rejected") {
                      return (
                        <>
                          <span className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
                            Request Rejected
                          </span>

                          <button
                            type="button"
                            onClick={() => openRequestModal("void")}
                            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Void
                          </button>

                          <button
                            type="button"
                            onClick={() => openRequestModal("refund")}
                            className="rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-50"
                          >
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
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Void
                        </button>

                        <button
                          type="button"
                          onClick={() => openRequestModal("refund")}
                          className="rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-50"
                        >
                          Refund
                        </button>
                      </>
                    );
                  })()}
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void / Refund Request Modal */}
      {selectedSale && requestAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">
                {requestAction === "void"
                  ? "Request Void Approval"
                  : "Request Refund Approval"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Submit this request to a Manager or Admin for approval.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sale #</p>
                  <p className="font-medium text-gray-800">
                    {selectedSale.sale_number}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-medium text-gray-800">
                    {formatCurrency(selectedSale.total)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-500">Action</p>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    requestAction === "void"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {requestAction === "void" ? "Void" : "Refund"}
                </span>
              </div>

              {requestAction === "refund" && (
                <div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Items to Refund
                    </p>

                    <p className="text-xs text-gray-500">
                      Enter the quantity to refund for each item.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left font-medium text-gray-600">
                            Product
                          </th>

                          <th className="px-3 py-3 text-right font-medium text-gray-600">
                            Sold
                          </th>

                          <th className="px-3 py-3 text-right font-medium text-gray-600">
                            Refunded
                          </th>

                          <th className="px-3 py-3 text-right font-medium text-gray-600">
                            Remaining
                          </th>

                          <th className="px-3 py-3 text-right font-medium text-gray-600">
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
                            <tr key={item.id} className="border-t">
                              <td className="px-3 py-3">
                                <div className="font-medium text-gray-800">
                                  {item.product?.name ?? "Unknown Product"}
                                </div>

                                {item.product?.sku && (
                                  <div className="text-xs text-gray-500">
                                    SKU: {item.product.sku}
                                  </div>
                                )}
                              </td>

                              <td className="px-3 py-3 text-right">
                                {soldQuantity}
                              </td>

                              <td className="px-3 py-3 text-right text-gray-500">
                                {refundedQuantity}
                              </td>

                              <td className="px-3 py-3 text-right font-medium">
                                {remainingQuantity}
                              </td>

                              <td className="px-3 py-3 text-right">
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
                                    className="w-24 rounded-lg border px-3 py-2 text-right text-sm outline-none focus:border-yellow-500 disabled:bg-gray-100"
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-gray-400">
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
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reason
                </label>

                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  onFocus={selectAllOnFocus}
                  rows={4}
                  maxLength={1000}
                  placeholder="Enter reason for this request..."
                  className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
                  disabled={requestLoading}
                />

                <div className="mt-1 text-right text-xs text-gray-400">
                  {requestReason.length}/1000
                </div>
              </div>

              {requestError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {requestError}
                </div>
              )}

              {requestSuccess && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                  {requestSuccess}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={closeRequestModal}
                disabled={requestLoading}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

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
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  requestAction === "void"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {requestLoading ? "Submitting..." : "Request Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
