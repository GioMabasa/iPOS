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
      return "bg-green-100 text-green-700";

    case "partial":
      return "bg-blue-100 text-blue-700";

    case "overdue":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receivables</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage customer charge balances and payments.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, sale number, or invoice..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | Receivable["status"],
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Loading receivables...
          </div>
        ) : paginatedReceivables.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No receivables found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Invoice
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sale Date
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Due Date
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Paid
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Balance
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedReceivables.map((receivable) => (
                  <tr key={receivable.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {receivable.customer?.name ?? "-"}
                      </div>

                      {receivable.customer?.business_type && (
                        <div className="text-xs text-gray-500">
                          {receivable.customer.business_type}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="font-medium">
                        {receivable.invoice_number}
                      </div>

                      <div className="text-xs text-gray-500">
                        {receivable.sale_number}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(receivable.sale_date)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(receivable.due_date)}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(receivable.total)}
                    </td>

                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                      {formatCurrency(receivable.paid)}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(receivable.balance)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          receivable.status,
                        )}`}
                      >
                        {getStatusLabel(receivable.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(receivable.id)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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

        {!loading && filteredReceivables.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Showing{" "}
              {Math.min((page - 1) * PER_PAGE + 1, filteredReceivables.length)}{" "}
              to {Math.min(page * PER_PAGE, filteredReceivables.length)} of{" "}
              {filteredReceivables.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetails && selectedReceivable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Receivable Details
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedReceivable.invoice_number}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedReceivable(null);
                }}
                className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {detailsLoading ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading details...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-xs font-medium uppercase text-gray-500">
                        Customer
                      </div>

                      <div className="mt-1 font-medium text-gray-900">
                        {selectedReceivable.customer?.name ?? "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium uppercase text-gray-500">
                        Sale Date
                      </div>

                      <div className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedReceivable.sale_date)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium uppercase text-gray-500">
                        Due Date
                      </div>

                      <div className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedReceivable.due_date)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium uppercase text-gray-500">
                        Status
                      </div>

                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            selectedReceivable.status,
                          )}`}
                        >
                          {getStatusLabel(selectedReceivable.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-sm text-gray-500">Total</div>

                      <div className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(selectedReceivable.total)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-sm text-gray-500">Paid</div>

                      <div className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(selectedReceivable.paid)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-sm text-gray-500">Balance</div>

                      <div className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(selectedReceivable.balance)}
                      </div>
                    </div>
                  </div>

                  {Number(selectedReceivable.balance) > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={handleOpenPaymentModal}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Record Payment
                      </button>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-3 text-base font-semibold text-gray-900">
                      Payment History
                    </h3>

                    {selectedReceivable.payments.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                        No payments recorded.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Date
                              </th>

                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                                Amount
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Method
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Reference
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Received By
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-100">
                            {selectedReceivable.payments.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {formatDate(
                                    payment.payment_date.slice(0, 10),
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </td>

                                <td className="px-4 py-3 text-sm capitalize text-gray-700">
                                  {payment.payment_method}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {payment.reference_number ?? "-"}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {payment.received_by?.name ?? "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedReceivable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Record Payment
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedReceivable.invoice_number}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePaymentModal}
                disabled={paymentLoading}
                className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {paymentError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {paymentError}
                </div>
              )}

              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">Remaining Balance</div>

                  <div className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(selectedReceivable.balance)}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    disabled={paymentLoading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as "cash" | "check")
                    }
                    disabled={paymentLoading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={Number(selectedReceivable.balance)}
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    disabled={paymentLoading}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    disabled={paymentLoading}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Notes
                  </label>

                  <textarea
                    value={paymentNotes}
                    onChange={(event) => setPaymentNotes(event.target.value)}
                    disabled={paymentLoading}
                    rows={3}
                    placeholder="Optional"
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={handleClosePaymentModal}
                disabled={paymentLoading}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentLoading ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
