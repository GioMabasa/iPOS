import type { RefObject } from "react";

import POSProductCatalog from "./POSProductCatalog";

type POSCartProduct = {
  product_id: number;
  name: string;
  sku: string;
  stock: number | string;
  selling_price: number | string;
};

type POSCartItem = {
  product: POSCartProduct;
  quantity: number;
};

type POSWorkspaceProps = {
  products: any[];
  search: string;
  currentPage: number;
  lastPage: number;
  fetching: boolean;
  productsPerPage: number;
  searchInputRef: RefObject<HTMLInputElement | null>;

  cart: POSCartItem[];
  subtotal: number;
  total: number;

  onSearchChange: (value: string) => void;
  onBarcodeScan: (barcode: string) => void;
  onAddToCart: (product: any) => void;
  getCartQuantity: (productId: number) => number;

  onPreviousPage: () => void;
  onNextPage: () => void;

  updateQuantity: (productId: number, quantity: number) => void;

  onClearCart: () => void;
  onRemoveItem: (productId: number) => void;

  onProceedToPayment: () => void;

  toNumber: (value: unknown) => number;
  formatCurrency: (value: unknown) => string;
};

export default function POSWorkspace({
  products,
  search,
  currentPage,
  lastPage,
  fetching,
  productsPerPage,
  searchInputRef,

  cart,
  subtotal,
  total,

  onSearchChange,
  onBarcodeScan,
  onAddToCart,
  getCartQuantity,

  onPreviousPage,
  onNextPage,

  updateQuantity,

  onClearCart,
  onRemoveItem,

  onProceedToPayment,

  toNumber,
  formatCurrency,
}: POSWorkspaceProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* ======================================================
          PRODUCTS
      ====================================================== */}

      <POSProductCatalog
        products={products}
        search={search}
        currentPage={currentPage}
        lastPage={lastPage}
        fetching={fetching}
        productsPerPage={productsPerPage}
        searchInputRef={searchInputRef}
        onSearchChange={onSearchChange}
        onBarcodeScan={onBarcodeScan}
        onAddToCart={onAddToCart}
        getCartQuantity={getCartQuantity}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        toNumber={toNumber}
        formatCurrency={formatCurrency}
      />

      {/* ======================================================
          CART
      ====================================================== */}

      <section className="flex h-[calc(100vh-220px)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* CART HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4h2l2 11h10l2-8H6m3 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1-2 0 1 1 0 0 1 2 0Z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-900">Current Sale</h2>

              <p className="mt-0.5 text-xs text-gray-400">
                {cart.length} product
                {cart.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
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
                  d="M3 6h18M9 6V4h6v2m-8 0 1 14h8l1-14"
                />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* CART ITEMS */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {cart.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
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
                    d="M3 4h2l2 11h10l2-8H6m3 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1-2 0 1 1 0 0 1 2 0Z"
                  />
                </svg>
              </div>

              <p className="mt-4 text-sm font-semibold text-gray-700">
                Cart is empty
              </p>

              <p className="mt-1 max-w-[220px] text-xs leading-5 text-gray-400">
                Scan a barcode or select a product to add it to the sale.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const availableStock = toNumber(item.product.stock);

                const remaining = Math.max(availableStock - item.quantity, 0);

                const lineTotal =
                  toNumber(item.product.selling_price) * item.quantity;

                return (
                  <div
                    key={item.product.product_id}
                    className="rounded-2xl border border-gray-200 bg-white p-3.5 transition hover:border-blue-100 hover:shadow-sm"
                  >
                    {/* ITEM HEADER */}

                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                        {item.product.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">
                              {item.product.name}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-gray-400">
                              SKU: {item.product.sku}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onRemoveItem(item.product.product_id)
                            }
                            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 6l12 12M18 6 6 18"
                              />
                            </svg>
                          </button>
                        </div>

                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatCurrency(item.product.selling_price)} each
                        </p>
                      </div>
                    </div>

                    {/* QUANTITY */}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.product_id,
                              item.quantity - 1,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-lg font-medium text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min="1"
                          max={availableStock}
                          value={item.quantity}
                          onChange={(event) => {
                            const value = event.target.value;

                            if (value === "") {
                              return;
                            }

                            updateQuantity(
                              item.product.product_id,
                              Number(value),
                            );
                          }}
                          onFocus={(event) => event.target.select()}
                          className="h-9 w-12 border-x border-gray-200 bg-white text-center text-sm font-bold text-gray-900 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.product_id,
                              item.quantity + 1,
                            )
                          }
                          disabled={item.quantity >= availableStock}
                          className="flex h-9 w-9 items-center justify-center text-lg font-medium text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>

                    {/* REMAINING */}

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Remaining stock</span>

                      <span
                        className={`font-semibold ${
                          remaining === 0 ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        {remaining}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOTAL */}

        <div className="shrink-0 border-t border-gray-100 bg-gray-50/70 p-4 sm:p-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>

              <span className="font-medium text-gray-700">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-end justify-between border-t border-gray-200 pt-3">
              <span className="text-sm font-semibold text-gray-600">Total</span>

              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onProceedToPayment}
            disabled={cart.length === 0}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Proceed to Payment
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
                d="M5 12h14m-6-6 6 6-6 6"
              />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}
