import type { Dispatch, SetStateAction } from "react";
import type { Sale } from "../../types/sale";

interface RequestActionModalProps {
  selectedSale: Sale | null;
  requestAction: "void" | "refund" | null;
  user: { role?: string } | null;

  requestReason: string;
  requestLoading: boolean;
  requestError: string;
  requestSuccess: string;

  refundQuantities: Record<number, number>;

  setRefundQuantities: Dispatch<SetStateAction<Record<number, number>>>;
  setRequestReason: Dispatch<SetStateAction<string>>;

  closeRequestModal: () => void;
  handleRequestSubmit: () => Promise<void>;
  handleDirectAction: (action: "void" | "refund") => Promise<void>;

  selectAllOnFocus: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;

  formatCurrency: (value: number | string) => string;
}

export default function RequestActionModal({
  selectedSale,
  requestAction,
  user,
  requestReason,
  requestLoading,
  requestError,
  requestSuccess,
  refundQuantities,
  setRefundQuantities,
  setRequestReason,
  closeRequestModal,
  handleRequestSubmit,
  handleDirectAction,
  selectAllOnFocus,
  formatCurrency,
}: RequestActionModalProps) {
  if (!selectedSale || !requestAction) {
    return null;
  }

  return (
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
          <div className="space-y-6 p-5 sm:p-6">
            {/* Transaction Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Sale Number */}
              <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/70 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                      Sale #
                    </p>

                    <p className="mt-1.5 text-sm font-bold text-slate-900">
                      {selectedSale.sale_number}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:scale-105">
                    <span className="text-sm font-bold">#</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                      Amount
                    </p>

                    <p className="mt-1.5 text-sm font-bold text-emerald-700">
                      {formatCurrency(selectedSale.total)}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:scale-105">
                    <span className="text-sm font-bold">₱</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div
                className={`group rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  requestAction === "void"
                    ? "border-rose-100 bg-gradient-to-br from-white via-white to-rose-50/70 hover:border-rose-200"
                    : "border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/70 hover:border-amber-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wide ${
                        requestAction === "void"
                          ? "text-rose-500"
                          : "text-amber-500"
                      }`}
                    >
                      Action
                    </p>

                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        requestAction === "void"
                          ? "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200"
                          : "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          requestAction === "void"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                      />

                      {requestAction === "void" ? "Void" : "Refund"}
                    </span>
                  </div>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${
                      requestAction === "void"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    <span className="text-sm font-bold">
                      {requestAction === "void" ? "×" : "↻"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Items */}
            {requestAction === "refund" && (
              <div>
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 shadow-sm">
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
                    <p className="text-sm font-bold text-slate-900">
                      Items to Refund
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Enter the quantity to refund for each item.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full text-sm">
                      <thead className="bg-gradient-to-r from-amber-50/80 to-orange-50/60">
                        <tr className="border-b border-amber-100">
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-amber-700">
                            Product
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-amber-700">
                            Sold
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-amber-700">
                            Refunded
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-amber-700">
                            Remaining
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-amber-700">
                            Refund Qty
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
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
                              className="transition hover:bg-amber-50/30"
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

                              <td className="px-4 py-3.5 text-right">
                                <span className="font-bold text-slate-800">
                                  {remainingQuantity}
                                </span>
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
                                    className="h-10 w-24 rounded-xl border border-amber-200 bg-amber-50/40 px-3 text-right text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 disabled:bg-slate-100"
                                  />
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
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
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40 p-4 sm:p-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">
                    Reason
                  </label>

                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-500">
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
                  className="w-full resize-none rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  disabled={requestLoading}
                />
              </div>
            )}

            {requestError && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-red-50 p-4 text-sm text-rose-700 shadow-sm">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
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

                <p className="pt-1 font-medium">{requestError}</p>
              </div>
            )}

            {requestSuccess && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-sm text-emerald-700 shadow-sm">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
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

                <p className="pt-1 font-medium">{requestSuccess}</p>
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
  );
}
