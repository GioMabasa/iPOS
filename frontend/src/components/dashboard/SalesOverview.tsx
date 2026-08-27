import type { SalesSummary } from "../../types/report";

interface SalesOverviewProps {
  sales: SalesSummary;
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

export default function SalesOverview({ sales }: SalesOverviewProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>

        <p className="mt-1 text-sm text-gray-500">
          Sales performance for the selected period.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL SALES */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Sales</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(sales.total_sales)}
          </p>

          <p className="mt-1 text-xs text-gray-500">Revenue generated</p>
        </div>

        {/* TRANSACTIONS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Transactions</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(sales.transaction_count)}
          </p>

          <p className="mt-1 text-xs text-gray-500">Completed sales</p>
        </div>

        {/* GROSS PROFIT */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Gross Profit</p>

          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(sales.gross_profit)}
          </p>

          <p className="mt-1 text-xs text-gray-500">Sales minus COGS</p>
        </div>

        {/* GROSS MARGIN */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Gross Margin</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {Number(sales.gross_margin).toFixed(2)}%
          </p>

          <p className="mt-1 text-xs text-gray-500">Gross profit percentage</p>
        </div>
      </div>
    </section>
  );
}
