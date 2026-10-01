import type {
  InventoryProduct,
  InventoryTransaction,
} from "../../types/inventory";

interface ProductDetailsModalProps {
  selectedProduct: InventoryProduct | null;

  transactions: InventoryTransaction[];
  transactionsLoading: boolean;
  transactionsError: string;

  transactionPage: number;
  transactionLastPage: number;
  transactionTotal: number;

  closeProductDetails: () => void;

  loadTransactions: (productId: number, page: number) => void | Promise<void>;

  setTransactionPage: (page: number) => void;

  formatQuantity: (value: string | number) => string;
  formatCurrency: (value: string | number) => string;
  formatDate: (value: string) => string;
  formatReference: (transaction: InventoryTransaction) => string;

  getStockStatus: (product: InventoryProduct) => {
    label: string;
    className: string;
  };

  getTransactionClass: (type: InventoryTransaction["type"]) => string;

  getTransactionLabel: (type: InventoryTransaction["type"]) => string;
}

export default function ProductDetailsModal({
  selectedProduct,

  transactions,
  transactionsLoading,
  transactionsError,

  transactionPage,
  transactionLastPage,
  transactionTotal,

  closeProductDetails,

  loadTransactions,
  setTransactionPage,

  formatQuantity,
  formatCurrency,
  formatDate,
  formatReference,

  getStockStatus,
  getTransactionClass,
  getTransactionLabel,
}: ProductDetailsModalProps) {
  if (!selectedProduct) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 7.5 12 3.75l7.5 3.75L12 11.25 4.5 7.5Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 7.5v9l7.5 4.5 7.5-4.5v-9M8.25 9.375l7.5-3.75"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Inventory Details
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                {selectedProduct.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeProductDetails}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6 6 18"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-140px)] space-y-6 overflow-y-auto p-5 sm:p-6">
          {/* Product Information */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Product
              </p>

              <p className="mt-1.5 font-semibold text-slate-800">
                {selectedProduct.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                SKU
              </p>

              <p className="mt-1.5 font-semibold text-slate-800">
                {selectedProduct.sku || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Current Stock
              </p>

              <p className="mt-1.5 font-semibold text-slate-800">
                {formatQuantity(selectedProduct.stock)} {selectedProduct.unit}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  getStockStatus(selectedProduct).className
                }`}
              >
                {getStockStatus(selectedProduct).label}
              </span>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Transaction History
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Inventory movements for this product.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadTransactions(selectedProduct.product_id, transactionPage)
                }
                disabled={transactionsLoading}
                className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 12a8.25 8.25 0 1 1-2.418-5.832"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 4.5v5.25H15"
                  />
                </svg>

                {transactionsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {transactionsError && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="mt-0.5 h-5 w-5 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3.75 21 19.5H3L12 3.75Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4.5M12 16.5h.007"
                  />
                </svg>

                <span>{transactionsError}</span>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200">
              {transactionsLoading ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                  <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                  <p className="text-sm font-medium text-slate-600">
                    Loading transactions...
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
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
                        d="M5.25 5.25h13.5A1.25 1.25 0 0 1 20 6.5v11A1.25 1.25 0 0 1 18.75 18.75H5.25A1.25 1.25 0 0 1 4 17.5v-11a1.25 1.25 0 0 1 1.25-1.25Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 9h8M8 12h8M8 15h5"
                      />
                    </svg>
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    No inventory transactions found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] text-sm">
                    <thead className="bg-slate-50/80">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Type
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Qty
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Unit Cost
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reference
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((transaction) => {
                        const quantity = Number(transaction.quantity);

                        const displayQuantity =
                          transaction.type === "bad_order"
                            ? -Math.abs(quantity)
                            : quantity;

                        const quantityText =
                          displayQuantity > 0
                            ? `+${formatQuantity(Math.abs(displayQuantity))}`
                            : displayQuantity < 0
                              ? `-${formatQuantity(Math.abs(displayQuantity))}`
                              : "0";

                        const quantityClass =
                          displayQuantity > 0
                            ? "text-emerald-600"
                            : displayQuantity < 0
                              ? "text-red-600"
                              : "text-slate-500";

                        return (
                          <tr
                            key={transaction.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                              {formatDate(transaction.created_at)}
                            </td>

                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getTransactionClass(
                                  transaction.type,
                                )}`}
                              >
                                {getTransactionLabel(transaction.type)}
                              </span>
                            </td>

                            <td
                              className={`px-4 py-3.5 text-right font-semibold ${quantityClass}`}
                            >
                              {quantityText}
                            </td>

                            <td className="px-4 py-3.5 text-right text-slate-600">
                              {transaction.unit_cost == null
                                ? "—"
                                : formatCurrency(transaction.unit_cost)}
                            </td>

                            <td className="px-4 py-3.5 text-slate-600">
                              {formatReference(transaction)}
                            </td>

                            <td className="max-w-[300px] px-4 py-3.5 text-slate-600">
                              <span className="block truncate">
                                {transaction.notes || "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Transaction Pagination */}
            {!transactionsLoading && transactionLastPage > 1 && (
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  {transactionTotal} transaction
                  {transactionTotal !== 1 ? "s" : ""}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={transactionPage <= 1}
                    onClick={() => {
                      const nextPage = transactionPage - 1;

                      setTransactionPage(nextPage);

                      loadTransactions(selectedProduct.product_id, nextPage);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.5 18-6-6 6-6"
                      />
                    </svg>
                    Previous
                  </button>

                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                    Page {transactionPage} of {transactionLastPage}
                  </span>

                  <button
                    type="button"
                    disabled={transactionPage >= transactionLastPage}
                    onClick={() => {
                      const nextPage = transactionPage + 1;

                      setTransactionPage(nextPage);

                      loadTransactions(selectedProduct.product_id, nextPage);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m9.5 6 6 6-6 6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={closeProductDetails}
            disabled={transactionsLoading}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
