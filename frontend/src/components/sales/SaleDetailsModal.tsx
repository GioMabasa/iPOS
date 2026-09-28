import type { Dispatch, SetStateAction } from "react";
import type { Sale, SaleItem } from "../../types/sale";
import type { SaleActionRequest } from "../../types/saleActionRequest";

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

interface SaleDetailsModalProps {
  selectedSale: Sale | null;
  user: { role?: string } | null;

  requestLoading: boolean;
  requestAction: "void" | "refund" | null;
  requestSuccess: string;
  requestError: string;

  refundQuantities: Record<number, number>;
  setRefundQuantities: Dispatch<SetStateAction<Record<number, number>>>;

  setRequestAction: Dispatch<SetStateAction<"void" | "refund" | null>>;
  setRequestReason: Dispatch<SetStateAction<string>>;
  setRequestError: Dispatch<SetStateAction<string>>;
  setRequestSuccess: Dispatch<SetStateAction<string>>;
  setSelectedSale: Dispatch<SetStateAction<Sale | null>>;

  getStatusClass: (value: string) => string;
  getStatusLabel: (value: string) => string;
  formatDate: (value: string) => string;
  formatCurrency: (value: number | string) => string;
  getReference: (cost: SaleCost) => string;

  getLatestSaleActionRequest: (saleId: number) => SaleActionRequest | undefined;

  openRequestModal: (action: "void" | "refund") => void;
  handleDirectAction: (action: "void" | "refund") => Promise<void>;
}

export default function SaleDetailsModal({
  selectedSale,
  user,
  requestLoading,
  requestAction,
  requestSuccess,
  requestError,
  refundQuantities,
  setRefundQuantities,
  setRequestAction,
  setRequestReason,
  setRequestError,
  setRequestSuccess,
  setSelectedSale,
  getStatusClass,
  getStatusLabel,
  formatDate,
  formatCurrency,
  getReference,
  getLatestSaleActionRequest,
  openRequestModal,
  handleDirectAction,
}: SaleDetailsModalProps) {
  if (!selectedSale) {
    return null;
  }

  return (
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
                <h3 className="text-sm font-semibold text-slate-800">Items</h3>
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
                  <span className="font-semibold text-slate-800">Total</span>
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
  );
}
