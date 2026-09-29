import type { Product } from "../../types/product";

interface ProductTableProps {
  products: Product[];

  loading: boolean;
  error: string;

  currentPage: number;
  lastPage: number;
  total: number;
  showingFrom: number;
  showingTo: number;

  search: string;
  categoryFilter: number | "";
  statusFilter: string | boolean;

  isCashier: boolean;

  loadProducts: (page: number) => void;
  goToPage: (page: number) => void;

  handleViewProduct: (product: Product) => void;
  handleEditProduct: (product: Product) => void;
  handleAddProduct: () => void;
  handleToggleProductStatus: (product: Product) => void;
  clearFilters: () => void;
}

export default function ProductTable({
  products,
  loading,
  error,
  currentPage,
  lastPage,
  total,
  showingFrom,
  showingTo,
  search,
  categoryFilter,
  statusFilter,
  isCashier,
  loadProducts,
  goToPage,
  handleViewProduct,
  handleEditProduct,
  handleAddProduct,
  handleToggleProductStatus,
  clearFilters,
}: ProductTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {loading && (
        <div className="p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <svg
              className="h-5 w-5 animate-spin text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
              />

              <path
                className="opacity-90"
                fill="currentColor"
                d="M21 12a9 9 0 0 1-9-9v3a6 6 0 0 0 6 6h3Z"
              />
            </svg>
          </div>

          <p className="mt-3 text-sm font-medium text-gray-600">
            Loading products...
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Please wait while we retrieve your products.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => loadProducts(currentPage)}
            className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      SKU
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Barcode
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Category
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Unit
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Selling Price
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Stock
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Min. Stock
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Edit
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const stock = Number(
                      (
                        product as Product & {
                          stock?: number | string;
                        }
                      ).stock ?? 0,
                    );

                    const cashierCanEdit = isCashier && !product.is_active;

                    const canEdit = !isCashier || cashierCanEdit;

                    return (
                      <tr
                        key={product.id}
                        tabIndex={0}
                        role="button"
                        onClick={() => handleViewProduct(product)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleViewProduct(product);
                          }
                        }}
                        className="group cursor-pointer transition hover:bg-indigo-50/50 focus:bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-200"
                      >
                        {/* PRODUCT */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-500 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                              {product.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate font-semibold text-gray-900">
                                {product.name}
                              </div>

                              {product.description && (
                                <div className="mt-0.5 max-w-xs truncate text-xs text-gray-400">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU */}

                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-medium text-gray-600">
                            {product.sku}
                          </span>
                        </td>

                        {/* BARCODE */}

                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-gray-500">
                            {product.barcode || "-"}
                          </span>
                        </td>

                        {/* CATEGORY */}

                        <td className="px-5 py-4 text-gray-600">
                          {product.category?.name || "-"}
                        </td>

                        {/* UNIT */}

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {product.unit}
                          </span>
                        </td>

                        {/* SELLING PRICE */}

                        <td className="px-5 py-4">
                          <span className="font-semibold text-gray-900">
                            ₱
                            {Number(product.selling_price).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </td>

                        {/* STOCK */}

                        <td className="px-5 py-4">
                          <span
                            className={
                              stock <= Number(product.minimum_stock)
                                ? "font-semibold text-amber-600"
                                : "font-semibold text-gray-900"
                            }
                          >
                            {stock.toLocaleString("en-PH", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        {/* MINIMUM STOCK */}

                        <td className="px-5 py-4 text-gray-600">
                          {Number(product.minimum_stock).toLocaleString(
                            "en-PH",
                            {
                              maximumFractionDigits: 3,
                            },
                          )}
                        </td>

                        {/* STATUS */}

                        <td
                          className="px-5 py-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {isCashier ? (
                            <span
                              className={
                                product.is_active
                                  ? "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-green-700"
                                  : "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500"
                              }
                            >
                              <span
                                className={
                                  product.is_active
                                    ? "h-2 w-2 rounded-full bg-green-500"
                                    : "h-2 w-2 rounded-full bg-gray-400"
                                }
                              />

                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={product.is_active}
                              aria-label={`Set ${product.name} ${
                                product.is_active ? "inactive" : "active"
                              }`}
                              onClick={() => handleToggleProductStatus(product)}
                              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <span
                                className={
                                  product.is_active
                                    ? "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-green-500 transition"
                                    : "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-gray-300 transition"
                                }
                              >
                                <span
                                  className={
                                    product.is_active
                                      ? "inline-block h-4 w-4 translate-x-6 rounded-full bg-white shadow-sm transition"
                                      : "inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow-sm transition"
                                  }
                                />
                              </span>

                              <span
                                className={
                                  product.is_active
                                    ? "text-xs font-semibold text-green-700"
                                    : "text-xs font-semibold text-gray-500"
                                }
                              >
                                {product.is_active ? "Active" : "Inactive"}
                              </span>
                            </button>
                          )}
                        </td>

                        {/* EDIT */}

                        <td
                          className="px-5 py-4 text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14 5 5 5M4 20l3.5-.8L19.2 7.5a2.1 2.1 0 0 0-3-3L4.5 16.2 4 20Z"
                                />
                              </svg>
                              Edit
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              View only
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* PAGINATION */}

              <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {showingFrom}–{showingTo}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">{total}</span>{" "}
                  products
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m15 18-6-6 6-6"
                      />
                    </svg>
                    Previous
                  </button>

                  <span className="flex h-9 items-center rounded-lg bg-gray-50 px-3 text-sm font-medium text-gray-600">
                    Page{" "}
                    <span className="mx-1 font-semibold text-gray-900">
                      {currentPage}
                    </span>{" "}
                    of {lastPage}
                  </span>

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === lastPage || loading}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m9 18 6 6-6-6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7.5 12 3 4 7.5m16 0L12 12 4 7.5m16 0V16.5L12 21l-8-4.5V7.5M12 12v9"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-base font-semibold text-gray-900">
                No products found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-gray-500">
                {search || categoryFilter !== "" || statusFilter !== ""
                  ? "Try adjusting your filters or search terms."
                  : "Start building your product catalog by adding your first product."}
              </p>

              {search || categoryFilter !== "" || statusFilter !== "" ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14M5 12h14"
                    />
                  </svg>
                  Add your first product
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
