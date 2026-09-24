import { useEffect, useState } from "react";

import type { SaleActionRequest } from "../types/saleActionRequest";

import {
  approveSaleActionRequest,
  getSaleActionRequests,
  rejectSaleActionRequest,
} from "../services/saleActionRequestService";

export default function ApprovalRequests() {
  const [requests, setRequests] = useState<SaleActionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | ""
  >("");

  const [actionType, setActionType] = useState<"void" | "refund" | "">("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);

  const [selectedRequest, setSelectedRequest] =
    useState<SaleActionRequest | null>(null);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveReason, setApproveReason] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSaleActionRequests({
        status: status || undefined,
        action_type: actionType || undefined,
        page,
      });

      setRequests(response.data);
      setLastPage(response.pagination.last_page);
      setTotalRequests(response.pagination.total);
    } catch (err) {
      console.error(err);
      setError("Unable to load approval requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [page, status, actionType]);

  const formatCurrency = (value: number | string) => {
    return `₱${Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getActionLabel = (value: string) => {
    switch (value) {
      case "void":
        return "Void";

      case "refund":
        return "Refund";

      default:
        return value;
    }
  };

  const getActionClass = (value: string) => {
    switch (value) {
      case "void":
        return "border-red-100 bg-red-50 text-red-700";

      case "refund":
        return "border-amber-100 bg-amber-50 text-amber-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const getStatusLabel = (value: string) => {
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

  const getStatusClass = (value: string) => {
    switch (value) {
      case "pending":
        return "border-amber-100 bg-amber-50 text-amber-700";

      case "approved":
        return "border-green-100 bg-green-50 text-green-700";

      case "rejected":
        return "border-red-100 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const getStatusDotClass = (value: string) => {
    switch (value) {
      case "pending":
        return "bg-amber-500";

      case "approved":
        return "bg-green-500";

      case "rejected":
        return "bg-red-500";

      default:
        return "bg-slate-400";
    }
  };

  const getActionDotClass = (value: string) => {
    switch (value) {
      case "void":
        return "bg-red-500";

      case "refund":
        return "bg-amber-500";

      default:
        return "bg-slate-400";
    }
  };

  const openApproveModal = (request: SaleActionRequest) => {
    setSelectedRequest(request);
    setApproveReason("");
    setShowApproveModal(true);
  };

  const openRejectModal = (request: SaleActionRequest) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) {
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      setError("");

      await approveSaleActionRequest(
        selectedRequest.id,
        approveReason.trim() || undefined,
      );

      setShowApproveModal(false);
      setSelectedRequest(null);
      setApproveReason("");

      await loadRequests();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ?? "Unable to approve the request.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) {
      return;
    }

    if (!rejectReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      setError("");

      await rejectSaleActionRequest(selectedRequest.id, rejectReason.trim());

      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason("");

      await loadRequests();
    } catch (err: any) {
      console.error(err);

      setError(err?.response?.data?.message ?? "Unable to reject the request.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
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
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Approval Requests
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and approve or reject sale void and refund requests.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-3">
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
            <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
            <p className="text-xs text-slate-500">
              Narrow down approval requests by status or action.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-xs">
            <label
              htmlFor="approval-status"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Status
            </label>

            <div className="relative">
              <select
                id="approval-status"
                value={status}
                onChange={(e) => {
                  setStatus(
                    e.target.value as "pending" | "approved" | "rejected" | "",
                  );
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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

          <div className="w-full lg:max-w-xs">
            <label
              htmlFor="approval-action"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Action Type
            </label>

            <div className="relative">
              <select
                id="approval-action"
                value={actionType}
                onChange={(e) => {
                  setActionType(e.target.value as "void" | "refund" | "");
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">All Actions</option>
                <option value="void">Void</option>
                <option value="refund">Refund</option>
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

          <button
            type="button"
            onClick={() => {
              setStatus("");
              setActionType("");
              setPage(1);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
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

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
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

      {/* Requests Table */}
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
                <path d="M8 6h13" />
                <path d="M8 12h13" />
                <path d="M8 18h13" />
                <path d="M3 6h.01" />
                <path d="M3 12h.01" />
                <path d="M3 18h.01" />
              </svg>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Approval Request List
              </h2>
              <p className="text-xs text-slate-500">
                {totalRequests} request
                {totalRequests !== 1 ? "s" : ""} in the current result set
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
              <span>Loading approval requests...</span>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M8 6h13" />
                <path d="M8 12h13" />
                <path d="M8 18h13" />
                <path d="M3 6h.01" />
                <path d="M3 12h.01" />
                <path d="M3 18h.01" />
              </svg>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No approval requests found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              There are no requests matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Sale #
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Invoice #
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Cashier
                  </th>

                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                  <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Requested
                  </th>

                  <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">
                        {request.sale?.sale_number ?? "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">
                        {request.sale?.invoice_number ?? "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                          {(request.requester?.name ?? "—")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="font-medium text-slate-800">
                          {request.requester?.name ?? "—"}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(request.sale?.total ?? 0)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionClass(
                          request.action_type,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getActionDotClass(
                            request.action_type,
                          )}`}
                        />
                        {getActionLabel(request.action_type)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          request.status,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                            request.status,
                          )}`}
                        />
                        {getStatusLabel(request.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(request.created_at)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
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
        {!loading && lastPage > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-sm text-slate-500">
              {totalRequests} request
              {totalRequests !== 1 ? "s" : ""}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
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
                Previous
              </button>

              <span className="inline-flex h-9 items-center rounded-xl bg-slate-50 px-3 text-sm font-medium text-slate-600">
                Page {page} of {lastPage}
              </span>

              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
              >
                Next
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
        )}
      </section>

      {/* View Modal */}
      {selectedRequest && !showApproveModal && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Approval Request
                  </h2>

                  <p className="text-sm text-slate-500">
                    Request #{selectedRequest.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="space-y-6">
                {/* Request Information */}
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 10v6" />
                        <path d="M12 7h.01" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Request Information
                      </h3>
                      <p className="text-xs text-slate-500">
                        Details of the selected approval request.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Sale #
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedRequest.sale?.sale_number ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Invoice #
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedRequest.sale?.invoice_number ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Cashier
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedRequest.requester?.name ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Requested
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDate(selectedRequest.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Type
                      </p>

                      <span
                        className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionClass(
                          selectedRequest.action_type,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getActionDotClass(
                            selectedRequest.action_type,
                          )}`}
                        />
                        {getActionLabel(selectedRequest.action_type)}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          selectedRequest.status,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                            selectedRequest.status,
                          )}`}
                        />
                        {getStatusLabel(selectedRequest.status)}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Amount
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatCurrency(selectedRequest.sale?.total ?? 0)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Customer
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedRequest.sale?.customer?.name ??
                          "Walk-in Customer"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Request Reason */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Request Reason
                  </h3>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {selectedRequest.reason}
                    </p>
                  </div>
                </section>

                {/* Items */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {selectedRequest.action_type === "refund"
                          ? "Refund Items"
                          : "Sale Items"}
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Review the products included in this request.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-[900px] w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Product
                          </th>

                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Qty
                          </th>

                          {selectedRequest.action_type === "refund" && (
                            <>
                              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Refunded
                              </th>

                              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Requested Refund
                              </th>
                            </>
                          )}

                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Unit Price
                          </th>

                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Discount
                          </th>

                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {selectedRequest.sale?.items?.map((item) => {
                          const refundItem = selectedRequest.refund_items?.find(
                            (refund) => refund.sale_item_id === item.id,
                          );

                          return (
                            <tr
                              key={item.id}
                              className="transition hover:bg-slate-50/70"
                            >
                              <td className="px-4 py-4">
                                <div className="font-semibold text-slate-900">
                                  {item.product?.name ?? "Unknown Product"}
                                </div>

                                {item.product?.sku && (
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    SKU: {item.product.sku}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-4 text-right text-slate-700">
                                {Number(item.quantity)}
                              </td>

                              {selectedRequest.action_type === "refund" && (
                                <>
                                  <td className="px-4 py-4 text-right text-slate-700">
                                    {Number(item.refunded_quantity ?? 0)}
                                  </td>

                                  <td className="px-4 py-4 text-right">
                                    <span className="font-semibold text-amber-700">
                                      {Number(refundItem?.quantity ?? 0)}
                                    </span>
                                  </td>
                                </>
                              )}

                              <td className="px-4 py-4 text-right text-slate-700">
                                {formatCurrency(item.unit_price)}
                              </td>

                              <td className="px-4 py-4 text-right text-slate-700">
                                {formatCurrency(item.discount)}
                              </td>

                              <td className="px-4 py-4 text-right font-semibold text-slate-900">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Rejection / Approval Information */}
                {selectedRequest.status === "rejected" &&
                  selectedRequest.approval_reason && (
                    <section>
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path d="M15 9l-6 6" />
                              <path d="M9 9l6 6" />
                            </svg>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                              Rejection Reason
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-700">
                              {selectedRequest.approval_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                {selectedRequest.status === "approved" &&
                  selectedRequest.approval_reason && (
                    <section>
                      <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path d="M8 12l2.5 2.5L16 9" />
                            </svg>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                              Approval Note
                            </p>

                            <p className="mt-1 text-sm leading-6 text-green-700">
                              {selectedRequest.approval_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedRequest.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => openApproveModal(selectedRequest)}
                      disabled={processingId === selectedRequest.id}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M5 12l4 4L19 6" />
                      </svg>
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => openRejectModal(selectedRequest)}
                      disabled={processingId === selectedRequest.id}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M6 6l12 12" />
                        <path d="M18 6L6 18" />
                      </svg>
                      Reject
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12l2.5 2.5L16 9" />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Approve Request
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  This will execute the requested{" "}
                  {getActionLabel(selectedRequest.action_type).toLowerCase()}{" "}
                  action.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">Sale #</span>

                  <span className="text-sm font-semibold text-slate-900">
                    {selectedRequest.sale?.sale_number}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                  <span className="text-sm text-slate-500">Amount</span>

                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(selectedRequest.sale?.total ?? 0)}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="approve-reason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Approval Note
                </label>

                <textarea
                  id="approve-reason"
                  value={approveReason}
                  onChange={(e) => setApproveReason(e.target.value)}
                  rows={4}
                  placeholder="Optional approval note..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveReason("");
                }}
                disabled={processingId !== null}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={processingId !== null}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M5 12l4 4L19 6" />
                </svg>

                {processingId !== null ? "Approving..." : "Approve Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15 9l-6 6" />
                  <path d="M9 9l6 6" />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Reject Request
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  A rejection reason is required.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">Sale #</span>

                  <span className="text-sm font-semibold text-slate-900">
                    {selectedRequest.sale?.sale_number}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                  <span className="text-sm text-slate-500">Amount</span>

                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(selectedRequest.sale?.total ?? 0)}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reject-reason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Rejection Reason
                </label>

                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Enter rejection reason..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={processingId !== null}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={processingId !== null}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>

                {processingId !== null ? "Rejecting..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
