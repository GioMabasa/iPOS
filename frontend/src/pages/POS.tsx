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
          <div className="text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
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
                  d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"
                />
              </svg>
            </div>

            <p className="mt-3 text-sm font-semibold text-gray-600">
              Loading inventory...
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Preparing the point of sale.
            </p>
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
                d="M4 7h16M4 7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M4 7l2-3h12l2 3M7 11h4m-4 4h2"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Point of Sale
            </h1>

            <p className="mt-0.5 text-sm text-gray-500">
              Scan a barcode or select a product to create a sale.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-xl p-3 bg-indigo-500 text-white shadow-sm border  px-3 py-2 shadow-sm sm:flex">
          <kbd className="rounded-md bg-indigo-700 px-2 py-1 text-xs  font-bold text-white">
            F4
          </kbd>

          <span className="text-xs text-white">Payment</span>
        </div>
      </div>

      {/* ========================================================
          SUCCESS MESSAGE
      ======================================================== */}

      {successMessage && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100">
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
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <span>{successMessage}</span>
        </div>
      )}

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
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
                  d="M12 8v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg text-red-400 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ========================================================
          POS LAYOUT
      ======================================================== */}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ======================================================
            PRODUCTS
        ====================================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* SEARCH */}

          <div className="border-b border-gray-100 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Product Catalog
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Search or scan to add products.
                </p>
              </div>

              <span className="hidden rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500 sm:inline-flex">
                {PRODUCTS_PER_PAGE} per page
              </span>
            </div>

            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m20 20-4-4"
                />
              </svg>

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
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-400">
                Barcode scanner: scan the product and it will automatically add
                it to the cart.
              </p>

              {fetching && (
                <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-blue-600">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                  Searching
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT GRID */}

          <div className="p-4 sm:p-5">
            {products.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <svg
                    className="h-7 w-7"
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

                <h3 className="mt-4 text-sm font-semibold text-gray-800">
                  No products found
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Try a different product name, SKU, or barcode.
                </p>
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
                        className={`group flex flex-col rounded-2xl border p-4 transition ${
                          outOfStock
                            ? "border-gray-200 bg-gray-50"
                            : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        }`}
                      >
                        {/* PRODUCT HEADER */}

                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              outOfStock
                                ? "bg-gray-200 text-gray-400"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {product.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-gray-900">
                              {product.name}
                            </h3>

                            <p className="mt-1 truncate text-[11px] text-gray-400">
                              SKU:{" "}
                              <span className="font-medium text-gray-600">
                                {product.sku}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* STATUS */}

                        <div className="mt-3">
                          {outOfStock ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Out of Stock
                            </span>
                          ) : product.is_low_stock ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              In Stock
                            </span>
                          )}
                        </div>

                        {/* BARCODE */}

                        <div className="mt-3 flex min-h-[24px] items-center gap-2 text-[11px] text-gray-400">
                          <span>Barcode</span>

                          {product.barcode ? (
                            <span className="truncate rounded-md bg-gray-100 px-1.5 py-0.5 font-mono font-medium text-gray-600">
                              {product.barcode}
                            </span>
                          ) : (
                            <span className="italic text-gray-400">
                              No barcode
                            </span>
                          )}
                        </div>

                        {/* PRICE */}

                        <div className="mt-3">
                          <p
                            className={`text-xl font-bold ${
                              outOfStock ? "text-gray-500" : "text-blue-600"
                            }`}
                          >
                            {formatCurrency(product.selling_price)}
                          </p>
                        </div>

                        {/* STOCK */}

                        <div className="mt-3 rounded-xl bg-gray-50 p-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400">Available</span>

                            <span className="font-semibold text-gray-700">
                              {availableStock}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[11px]">
                            <span className="text-gray-400">In Cart</span>

                            <span className="font-semibold text-gray-700">
                              {inCart}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
                            <span className="font-semibold text-gray-600">
                              Remaining
                            </span>

                            <span
                              className={`font-bold ${
                                remaining === 0
                                  ? "text-red-600"
                                  : "text-blue-600"
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
                          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
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
                  <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">
                      Page{" "}
                      <span className="font-semibold text-gray-700">
                        {currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-700">
                        {lastPage}
                      </span>
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
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <svg
                          className="h-3.5 w-3.5"
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

                      <button
                        type="button"
                        onClick={() => {
                          if (currentPage < lastPage) {
                            loadInventory(currentPage + 1, search);
                          }
                        }}
                        disabled={currentPage === lastPage || fetching}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m9 18 6-6-6-6"
                          />
                        </svg>
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
                    d="M3 4h2l2 11h10l2-8H6m3 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Current Sale
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  {cart.length} product
                  {cart.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    type: "clear",
                  })
                }
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
                      d="M3 4h2l2 11h10l2-8H6m3 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
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
                                setConfirmState({
                                  type: "remove",
                                  productId: item.product.product_id,
                                })
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
                          {/* DECREASE */}

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
                            className="h-9 w-12 border-x border-gray-200 bg-white text-center text-sm font-bold text-gray-900 outline-none"
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
                <span className="text-sm font-semibold text-gray-600">
                  Total
                </span>

                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openPaymentModal}
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

      {/* ========================================================
          CONFIRMATION MODAL
      ======================================================== */}

      {confirmState.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
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
                    d="M12 9v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {confirmState.type === "clear"
                  ? "Clear Cart?"
                  : "Remove Product?"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {confirmState.type === "clear"
                  ? "Are you sure you want to remove all products from the cart?"
                  : "Are you sure you want to remove this product from the cart?"}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmState({
                    type: null,
                  });

                  focusSearchInput();
                }}
                className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
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
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />

                    <path strokeLinecap="round" d="M3 10h18M7 15h3" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">Payment</h3>

                  <p className="mt-0.5 text-xs text-gray-400">
                    Complete the sale transaction.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Close payment"
              >
                ×
              </button>
            </div>

            {/* CONTENT */}

            <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/60 p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-2">
                {/* ======================================================
                    LEFT SIDE - PAYMENT DETAILS
                ====================================================== */}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-900">
                      Payment Details
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Choose how the customer will pay.
                    </p>
                  </div>

                  {/* PAYMENT METHOD */}

                  <div>
                    <label className="mb-2.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
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
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${
                          paymentMethod === "cash"
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect x="3" y="6" width="18" height="12" rx="2" />

                          <circle cx="12" cy="12" r="2.5" />

                          <path d="M7 9h.01M17 15h.01" />
                        </svg>
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
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${
                          paymentMethod === "charge"
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect x="3" y="5" width="18" height="14" rx="2" />

                          <path d="M7 10h10M7 14h6" />
                        </svg>
                        Charge
                      </button>
                    </div>
                  </div>

                  {/* CUSTOMER */}

                  <div className="mt-5">
                    <label
                      htmlFor="sale-customer"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
                    >
                      Customer
                      {paymentMethod === "charge" && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </label>

                    <div className="relative">
                      <select
                        id="sale-customer"
                        value={selectedCustomerId ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;

                          setSelectedCustomerId(value ? Number(value) : null);

                          setError("");
                        }}
                        disabled={submitting || customerLoading}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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

                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m6 9 6 6 6-6"
                        />
                      </svg>
                    </div>

                    {customerLoading && (
                      <p className="mt-1.5 text-xs text-blue-500">
                        Loading customers...
                      </p>
                    )}

                    {paymentMethod === "charge" && !selectedCustomer && (
                      <p className="mt-1.5 text-xs text-gray-400">
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
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
                        >
                          Payment Term
                          <span className="ml-1 text-red-500">*</span>
                        </label>

                        <div className="relative">
                          <select
                            id="sale-term"
                            value={termMonths ?? ""}
                            onChange={(event) => {
                              const value = event.target.value;

                              setTermMonths(value ? Number(value) : null);

                              setError("");
                            }}
                            disabled={submitting}
                            className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          >
                            <option value="">Select term</option>

                            {TERM_OPTIONS.map((months) => (
                              <option key={months} value={months}>
                                {months} {months === 1 ? "Month" : "Months"}
                              </option>
                            ))}
                          </select>

                          <svg
                            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m6 9 6 6 6-6"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* DUE DATE */}

                      {dueDate && (
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-3.5">
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 text-blue-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <rect x="3" y="4" width="18" height="17" rx="2" />

                              <path
                                strokeLinecap="round"
                                d="M16 2v4M8 2v4M3 10h18"
                              />
                            </svg>

                            <span className="text-sm text-blue-600">
                              Due Date
                            </span>
                          </div>

                          <span className="font-bold text-blue-900">
                            {formatDate(dueDate)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* AMOUNT PAID */}

                  {paymentMethod === "cash" && (
                    <div className="mt-5">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                        Amount Paid
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                          ₱
                        </span>

                        <input
                          ref={amountPaidInputRef}
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountPaid}
                          onChange={(event) =>
                            setAmountPaid(event.target.value)
                          }
                          onFocus={(event) => event.target.select()}
                          disabled={submitting}
                          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-xl font-bold text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>
                  )}

                  {/* CHANGE */}

                  {paymentMethod === "cash" && numericAmountPaid > total && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4">
                      <span className="text-sm font-semibold text-green-600">
                        Change
                      </span>

                      <span className="text-lg font-bold text-green-700">
                        {formatCurrency(changeAmount)}
                      </span>
                    </div>
                  )}

                  {/* CHARGE INFORMATION */}

                  {paymentMethod === "charge" &&
                    selectedCustomer &&
                    termMonths && (
                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <circle cx="12" cy="8" r="3" />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5"
                              />
                            </svg>
                          </div>

                          <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                            Charge Summary
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-blue-600">Customer</span>

                          <span className="max-w-[180px] truncate font-semibold text-blue-900">
                            {selectedCustomer.name}
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-blue-600">Term</span>

                          <span className="font-semibold text-blue-900">
                            {termMonths} {termMonths === 1 ? "Month" : "Months"}
                          </span>
                        </div>

                        {dueDate && (
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-blue-600">Due Date</span>

                            <span className="font-semibold text-blue-900">
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

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-900">
                      Adjustments
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Apply discount and tax before completing the sale.
                    </p>
                  </div>

                  {/* DISCOUNT / TAX */}

                  <div className="grid grid-cols-2 gap-3">
                    {/* DISCOUNT */}

                    <div>
                      <label
                        htmlFor="sale-discount"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
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
                          className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-9 text-right text-lg font-bold text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                          %
                        </span>
                      </div>

                      <p className="mt-1.5 text-right text-[11px] text-red-500">
                        - {formatCurrency(discountAmount)}
                      </p>
                    </div>

                    {/* TAX */}

                    <div>
                      <label
                        htmlFor="sale-tax"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
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
                          className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-9 text-right text-lg font-bold text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                          %
                        </span>
                      </div>

                      <p className="mt-1.5 text-right text-[11px] text-gray-400">
                        {taxType === "vat_inclusive"
                          ? "VAT included"
                          : taxType === "vat_exclusive"
                            ? "VAT added"
                            : "Non-VAT"}
                      </p>

                      <p className="mt-1 text-right text-[11px] text-gray-500">
                        {formatCurrency(taxAmount)}
                      </p>
                    </div>
                  </div>

                  {/* ADJUSTMENT SUMMARY */}

                  <div className="mt-6 rounded-xl bg-gray-50 p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>

                        <span className="font-medium text-gray-700">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-500">
                        <span>Discount ({discountRate.toFixed(2)}%)</span>

                        <span className="font-medium text-red-500">
                          - {formatCurrency(discountAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-500">
                        <span>
                          {taxType === "non_vat" ? "Tax" : "VAT"} (
                          {taxRate.toFixed(2)}%)
                        </span>

                        <span className="font-medium text-gray-700">
                          {taxType === "vat_inclusive" ? "" : "+ "}
                          {formatCurrency(taxAmount)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                        <span className="text-sm font-semibold text-indigo-600">
                          Total
                        </span>

                        <span className="text-3xl font-bold text-indigo-900">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NOTES */}

              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Notes
                  <span className="ml-1 font-normal normal-case tracking-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={submitting}
                  rows={3}
                  placeholder="Optional sale notes..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* INSUFFICIENT */}

              {paymentMethod === "cash" &&
                amountPaid &&
                insufficientPayment && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75 3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                      />
                    </svg>
                    Amount paid is insufficient.
                  </div>
                )}

              {/* CHARGE VALIDATION */}

              {paymentMethod === "charge" &&
                (!selectedCustomerId || !termMonths) && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75 3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                      />
                    </svg>
                    Select a customer and payment term before completing the
                    sale.
                  </div>
                )}
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white p-5 sm:p-6">
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={submitting}
                className="h-11 flex-1 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Sale
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
                        d="m5 12 14 0m-6-6 6 6-6 6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
