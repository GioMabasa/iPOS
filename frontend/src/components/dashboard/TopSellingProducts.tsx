import type { TopSellingProduct } from "../../types/report";

interface TopSellingProductsProps {
  products: TopSellingProduct[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Number(value) || 0);
}

export default function TopSellingProducts({
  products,
}: TopSellingProductsProps) {
  const maxQuantity =
    products.length > 0
      ? Math.max(
          ...products.map((product) => Number(product.quantity_sold) || 0),
          1,
        )
      : 1;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Selling Products
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Best-selling products for the selected period.
        </p>
      </div>

      <div className="h-[520px] overflow-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
        {products.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center p-6">
            <p className="text-sm text-gray-500">
              No product sales for this period.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((product, index) => {
              const quantity = Number(product.quantity_sold) || 0;

              const sales = Number(product.total_sales) || 0;

              const cogs = Number(product.total_cogs) || 0;

              const grossProfit = Number(product.gross_profit) || 0;

              const progress = Math.min(100, (quantity / maxQuantity) * 100);

              return (
                <div
                  key={product.product_id}
                  className="p-5 transition hover:bg-gray-50"
                >
                  {/* PRODUCT HEADER */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      {/* RANK */}

                      <div
                        className={
                          index === 0
                            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700"
                            : index === 1
                              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700"
                              : index === 2
                                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700"
                                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-xs font-semibold text-gray-500"
                        }
                      >
                        #{index + 1}
                      </div>

                      {/* PRODUCT */}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {product.product_name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>

                    {/* QUANTITY */}

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatNumber(quantity)}
                      </p>

                      <p className="text-xs text-gray-500">units sold</p>
                    </div>
                  </div>

                  {/* PROGRESS */}

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  {/* FINANCIAL DETAILS */}

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* SALES */}

                    <div>
                      <p className="text-xs text-gray-500">Sales</p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(sales)}
                      </p>
                    </div>

                    {/* COGS */}

                    <div>
                      <p className="text-xs text-gray-500">COGS</p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(cogs)}
                      </p>
                    </div>

                    {/* GROSS PROFIT */}

                    <div>
                      <p className="text-xs text-gray-500">Gross Profit</p>

                      <p className="mt-1 text-sm font-semibold text-emerald-600">
                        {formatCurrency(grossProfit)}
                      </p>
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
