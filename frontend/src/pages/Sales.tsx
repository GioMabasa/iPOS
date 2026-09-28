import { useEffect, useState } from "react";
import type { Sale } from "../types/sale";
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

import SalesHeader from "../components/sales/SalesHeader";
import SalesFilters from "../components/sales/SalesFilters";
import SalesSummaryCards from "../components/sales/SalesSummaryCards";
import MyRequestsCashierOnly from "../components/sales/MyRequestsCashierOnly";
import SaleDetailsModal from "../components/sales/SaleDetailsModal";
import RequestActionModal from "../components/sales/RequestActionModal";
import SalesTable from "../components/sales/SalesTable";

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

export default function Sales() {
  const { user } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);

  const [totalExpense, setTotalExpense] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  const handleOpenMyRequests = async () => {
    await loadMyActionRequests();
    setShowMyRequests(true);
  };

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
  const [perPage, setPerPage] = useState(10);

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

  const pendingRequestCount = myActionRequests.filter(
    (request) => request.status === "pending",
  ).length;

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
      setPerPage(response.pagination.per_page);

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

      // Total Expense is business-level and follows the selected date range.
      const expense = response.summary.total_expense ?? 0;
      setTotalExpense(expense);

      // Net Profit is business-level.
      // It comes directly from the backend and is independent of:
      // - User/Cashier filter
      // - Search filter
      // - Status filter
      // - Payment Method filter
      //
      // The selected date range is still respected by the backend.
      setNetProfit(response.summary.net_profit ?? 0);
    } catch (err) {
      console.error(err);
      setError("Unable to load sales.");
    } finally {
      setLoading(false);
    }
  };

  const from = totalTransactions > 0 ? (page - 1) * perPage + 1 : 0;

  const to = Math.min(page * perPage, totalTransactions);

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
    setDatePreset("today");
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

      <SalesHeader
        user={user}
        handleExport={handleExport}
        exportLoading={exportLoading}
      />

      {/* Filters */}
      <SalesFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        users={users}
        datePreset={datePreset}
        handleDatePresetChange={handleDatePresetChange}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        setPage={setPage}
        clearFilters={clearFilters}
        selectAllOnFocus={selectAllOnFocus}
        user={user}
        onViewMyRequests={handleOpenMyRequests}
        pendingRequestCount={pendingRequestCount}
      />

      {/* My Requests - Cashier Only */}
      {user?.role === "cashier" && showMyRequests && (
        <MyRequestsCashierOnly
          myActionRequests={myActionRequests}
          getRequestActionClass={getRequestActionClass}
          getRequestActionLabel={getRequestActionLabel}
          formatCurrency={formatCurrency}
          getRequestStatusClass={getRequestStatusClass}
          getRequestStatusLabel={getRequestStatusLabel}
          formatDate={formatDate}
          onClose={() => setShowMyRequests(false)}
        />
      )}

      {/* Summary Cards */}
      <SalesSummaryCards
        user={user}
        totalSales={totalSales}
        totalCogs={totalCogs}
        grossProfit={grossProfit}
        grossMargin={grossMargin}
        cashSales={cashSales}
        chargeSales={chargeSales}
        outstandingBalance={outstandingBalance}
        totalTransactions={totalTransactions}
        totalItemsSold={totalItemsSold}
        totalVoid={totalVoid}
        totalRefund={totalRefund}
        totalDiscount={totalDiscount}
        totalTax={totalTax}
        formatCurrency={formatCurrency}
        totalExpense={totalExpense}
        netProfit={netProfit}
      />

      {/* Sales Table */}
      <SalesTable
        sales={sales}
        loading={loading}
        error={error}
        page={page}
        lastPage={lastPage}
        totalTransactions={totalTransactions}
        from={from}
        to={to}
        setSelectedSale={setSelectedSale}
        setPage={setPage}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusClass={getStatusClass}
        getStatusLabel={getStatusLabel}
      />

      {/* View Sale Modal */}
      <SaleDetailsModal
        selectedSale={selectedSale}
        user={user}
        requestLoading={requestLoading}
        requestAction={requestAction}
        requestSuccess={requestSuccess}
        requestError={requestError}
        refundQuantities={refundQuantities}
        setRefundQuantities={setRefundQuantities}
        setRequestAction={setRequestAction}
        setRequestReason={setRequestReason}
        setRequestError={setRequestError}
        setRequestSuccess={setRequestSuccess}
        setSelectedSale={setSelectedSale}
        getStatusClass={getStatusClass}
        getStatusLabel={getStatusLabel}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getReference={getReference}
        getLatestSaleActionRequest={getLatestSaleActionRequest}
        openRequestModal={openRequestModal}
        handleDirectAction={handleDirectAction}
      />

      {/* Void / Refund Modal */}
      <RequestActionModal
        selectedSale={selectedSale}
        requestAction={requestAction}
        user={user}
        requestReason={requestReason}
        requestLoading={requestLoading}
        requestError={requestError}
        requestSuccess={requestSuccess}
        refundQuantities={refundQuantities}
        setRefundQuantities={setRefundQuantities}
        setRequestReason={setRequestReason}
        closeRequestModal={closeRequestModal}
        handleRequestSubmit={handleRequestSubmit}
        handleDirectAction={handleDirectAction}
        selectAllOnFocus={selectAllOnFocus}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
