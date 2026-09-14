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
        <h2 className="text-lg font-semibold text-gray-900">
          Low Stock Products
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Products that need attention based on their current stock level.
        </p>
      </div>

      <div className="overflow-scroll rounded-xl border border-gray-200 bg-white shadow-sm low-stock-products-container">
        {products.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                All products are sufficiently stocked.
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No low-stock products found for the current inventory.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
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

                return (
                  <div
                    key={product.product_id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* ==================================================
                      PRODUCT
                  ================================================== */}

                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            isOutOfStock
                              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
                              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"
                          }
                        >
                          <span className="text-sm font-bold">!</span>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {product.product_name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            SKU: {product.sku}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ==================================================
                      STOCK INFORMATION
                  ================================================== */}

                    <div className="flex flex-wrap items-center gap-6">
                      {/* CURRENT STOCK */}

                      <div>
                        <p className="text-xs text-gray-500">Current Stock</p>

                        <p
                          className={
                            isOutOfStock
                              ? "mt-1 text-sm font-bold text-red-600"
                              : "mt-1 text-sm font-bold text-amber-600"
                          }
                        >
                          {formatNumber(currentStock)} {product.unit}
                        </p>
                      </div>

                      {/* MINIMUM STOCK */}

                      <div>
                        <p className="text-xs text-gray-500">Minimum</p>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatNumber(minimumStock)} {product.unit}
                        </p>
                      </div>

                      {/* STATUS */}

                      <div>
                        <span
                          className={
                            isOutOfStock
                              ? "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                              : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                          }
                        >
                          {isOutOfStock ? "Out of Stock" : "Low Stock"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </section>
  );
}
