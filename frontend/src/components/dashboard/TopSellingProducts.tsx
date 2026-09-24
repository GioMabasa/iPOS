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
      {/* ==========================================================
          SECTION HEADER
      ========================================================== */}

      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Top Selling Products
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Best-selling products for the selected period.
        </p>
      </div>

      {/* ==========================================================
          CARD
      ========================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* CARD HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Product Performance
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Ranked by units sold
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5" />

              <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />

              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16v-4" />

              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8" />

              <path strokeLinecap="round" strokeLinejoin="round" d="M16 16V5" />
            </svg>
          </div>
        </div>

        {/* ========================================================
            CONTENT
        ======================================================== */}

        <div className="max-h-[520px] overflow-y-auto">
          {products.length === 0 ? (
            /* ======================================================
               EMPTY STATE
            ====================================================== */

            <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
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
                    d="M3 3v18h18"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16v-3"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 16V8"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 16v-5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 16v-8"
                  />
                </svg>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                No product sales
              </p>

              <p className="mt-1 text-xs text-slate-400">
                No product sales for this period.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {products.map((product, index) => {
                const quantity = Number(product.quantity_sold) || 0;

                const sales = Number(product.total_sales) || 0;

                const cogs = Number(product.total_cogs) || 0;

                const grossProfit = Number(product.gross_profit) || 0;

                const progress = Math.min(100, (quantity / maxQuantity) * 100);

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
                        {/* RANK */}

                        <div
                          className={
                            index === 0
                              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600"
                              : index === 1
                                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600"
                                : index === 2
                                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600"
                                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xs font-semibold text-slate-500"
                          }
                        >
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        {/* PRODUCT */}

                        <div className="min-w-0 pt-0.5">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {product.product_name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            SKU: {product.sku}
                          </p>
                        </div>
                      </div>

                      {/* QUANTITY */}

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tracking-tight text-slate-900">
                          {formatNumber(quantity)}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          units sold
                        </p>
                      </div>
                    </div>

                    {/* ==================================================
                        PROGRESS
                    ================================================== */}

                    <div className="mt-4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500 group-hover:bg-indigo-600"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* ==================================================
                        FINANCIAL DETAILS
                    ================================================== */}

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {/* SALES */}

                      <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Sales
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatCurrency(sales)}
                        </p>
                      </div>

                      {/* COGS */}

                      <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          COGS
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatCurrency(cogs)}
                        </p>
                      </div>

                      {/* GROSS PROFIT */}

                      <div className="rounded-xl bg-emerald-50/70 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600/70">
                          Gross Profit
                        </p>

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
      </div>
    </section>
  );
}
