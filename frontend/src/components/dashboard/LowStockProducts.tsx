import type { LowStockProduct } from "../../types/report";

interface LowStockProductsProps {
  products: LowStockProduct[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Number(value) || 0);
}

export default function LowStockProducts({ products }: LowStockProductsProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Low Stock Products
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Products that need attention based on their current stock level.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ==========================================================
            HEADER
        ========================================================== */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Stock Alerts</p>

            <p className="mt-0.5 text-xs text-slate-400">
              Products that need restocking
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17h.01"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>
        </div>

        {/* ==========================================================
            CONTENT
        ========================================================== */}

        <div className="max-h-[520px] overflow-y-auto">
          {products.filter(
            (product) =>
              product.status === "low_stock" ||
              product.status === "out_of_stock",
          ).length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
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
                    d="m5 12 4 4L19 6"
                  />
                </svg>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                All products are sufficiently stocked.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                No low-stock products found for the current inventory.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {products
                .filter(
                  (product) =>
                    product.status === "low_stock" ||
                    product.status === "out_of_stock",
                )
                .sort((a, b) => {
                  if (a.status === "low_stock" && b.status === "out_of_stock") {
                    return -1;
                  }

                  if (a.status === "out_of_stock" && b.status === "low_stock") {
                    return 1;
                  }

                  return 0;
                })
                .map((product) => {
                  const currentStock = Number(product.current_stock) || 0;

                  const minimumStock = Number(product.minimum_stock) || 0;

                  const isOutOfStock = product.status === "out_of_stock";

                  const stockPercentage =
                    minimumStock > 0
                      ? Math.min((currentStock / minimumStock) * 100, 100)
                      : 0;

                  return (
                    <div
                      key={product.product_id}
                      className="group p-5 transition hover:bg-slate-50/70"
                    >
                      {/* ==================================================
                          PRODUCT HEADER
                      ================================================== */}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={
                              isOutOfStock
                                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-bold text-red-600"
                                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600"
                            }
                          >
                            !
                          </div>

                          <div className="min-w-0 pt-0.5">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {product.product_name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>

                        <span
                          className={
                            isOutOfStock
                              ? "inline-flex shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                              : "inline-flex shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600"
                          }
                        >
                          {isOutOfStock ? "Out of Stock" : "Low Stock"}
                        </span>
                      </div>

                      {/* ==================================================
                          STOCK INFORMATION
                      ================================================== */}

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Current Stock
                          </p>

                          <p
                            className={
                              isOutOfStock
                                ? "mt-1 text-sm font-bold text-red-600"
                                : "mt-1 text-sm font-bold text-amber-600"
                            }
                          >
                            {formatNumber(currentStock)}{" "}
                            <span className="font-medium">{product.unit}</span>
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Minimum Stock
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatNumber(minimumStock)}{" "}
                            <span className="font-medium">{product.unit}</span>
                          </p>
                        </div>
                      </div>

                      {/* ==================================================
                          STOCK LEVEL
                      ================================================== */}

                      <div className="mt-4">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={
                              isOutOfStock
                                ? "h-full rounded-full bg-red-500 transition-all duration-500 group-hover:bg-red-600"
                                : "h-full rounded-full bg-amber-500 transition-all duration-500 group-hover:bg-amber-600"
                            }
                            style={{
                              width: `${stockPercentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            {Math.round(stockPercentage)}% of minimum stock
                          </p>

                          {isOutOfStock && (
                            <p className="text-xs font-medium text-red-600">
                              Reorder required
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
