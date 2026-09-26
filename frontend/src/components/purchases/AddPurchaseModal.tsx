import type { FormEvent } from "react";

import type { Product } from "../../types/product";
import type { PurchaseItemFormData } from "../../types/purchase";
import type { Supplier } from "../../types/supplier";

interface AddPurchaseModalProps {
  show: boolean;

  saving: boolean;

  modalError: string;
  onClearError: () => void;

  onClose: () => void;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  supplierId: number;
  onSupplierChange: (value: number) => void;

  purchaseDate: string;
  onPurchaseDateChange: (value: string) => void;

  referenceNumber: string;
  onReferenceNumberChange: (value: string) => void;

  discount: number;
  onDiscountChange: (value: number) => void;

  tax: number;
  onTaxChange: (value: number) => void;

  notes: string;
  onNotesChange: (value: string) => void;

  suppliers: Supplier[];
  loadingSuppliers: boolean;

  products: Product[];
  loadingProducts: boolean;

  items: PurchaseItemFormData[];

  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (
    index: number,
    field: keyof PurchaseItemFormData,
    value: number,
  ) => void;

  onOpenProductPicker: (index: number) => void;

  subtotal: number;
  grandTotal: number;

  getLineTotal: (item: PurchaseItemFormData) => number;
  formatCurrency: (value: number | string) => string;
}

