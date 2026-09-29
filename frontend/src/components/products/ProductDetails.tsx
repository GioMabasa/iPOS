import type { Product } from "../../types/product";

interface SupplierCostHistory {
  supplier: string | null;
  cost_price: number;
  purchase_date: string | null;
}

interface ProductDetailsProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetails({
  isOpen,
  product,
  onClose,
}: ProductDetailsProps) {
  if (!isOpen || !product) {
    return null;
  }

  const supplierCostHistory =
    (
      product as Product & {
        supplier_cost_history?: SupplierCostHistory[];
      }
    ).supplier_cost_history ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-5">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-20 w-32 rounded-full bg-indigo-200/20 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
                  {product.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {product.name}
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Product Details
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-2xl leading-none text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div className="space-y-7 p-6">
            {/* ==========================================================
                BASIC INFORMATION
            ========================================================== */}

            <section>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7 12 3 4 7m16 0-8 4-8-4m16 0v10l-8 4-8-4V7m8 4v10"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                    Basic Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    General information about this product.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* Product Name */}

                  <div className="p-5 transition hover:bg-indigo-50/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Product Name
                    </p>

                    <p className="mt-1.5 font-semibold text-slate-900">
                      {product.name}
                    </p>
                  </div>

                  {/* Category */}

                  <div className="p-5 transition hover:bg-indigo-50/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Category
                    </p>

                    <div className="mt-2">
                      {product.category?.name ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No category
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* SKU */}

                  <div className="p-5 transition hover:bg-slate-50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      SKU
                    </p>

                    <p className="mt-1.5 font-mono text-sm font-medium text-slate-800">
                      {product.sku}
                    </p>
                  </div>

                  {/* Barcode */}

                  <div className="p-5 transition hover:bg-slate-50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Barcode
                    </p>

                    <p className="mt-1.5 font-mono text-sm font-medium text-slate-800">
                      {product.barcode || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* Unit */}

                  <div className="p-5 transition hover:bg-slate-50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Unit
                    </p>

                    <p className="mt-1.5 font-semibold text-slate-900">
                      {product.unit}
                    </p>
                  </div>

                  {/* Status */}

                  <div className="p-5 transition hover:bg-slate-50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <div className="mt-2">
                      <span
                        className={
                          product.is_active
                            ? "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-500/10"
                        }
                      >
                        <span
                          className={
                            product.is_active
                              ? "h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300"
                              : "h-2 w-2 rounded-full bg-slate-400"
                          }
                        />

                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==========================================================
                DESCRIPTION
            ========================================================== */}

            <section>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 6h8M8 10h8M8 14h5m-8 6h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3Z"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                    Description
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Product description and additional information.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-indigo-50/40 p-5">
                <p className="text-sm leading-6 text-slate-600">
                  {product.description || "No description."}
                </p>
              </div>
            </section>

            {/* ==========================================================
                PRICING & INVENTORY
            ========================================================== */}

            <section>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 font-bold">
                  ₱
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                    Pricing & Inventory
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Current pricing and inventory settings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Selling Price */}

                <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                      Selling Price
                    </p>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <span className="text-sm font-bold">₱</span>
                    </div>
                  </div>

                  <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    ₱{Number(product.selling_price).toFixed(2)}
                  </p>
                </div>

                {/* Minimum Stock */}

                <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                      Minimum Stock
                    </p>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 7h16M4 12h16M4 17h16"
                        />
                      </svg>
                    </div>
                  </div>

                  <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    {product.minimum_stock}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {product.unit}
                  </p>
                </div>

                {/* Product ID */}

                <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-violet-500">
                      Product ID
                    </p>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a3 3 0 0 0 6 0M9 5h6"
                        />
                      </svg>
                    </div>
                  </div>

                  <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    #{product.id}
                  </p>
                </div>
              </div>
            </section>

            {/* ==========================================================
                SUPPLIER COST HISTORY
            ========================================================== */}

            <section>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7h18M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-7 5h6m-6 4h4"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                    Supplier Cost History
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Historical purchase costs by supplier.
                  </p>
                </div>
              </div>

              {supplierCostHistory.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40">
                        <tr>
                          <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Supplier
                          </th>

                          <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Cost Price
                          </th>

                          <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Purchase Date
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 bg-white">
                        {supplierCostHistory.map((history, index) => (
                          <tr
                            key={`${history.supplier}-${history.purchase_date}-${index}`}
                            className="transition hover:bg-indigo-50/40"
                          >
                            {/* Supplier */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                                  {(history.supplier || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <span className="font-semibold text-slate-900">
                                  {history.supplier || "-"}
                                </span>
                              </div>
                            </td>

                            {/* Cost Price */}

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                                ₱{Number(history.cost_price).toFixed(2)}
                              </span>
                            </td>

                            {/* Purchase Date */}

                            <td className="px-5 py-4 text-slate-600">
                              {history.purchase_date
                                ? new Date(
                                    `${history.purchase_date}T00:00:00`,
                                  ).toLocaleDateString("en-PH", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
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
                        d="M3 7h18M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                    </svg>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    No supplier cost history.
                  </p>

                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                    This product does not have any received purchase records
                    yet.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ============================================================
            FOOTER
        ============================================================ */}

        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
