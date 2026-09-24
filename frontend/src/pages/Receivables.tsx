import { useEffect, useMemo, useState } from "react";

import {
  createCustomerPayment,
  getReceivables,
  getReceivable,
} from "../services/receivableService";

import type {
  CreateCustomerPaymentRequest,
  Receivable,
  ReceivableDetail,
} from "../types/receivable";

const PER_PAGE = 10;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatCurrency(value: number | string): string {
  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status: Receivable["status"]): string {
  switch (status) {
    case "paid":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";

    case "partial":
      return "border border-blue-200 bg-blue-50 text-blue-700";

    case "overdue":
      return "border border-red-200 bg-red-50 text-red-700";

    default:
      return "border border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getStatusDotClass(status: Receivable["status"]): string {
  switch (status) {
    case "paid":
      return "bg-emerald-500";

    case "partial":
      return "bg-blue-500";

    case "overdue":
      return "bg-red-500";

    default:
      return "bg-amber-500";
  }
}

function getStatusLabel(status: Receivable["status"]): string {
  switch (status) {
    case "paid":
      return "Paid";

    case "partial":
      return "Partial";

    case "overdue":
      return "Overdue";

    default:
      return "Unpaid";
  }
}

/*
|--------------------------------------------------------------------------
| Icons
|--------------------------------------------------------------------------
*/

function ReceivablesIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 8h8M8 12h3M8 16h4"
      />
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-4-4" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function CreditCardIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M7 15h3" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8 12 2.5 2.5L16 9"
      />
    </svg>
  );
}

function AlertCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v4" />
      <path strokeLinecap="round" d="M12 16h.01" />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function Receivables() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Receivable["status"]
  >("all");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReceivable, setSelectedReceivable] =
    useState<ReceivableDetail | null>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "check">("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    loadReceivables();
  }, []);

  async function loadReceivables() {
    try {
      setLoading(true);
      setError("");

      const data = await getReceivables();

      setReceivables(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load receivables.");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetails(id: number) {
    try {
      setDetailsLoading(true);
      setError("");

      const data = await getReceivable(id);

      setSelectedReceivable(data);
      setShowDetails(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load receivable details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleOpenPaymentModal() {
    if (!selectedReceivable) {
      return;
    }

    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentAmount("");
    setPaymentMethod("cash");
    setReferenceNumber("");
    setPaymentNotes("");
    setPaymentError("");
    setShowPaymentModal(true);
  }

  function handleClosePaymentModal() {
    if (paymentLoading) {
      return;
    }

    setShowPaymentModal(false);
    setPaymentError("");
  }

  async function handleRecordPayment() {
    if (!selectedReceivable) {
      return;
    }

    setPaymentError("");

    const amount = Number(paymentAmount);
    const balance = Number(selectedReceivable.balance);

    if (!paymentDate) {
      setPaymentError("Payment date is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }

    if (amount > balance) {
      setPaymentError(
        "Payment amount cannot be greater than the remaining balance.",
      );
      return;
    }

    const payload: CreateCustomerPaymentRequest = {
      payment_date: paymentDate,
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || null,
      notes: paymentNotes.trim() || null,
    };

    try {
      setPaymentLoading(true);

      await createCustomerPayment(selectedReceivable.id, payload);

      const updatedReceivable = await getReceivable(selectedReceivable.id);

      setSelectedReceivable(updatedReceivable);
      setShowPaymentModal(false);

      await loadReceivables();
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to record customer payment.");
    } finally {
      setPaymentLoading(false);
    }
  }

  const filteredReceivables = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return receivables.filter((receivable) => {
      const matchesSearch =
        !searchValue ||
        receivable.sale_number.toLowerCase().includes(searchValue) ||
        receivable.invoice_number.toLowerCase().includes(searchValue) ||
        receivable.customer?.name?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || receivable.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [receivables, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReceivables.length / PER_PAGE),
  );

  const paginatedReceivables = filteredReceivables.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ReceivablesIcon className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Receivables
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer charge balances and payments.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <AlertCircleIcon className="h-5 w-5 shrink-0" />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================================================================
          FILTERS
      ================================================================ */}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-xl">
            <label
              htmlFor="receivables-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search Receivables
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon className="h-4 w-4" />
              </div>

              <input
                id="receivables-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, sale number, or invoice..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full lg:w-48">
            <label
              htmlFor="receivables-status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Status
            </label>

            <select
              id="receivables-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | Receivable["status"],
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </section>

      {/* ================================================================
          RECEIVABLE LIST
      ================================================================ */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ReceivablesIcon className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Receivable Records
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Customer charge balances and payment status.
              </p>
            </div>
          </div>

          {!loading && filteredReceivables.length > 0 && (
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
              {filteredReceivables.length} records
            </span>
          )}
        </div>

        {/* TABLE */}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

              <span>Loading receivables...</span>
            </div>
          </div>
        ) : paginatedReceivables.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <ReceivablesIcon className="h-6 w-6" />
              </div>

              <p className="text-sm font-semibold text-slate-800">
                No receivables found.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try adjusting your search or status filter.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sale Date
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due Date
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Paid
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Balance
                  </th>

                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedReceivables.map((receivable) => (
                  <tr
                    key={receivable.id}
                    className="group transition hover:bg-slate-50/70"
                  >
                    {/* CUSTOMER */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold uppercase text-indigo-600">
                          {(receivable.customer?.name ?? "-").charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {receivable.customer?.name ?? "-"}
                          </div>

                          {receivable.customer?.business_type && (
                            <div className="mt-0.5 text-xs text-slate-500">
                              {receivable.customer.business_type}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* INVOICE */}

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {receivable.invoice_number}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {receivable.sale_number}
                      </div>
                    </td>

                    {/* SALE DATE */}

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(receivable.sale_date)}
                    </td>

                    {/* DUE DATE */}

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(receivable.due_date)}
                    </td>

                    {/* TOTAL */}

                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(receivable.total)}
                    </td>

                    {/* PAID */}

                    <td className="px-5 py-4 text-right text-sm text-slate-600">
                      {formatCurrency(receivable.paid)}
                    </td>

                    {/* BALANCE */}

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(receivable.balance)}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          receivable.status,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                            receivable.status,
                          )}`}
                        />

                        {getStatusLabel(receivable.status)}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(receivable.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}

        {!loading && filteredReceivables.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  (page - 1) * PER_PAGE + 1,
                  filteredReceivables.length,
                )}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(page * PER_PAGE, filteredReceivables.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filteredReceivables.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          RECEIVABLE DETAILS MODAL
      ================================================================ */}

      {showDetails && selectedReceivable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ReceivablesIcon className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Receivable Details
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {selectedReceivable.invoice_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedReceivable(null);
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close details"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 p-5 sm:p-6">
                {detailsLoading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                      <span>Loading details...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* RECEIVABLE INFORMATION */}

                    <section>
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-900">
                          Receivable Information
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Details of the customer charge transaction.
                        </p>
                      </div>

                      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Customer
                          </div>

                          <div className="mt-1.5 font-semibold text-slate-900">
                            {selectedReceivable.customer?.name ?? "-"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Sale Date
                          </div>

                          <div className="mt-1.5 text-sm text-slate-700">
                            {formatDate(selectedReceivable.sale_date)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Due Date
                          </div>

                          <div className="mt-1.5 text-sm text-slate-700">
                            {formatDate(selectedReceivable.due_date)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Status
                          </div>

                          <div className="mt-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                selectedReceivable.status,
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                                  selectedReceivable.status,
                                )}`}
                              />

                              {getStatusLabel(selectedReceivable.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* FINANCIAL SUMMARY */}

                    <section>
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-900">
                          Payment Summary
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Current charge and payment balances.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="text-sm font-medium text-slate-500">
                            Total
                          </div>

                          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            {formatCurrency(selectedReceivable.total)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="text-sm font-medium text-slate-500">
                            Paid
                          </div>

                          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                            {formatCurrency(selectedReceivable.paid)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
                          <div className="text-sm font-medium text-indigo-600">
                            Balance
                          </div>

                          <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-700">
                            {formatCurrency(selectedReceivable.balance)}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* RECORD PAYMENT */}

                    {Number(selectedReceivable.balance) > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={handleOpenPaymentModal}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          <CreditCardIcon className="h-4 w-4" />
                          Record Payment
                        </button>
                      </div>
                    )}

                    {/* PAYMENT HISTORY */}

                    <section>
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-900">
                          Payment History
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Payments recorded against this receivable.
                        </p>
                      </div>

                      {selectedReceivable.payments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                            <CreditCardIcon className="h-5 w-5" />
                          </div>

                          <p className="text-sm font-semibold text-slate-700">
                            No payments recorded.
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Payment history will appear here once a payment is
                            recorded.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="min-w-[750px] w-full">
                            <thead className="border-b border-slate-200 bg-slate-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Date
                                </th>

                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Amount
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Method
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Reference
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Received By
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {selectedReceivable.payments.map((payment) => (
                                <tr
                                  key={payment.id}
                                  className="transition hover:bg-slate-50/70"
                                >
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {formatDate(
                                      payment.payment_date.slice(0, 10),
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                    {formatCurrency(payment.amount)}
                                  </td>

                                  <td className="px-4 py-3 text-sm capitalize text-slate-600">
                                    {payment.payment_method}
                                  </td>

                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {payment.reference_number ?? "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {payment.received_by?.name ?? "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          RECORD PAYMENT MODAL
      ================================================================ */}

      {showPaymentModal && selectedReceivable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <CreditCardIcon className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Record Payment
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {selectedReceivable.invoice_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePaymentModal}
                disabled={paymentLoading}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close payment modal"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 p-5">
                {paymentError && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />

                    <span>{paymentError}</span>
                  </div>
                )}

                {/* BALANCE */}

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    Remaining Balance
                  </div>

                  <div className="mt-1 text-2xl font-bold tracking-tight text-indigo-700">
                    {formatCurrency(selectedReceivable.balance)}
                  </div>
                </div>

                {/* PAYMENT DATE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    disabled={paymentLoading}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />
                </div>

                {/* PAYMENT METHOD */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as "cash" | "check")
                    }
                    disabled={paymentLoading}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                {/* AMOUNT */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Amount
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      ₱
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={Number(selectedReceivable.balance)}
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      disabled={paymentLoading}
                      placeholder="0.00"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* REFERENCE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    disabled={paymentLoading}
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />
                </div>

                {/* NOTES */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Notes
                  </label>

                  <textarea
                    value={paymentNotes}
                    onChange={(event) => setPaymentNotes(event.target.value)}
                    disabled={paymentLoading}
                    rows={3}
                    placeholder="Optional"
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={handleClosePaymentModal}
                disabled={paymentLoading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={
                  paymentLoading ||
                  !paymentAmount ||
                  Number(paymentAmount) <= 0 ||
                  Number(paymentAmount) > Number(selectedReceivable.balance)
                }
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4" />

                {paymentLoading ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