export default function AddPurchaseModal({
  show,
  saving,
  modalError,
  onClearError,
  onClose,
  onSubmit,
  supplierId,
  onSupplierChange,
  purchaseDate,
  onPurchaseDateChange,
  referenceNumber,
  onReferenceNumberChange,
  discount,
  onDiscountChange,
  tax,
  onTaxChange,
  notes,
  onNotesChange,
  suppliers,
  loadingSuppliers,
  products,
  loadingProducts,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onOpenProductPicker,
  subtotal,
  grandTotal,
  getLineTotal,
  formatCurrency,
}: AddPurchaseModalProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5 12 3l9 4.5M4.5 9.75V18L12 21.5 19.5 18V9.75M8 5l8.5 4.25M12 12v9"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Add Purchase
              </h2>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                <p className="text-xs font-medium text-slate-500">
                  Create a purchase and receive inventory.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* MODAL ERROR */}

        {modalError && (
          <div className="mx-5 mt-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-white px-4 py-3 text-sm text-red-700 sm:mx-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.73 3h15.14a2 2 0 0 0 1.73-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <span className="pt-1">{modalError}</span>
            </div>

            <button
              type="button"
              onClick={onClearError}
              className="shrink-0 font-semibold text-red-400 transition hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* FORM */}

        <form onSubmit={onSubmit}>
          <div className="space-y-7 p-5 sm:p-6">
            {/* ====================================================
                PURCHASE INFORMATION
            ==================================================== */}

            <div>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Purchase Information
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the supplier and purchase reference details.
                  </p>
                </div>

                <div className="hidden h-px flex-1 bg-gradient-to-r from-indigo-100 via-violet-100 to-transparent sm:block" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* SUPPLIER */}

                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-white p-4">
                  <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Supplier <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={supplierId}
                    onChange={(event) =>
                      onSupplierChange(Number(event.target.value))
                    }
                    disabled={saving || loadingSuppliers}
                    className="h-10 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
                  >
                    <option value={0}>
                      {loadingSuppliers
                        ? "Loading suppliers..."
                        : "Select supplier"}
                    </option>

                    {suppliers
                      .filter((supplier) => supplier.is_active)
                      .map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* PURCHASE DATE */}

                <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-4">
                  <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-wider text-sky-600">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(event) =>
                      onPurchaseDateChange(event.target.value)
                    }
                    disabled={saving}
                    required
                    className="h-10 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
                  />
                </div>

                {/* REFERENCE */}

                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:col-span-2">
                  <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-wider text-amber-600">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(event) =>
                      onReferenceNumberChange(event.target.value)
                    }
                    disabled={saving}
                    placeholder="Supplier invoice / reference number"
                    className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* ====================================================
                ITEMS
            ==================================================== */}

            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Purchase Items
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Add products received from the supplier.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onAddItem}
                  disabled={saving || loadingProducts || products.length === 0}
                  className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 px-3 text-xs font-bold text-indigo-700 shadow-sm transition hover:from-indigo-100 hover:to-violet-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14M5 12h14"
                    />
                  </svg>
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-indigo-100 bg-white shadow-sm">
                <table className="w-full min-w-[800px]">
                  <thead className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Product
                      </th>

                      <th className="w-32 px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Quantity
                      </th>

                      <th className="w-40 px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Unit Cost
                      </th>

                      <th className="w-40 px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Total
                      </th>

                      <th className="w-24 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const selectedProduct = products.find(
                        (product) => product.id === item.product_id,
                      );

                      return (
                        <tr
                          key={index}
                          className="transition hover:bg-indigo-50/30"
                        >
                          {/* PRODUCT */}

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => onOpenProductPicker(index)}
                              disabled={
                                saving ||
                                loadingProducts ||
                                products.length === 0
                              }
                              className="group flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left outline-none transition hover:border-indigo-300 hover:bg-indigo-50/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600">
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-3.5 w-3.5"
                                  >
                                    <circle cx="11" cy="11" r="7" />
                                    <path
                                      strokeLinecap="round"
                                      d="m20 20-4-4"
                                    />
                                  </svg>
                                </div>

                                <div className="min-w-0">
                                  {selectedProduct ? (
                                    <>
                                      <p className="truncate text-sm font-semibold text-slate-900">
                                        {selectedProduct.name}
                                      </p>

                                      <p className="truncate text-[11px] text-slate-400">
                                        {selectedProduct.sku
                                          ? `SKU: ${selectedProduct.sku}`
                                          : selectedProduct.barcode
                                            ? `Barcode: ${selectedProduct.barcode}`
                                            : "Product selected"}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-slate-400">
                                      {loadingProducts
                                        ? "Loading products..."
                                        : "Add product / scan barcode"}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-indigo-600"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m9 18 6-6-6-6"
                                />
                              </svg>
                            </button>
                          </td>

                          {/* QUANTITY */}

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onFocus={(event) => event.currentTarget.select()}
                              onChange={(event) =>
                                onUpdateItem(
                                  index,
                                  "quantity",
                                  Number(event.target.value),
                                )
                              }
                              disabled={saving}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                            />
                          </td>

                          {/* UNIT COST */}

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.unit_cost}
                              onFocus={(event) => event.currentTarget.select()}
                              onChange={(event) =>
                                onUpdateItem(
                                  index,
                                  "unit_cost",
                                  Number(event.target.value),
                                )
                              }
                              disabled={saving}
                              className={`h-10 w-full rounded-xl border bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:ring-2 disabled:bg-slate-50 ${
                                item.unit_cost <= 0
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                              }`}
                            />
                          </td>

                          {/* LINE TOTAL */}

                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                              ₱{formatCurrency(getLineTotal(item))}
                            </span>
                          </td>

                          {/* REMOVE */}

                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => onRemoveItem(index)}
                              disabled={saving || items.length === 1}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Search products by name, SKU, or barcode. USB barcode scanners
                can be used directly in the product picker.
              </p>
            </div>

            {/* ====================================================
                TOTALS + NOTES
            ==================================================== */}

            <div className="grid gap-5 lg:grid-cols-2">
              {/* NOTES */}

              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Notes</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Add any optional notes for this purchase.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-4">
                  <textarea
                    value={notes}
                    onChange={(event) => onNotesChange(event.target.value)}
                    disabled={saving}
                    rows={6}
                    placeholder="Optional notes..."
                    className="w-full resize-none rounded-xl border border-sky-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* TOTALS */}

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50/60 to-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 4h12M6 8h12M8 12h8M9 16h6M5 20h14"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Purchase Summary
                    </p>

                    <p className="text-xs text-slate-500">
                      Review the final purchase amount.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>

                    <span className="font-semibold text-slate-800">
                      ₱{formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <label
                      htmlFor="purchase-discount"
                      className="text-slate-500"
                    >
                      Discount
                    </label>

                    <input
                      id="purchase-discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) =>
                        onDiscountChange(
                          Math.max(0, Number(event.target.value)),
                        )
                      }
                      disabled={saving}
                      className="h-9 w-32 rounded-xl border border-indigo-100 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <label htmlFor="purchase-tax" className="text-slate-500">
                      Tax
                    </label>

                    <input
                      id="purchase-tax"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tax}
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) =>
                        onTaxChange(Math.max(0, Number(event.target.value)))
                      }
                      disabled={saving}
                      className="h-9 w-32 rounded-xl border border-indigo-100 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div className="my-4 h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        Total Purchase
                      </p>

                      <p className="mt-1 text-2xl font-extrabold tracking-tight text-indigo-600">
                        ₱{formatCurrency(grandTotal)}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <rect x="3" y="6" width="18" height="12" rx="2"></rect>
                        <circle cx="12" cy="12" r="2.5"></circle>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-white/95 p-5 backdrop-blur-md sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingProducts ||
                loadingSuppliers ||
                !supplierId ||
                items.length === 0 ||
                products.length === 0 ||
                suppliers.length === 0 ||
                items.some((item) => item.unit_cost <= 0)
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12.5 9.5 17 19 7.5"
                    />
                  </svg>
                  Receive Purchase
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
