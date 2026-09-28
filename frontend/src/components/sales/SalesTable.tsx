import type { Sale } from "../../types/sale";
import SalesPagination from "./SalesPagination";

interface SalesTableProps {
  sales: Sale[];
  loading: boolean;
  error: string;

  page: number;
  lastPage: number;
  totalTransactions: number;
  from: number;
  to: number;

  setSelectedSale: (sale: Sale) => void;
  setPage: (page: number) => void;

  formatDate: (value: string) => string;
  formatCurrency: (value: number | string) => string;
  getStatusClass: (value: string) => string;
  getStatusLabel: (value: string) => string;
}

export default function SalesTable({
  sales,
  loading,
  error,
  page,
  lastPage,
  totalTransactions,
  from,
  to,
  setSelectedSale,
  setPage,
  formatDate,
  formatCurrency,
  getStatusClass,
  getStatusLabel,
}: SalesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <svg
              className="h-6 w-6 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M12 3a9 9 0 0 1 9 9h-2.5a6.5 6.5 0 0 0-6.5-6.5V3Z"
              />
            </svg>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading sales...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait while the transactions are being loaded.
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
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

          <p className="mt-4 text-sm font-semibold text-red-700">
            Unable to load sales
          </p>

          <p className="mt-1 text-xs text-slate-400">{error}</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
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
                d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9h8M8 13h5"
              />
            </svg>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            No sales found.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full text-sm">
            <thead className="bg-indigo-50">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sale #
                </th>

                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invoice #
                </th>

                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sold By
                </th>

                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Method
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  COGS
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Gross Profit
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Margin
                </th>

                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelectedSale(sale)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedSale(sale);
                    }
                  }}
                  className="group cursor-pointer transition hover:bg-indigo-50/50 focus:bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-200"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {sale.sale_number}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-slate-600">{sale.invoice_number}</p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap font-medium text-slate-700">
                      {formatDate(sale.sale_date)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="whitespace-nowrap text-slate-600">
                        {sale.user?.name ?? "—"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        sale.payment_method === "cash"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          : "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          sale.payment_method === "cash"
                            ? "bg-emerald-500"
                            : "bg-orange-500"
                        }`}
                      />
                      {sale.payment_method === "cash" ? "Cash" : "Charge"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right font-semibold text-slate-900">
                    {formatCurrency(sale.total)}
                  </td>

                  <td className="px-5 py-4 text-right text-slate-600">
                    {formatCurrency(sale.total_cost ?? 0)}
                  </td>

                  <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                    {formatCurrency(sale.gross_profit ?? 0)}
                  </td>

                  <td className="px-5 py-4 text-right font-medium text-slate-700">
                    {Number(sale.gross_margin ?? 0).toFixed(2)}%
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        sale.status,
                      )}`}
                    >
                      {getStatusLabel(sale.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <SalesPagination
        page={page}
        lastPage={lastPage}
        totalTransactions={totalTransactions}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </div>
  );
}
