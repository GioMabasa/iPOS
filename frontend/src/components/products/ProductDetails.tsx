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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">
                {product.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900">
                  {product.name}
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">Product Details</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="space-y-7 p-6">
            {/* ==========================================================
                BASIC INFORMATION
            ========================================================== */}

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Basic Information
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  General information about this product.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* Product Name */}

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Product Name
                    </p>

                    <p className="mt-1.5 font-semibold text-gray-900">
                      {product.name}
                    </p>
                  </div>

                  {/* Category */}

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Category
                    </p>

                    <div className="mt-1.5">
                      {product.category?.name ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No category
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 border-t border-gray-100 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* SKU */}

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      SKU
                    </p>

                    <p className="mt-1.5 font-mono text-sm text-gray-900">
                      {product.sku}
                    </p>
                  </div>

                  {/* Barcode */}

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Barcode
                    </p>

                    <p className="mt-1.5 font-mono text-sm text-gray-900">
                      {product.barcode || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 border-t border-gray-100 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* Unit */}

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Unit
                    </p>

                    <p className="mt-1.5 font-medium text-gray-900">
                      {product.unit}
                    </p>
                  </div>

                  {/* Status */}

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Status
                    </p>

                    <div className="mt-1.5">
                      <span
                        className={
                          product.is_active
                            ? "inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20"
                            : "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-500/10"
                        }
                      >
                        <span
                          className={
                            product.is_active
                              ? "h-1.5 w-1.5 rounded-full bg-green-500"
                              : "h-1.5 w-1.5 rounded-full bg-gray-400"
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
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Description
                </h3>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  {product.description || "No description."}
                </p>
              </div>
            </section>

            {/* ==========================================================
                PRICING & INVENTORY
            ========================================================== */}

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Pricing & Inventory
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Current pricing and inventory settings.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Selling Price */}

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Selling Price
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    ₱{Number(product.selling_price).toFixed(2)}
                  </p>
                </div>

                {/* Minimum Stock */}

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Minimum Stock
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    {product.minimum_stock}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">{product.unit}</p>
                </div>

                {/* Product ID */}

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Product ID
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    #{product.id}
                  </p>
                </div>
              </div>
            </section>

            {/* ==========================================================
                SUPPLIER COST HISTORY
            ========================================================== */}

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Supplier Cost History
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Historical purchase costs by supplier.
                </p>
              </div>

              {supplierCostHistory.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Supplier
                          </th>

                          <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Cost Price
                          </th>

                          <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Purchase Date
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white">
                        {supplierCostHistory.map((history, index) => (
                          <tr
                            key={`${history.supplier}-${history.purchase_date}-${index}`}
                            className="transition hover:bg-gray-50/80"
                          >
                            {/* Supplier */}

                            <td className="px-5 py-4">
                              <span className="font-medium text-gray-900">
                                {history.supplier || "-"}
                              </span>
                            </td>

                            {/* Cost Price */}

                            <td className="px-5 py-4 font-semibold text-gray-900">
                              ₱{Number(history.cost_price).toFixed(2)}
                            </td>

                            {/* Purchase Date */}

                            <td className="px-5 py-4 text-gray-600">
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
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    No supplier cost history.
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
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

        <div className="flex shrink-0 justify-end border-t border-gray-200 bg-gray-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
