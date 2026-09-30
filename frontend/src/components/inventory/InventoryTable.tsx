import type { InventoryProduct } from "../../types/inventory";

interface InventoryTableProps {
  inventory: InventoryProduct[];
  loading: boolean;
  total: number;
  from: number | null;
  to: number | null;
  currentPage: number;
  lastPage: number;
  formatQuantity: (value: string | number) => string;
  formatCurrency: (value: string | number) => string;
  getStockStatus: (product: InventoryProduct) => {
    label: string;
    className: string;
  };
  getProductStatus: (product: InventoryProduct) => {
    label: string;
    className: string;
  };
  openProductDetails: (product: InventoryProduct) => void;
  openAdjustmentModal: (product: InventoryProduct) => void;
  goToPage: (page: number) => void;
}

export default function InventoryTable({
  inventory,
  loading,
  total,
  from,
  to,
  currentPage,
  lastPage,
  formatQuantity,
  formatCurrency,
  getStockStatus,
  getProductStatus,
  openProductDetails,
  openAdjustmentModal,
  goToPage,
}: InventoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Inventory List</p>

          <p className="mt-0.5 text-xs text-slate-400">
            Current stock, pricing, supplier and product status.
          </p>
        </div>

        <div className="hidden rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500 sm:block">
          {total.toLocaleString("en-PH")} products
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading inventory...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait while the inventory is being loaded.
          </p>
        </div>
      ) : inventory.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center p-6 text-center">
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
                d="m4.5 7.5 7.5-4.125L19.5 7.5 12 11.625 4.5 7.5Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 7.5v9L12 20.625l7.5-4.125v-9"
              />
            </svg>
          </div>

          <p className="text-sm font-semibold text-slate-700">
            No inventory items found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] text-sm">
            <thead className="bg-slate-50/80">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>

                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  SKU
                </th>

                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Barcode
                </th>

                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Supplier
                </th>

                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Minimum Stock
                </th>

                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>

                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit
                </th>

                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock Value
                </th>

                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cost
                </th>

                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Selling Price
                </th>

                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock Status
                </th>

                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product Status
                </th>

                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {inventory.map((product) => {
                const stockStatus = getStockStatus(product);
                const productStatus = getProductStatus(product);

                return (
                  <tr
                    key={product.product_id}
                    onClick={() => openProductDetails(product)}
                    className="group cursor-pointer transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">
                        {product.name}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-600">
                      {product.sku || "—"}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs text-slate-500">
                      {product.barcode || "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {product.supplier || "—"}
                    </td>

                    <td className="px-4 py-4 text-right text-slate-600">
                      {formatQuantity(product.minimum_stock)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-slate-800">
                        {formatQuantity(product.stock)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {product.unit}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-slate-800">
                      {formatCurrency(product.stock_value)}
                    </td>

                    <td className="px-4 py-4 text-right text-slate-600">
                      {formatCurrency(product.cost)}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-slate-800">
                      {formatCurrency(product.selling_price)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${stockStatus.className}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${productStatus.className}`}
                      >
                        {productStatus.label}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openAdjustmentModal(product);
                          }}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-3.5 w-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 5v14M5 12h14"
                            />
                          </svg>
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {total > 0
              ? `Showing ${from}–${to} of ${total} products`
              : "No products"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
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
              Page {currentPage} of {lastPage}
            </span>

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === lastPage || loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
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
  );
}
