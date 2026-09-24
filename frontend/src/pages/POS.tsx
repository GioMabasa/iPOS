import { useEffect, useRef, useState } from "react";

import { getPOSProducts, type POSProduct } from "../services/inventoryService";
import { createSale } from "../services/saleService";
import { getCustomers } from "../services/customerService";
import { getSettings } from "../services/settingService";
import { getBirSettings } from "../services/birSettingService";

import type { CreateSaleRequest } from "../types/sale";
import type { Customer } from "../types/customer";
import type { TaxType } from "../types/birSetting";

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

const TERM_OPTIONS = [1, 2, 3, 4, 5, 6, 9, 12];

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

function getDueDate(termMonths: number): string {
  const date = new Date();

  date.setHours(12, 0, 0, 0);

  date.setMonth(date.getMonth() + termMonths);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");

  return `${month}/${day}/${year}`;
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

  const [amountPaid, setAmountPaid] = useState("0");

  const [discount, setDiscount] = useState("0");

  const [tax, setTax] = useState("0");

  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "charge">("cash");

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [defaultCustomer, setDefaultCustomer] = useState("Walk-in Customer");

  const [customerLoading, setCustomerLoading] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );

  const [termMonths, setTermMonths] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | BIR Tax Settings
  |--------------------------------------------------------------------------
  */

  const [taxType, setTaxType] = useState<TaxType>("non_vat");

  const [vatRate, setVatRate] = useState("12");

  useEffect(() => {
    if (showPaymentModal) {
      setTimeout(() => {
        if (paymentMethod === "cash") {
          amountPaidInputRef.current?.focus();
          amountPaidInputRef.current?.select();
        }
      }, 100);
    }
  }, [showPaymentModal, paymentMethod]);

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
  | Load Customers
  |--------------------------------------------------------------------------
  */

  async function loadCustomers() {
    try {
      setCustomerLoading(true);

      const response = await getCustomers();

      setCustomers(response);
    } catch (err) {
      console.error("Customer loading error:", err);

      setError("Unable to load customers.");
    } finally {
      setCustomerLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load Settings
  |--------------------------------------------------------------------------
  */

  async function loadSettings() {
    try {
      const response = await getSettings();

      setDefaultCustomer(
        response.data.default_customer?.trim() || "Walk-in Customer",
      );
    } catch (err) {
      console.error("Settings loading error:", err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load BIR Settings
  |--------------------------------------------------------------------------
  */

  async function loadBirSettings() {
    try {
      const response = await getBirSettings();

      if (!response.data) {
        setTaxType("non_vat");
        setVatRate("12");
        setTax("0");

        return;
      }

      const configuredTaxType = response.data.vat_registered
        ? (response.data.tax_type ?? "non_vat")
        : "non_vat";

      const configuredVatRate = toNumber(response.data.vat_rate);

      setTaxType(configuredTaxType);

      setVatRate(String(configuredVatRate));

      setTax(configuredTaxType === "non_vat" ? "0" : String(configuredVatRate));
    } catch (err) {
      console.error("BIR settings loading error:", err);

      setTaxType("non_vat");
      setVatRate("12");
      setTax("0");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadInventory(1, "", true);
    void loadSettings();
    void loadBirSettings();
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

  const discountRate = Math.min(Math.max(toNumber(discount), 0), 100);

  const discountAmount = subtotal * (discountRate / 100);

  const taxableAmount = Math.max(subtotal - discountAmount, 0);

  const taxRate = Math.min(Math.max(toNumber(tax), 0), 100);

  let taxAmount = 0;

  let total = taxableAmount;

  if (taxType === "vat_exclusive") {
    taxAmount = taxableAmount * (taxRate / 100);

    total = taxableAmount + taxAmount;
  } else if (taxType === "vat_inclusive") {
    const divisor = 1 + taxRate / 100;

    const netAmount = divisor > 0 ? taxableAmount / divisor : taxableAmount;

    taxAmount = taxableAmount - netAmount;

    total = taxableAmount;
  }

  const numericAmountPaid = toNumber(amountPaid);

  const changeAmount =
    paymentMethod === "cash" ? Math.max(numericAmountPaid - total, 0) : 0;

  const insufficientPayment =
    paymentMethod === "cash" && numericAmountPaid < total;

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ?? null;

  const dueDate =
    paymentMethod === "charge" && termMonths ? getDueDate(termMonths) : null;

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

    setDiscount("0");

    setTax(taxType === "non_vat" ? "0" : vatRate);

    setNotes("");

    setPaymentMethod("cash");

    setSelectedCustomerId(null);

    setTermMonths(null);

    setShowPaymentModal(true);

    void loadCustomers();
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

    setDiscount("0");

    setTax(taxType === "non_vat" ? "0" : vatRate);

    setAmountPaid("0");

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

    if (paymentMethod === "cash") {
      if (numericAmountPaid < total) {
        setError("Amount paid is insufficient.");

        return;
      }
    }

    if (paymentMethod === "charge") {
      if (!selectedCustomerId) {
        setError("Please select a customer for charge payment.");

        return;
      }

      if (!termMonths) {
        setError("Please select a payment term.");

        return;
      }
    }

    try {
      setSubmitting(true);

      const payload: CreateSaleRequest = {
        customer_id: selectedCustomerId,

        payment_method: paymentMethod,

        term_months: paymentMethod === "charge" ? termMonths : null,

        sale_date: getToday(),

        discount: discountAmount,

        tax: taxAmount,

        amount_paid: paymentMethod === "cash" ? numericAmountPaid : 0,

        notes: notes.trim() || null,

        items: cart.map((item) => ({
          product_id: item.product.product_id,

          quantity: item.quantity,
        })),
      };

      const response = await createSale(payload);

      console.log("Sale completed:", response);

      window.dispatchEvent(new Event("ipos:sale-completed"));

      setShowPaymentModal(false);

      setCart([]);

      setAmountPaid("0");

      setDiscount("0");

      setTax(taxType === "non_vat" ? "0" : vatRate);

      setNotes("");

      setPaymentMethod("cash");

      setSelectedCustomerId(null);

      setTermMonths(null);

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

      const canComplete =
        !submitting &&
        !insufficientPayment &&
        (paymentMethod === "charge"
          ? Boolean(selectedCustomerId && termMonths)
          : Boolean(amountPaid));

      if (canComplete) {
        handleCompleteSale();
      }
    }

    window.addEventListener("keydown", handleCompleteSaleShortcut);

    return () => {
      window.removeEventListener("keydown", handleCompleteSaleShortcut);
    };
  }, [
    showPaymentModal,
    submitting,
    insufficientPayment,
    amountPaid,
    paymentMethod,
    selectedCustomerId,
    termMonths,
    discountRate,
    taxRate,
    discountAmount,
    taxAmount,
    total,
  ]);

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

        <section className="flex h-[calc(100vh-240px)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
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
                            onFocus={(event) => event.target.select()}
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

          <div className="shrink-0 border-t border-gray-200 bg-white p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>

                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-2xl font-bold text-gray-900">
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
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-5">
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

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-2">
                {/* ======================================================
                    LEFT SIDE - PAYMENT DETAILS
                ====================================================== */}

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="mb-4 text-sm font-semibold text-gray-700">
                    Payment Details
                  </p>

                  {/* PAYMENT METHOD */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Payment Method
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("cash");
                          setError("");
                        }}
                        disabled={submitting}
                        className={`h-11 rounded-lg border text-sm font-semibold transition ${
                          paymentMethod === "cash"
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Cash
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("charge");
                          setAmountPaid("0");
                          setError("");
                        }}
                        disabled={submitting}
                        className={`h-11 rounded-lg border text-sm font-semibold transition ${
                          paymentMethod === "charge"
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Charge
                      </button>
                    </div>
                  </div>

                  {/* CUSTOMER */}

                  <div className="mt-5">
                    <label
                      htmlFor="sale-customer"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Customer
                      {paymentMethod === "charge" && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </label>

                    <select
                      id="sale-customer"
                      value={selectedCustomerId ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;

                        setSelectedCustomerId(value ? Number(value) : null);

                        setError("");
                      }}
                      disabled={submitting || customerLoading}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">{defaultCustomer}</option>

                      {customers
                        .filter((customer) => customer.is_active)
                        .map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                            {customer.business_type
                              ? ` - ${customer.business_type}`
                              : ""}
                          </option>
                        ))}
                    </select>

                    {customerLoading && (
                      <p className="mt-1 text-xs text-gray-400">
                        Loading customers...
                      </p>
                    )}

                    {paymentMethod === "charge" && !selectedCustomer && (
                      <p className="mt-1 text-xs text-gray-500">
                        A customer is required for charge payment.
                      </p>
                    )}
                  </div>

                  {/* TERM */}

                  {paymentMethod === "charge" && (
                    <>
                      <div className="mt-5">
                        <label
                          htmlFor="sale-term"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Payment Term
                          <span className="ml-1 text-red-500">*</span>
                        </label>

                        <select
                          id="sale-term"
                          value={termMonths ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;

                            setTermMonths(value ? Number(value) : null);

                            setError("");
                          }}
                          disabled={submitting}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Select term</option>

                          {TERM_OPTIONS.map((months) => (
                            <option key={months} value={months}>
                              {months} {months === 1 ? "Month" : "Months"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* DUE DATE */}

                      {dueDate && (
                        <div className="mt-4 flex justify-between rounded-lg bg-gray-50 p-3">
                          <span className="text-sm text-gray-600">
                            Due Date
                          </span>

                          <span className="font-bold text-gray-900">
                            {formatDate(dueDate)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* AMOUNT PAID */}

                  {paymentMethod === "cash" && (
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
                  )}

                  {/* CHANGE */}

                  {paymentMethod === "cash" && (
                    <div className="mt-4 flex justify-between rounded-lg bg-gray-50 p-3">
                      <span className="text-sm text-gray-600">Change</span>

                      <span className="font-bold text-gray-900">
                        {formatCurrency(changeAmount)}
                      </span>
                    </div>
                  )}

                  {/* CHARGE INFORMATION */}

                  {paymentMethod === "charge" &&
                    selectedCustomer &&
                    termMonths && (
                      <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-indigo-600">Customer</span>

                          <span className="font-semibold text-indigo-900">
                            {selectedCustomer.name}
                          </span>
                        </div>

                        <div className="mt-1 flex justify-between text-sm">
                          <span className="text-indigo-600">Term</span>

                          <span className="font-semibold text-indigo-900">
                            {termMonths} {termMonths === 1 ? "Month" : "Months"}
                          </span>
                        </div>

                        {dueDate && (
                          <div className="mt-1 flex justify-between text-sm">
                            <span className="text-indigo-600">Due Date</span>

                            <span className="font-semibold text-indigo-900">
                              {formatDate(dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* ======================================================
                    RIGHT SIDE - ADJUSTMENTS
                ====================================================== */}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-gray-700">
                    Adjustments
                  </p>

                  {/* DISCOUNT / TAX */}

                  <div className="grid grid-cols-2 gap-3">
                    {/* DISCOUNT */}

                    <div>
                      <label
                        htmlFor="sale-discount"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Discount (%)
                      </label>

                      <div className="relative">
                        <input
                          id="sale-discount"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={discount}
                          onChange={(event) => {
                            setDiscount(event.target.value);
                            setError("");
                          }}
                          onFocus={(event) => event.target.select()}
                          disabled={submitting}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-right text-lg font-semibold text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                          %
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatCurrency(discountAmount)}
                      </p>
                    </div>

                    {/* TAX */}

                    <div>
                      <label
                        htmlFor="sale-tax"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Tax (%)
                      </label>

                      <div className="relative">
                        <input
                          id="sale-tax"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={tax}
                          onChange={(event) => {
                            setTax(event.target.value);
                            setError("");
                          }}
                          onFocus={(event) => event.target.select()}
                          disabled={submitting || taxType === "non_vat"}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-right text-lg font-semibold text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                          %
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {taxType === "vat_inclusive"
                          ? "VAT included"
                          : taxType === "vat_exclusive"
                            ? "VAT added"
                            : "Non-VAT"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatCurrency(taxAmount)}
                      </p>
                    </div>
                  </div>

                  {/* ADJUSTMENT SUMMARY */}

                  <div className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>

                      <span>{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Discount ({discountRate.toFixed(2)}%)</span>

                      <span className="text-red-600">
                        - {formatCurrency(discountAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>
                        {taxType === "non_vat" ? "Tax" : "VAT"} (
                        {taxRate.toFixed(2)}%)
                      </span>

                      <span className="text-gray-700">
                        {taxType === "vat_inclusive" ? "" : "+ "}
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-gray-200 pt-3 text-2xl font-bold text-gray-900">
                      <span>Total</span>

                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
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

              {paymentMethod === "cash" &&
                amountPaid &&
                insufficientPayment && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Amount paid is insufficient.
                  </div>
                )}

              {/* CHARGE VALIDATION */}

              {paymentMethod === "charge" &&
                (!selectedCustomerId || !termMonths) && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Select a customer and payment term before completing the
                    sale.
                  </div>
                )}
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 gap-3 border-t border-gray-200 bg-white p-5">
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
                disabled={
                  submitting ||
                  insufficientPayment ||
                  (paymentMethod === "cash" && !amountPaid) ||
                  (paymentMethod === "charge" &&
                    (!selectedCustomerId || !termMonths))
                }
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
