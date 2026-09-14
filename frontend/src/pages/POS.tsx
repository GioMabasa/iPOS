import { useEffect, useRef, useState } from "react";

import { getPOSProducts, type POSProduct } from "../services/inventoryService";
import { createSale } from "../services/saleService";

import type { CreateSaleRequest } from "../types/sale";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface CartItem {
  product: POSProduct;
  quantity: number;
}

interface ConfirmState {
  type: "remove" | "clear" | null;
  productId?: number;
}

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PRODUCTS_PER_PAGE = 9;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function getToday(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
|--------------------------------------------------------------------------
| POS
|--------------------------------------------------------------------------
*/

export default function POS() {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [products, setProducts] = useState<POSProduct[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [fetching, setFetching] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Initial Search Effect
  |--------------------------------------------------------------------------
  */

  const isInitialSearchEffect = useRef(true);

  /*
  |--------------------------------------------------------------------------
  | Confirmation Modal
  |--------------------------------------------------------------------------
  */

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    type: null,
  });

  /*
  |--------------------------------------------------------------------------
  | Payment Modal
  |--------------------------------------------------------------------------
  */

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [amountPaid, setAmountPaid] = useState("");

  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (showPaymentModal) {
      setTimeout(() => {
        amountPaidInputRef.current?.focus();
        amountPaidInputRef.current?.select();
      }, 100);
    }
  }, [showPaymentModal]);

  /*
  |--------------------------------------------------------------------------
  | Search Input Ref
  |--------------------------------------------------------------------------
  */

  const searchInputRef = useRef<HTMLInputElement>(null);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);

  /*
  |--------------------------------------------------------------------------
  | Load POS Products
  |--------------------------------------------------------------------------
  */

  async function loadInventory(
    page: number = 1,
    keyword: string = search,
    initialLoad: boolean = false,
  ) {
    try {
      if (initialLoad) {
        setLoading(true);
      } else {
        setFetching(true);
      }

      setError("");

      const response = await getPOSProducts({
        page,
        per_page: PRODUCTS_PER_PAGE,
        search: keyword.trim() || undefined,
      });

      setProducts(response.data);

      setCurrentPage(Number(response.current_page));

      setLastPage(Number(response.last_page));
    } catch (err) {
      console.error("POS products loading error:", err);

      setError("Unable to load inventory.");
    } finally {
      if (initialLoad) {
        setLoading(false);
      } else {
        setFetching(false);
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadInventory(1, "", true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Search Products
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (isInitialSearchEffect.current) {
      isInitialSearchEffect.current = false;

      return;
    }

    const timeout = setTimeout(() => {
      loadInventory(1, search);
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [search]);

  useEffect(() => {
    if (!loading) {
      focusSearchInput();
    }
  }, [loading]);

  /*
  |--------------------------------------------------------------------------
  | Focus Barcode / Search Input
  |--------------------------------------------------------------------------
  */

  function focusSearchInput() {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }

  /*
  |--------------------------------------------------------------------------
  | Auto Focus Barcode / Search Input
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    focusSearchInput();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Get Cart Quantity
  |--------------------------------------------------------------------------
  */

  function getCartQuantity(productId: number): number {
    const item = cart.find(
      (cartItem) => cartItem.product.product_id === productId,
    );

    return item?.quantity ?? 0;
  }

  /*
  |--------------------------------------------------------------------------
  | Add To Cart
  |--------------------------------------------------------------------------
  */

  function addToCart(product: POSProduct) {
    const availableStock = toNumber(product.stock);

    if (availableStock <= 0) {
      setError(`${product.name} is out of stock.`);

      return;
    }

    setError("");

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product.product_id === product.product_id,
      );

      if (existing) {
        if (existing.quantity >= availableStock) {
          setError(`Maximum stock reached for ${product.name}.`);

          return currentCart;
        }

        return currentCart.map((item) =>
          item.product.product_id === product.product_id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Barcode Scan
  |--------------------------------------------------------------------------
  */

  async function handleBarcodeScan(value: string) {
    const scannedValue = value.trim();

    if (!scannedValue) {
      return;
    }

    try {
      setError("");

      /*
      |--------------------------------------------------------------------------
      | Search Barcode Through POS API
      |--------------------------------------------------------------------------
      */

      const response = await getPOSProducts({
        page: 1,
        per_page: PRODUCTS_PER_PAGE,
        search: scannedValue,
      });

      const product = response.data.find(
        (item) => item.barcode?.trim() === scannedValue,
      );

      if (product) {
        addToCart(product);

        setSearch("");

        setCurrentPage(1);

        setSuccessMessage(`${product.name} added to cart.`);

        setTimeout(() => {
          setSuccessMessage("");
        }, 2000);

        focusSearchInput();

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | If No Barcode Match
      |--------------------------------------------------------------------------
      */

      setError(`Barcode "${scannedValue}" was not found.`);

      focusSearchInput();
    } catch (err) {
      console.error("Barcode search error:", err);

      setError("Unable to search barcode.");

      focusSearchInput();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update Quantity
  |--------------------------------------------------------------------------
  */

  function updateQuantity(productId: number, quantity: number) {
    setCart((currentCart) => {
      const product = products.find((item) => item.product_id === productId);

      const cartProduct = currentCart.find(
        (item) => item.product.product_id === productId,
      )?.product;

      const selectedProduct = product ?? cartProduct;

      if (!selectedProduct) {
        return currentCart;
      }

      const availableStock = toNumber(selectedProduct.stock);

      if (!Number.isFinite(quantity)) {
        return currentCart;
      }

      if (quantity <= 0) {
        return currentCart.filter(
          (item) => item.product.product_id !== productId,
        );
      }

      const safeQuantity = Math.min(Math.floor(quantity), availableStock);

      if (safeQuantity <= 0) {
        return currentCart.filter(
          (item) => item.product.product_id !== productId,
        );
      }

      return currentCart.map((item) =>
        item.product.product_id === productId
          ? {
              ...item,
              quantity: safeQuantity,
            }
          : item,
      );
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Remove From Cart
  |--------------------------------------------------------------------------
  */

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product.product_id !== productId),
    );

    setConfirmState({
      type: null,
    });

    focusSearchInput();
  }

  /*
  |--------------------------------------------------------------------------
  | Clear Cart
  |--------------------------------------------------------------------------
  */

  function clearCart() {
    setCart([]);

    setConfirmState({
      type: null,
    });

    focusSearchInput();
  }

  /*
  |--------------------------------------------------------------------------
  | Totals
  |--------------------------------------------------------------------------
  */

  const subtotal = cart.reduce(
    (total, item) =>
      total + toNumber(item.product.selling_price) * item.quantity,
    0,
  );

  const total = subtotal;

  const numericAmountPaid = toNumber(amountPaid);

  const changeAmount = Math.max(numericAmountPaid - total, 0);

  const insufficientPayment = numericAmountPaid < total;

  /*
  |--------------------------------------------------------------------------
  | Open Payment
  |--------------------------------------------------------------------------
  */

  function openPaymentModal() {
    if (cart.length === 0) {
      return;
    }

    setError("");

    setAmountPaid("0");

    setNotes("");

    setShowPaymentModal(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Payment Shortcut
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handlePaymentShortcut(event: KeyboardEvent) {
      if (event.key === "F4") {
        event.preventDefault();

        if (!showPaymentModal && cart.length > 0) {
          openPaymentModal();
        }
      }
    }

    window.addEventListener("keydown", handlePaymentShortcut);

    return () => {
      window.removeEventListener("keydown", handlePaymentShortcut);
    };
  }, [cart.length, showPaymentModal]);

  /*
  |--------------------------------------------------------------------------
  | Close Payment
  |--------------------------------------------------------------------------
  */

  function closePaymentModal() {
    if (submitting) {
      return;
    }

    setShowPaymentModal(false);

    focusSearchInput();
  }

  /*
  |--------------------------------------------------------------------------
  | Complete Sale
  |--------------------------------------------------------------------------
  */

  async function handleCompleteSale() {
    setError("");

    if (cart.length === 0) {
      return;
    }

    if (numericAmountPaid < total) {
      setError("Amount paid is insufficient.");

      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateSaleRequest = {
        sale_date: getToday(),

        discount: 0,

        tax: 0,

        amount_paid: numericAmountPaid,

        notes: notes.trim() || null,

        items: cart.map((item) => ({
          product_id: item.product.product_id,

          quantity: item.quantity,
        })),
      };

      const response = await createSale(payload);

      console.log("Sale completed:", response);

      setShowPaymentModal(false);

      setCart([]);

      setAmountPaid("");

      setNotes("");

      setSuccessMessage("Sale completed successfully!");

      /*
      |--------------------------------------------------------------------------
      | Refresh POS Products
      |--------------------------------------------------------------------------
      */

      await loadInventory(currentPage, search);

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);

      focusSearchInput();
    } catch (err: any) {
      console.error("Sale creation error:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to complete sale. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Complete Sale Shortcut
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handleCompleteSaleShortcut(event: KeyboardEvent) {
      if (event.key !== "Enter" || !showPaymentModal) {
        return;
      }

      event.preventDefault();

      if (!submitting && !insufficientPayment && amountPaid) {
        handleCompleteSale();
      }
    }

    window.addEventListener("keydown", handleCompleteSaleShortcut);

    return () => {
      window.removeEventListener("keydown", handleCompleteSaleShortcut);
    };
  }, [showPaymentModal, submitting, insufficientPayment, amountPaid]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
            Loading inventory...
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Point of Sale
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Scan a barcode or select a product to create a sale.
        </p>
      </div>

      {/* ========================================================
          SUCCESS MESSAGE
      ======================================================== */}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {/* ========================================================
          POS LAYOUT
      ======================================================== */}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* ======================================================
            PRODUCTS
        ====================================================== */}

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* SEARCH */}

          <div className="border-b border-gray-200 p-4">
            <label
              htmlFor="product-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search or Scan Barcode
            </label>

            <input
              ref={searchInputRef}
              id="product-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  void handleBarcodeScan(search);
                }
              }}
              placeholder="Scan barcode or search by name, SKU..."
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <p className="mt-2 text-xs text-gray-400">
              Barcode scanner: scan the product and it will automatically add to
              the cart.
            </p>

            {fetching && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                Searching...
              </div>
            )}
          </div>

          {/* PRODUCT GRID */}

          <div className="p-4">
            {products.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-500">
                No products found.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => {
                    const availableStock = toNumber(product.stock);

                    const inCart = getCartQuantity(product.product_id);

                    const remaining = Math.max(availableStock - inCart, 0);

                    const outOfStock = availableStock <= 0;

                    const stockLimitReached = remaining <= 0;

                    return (
                      <div
                        key={product.product_id}
                        className={`rounded-xl border p-4 transition ${
                          outOfStock
                            ? "border-gray-200 bg-gray-50"
                            : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                        }`}
                      >
                        {/* PRODUCT HEADER */}

                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="truncate font-semibold text-gray-900">
                              {product.name}
                            </h3>

                            {outOfStock ? (
                              <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase text-red-700">
                                Out of Stock
                              </span>
                            ) : product.is_low_stock ? (
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-700">
                                Low Stock
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase text-green-700">
                                In Stock
                              </span>
                            )}
                          </div>

                          {/* SKU */}

                          <p className="mt-2 text-xs text-gray-500">
                            SKU:{" "}
                            <span className="font-medium text-gray-700">
                              {product.sku}
                            </span>
                          </p>

                          {/* BARCODE */}

                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span>Barcode:</span>

                            {product.barcode ? (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono font-medium text-gray-700">
                                {product.barcode}
                              </span>
                            ) : (
                              <span className="italic text-gray-400">
                                No barcode
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PRICE */}

                        <div className="mt-4">
                          <p className="text-lg font-bold text-indigo-600">
                            {formatCurrency(product.selling_price)}
                          </p>
                        </div>

                        {/* STOCK */}

                        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Available</span>

                            <span className="font-medium text-gray-900">
                              {availableStock}
                            </span>
                          </div>

                          <div className="mt-1 flex justify-between">
                            <span className="text-gray-500">In Cart</span>

                            <span className="font-medium text-gray-900">
                              {inCart}
                            </span>
                          </div>

                          <div className="mt-1 flex justify-between border-t border-gray-200 pt-1">
                            <span className="font-semibold text-gray-700">
                              Remaining
                            </span>

                            <span
                              className={`font-bold ${
                                remaining === 0
                                  ? "text-red-600"
                                  : "text-indigo-600"
                              }`}
                            >
                              {remaining}
                            </span>
                          </div>
                        </div>

                        {/* ADD TO CART */}

                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={outOfStock || stockLimitReached}
                          className="mt-3 h-10 w-full rounded-lg bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                        >
                          {outOfStock
                            ? "Out of Stock"
                            : stockLimitReached
                              ? "Stock Limit Reached"
                              : "Add to Cart"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION */}

                {lastPage > 1 && (
                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500">
                      Page {currentPage} of {lastPage}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentPage > 1) {
                            loadInventory(currentPage - 1, search);
                          }
                        }}
                        disabled={currentPage === 1 || fetching}
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentPage < lastPage) {
                            loadInventory(currentPage + 1, search);
                          }
                        }}
                        disabled={currentPage === lastPage || fetching}
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ======================================================
            CART
        ====================================================== */}

        <section className="flex max-h-[calc(100vh-140px)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* CART HEADER */}

          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div>
              <h2 className="font-semibold text-gray-900">Current Sale</h2>

              <p className="mt-0.5 text-xs text-gray-500">
                {cart.length} product
                {cart.length !== 1 ? "s" : ""}
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    type: "clear",
                  })
                }
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* CART ITEMS */}

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    🛒
                  </div>

                  <p className="text-sm font-medium text-gray-700">
                    Cart is empty
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Scan or select a product to add it to the sale.
                  </p>
                </div>
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
                      className="rounded-lg border border-gray-200 p-3"
                    >
                      {/* ITEM HEADER */}

                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.product.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            SKU: {item.product.sku}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Barcode:{" "}
                            {item.product.barcode ? (
                              <span className="font-mono font-medium text-gray-700">
                                {item.product.barcode}
                              </span>
                            ) : (
                              <span className="italic text-gray-400">
                                No barcode
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatCurrency(item.product.selling_price)} each
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmState({
                              type: "remove",
                              productId: item.product.product_id,
                            })
                          }
                          className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      {/* QUANTITY */}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-gray-300 bg-white">
                          {/* DECREASE */}

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.product_id,
                                item.quantity - 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center text-lg text-gray-600 hover:bg-gray-100"
                          >
                            −
                          </button>

                          {/* INPUT */}

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
                            className="h-9 w-14 border-x border-gray-300 text-center text-sm font-semibold outline-none"
                          />

                          {/* INCREASE */}

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.product_id,
                                item.quantity + 1,
                              )
                            }
                            disabled={item.quantity >= availableStock}
                            className="flex h-9 w-9 items-center justify-center text-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>

                      {/* REMAINING */}

                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-gray-500">Remaining stock</span>

                        <span
                          className={`font-semibold ${
                            remaining === 0 ? "text-red-600" : "text-gray-700"
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

          <div className="border-t border-gray-200 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>

                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>

                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={openPaymentModal}
              disabled={cart.length === 0}
              className="mt-4 h-12 w-full rounded-lg bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to Payment
            </button>
          </div>
        </section>
      </div>

      {/* ========================================================
          CONFIRMATION MODAL
      ======================================================== */}

      {confirmState.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              {confirmState.type === "clear"
                ? "Clear Cart?"
                : "Remove Product?"}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {confirmState.type === "clear"
                ? "Are you sure you want to remove all products from the cart?"
                : "Are you sure you want to remove this product from the cart?"}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmState({
                    type: null,
                  });

                  focusSearchInput();
                }}
                className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmState.type === "clear") {
                    clearCart();
                  }

                  if (
                    confirmState.type === "remove" &&
                    confirmState.productId
                  ) {
                    removeFromCart(confirmState.productId);
                  }
                }}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
              >
                {confirmState.type === "clear" ? "Clear Cart" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAYMENT MODAL
      ======================================================== */}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment</h3>

                <p className="mt-1 text-xs text-gray-500">
                  Complete the sale transaction.
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={submitting}
                className="text-xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* CONTENT */}

            <div className="p-5">
              {/* TOTAL */}

              <div className="rounded-lg bg-indigo-50 p-4">
                <p className="text-sm text-indigo-600">Total Amount</p>

                <p className="mt-1 text-2xl font-bold text-indigo-700">
                  {formatCurrency(total)}
                </p>
              </div>

              {/* AMOUNT PAID */}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amount Paid
                </label>

                <input
                  ref={amountPaidInputRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  onFocus={(event) => event.target.select()}
                  disabled={submitting}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-lg font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* CHANGE */}

              <div className="mt-4 flex justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Change</span>

                <span className="font-bold text-gray-900">
                  {formatCurrency(changeAmount)}
                </span>
              </div>

              {/* NOTES */}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                  <span className="ml-1 text-gray-400">(Optional)</span>
                </label>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={submitting}
                  rows={3}
                  placeholder="Optional sale notes..."
                  className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* INSUFFICIENT */}

              {amountPaid && insufficientPayment && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  Amount paid is insufficient.
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex gap-3 border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={submitting}
                className="h-11 flex-1 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={submitting || insufficientPayment || !amountPaid}
                className="h-11 flex-1 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
