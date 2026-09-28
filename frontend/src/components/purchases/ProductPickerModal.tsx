import type { RefObject } from "react";

import type { Product } from "../../types/product";

interface ProductPickerModalProps {
  show: boolean;
  filteredProducts: Product[];
  productSearch: string;
  highlightedProductIndex: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSelectProduct: (product: Product) => void;
  onHighlight: (index: number) => void;
  onClose: () => void;
}

export default function ProductPickerModal({
  show,
  filteredProducts,
  productSearch,
  highlightedProductIndex,
  inputRef,
  onSearchChange,
  onKeyDown,
  onSelectProduct,
  onHighlight,
  onClose,
}: ProductPickerModalProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Select Product
              </h2>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                <p className="text-xs font-medium text-slate-500">
                  Search by product name, SKU, or scan a barcode.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
            aria-label="Close product picker"
          >
            ×
          </button>
        </div>

        {/* SEARCH */}

        <div className="border-b border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-violet-50/50 to-white p-4 sm:p-5">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={productSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              placeholder="Scan barcode or search product name / SKU..."
              className="h-12 w-full rounded-2xl border border-indigo-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-lg border border-indigo-100 bg-white px-1.5 py-0.5 font-bold text-indigo-600 shadow-sm">
                ENTER
              </span>
              Select
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-lg border border-violet-100 bg-white px-1.5 py-0.5 font-bold text-violet-600 shadow-sm">
                ↑ ↓
              </span>
              Navigate
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 font-bold text-slate-600 shadow-sm">
                ESC
              </span>
              Close
            </span>

            <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-3.5 w-3.5 text-indigo-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
              USB barcode scanner supported
            </span>
          </div>
        </div>

        {/* RESULTS */}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-7 w-7"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="m20 20-4-4" />
                </svg>
              </div>

              <p className="text-sm font-bold text-slate-700">
                No products found
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Try searching by product name, SKU, or barcode.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProducts.map((product, index) => {
                const isHighlighted = index === highlightedProductIndex;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    onMouseEnter={() => onHighlight(index)}
                    className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition sm:px-6 ${
                      isHighlighted
                        ? "bg-gradient-to-r from-indigo-50 via-violet-50/70 to-white"
                        : "bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                        isHighlighted
                          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200"
                          : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 9.5h8M8 13h5"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-bold ${
                          isHighlighted ? "text-indigo-900" : "text-slate-900"
                        }`}
                      >
                        {product.name}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-400">
                        {product.sku && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5">
                            SKU: {product.sku}
                          </span>
                        )}

                        {product.barcode && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5">
                            Barcode: {product.barcode}
                          </span>
                        )}

                        {product.unit && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5">
                            Unit: {product.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                        isHighlighted
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m9 18 6-6-6-6"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-between gap-4 border-t border-slate-200/80 bg-white/95 px-5 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <p className="text-xs font-medium text-slate-500">
              {filteredProducts.length} product
              {filteredProducts.length === 1 ? "" : "s"} found
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
