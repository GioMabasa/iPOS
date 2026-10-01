import type { Dispatch, SetStateAction } from "react";

import type { InventoryProduct } from "../../types/inventory";

interface AdjustmentModalProps {
  open: boolean;

  adjustmentProduct: InventoryProduct | null;

  adjustmentType: "adjustment" | "bad_order";
  adjustmentDirection: "increase" | "decrease";

  adjustmentQuantity: string;
  adjustmentUnitCost: string;
  adjustmentNotes: string;

  adjustmentLoading: boolean;
  adjustmentError: string;

  setAdjustmentType: Dispatch<SetStateAction<"adjustment" | "bad_order">>;

  setAdjustmentDirection: Dispatch<SetStateAction<"increase" | "decrease">>;

  setAdjustmentQuantity: Dispatch<SetStateAction<string>>;
  setAdjustmentUnitCost: Dispatch<SetStateAction<string>>;
  setAdjustmentNotes: Dispatch<SetStateAction<string>>;

  closeAdjustmentModal: () => void;

  handleAdjustmentSubmit: () => void | Promise<void>;

  formatQuantity: (value: string | number) => string;
}

export default function AdjustmentModal({
  open,

  adjustmentProduct,

  adjustmentType,
  adjustmentDirection,

  adjustmentQuantity,
  adjustmentUnitCost,
  adjustmentNotes,

  adjustmentLoading,
  adjustmentError,

  setAdjustmentType,
  setAdjustmentDirection,
  setAdjustmentQuantity,
  setAdjustmentUnitCost,
  setAdjustmentNotes,

  closeAdjustmentModal,

  handleAdjustmentSubmit,

  formatQuantity,
}: AdjustmentModalProps) {
  const quantityValue = Number(adjustmentQuantity);
  const unitCostValue = Number(adjustmentUnitCost);

  const isQuantityValid =
    adjustmentQuantity.trim() !== "" &&
    Number.isFinite(quantityValue) &&
    quantityValue > 0;

  const isIncreasingAdjustment =
    adjustmentType === "adjustment" && adjustmentDirection === "increase";

  const isUnitCostValid =
    !isIncreasingAdjustment ||
    (adjustmentUnitCost.trim() !== "" &&
      Number.isFinite(unitCostValue) &&
      unitCostValue >= 0);

  const isFormValid =
    Boolean(adjustmentProduct) && isQuantityValid && isUnitCostValid;

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/20">
        {/* Modal Header */}
        <div className="relative overflow-hidden border-b border-indigo-100 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-5 text-white sm:px-6">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-20 h-28 w-28 rounded-full bg-fuchsia-400/20" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
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
                    d="M12 5v14M5 12h14"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Adjust Inventory
                </h2>

                <p className="mt-0.5 text-sm text-indigo-100">
                  Record a stock adjustment or bad order.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeAdjustmentModal}
              disabled={adjustmentLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                  d="M6 6l12 12M18 6 6 18"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-140px)] space-y-5 overflow-y-auto bg-slate-50/40 p-5 sm:p-6">
          {/* Error */}
          {adjustmentError && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
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
                    d="M12 3.75 21 19.5H3L12 3.75Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4.5M12 16.5h.007"
                  />
                </svg>
              </div>

              <span className="pt-1 font-medium">{adjustmentError}</span>
            </div>
          )}

          {/* Product */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">
              Product
            </label>

            {adjustmentProduct ? (
              <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/40 p-4 shadow-sm">
                <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-indigo-200/20 blur-2xl" />

                <div className="relative flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200">
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
                        d="M6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5A2.25 2.25 0 0 1 17.25 19.5H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 9h8M8 12h8M8 15h4"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800">
                      {adjustmentProduct.name}
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                      <span>
                        SKU:{" "}
                        <span className="font-semibold text-slate-700">
                          {adjustmentProduct.sku || "—"}
                        </span>
                      </span>

                      <span>
                        Barcode:{" "}
                        <span className="font-semibold text-slate-700">
                          {adjustmentProduct.barcode || "—"}
                        </span>
                      </span>

                      <span className="sm:col-span-2">
                        Current Stock:{" "}
                        <span className="font-bold text-indigo-700">
                          {formatQuantity(adjustmentProduct.stock)}{" "}
                          {adjustmentProduct.unit}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                    Locked
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 text-sm font-medium text-amber-700">
                No product selected.
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">
              Adjustment Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType("bad_order")}
                disabled={adjustmentLoading}
                className={`rounded-2xl border p-3 text-left transition ${
                  adjustmentType === "bad_order"
                    ? "border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 text-rose-700 shadow-sm ring-2 ring-rose-100"
                    : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50/50"
                }`}
              >
                <div
                  className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${
                    adjustmentType === "bad_order"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                      : "bg-rose-50 text-rose-500"
                  }`}
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
                      d="m9 14 6-6M9 8h.01M15 14h.01"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 4.5h9l3 3v9l-3 3h-9l-3-3v-9l3-3Z"
                    />
                  </svg>
                </div>

                <div className="text-sm font-bold">Bad Order</div>

                <div className="mt-1 text-xs opacity-70">
                  Deduct damaged or bad stock
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType("adjustment")}
                disabled={adjustmentLoading}
                className={`rounded-2xl border p-3 text-left transition ${
                  adjustmentType === "adjustment"
                    ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 shadow-sm ring-2 ring-indigo-100"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <div
                  className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${
                    adjustmentType === "adjustment"
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200"
                      : "bg-indigo-50 text-indigo-500"
                  }`}
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
                      d="M12 5v14M5 12h14"
                    />
                  </svg>
                </div>

                <div className="text-sm font-bold">Adjustment</div>

                <div className="mt-1 text-xs opacity-70">
                  Increase or decrease stock
                </div>
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {adjustmentType === "bad_order"
                ? "Bad Order will deduct the quantity from current stock."
                : "Adjustment can increase or decrease stock."}
            </p>
          </div>

          {/* Direction */}
          {adjustmentType === "adjustment" && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Direction
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustmentDirection("increase")}
                  disabled={adjustmentLoading}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    adjustmentDirection === "increase"
                      ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 shadow-sm ring-2 ring-emerald-100"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      adjustmentDirection === "increase"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-emerald-50 text-emerald-500"
                    }`}
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
                        d="M12 19V5M5 12l7-7 7 7"
                      />
                    </svg>
                  </div>

                  <div>
                    <div className="text-sm font-bold">Increase</div>
                    <div className="text-xs opacity-70">Add stock</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustmentDirection("decrease")}
                  disabled={adjustmentLoading}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    adjustmentDirection === "decrease"
                      ? "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm ring-2 ring-orange-100"
                      : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      adjustmentDirection === "decrease"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                        : "bg-orange-50 text-orange-500"
                    }`}
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
                        d="M12 5v14M5 12l7 7 7-7"
                      />
                    </svg>
                  </div>

                  <div>
                    <div className="text-sm font-bold">Decrease</div>
                    <div className="text-xs opacity-70">Remove stock</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                Quantity
              </label>

              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                Required
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                disabled={adjustmentLoading}
                placeholder="Enter quantity"
                className={`h-12 w-full rounded-2xl border bg-white px-4 text-base font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-4 disabled:bg-slate-100 ${
                  adjustmentQuantity.trim() === ""
                    ? "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                    : isQuantityValid
                      ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100"
                      : "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                }`}
              />
            </div>

            {adjustmentProduct && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Current Stock:
                <span className="font-bold text-indigo-700">
                  {formatQuantity(adjustmentProduct.stock)}{" "}
                  {adjustmentProduct.unit}
                </span>
              </div>
            )}
          </div>

          {/* Unit Cost */}
          {isIncreasingAdjustment && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-800">
                  Unit Cost
                </label>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                  Required
                </span>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-bold text-emerald-600">
                  ₱
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentUnitCost}
                  onChange={(e) => setAdjustmentUnitCost(e.target.value)}
                  disabled={adjustmentLoading}
                  placeholder="Enter unit cost"
                  className={`h-12 w-full rounded-2xl border bg-white pl-9 pr-4 text-base font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-4 disabled:bg-slate-100 ${
                    adjustmentUnitCost.trim() === ""
                      ? "border-amber-300 focus:border-amber-500 focus:ring-amber-100"
                      : isUnitCostValid
                        ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100"
                        : "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                  }`}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Cost per unit for the added stock. Used for FIFO and COGS.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                Reason / Notes
              </label>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                {adjustmentNotes.length}/1000
              </span>
            </div>

            <textarea
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
              disabled={adjustmentLoading}
              rows={4}
              maxLength={1000}
              placeholder="Enter reason or notes..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="hidden text-xs text-slate-400 sm:block">
            {isFormValid
              ? "Ready to save adjustment."
              : "Complete the required fields to continue."}
          </div>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={closeAdjustmentModal}
              disabled={adjustmentLoading}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAdjustmentSubmit}
              disabled={adjustmentLoading || !isFormValid}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg transition focus:outline-none focus:ring-4 ${
                adjustmentLoading || !isFormValid
                  ? "cursor-not-allowed bg-slate-300 shadow-none"
                  : "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-indigo-200 hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700 hover:shadow-indigo-300 focus:ring-indigo-100"
              }`}
            >
              {adjustmentLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {!adjustmentLoading && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12.5 9.5 17 19 7.5"
                  />
                </svg>
              )}

              {adjustmentLoading ? "Saving..." : "Save Adjustment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
