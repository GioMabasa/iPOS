import type { Purchase } from "../../types/purchase";

interface ViewPurchaseModalProps {
  viewPurchase: Purchase | null;
  loadingPurchase: boolean;
  onClose: () => void;
  formatCurrency: (value: number | string) => string;
}

export default function ViewPurchaseModal({
  viewPurchase,
  loadingPurchase,
  onClose,
  formatCurrency,
}: ViewPurchaseModalProps) {
  if (!viewPurchase) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl">
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
                  d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Supplier Delivery Details
              </h2>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <p className="text-xs font-medium text-slate-500">
                  {viewPurchase.purchase_number}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-7 p-5 sm:p-6">
          {/* PURCHASE INFORMATION */}

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delivery Information
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Basic information about this received purchase.
                </p>
              </div>

              <div className="hidden h-px flex-1 bg-gradient-to-r from-indigo-100 via-violet-100 to-transparent sm:block" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
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
                      d="M6 4h12v16H6z"
                    />
                    <path strokeLinecap="round" d="M9 8h6M9 12h6M9 16h3" />
                  </svg>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Delivery Number
                </p>

                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {viewPurchase.purchase_number}
                </p>
              </div>

              <div className="group rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
                  </svg>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                  Delivery Date
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-700">
                  {new Date(viewPurchase.purchase_date).toLocaleDateString(
                    "en-PH",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>

              <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
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
                      d="M4 20V9l8-5 8 5v11"
                    />
                    <path strokeLinecap="round" d="M8 20v-6h8v6M4 20h16" />
                  </svg>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                  Supplier
                </p>

                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {viewPurchase.supplier?.name || "—"}
                </p>
              </div>

              <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
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
                      d="m5 12 4 4L19 6"
                    />
                  </svg>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  Status
                </p>

                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {viewPurchase.status}
                </span>
              </div>
            </div>
          </div>

          {/* REFERENCE */}

          {viewPurchase.reference_number && (
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
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
                      d="M15 7h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3M9 17H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3"
                    />
                    <path strokeLinecap="round" d="M8 12h8" />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                    Reference Number
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {viewPurchase.reference_number}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS */}

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delivery Items
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Products included in this Delivery.
                </p>
              </div>

              <div className="hidden h-px flex-1 bg-gradient-to-r from-violet-100 via-indigo-100 to-transparent sm:block" />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[650px]">
                <thead className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Product
                    </th>

                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Quantity
                    </th>

                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Unit Cost
                    </th>

                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loadingPurchase ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                          Loading Delivery details...
                        </div>
                      </td>
                    </tr>
                  ) : viewPurchase.items && viewPurchase.items.length > 0 ? (
                    viewPurchase.items.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-indigo-50/40"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                                  d="m7 3 10 0 3 4v14H4V7l3-4Z"
                                />
                                <path
                                  strokeLinecap="round"
                                  d="M4 7h16M9 12h6M9 16h4"
                                />
                              </svg>
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {item.product?.name || "Unknown Product"}
                              </p>

                              {item.product?.sku && (
                                <p className="mt-1 text-xs font-medium text-slate-400">
                                  SKU: {item.product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
                            {item.quantity}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-medium text-slate-600">
                          ₱{formatCurrency(item.unit_cost)}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                          ₱{formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No purchase items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* NOTES + TOTALS */}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* NOTES */}

            <div>
              {viewPurchase.notes ? (
                <div className="h-full rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-white p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
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
                          d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
                        />
                        <path strokeLinecap="round" d="M8 8h8M8 12h8" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">Notes</p>

                      <p className="text-xs text-slate-500">
                        Additional purchase information
                      </p>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {viewPurchase.notes}
                  </p>
                </div>
              ) : (
                <div className="flex h-full min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
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
                          d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
                        />
                      </svg>
                    </div>

                    <p className="text-sm font-medium text-slate-500">
                      No notes added.
                    </p>
                  </div>
                </div>
              )}
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
                    Delivery Summary
                  </p>

                  <p className="text-xs text-slate-500">Financial breakdown</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>

                  <span className="font-semibold text-slate-800">
                    ₱{formatCurrency(viewPurchase.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Discount</span>

                  <span className="font-semibold text-slate-800">
                    ₱{formatCurrency(viewPurchase.discount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tax</span>

                  <span className="font-semibold text-slate-800">
                    ₱{formatCurrency(viewPurchase.tax)}
                  </span>
                </div>

                <div className="my-4 h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent" />

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      Total Delivery
                    </p>

                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-indigo-600">
                      ₱{formatCurrency(viewPurchase.total)}
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
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 flex justify-end border-t border-slate-200/80 bg-white/95 p-5 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg active:translate-y-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
