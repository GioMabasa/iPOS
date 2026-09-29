import type {
  InventoryHistoryTransaction,
  InventoryTransaction,
} from "../../types/inventory";

type HistoryType = "bad_order" | "adjustment";

interface InventoryHistoryModalProps {
  open: boolean;
  historyType: HistoryType | null;

  historyTransactions: InventoryHistoryTransaction[];
  historyLoading: boolean;
  historyError: string;

  historyPage: number;
  historyLastPage: number;
  historyTotal: number;

  closeHistory: () => void;

  loadHistory: (type: HistoryType, page: number) => void | Promise<void>;

  setHistoryPage: (page: number) => void;

  formatDate: (value: string) => string;
  formatQuantity: (value: string | number) => string;
  formatCurrency: (value: string | number) => string;

  formatReference: (transaction: InventoryTransaction) => string;

  getTransactionClass: (type: InventoryTransaction["type"]) => string;

  getTransactionLabel: (type: InventoryTransaction["type"]) => string;
}

export default function InventoryHistoryModal({
  open,
  historyType,
  historyTransactions,
  historyLoading,
  historyError,
  historyPage,
  historyLastPage,
  historyTotal,
  closeHistory,
  loadHistory,
  setHistoryPage,
  formatDate,
  formatQuantity,
  formatCurrency,
  formatReference,
  getTransactionClass,
  getTransactionLabel,
}: InventoryHistoryModalProps) {
  if (!open || !historyType) {
    return null;
  }

  const title =
    historyType === "bad_order" ? "Bad Order History" : "Adjustment History";

  const description =
    historyType === "bad_order"
      ? "Review recorded bad order inventory transactions."
      : "Review recorded inventory adjustment transactions.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>

            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={closeHistory}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {historyError && (
            <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {historyError}
            </div>
          )}

          {historyLoading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <div className="text-sm text-gray-500">Loading history...</div>
            </div>
          ) : historyTransactions.length === 0 ? (
            <div className="flex items-center justify-center px-6 py-16">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  No history found.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  There are no recorded transactions for this category.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto px-6 py-5">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Date</th>

                    <th className="px-4 py-3">Product</th>

                    <th className="px-4 py-3">Type</th>

                    <th className="px-4 py-3 text-right">Quantity</th>

                    <th className="px-4 py-3 text-right">Unit Cost</th>

                    <th className="px-4 py-3">Reference</th>

                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {historyTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDate(transaction.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        {transaction.product ? (
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.product.name}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              SKU: {transaction.product.sku}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            Product unavailable
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getTransactionClass(
                            transaction.type,
                          )}`}
                        >
                          {getTransactionLabel(transaction.type)}
                        </span>
                      </td>

                      <td
                        className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                          Number(transaction.quantity) < 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {Number(transaction.quantity) > 0 ? "+" : ""}
                        {formatQuantity(transaction.quantity)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        {transaction.unit_cost !== null
                          ? formatCurrency(transaction.unit_cost)
                          : "—"}
                      </td>

                      <td className="px-4 py-4">
                        {formatReference(transaction)}
                      </td>

                      <td className="max-w-xs px-4 py-4">
                        <span
                          className="block truncate"
                          title={transaction.notes ?? ""}
                        >
                          {transaction.notes || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {historyTotal > 0
              ? `Showing page ${historyPage} of ${historyLastPage} • ${historyTotal} transaction${
                  historyTotal === 1 ? "" : "s"
                }`
              : "No transactions"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={historyPage <= 1 || historyLoading}
              onClick={() => {
                const nextPage = historyPage - 1;

                setHistoryPage(nextPage);
                loadHistory(historyType, nextPage);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="min-w-[80px] text-center text-sm font-medium text-gray-700">
              {historyPage} / {historyLastPage}
            </span>

            <button
              type="button"
              disabled={historyPage >= historyLastPage || historyLoading}
              onClick={() => {
                const nextPage = historyPage + 1;

                setHistoryPage(nextPage);
                loadHistory(historyType, nextPage);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>

            <button
              type="button"
              onClick={closeHistory}
              className="ml-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
