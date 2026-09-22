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
        return "bg-red-100 text-red-700";

      case "refund":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
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
        return "bg-yellow-100 text-yellow-700";

      case "approved":
        return "bg-green-100 text-green-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Approval Requests</h1>

        <p className="text-sm text-gray-500">
          Review and approve or reject sale void and refund requests.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <select
          value={status}
          onChange={(e) => {
            setStatus(
              e.target.value as "pending" | "approved" | "rejected" | "",
            );
            setPage(1);
          }}
          className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={actionType}
          onChange={(e) => {
            setActionType(e.target.value as "void" | "refund" | "");
            setPage(1);
          }}
          className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Actions</option>
          <option value="void">Void</option>
          <option value="refund">Refund</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setStatus("");
            setActionType("");
            setPage(1);
          }}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading approval requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No approval requests found.
          </div>
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
                    Cashier
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Action
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Requested
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
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

                    <td className="px-4 py-3 text-gray-600">
                      {request.requester?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(request.sale?.total ?? 0)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getActionClass(
                          request.action_type,
                        )}`}
                      >
                        {getActionLabel(request.action_type)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          request.status,
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(request.created_at)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(request)}
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
        {!loading && lastPage > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-gray-500">
              {totalRequests} request
              {totalRequests !== 1 ? "s" : ""}
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

      {/* View Modal */}
      {selectedRequest && !showApproveModal && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Approval Request
                </h2>

                <p className="text-sm text-gray-500">
                  Request #{selectedRequest.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Request Information */}
              <div>
                <h3 className="mb-3 text-base font-semibold text-gray-800">
                  Request Information
                </h3>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Sale #</p>
                    <p className="font-medium">
                      {selectedRequest.sale?.sale_number ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Invoice #</p>
                    <p className="font-medium">
                      {selectedRequest.sale?.invoice_number ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Cashier</p>
                    <p className="font-medium">
                      {selectedRequest.requester?.name ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Requested</p>
                    <p className="font-medium">
                      {formatDate(selectedRequest.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Type</p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getActionClass(
                        selectedRequest.action_type,
                      )}`}
                    >
                      {getActionLabel(selectedRequest.action_type)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Status</p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        selectedRequest.status,
                      )}`}
                    >
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(selectedRequest.sale?.total ?? 0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium">
                      {selectedRequest.sale?.customer?.name ??
                        "Walk-in Customer"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-xs text-gray-500">Request Reason</p>

                <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {selectedRequest.reason}
                </p>
              </div>

              {/* Items */}
              <div>
                <h3 className="mb-3 text-base font-semibold text-gray-800">
                  {selectedRequest.action_type === "refund"
                    ? "Refund Items"
                    : "Sale Items"}
                </h3>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>

                        <th className="px-4 py-3 text-right">Qty</th>

                        {selectedRequest.action_type === "refund" && (
                          <>
                            <th className="px-4 py-3 text-right">Refunded</th>

                            <th className="px-4 py-3 text-right">
                              Requested Refund
                            </th>
                          </>
                        )}

                        <th className="px-4 py-3 text-right">Unit Price</th>

                        <th className="px-4 py-3 text-right">Discount</th>

                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedRequest.sale?.items?.map((item) => {
                        const refundItem = selectedRequest.refund_items?.find(
                          (refund) => refund.sale_item_id === item.id,
                        );

                        return (
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

                            {selectedRequest.action_type === "refund" && (
                              <>
                                <td className="px-4 py-3 text-right">
                                  {Number(item.refunded_quantity ?? 0)}
                                </td>

                                <td className="px-4 py-3 text-right font-semibold text-yellow-700">
                                  {Number(refundItem?.quantity ?? 0)}
                                </td>
                              </>
                            )}

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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rejection / Approval Information */}
              {selectedRequest.status === "rejected" &&
                selectedRequest.approval_reason && (
                  <div>
                    <p className="text-xs text-gray-500">Rejection Reason</p>

                    <p className="mt-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {selectedRequest.approval_reason}
                    </p>
                  </div>
                )}

              {selectedRequest.status === "approved" &&
                selectedRequest.approval_reason && (
                  <div>
                    <p className="text-xs text-gray-500">Approval Note</p>

                    <p className="mt-1 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                      {selectedRequest.approval_reason}
                    </p>
                  </div>
                )}
            </div>

            <div className="flex justify-between border-t px-6 py-4">
              <div className="flex gap-2">
                {selectedRequest.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => openApproveModal(selectedRequest)}
                      disabled={processingId === selectedRequest.id}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => openRejectModal(selectedRequest)}
                      disabled={processingId === selectedRequest.id}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                Approve Request
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                This will execute the requested{" "}
                {getActionLabel(selectedRequest.action_type).toLowerCase()}{" "}
                action.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sale #</span>

                  <span className="font-medium">
                    {selectedRequest.sale?.sale_number}
                  </span>
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-gray-500">Amount</span>

                  <span className="font-medium">
                    {formatCurrency(selectedRequest.sale?.total ?? 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Approval Note
                </label>

                <textarea
                  value={approveReason}
                  onChange={(e) => setApproveReason(e.target.value)}
                  rows={4}
                  placeholder="Optional approval note..."
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveReason("");
                }}
                disabled={processingId !== null}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={processingId !== null}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId !== null ? "Approving..." : "Approve Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                Reject Request
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                A rejection reason is required.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sale #</span>

                  <span className="font-medium">
                    {selectedRequest.sale?.sale_number}
                  </span>
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-gray-500">Amount</span>

                  <span className="font-medium">
                    {formatCurrency(selectedRequest.sale?.total ?? 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Rejection Reason
                </label>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Enter rejection reason..."
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={processingId !== null}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={processingId !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId !== null ? "Rejecting..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
