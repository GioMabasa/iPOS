import type { RefObject } from "react";

import type { POSProduct } from "../../services/inventoryService";

interface POSProductCatalogProps {
  products: POSProduct[];
  search: string;
  currentPage: number;
  lastPage: number;
  fetching: boolean;
  productsPerPage: number;

  searchInputRef: RefObject<HTMLInputElement | null>;

  onSearchChange: (value: string) => void;
  onBarcodeScan: (value: string) => void | Promise<void>;
  onAddToCart: (product: POSProduct) => void;
  getCartQuantity: (productId: number) => number;

  onPreviousPage: () => void;
  onNextPage: () => void;

  toNumber: (value: unknown) => number;
  formatCurrency: (value: unknown) => string;
}

export default function POSProductCatalog({
  products,
  search,
  currentPage,
  lastPage,
  fetching,
  productsPerPage,
  searchInputRef,
  onSearchChange,
  onBarcodeScan,
  onAddToCart,
  getCartQuantity,
  onPreviousPage,
  onNextPage,
  toNumber,
  formatCurrency,
}: POSProductCatalogProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-5 sm:p-6">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-20 h-36 w-36 rounded-full bg-white/10" />

        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl text-white ring-1 ring-white/20 backdrop-blur-sm">
                  🛍️
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white sm:text-xl">
                    Product Catalog
                  </h2>

                  <p className="mt-0.5 text-sm text-blue-100">
                    Select a product or scan a barcode to add it to the sale.
                  </p>
                </div>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
              {productsPerPage} products per page
            </span>
          </div>

          {/* SEARCH / BARCODE SCANNER */}
          <div className="mt-5">
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                🔎
              </div>

              <input
                ref={searchInputRef}
                id="product-search"
                type="text"
                autoFocus
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();

                    const scannedValue = search.trim();

                    if (!scannedValue) return;

                    void onBarcodeScan(scannedValue);
                  }
                }}
                placeholder="Scan barcode or search by name, SKU..."
                className="w-full rounded-2xl border border-white/20 bg-white px-11 py-3.5 pr-12 text-sm font-medium text-slate-900 shadow-lg outline-none transition placeholder:text-slate-400 focus:border-white focus:ring-4 focus:ring-white/20"
                autoComplete="off"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange("");

                    setTimeout(() => {
                      searchInputRef.current?.focus();
                    }, 50);
                  }}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-xs">
              <span className="text-blue-100">
                Scan a barcode or search by name, SKU, or barcode.
              </span>

              {fetching && (
                <span className="flex shrink-0 items-center gap-2 font-semibold text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Searching...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="bg-slate-50/70 p-4 sm:p-5">
        {products.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔍
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                No products found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try a different search term or scan another barcode.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const availableStock = toNumber(product.stock);
                const inCart = getCartQuantity(product.product_id);
                const remaining = Math.max(availableStock - inCart, 0);

                const outOfStock = availableStock <= 0;
                const stockLimitReached = remaining <= 0;

                const isLowStock =
                  !outOfStock &&
                  toNumber(product.minimum_stock) > 0 &&
                  availableStock <= toNumber(product.minimum_stock);

                return (
                  <div
                    key={product.product_id}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                  >
                    {/* CARD ACCENT */}
                    <div
                      className={`h-1.5 w-full ${
                        outOfStock
                          ? "bg-gradient-to-r from-red-400 to-rose-500"
                          : isLowStock
                            ? "bg-gradient-to-r from-amber-400 to-orange-500"
                            : "bg-gradient-to-r from-emerald-400 to-teal-500"
                      }`}
                    />

                    <div className="flex flex-1 flex-col p-4">
                      {/* PRODUCT HEADER */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-900">
                            {product.name}
                          </h3>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            SKU: {product.sku || "—"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            outOfStock
                              ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                              : isLowStock
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          }`}
                        >
                          {outOfStock
                            ? "Out of Stock"
                            : isLowStock
                              ? "Low Stock"
                              : "In Stock"}
                        </span>
                      </div>

                      {/* PRICE */}
                      <div className="mt-4 flex items-end justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                            Selling Price
                          </p>

                          <p className="mt-0.5 text-xl font-extrabold tracking-tight text-blue-700">
                            {formatCurrency(product.selling_price)}
                          </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                          💰
                        </div>
                      </div>

                      {/* DETAILS */}
                      <div className="mt-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-500">Barcode</span>

                          <span className="max-w-[60%] truncate font-medium text-slate-700">
                            {product.barcode || "—"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-500">Available</span>

                          <span className="font-bold text-slate-800">
                            {availableStock}
                          </span>
                        </div>

                        {inCart > 0 && (
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-500">In Cart</span>

                            <span className="font-bold text-blue-600">
                              {inCart}
                            </span>
                          </div>
                        )}

                        {inCart > 0 && (
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-500">Remaining</span>

                            <span
                              className={`font-bold ${
                                remaining === 0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {remaining}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ADD TO CART */}
                      <button
                        type="button"
                        onClick={() => {
                          onAddToCart(product);

                          setTimeout(() => {
                            searchInputRef.current?.focus();
                          }, 50);
                        }}
                        disabled={outOfStock || stockLimitReached}
                        className="mt-auto flex w-full items-center justify-center gap-2 pt-5"
                      >
                        <span
                          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition duration-200 ${
                            outOfStock || stockLimitReached
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm hover:from-indigo-700 hover:to-blue-700 hover:shadow-md active:scale-[0.98]"
                          }`}
                        >
                          {outOfStock ? (
                            <>
                              <span>🚫</span>
                              Out of Stock
                            </>
                          ) : stockLimitReached ? (
                            <>
                              <span>⚠️</span>
                              Maximum Stock Reached
                            </>
                          ) : (
                            <>
                              <span>＋</span>
                              Add to Cart
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            {lastPage > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={onPreviousPage}
                  disabled={currentPage <= 1 || fetching}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                    {currentPage}
                  </span>

                  <span className="text-slate-400">of</span>

                  <span className="font-semibold text-slate-600">
                    {lastPage}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onNextPage}
                  disabled={currentPage >= lastPage || fetching}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
