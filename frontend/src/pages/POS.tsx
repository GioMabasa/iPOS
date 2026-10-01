import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import POSProductCatalog from "../components/pos/POSProductCatalog";

import { getPOSProducts, type POSProduct } from "../services/inventoryService";
import { createSale } from "../services/saleService";
import { getCustomers } from "../services/customerService";
import { getSettings } from "../services/settingService";
import { getBirSettings } from "../services/birSettingService";

import POSWorkspace from "../components/pos/POSWorkspace";

import type { CreateSaleRequest } from "../types/sale";
import type { Customer } from "../types/customer";
import type { TaxType } from "../types/birSetting";

import POSPaymentModal from "../components/pos/POSPaymentModal";
import ErrorMessage from "../components/ErrorMessage";

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
  | Preserve Scanner Error
  |--------------------------------------------------------------------------
  */

  const preserveScannerErrorRef = useRef(false);

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

  /*
  |--------------------------------------------------------------------------
  | Cash Change Modal
  |--------------------------------------------------------------------------
  */

  const [showChangeModal, setShowChangeModal] = useState(false);

  const [changeModalData, setChangeModalData] = useState({
    subtotal: 0,
    total: 0,
    cashReceived: 0,
    change: 0,
  });

  const [amountPaid, setAmountPaid] = useState("0");

  const [discount, setDiscount] = useState("0");

  const [tax, setTax] = useState("0");

  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "charge">("cash");

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [defaultCustomer, setDefaultCustomer] = useState("Walk-in Customer");

  const [businessName, setBusinessName] = useState("iPOS");

  const [businessAddress, setBusinessAddress] = useState("");

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

  /*
  |--------------------------------------------------------------------------
  | Payment Input Focus
  |--------------------------------------------------------------------------
  */

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
  | Error Close Handler
  |--------------------------------------------------------------------------
  */

  const handleErrorClose = useCallback(() => {
    setError("");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Escape Key - Close POS Error
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape" && error) {
        handleErrorClose();
      }
    }

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [error, handleErrorClose]);

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

      const preserveScannerError = preserveScannerErrorRef.current;

      preserveScannerErrorRef.current = false;

      if (!preserveScannerError) {
        setError("");
      }

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

  function handlePreviousProductPage() {
    if (currentPage <= 1 || fetching) return;

    void loadInventory(currentPage - 1, search);
  }

  function handleNextProductPage() {
    if (currentPage >= lastPage || fetching) return;

    void loadInventory(currentPage + 1, search);
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

      setBusinessName(response.data.business_name?.trim() || "iPOS");

      setBusinessAddress(response.data.business_address?.trim() || "");
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

  function addToCart(product: POSProduct): boolean {
    const availableStock = toNumber(product.stock);

    if (availableStock <= 0) {
      setError(`${product.name} is out of stock.`);

      return false;
    }

    setError("");

    let added = true;

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product.product_id === product.product_id,
      );

      if (existing) {
        if (existing.quantity >= availableStock) {
          setError(`Maximum stock reached for ${product.name}`);

          added = false;

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

    return added;
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

    setError("");

    try {
      const response = await getPOSProducts({
        page: 1,
        per_page: PRODUCTS_PER_PAGE,
        search: scannedValue,
      });

      const product = response.data.find(
        (item) => item.barcode?.trim() === scannedValue,
      );

      if (product) {
        const added = addToCart(product);

        if (!added) {
          preserveScannerErrorRef.current = true;

          setSearch("");

          setCurrentPage(1);

          focusSearchInput();

          return;
        }

        setSearch("");

        setCurrentPage(1);

        setSuccessMessage(`${product.name} added to cart.`);

        setTimeout(() => {
          setSuccessMessage("");
        }, 2000);

        focusSearchInput();

        return;
      }

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
  | Escape Key - Close Payment Modal
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (showPaymentModal) {
        closePaymentModal();
      }
    }

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showPaymentModal, submitting, taxType, vatRate]);

  /*
  |--------------------------------------------------------------------------
  | Close Change Modal
  |--------------------------------------------------------------------------
  */

  function closeChangeModal() {
    // Close change modal
    setShowChangeModal(false);

    // Make sure payment modal/register flow is closed
    setShowPaymentModal(false);

    // Reset payment state for the next transaction
    setPaymentMethod("cash");
    setAmountPaid("0");
    setDiscount("0");
    setTax("0");
    setNotes("");
    setSelectedCustomerId(null);
    setTermMonths(1);

    // Clear success message after a short delay
    setSuccessMessage("Sale completed successfully!");

    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    // Ready for the next barcode scan
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

      const sale = response.data;

      /*
      |--------------------------------------------------------------------------
      | Save Completed Sale Values
      |--------------------------------------------------------------------------
      |
      | These values must be saved before clearing the cart/payment fields.
      | The Change Modal must use the actual saved sale values from Laravel.
      |
      */

      if (paymentMethod === "cash") {
        setChangeModalData({
          subtotal: Number(sale.subtotal),
          total: Number(sale.total),
          cashReceived: Number(sale.amount_paid),
          change: Number(sale.change_amount),
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Native Tauri Thermal Receipt
      |--------------------------------------------------------------------------
      |
      | Receipt is printed directly through the Windows RAW printer
      | spooler using the Generic / Text Only printer.
      |
      */

      try {
        await invoke("print_thermal_receipt", {
          receipt: {
            business_name: businessName || "iPOS",

            business_address: businessAddress || "",

            receipt_number: sale.invoice_number,

            date: sale.sale_date,

            cashier: sale.user?.name || "Cashier",

            items: sale.items.map((item) => ({
              name: item.product?.name || `Product #${item.product_id}`,

              qty: Number(item.quantity),

              price: Number(item.unit_price),
            })),

            subtotal: Number(sale.subtotal),

            discount: Number(sale.discount),

            tax: Number(sale.tax),

            total: Number(sale.total),

            payment_type: sale.payment_method,

            cash_received:
              sale.payment_method === "cash" ? Number(sale.amount_paid) : null,

            change:
              sale.payment_method === "cash"
                ? Number(sale.change_amount)
                : null,

            customer_name:
              sale.customer?.name || defaultCustomer || "Walk-in Customer",

            term_months:
              sale.payment_method === "charge" ? sale.term_months : null,

            due_date: sale.payment_method === "charge" ? sale.due_date : null,
          },
        });

        console.log("Native thermal receipt printed successfully.");
      } catch (printError) {
        console.error("Native thermal receipt error:", printError);

        setSuccessMessage(
          "Sale completed successfully, but the receipt could not be printed.",
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Cash Drawer
      |--------------------------------------------------------------------------
      |
      | Only CASH payments open the drawer.
      | CHARGE payments do not open the drawer.
      |
      */

      if (paymentMethod === "cash") {
        try {
          const drawerResult = await invoke<string>("open_cash_drawer");

          console.log("Cash drawer result:", drawerResult);
        } catch (drawerError) {
          console.error("Cash drawer error:", drawerError);

          setSuccessMessage(
            "Sale completed successfully, but the cash drawer could not be opened.",
          );
        }
      }

      window.dispatchEvent(new Event("ipos:sale-completed"));

      /*
      |--------------------------------------------------------------------------
      | Reset Payment / Cart
      |--------------------------------------------------------------------------
      */

      setShowPaymentModal(false);

      setCart([]);

      setAmountPaid("0");

      setDiscount("0");

      setTax(taxType === "non_vat" ? "0" : vatRate);

      setNotes("");

      setSelectedCustomerId(null);

      setTermMonths(null);

      /*
      |--------------------------------------------------------------------------
      | Cash Change Modal
      |--------------------------------------------------------------------------
      |
      | For CASH:
      |   Receipt → Drawer → Change Modal
      |
      | For CHARGE:
      |   Receipt → Complete → Search focus
      |
      */

      if (paymentMethod === "cash") {
        setShowChangeModal(true);
      } else {
        setPaymentMethod("cash");

        setSuccessMessage("Sale completed successfully!");

        setTimeout(() => {
          setSuccessMessage("");
        }, 4000);

        focusSearchInput();
      }

      /*
      |--------------------------------------------------------------------------
      | Refresh POS Products
      |--------------------------------------------------------------------------
      */

      await loadInventory(currentPage, search);

      if (paymentMethod === "charge") {
        setTimeout(() => {
          setSuccessMessage("");
        }, 4000);

        focusSearchInput();
      }
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
                  d="M21 12a9 9 0 0 1-9 9v-3a6 6 0 0 0 6-6h3Z"
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
    <div className="min-h-full bg-gray-50">
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

        <div className="hidden items-center gap-2 rounded-xl border bg-indigo-500 px-3 py-2 p-3 text-white shadow-sm sm:flex">
          <kbd className="rounded-md bg-indigo-700 px-2 py-1 text-xs font-bold text-white">
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

      <ErrorMessage
        message={error || null}
        onClose={handleErrorClose}
        title="POS Error"
        duration={5000}
      />

      {/* ========================================================
          POS LAYOUT
      ======================================================== */}

      <POSWorkspace
        products={products}
        search={search}
        currentPage={currentPage}
        lastPage={lastPage}
        fetching={fetching}
        productsPerPage={PRODUCTS_PER_PAGE}
        searchInputRef={searchInputRef}
        cart={cart}
        subtotal={subtotal}
        total={total}
        onSearchChange={setSearch}
        onBarcodeScan={handleBarcodeScan}
        onAddToCart={addToCart}
        getCartQuantity={getCartQuantity}
        onPreviousPage={handlePreviousProductPage}
        onNextPage={handleNextProductPage}
        updateQuantity={updateQuantity}
        onClearCart={() =>
          setConfirmState({
            type: "clear",
          })
        }
        onRemoveItem={(productId) =>
          setConfirmState({
            type: "remove",
            productId,
          })
        }
        onProceedToPayment={openPaymentModal}
        toNumber={toNumber}
        formatCurrency={formatCurrency}
      />

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
                    d="M12 9v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75 3L13.7 3.8a2 2 0 0 0-3.4 0Z"
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
          CASH CHANGE MODAL
      ======================================================== */}

      {showChangeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="bg-green-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <svg
                    className="h-6 w-6"
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

                <div>
                  <h2 className="text-lg font-bold">Payment Successful</h2>

                  <p className="text-sm text-green-100">
                    Cash sale completed successfully.
                  </p>
                </div>
              </div>
            </div>

            {/* BODY */}

            <div className="p-6">
              <div className="space-y-4">
                {/* SUBTOTAL */}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Subtotal
                  </span>

                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(changeModalData.subtotal)}
                  </span>
                </div>

                {/* TOTAL */}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Total
                  </span>

                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(changeModalData.total)}
                  </span>
                </div>

                {/* CASH RECEIVED */}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Cash Received
                  </span>

                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(changeModalData.cashReceived)}
                  </span>
                </div>

                <div className="my-4 border-t border-gray-200" />

                {/* CHANGE */}

                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <p className="text-center text-sm font-semibold text-green-700">
                    CHANGE
                  </p>

                  <p className="mt-1 text-center text-4xl font-extrabold tracking-tight text-green-700">
                    {formatCurrency(changeModalData.change)}
                  </p>
                </div>

                {/* GUIDE */}

                <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Please give the customer the change shown above.
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Cash drawer command has been sent to the printer.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              <button
                type="button"
                onClick={closeChangeModal}
                autoFocus
                className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAYMENT MODAL
      ======================================================== */}

      <POSPaymentModal
        showPaymentModal={showPaymentModal}
        submitting={submitting}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        customers={customers}
        customerLoading={customerLoading}
        defaultCustomer={defaultCustomer}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        selectedCustomer={selectedCustomer}
        termMonths={termMonths}
        setTermMonths={setTermMonths}
        termOptions={TERM_OPTIONS}
        dueDate={dueDate}
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        amountPaidInputRef={amountPaidInputRef}
        discount={discount}
        setDiscount={setDiscount}
        tax={tax}
        setTax={setTax}
        taxType={taxType}
        notes={notes}
        setNotes={setNotes}
        numericAmountPaid={numericAmountPaid}
        insufficientPayment={insufficientPayment}
        changeAmount={changeAmount}
        subtotal={subtotal}
        discountRate={discountRate}
        discountAmount={discountAmount}
        taxRate={taxRate}
        taxAmount={taxAmount}
        total={total}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onClose={closePaymentModal}
        onCompleteSale={handleCompleteSale}
        error={error}
        onClearError={handleErrorClose}
      />
    </div>
  );
}
