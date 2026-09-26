import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  createPurchase,
  getPurchases,
  getPurchase,
  exportPurchases,
} from "../services/purchaseService";

import PurchaseFilters, {
  type PurchasePeriod,
} from "../components/purchases/PurchaseFilters";

import PurchaseTable from "../components/purchases/PurchaseTable";

import AddPurchaseModal from "../components/purchases/AddPurchaseModal";

import { getProducts } from "../services/productService";

import type { Product } from "../types/product";

import type {
  Purchase,
  PurchaseItemFormData,
  CreatePurchaseRequest,
} from "../types/purchase";

import type { Supplier } from "../types/supplier";

import { getSuppliers } from "../services/supplierService";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const emptyItem: PurchaseItemFormData = {
  product_id: 0,
  quantity: 1,
  unit_cost: 0,
};

const getToday = () => {
  const date = new Date();

  return date.toISOString().split("T")[0];
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function Purchases() {
  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [purchaseSuppliers, setPurchaseSuppliers] = useState<Supplier[]>([]);

  const [loadingPurchaseSuppliers, setLoadingPurchaseSuppliers] =
    useState(false);
  const [exporting, setExporting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [currentPage, setCurrentPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [from, setFrom] = useState<number | null>(null);

  const [to, setTo] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [saving, setSaving] = useState(false);

  const [loadingPurchase, setLoadingPurchase] = useState(false);

  const [error, setError] = useState("");

  const [modalError, setModalError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Add Purchase Modal
  |--------------------------------------------------------------------------
  */

  const [showAddModal, setShowAddModal] = useState(false);

  const [supplierId, setSupplierId] = useState<number>(0);

  const [purchaseDate, setPurchaseDate] = useState(getToday());

  const [referenceNumber, setReferenceNumber] = useState("");

  const [discount, setDiscount] = useState(0);

  const [tax, setTax] = useState(0);

  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseItemFormData[]>([
    {
      ...emptyItem,
    },
  ]);

  /*
  |--------------------------------------------------------------------------
  | Data Loaded Flags
  |--------------------------------------------------------------------------
  */

  const [productsLoaded, setProductsLoaded] = useState(false);

  const [suppliersLoaded, setSuppliersLoaded] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Product Picker Modal
  |--------------------------------------------------------------------------
  */

  const [showProductPicker, setShowProductPicker] = useState(false);

  const [productPickerItemIndex, setProductPickerItemIndex] = useState<
    number | null
  >(null);

  const [productSearch, setProductSearch] = useState("");

  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);

  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState<
    number | ""
  >("");
  const [purchasePeriod, setPurchasePeriod] = useState<PurchasePeriod>("all");

  const [purchaseStartDate, setPurchaseStartDate] = useState("");
  const [purchaseEndDate, setPurchaseEndDate] = useState("");

  /*
  |--------------------------------------------------------------------------
  | View Purchase Modal
  |--------------------------------------------------------------------------
  */

  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Purchases
  |--------------------------------------------------------------------------
  */

  const loadPurchases = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchases(page, 20, {
        search: search.trim(),
        supplier_id: purchaseSupplierFilter,
        period: purchasePeriod,
        start_date: purchasePeriod === "custom" ? purchaseStartDate : undefined,
        end_date: purchasePeriod === "custom" ? purchaseEndDate : undefined,
      });

      setPurchases(response.data);
      setCurrentPage(response.pagination.current_page);
      setLastPage(response.pagination.last_page);
      setTotal(response.pagination.total);
      setFrom(response.pagination.from);
      setTo(response.pagination.to);
    } catch (err) {
      console.error(err);
      setError("Failed to load purchases.");
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Export
  |--------------------------------------------------------------------------
  */
  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");

      const blob = await exportPurchases({
        search: search.trim() || undefined,
        supplier_id:
          purchaseSupplierFilter !== "" ? purchaseSupplierFilter : undefined,
        period: purchasePeriod !== "all" ? purchasePeriod : undefined,
        start_date:
          purchasePeriod === "custom"
            ? purchaseStartDate || undefined
            : undefined,
        end_date:
          purchasePeriod === "custom"
            ? purchaseEndDate || undefined
            : undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "purchases.xlsx";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to export purchases.");
    } finally {
      setExporting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Products
  |--------------------------------------------------------------------------
  */

  async function loadProducts() {
    if (productsLoaded || loadingProducts) {
      return;
    }

    try {
      setLoadingProducts(true);

      const response = await getProducts({
        page: 1,
        per_page: 100,
      });

      const activeProducts = response.data.filter(
        (product) => product.is_active,
      );

      setProducts(activeProducts);

      setProductsLoaded(true);
    } catch (err) {
      console.error("Load products error:", err);

      setProducts([]);

      setError("Failed to load products.");
    } finally {
      setLoadingProducts(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load Suppliers
  |--------------------------------------------------------------------------
  */

  async function loadSuppliers() {
    if (suppliersLoaded || loadingSuppliers) {
      return;
    }

    try {
      setLoadingSuppliers(true);

      setModalError("");

      const response = await getSuppliers({
        page: 1,
        per_page: 100,
      });

      setSuppliers(response.data);

      setSuppliersLoaded(true);
    } catch (err) {
      console.error("Load suppliers error:", err);

      setModalError("Failed to load suppliers. Please try again.");
    } finally {
      setLoadingSuppliers(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadPurchases(1);
  }, [
    search,
    purchaseSupplierFilter,
    purchasePeriod,
    purchaseStartDate,
    purchaseEndDate,
  ]);

  useEffect(() => {
    loadPurchaseSuppliers();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Product Picker Results
  |--------------------------------------------------------------------------
  */

  const filteredProducts = useMemo(() => {
    const keyword = productSearch.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.sku?.toLowerCase().includes(keyword) ||
        product.barcode?.toLowerCase().includes(keyword)
      );
    });
  }, [products, productSearch]);

  /*
  |--------------------------------------------------------------------------
  | Reset Product Picker
  |--------------------------------------------------------------------------
  */

  function resetProductPicker() {
    setProductSearch("");

    setHighlightedProductIndex(0);

    setProductPickerItemIndex(null);
  }

  /*
  |--------------------------------------------------------------------------
  | Open Product Picker
  |--------------------------------------------------------------------------
  */

  function openProductPicker(index: number) {
    if (saving || loadingProducts || products.length === 0) {
      return;
    }

    setProductPickerItemIndex(index);

    setProductSearch("");

    setHighlightedProductIndex(0);

    setShowProductPicker(true);

    setTimeout(() => {
      productSearchInputRef.current?.focus();
    }, 50);
  }

  /*
  |--------------------------------------------------------------------------
  | Close Product Picker
  |--------------------------------------------------------------------------
  */

  function closeProductPicker() {
    setShowProductPicker(false);

    resetProductPicker();
  }

  /*
  |--------------------------------------------------------------------------
  | Handle Product Selection
  |--------------------------------------------------------------------------
  */

  function selectProduct(product: Product) {
    if (productPickerItemIndex === null) {
      return;
    }

    handleProductChange(productPickerItemIndex, product.id);

    closeProductPicker();
  }

  /*
  |--------------------------------------------------------------------------
  | Product Picker Keyboard Navigation
  |--------------------------------------------------------------------------
  */

  function handleProductSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (filteredProducts.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setHighlightedProductIndex((current) =>
        current < filteredProducts.length - 1 ? current + 1 : 0,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setHighlightedProductIndex((current) =>
        current > 0 ? current - 1 : filteredProducts.length - 1,
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const keyword = productSearch.trim().toLowerCase();

      /*
       * Exact barcode / SKU match.
       *
       * This is useful for USB barcode scanners because
       * most scanners behave like a keyboard and send Enter
       * after the barcode.
       */
      const exactMatch = filteredProducts.find((product) => {
        const barcode = product.barcode?.toLowerCase() || "";

        const sku = product.sku?.toLowerCase() || "";

        return keyword !== "" && (barcode === keyword || sku === keyword);
      });

      if (exactMatch) {
        selectProduct(exactMatch);

        return;
      }

      /*
       * If there is no exact barcode/SKU match,
       * select the highlighted product.
       */
      const highlightedProduct =
        filteredProducts[highlightedProductIndex] || filteredProducts[0];

      if (highlightedProduct) {
        selectProduct(highlightedProduct);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();

      closeProductPicker();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Reset Purchase Form
  |--------------------------------------------------------------------------
  */

  function resetPurchaseForm() {
    setSupplierId(0);

    setPurchaseDate(getToday());

    setReferenceNumber("");

    setDiscount(0);

    setTax(0);

    setNotes("");

    setItems([
      {
        ...emptyItem,
      },
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | Open Add Modal
  |--------------------------------------------------------------------------
  */

  async function openAddModal() {
    resetPurchaseForm();

    setError("");

    setModalError("");

    setShowAddModal(true);

    await Promise.all([loadProducts(), loadSuppliers()]);
  }

  /*
  |--------------------------------------------------------------------------
  | Close Add Modal
  |--------------------------------------------------------------------------
  */

  function closeAddModal() {
    if (saving) {
      return;
    }

    closeProductPicker();

    setShowAddModal(false);

    setModalError("");

    resetPurchaseForm();
  }

  /*
  |--------------------------------------------------------------------------
  | Add Item
  |--------------------------------------------------------------------------
  */

  function addItem() {
    setItems((current) => [
      ...current,
      {
        ...emptyItem,
      },
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Item
  |--------------------------------------------------------------------------
  */

  function removeItem(index: number) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Update Item
  |--------------------------------------------------------------------------
  */

  function updateItem(
    index: number,
    field: keyof PurchaseItemFormData,
    value: number,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Handle Product Change
  |--------------------------------------------------------------------------
  */

  function handleProductChange(index: number, productId: number) {
    let unitCost = 0;

    if (supplierId && productId) {
      const product = products.find((product) => product.id === productId);

      const supplier = product?.suppliers?.find(
        (supplier) => supplier.id === supplierId,
      );

      unitCost = Number(supplier?.pivot?.cost_price ?? 0);
    }

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              product_id: productId,
              unit_cost: unitCost,
            }
          : item,
      ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Calculate Line Total
  |--------------------------------------------------------------------------
  */

  function getLineTotal(item: PurchaseItemFormData) {
    return item.quantity * item.unit_cost;
  }

  /*
  |--------------------------------------------------------------------------
  | Calculate Subtotal
  |--------------------------------------------------------------------------
  */

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + getLineTotal(item), 0);
  }, [items]);

  /*
  |--------------------------------------------------------------------------
  | Calculate Grand Total
  |--------------------------------------------------------------------------
  */

  const grandTotal = useMemo(() => {
    return subtotal - discount + tax;
  }, [subtotal, discount, tax]);

  /*
  |--------------------------------------------------------------------------
  | Format Currency
  |--------------------------------------------------------------------------
  */

  function formatCurrency(value: number | string) {
    return Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Handle Create Purchase
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setModalError("");

    setError("");

    if (!supplierId) {
      setModalError("Please select a supplier.");

      return;
    }

    if (!purchaseDate) {
      setModalError("Purchase date is required.");

      return;
    }

    if (items.length === 0) {
      setModalError("Please add at least one product.");

      return;
    }

    const invalidItem = items.some(
      (item) => !item.product_id || item.quantity <= 0 || item.unit_cost < 0,
    );

    if (invalidItem) {
      setModalError(
        "Please make sure all purchase items have a product, valid quantity, and valid unit cost.",
      );

      return;
    }

    if (discount > subtotal) {
      setModalError("Discount cannot be greater than the subtotal.");

      return;
    }

    if (grandTotal < 0) {
      setModalError("Purchase total cannot be negative.");

      return;
    }

    try {
      setSaving(true);

      const payload: CreatePurchaseRequest = {
        supplier_id: supplierId,

        purchase_date: purchaseDate,

        reference_number: referenceNumber.trim() || null,

        discount,

        tax,

        notes: notes.trim() || null,

        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      };

      await createPurchase(payload);

      setSuccessMessage("Purchase received successfully.");

      closeAddModal();

      await loadPurchases(1);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Create purchase error:", err);

      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string[]>;
            };
          };
        }
      )?.response;

      const validationErrors = response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];

        setModalError(
          firstError || response?.data?.message || "Failed to create purchase.",
        );
      } else {
        setModalError(response?.data?.message || "Failed to create purchase.");
      }
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load Suppliers
  |--------------------------------------------------------------------------
  */

  async function loadPurchaseSuppliers() {
    if (loadingPurchaseSuppliers || purchaseSuppliers.length > 0) {
      return;
    }

    try {
      setLoadingPurchaseSuppliers(true);

      const response = await getSuppliers({
        page: 1,
        per_page: 100,
        status: "active",
      });

      setPurchaseSuppliers(response.data);
    } catch (err) {
      console.error("Load purchase suppliers error:", err);
    } finally {
      setLoadingPurchaseSuppliers(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | View Purchase
  |--------------------------------------------------------------------------
  */

  async function openViewPurchase(purchase: Purchase) {
    try {
      setLoadingPurchase(true);

      setError("");

      setViewPurchase(purchase);

      const response = await getPurchase(purchase.id);

      setViewPurchase(response);
    } catch (err) {
      console.error("Load purchase details error:", err);

      setError("Failed to load purchase details.");
    } finally {
      setLoadingPurchase(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Close View Purchase
  |--------------------------------------------------------------------------
  */

  function closeViewPurchase() {
    setViewPurchase(null);
  }

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage || loading) {
      return;
    }

    loadPurchases(page);
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
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
                  d="M3 7.5 12 3l9 4.5M4.5 9.75V18L12 21.5 19.5 18V9.75M8 5l8.5 4.25M12 12v9"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Purchases Management
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage purchase orders and received inventory.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 border border-emerald-200"
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
                d="M12 3v12m0 0 4-4m-4 4-4-4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 15.75v1.5A2.25 2.25 0 0 0 6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-1.5"
              />
            </svg>
            {exporting ? "Exporting..." : "Export Purchases to Spreadsheet"}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            disabled={loadingProducts || loadingSuppliers}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14M5 12h14"
              />
            </svg>
            Add Purchase
          </button>
        </div>
      </div>

      {/* ================================================================
          SUCCESS MESSAGE
      ================================================================ */}

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* ================================================================
          PAGE ERROR
      ================================================================ */}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.73 3h15.14a2 2 0 0 0 1.73-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-red-400 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ================================================================
          MAIN CONTENT
      ================================================================ */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <PurchaseFilters
          search={search}
          onSearchChange={setSearch}
          purchaseSupplierFilter={purchaseSupplierFilter}
          onSupplierChange={setPurchaseSupplierFilter}
          purchaseSuppliers={purchaseSuppliers}
          loadingPurchaseSuppliers={loadingPurchaseSuppliers}
          purchasePeriod={purchasePeriod}
          onPeriodChange={setPurchasePeriod}
          purchaseStartDate={purchaseStartDate}
          onStartDateChange={setPurchaseStartDate}
          purchaseEndDate={purchaseEndDate}
          onEndDateChange={setPurchaseEndDate}
        />

        <PurchaseTable
          purchases={purchases}
          loading={loading}
          search={search}
          total={total}
          from={from}
          to={to}
          currentPage={currentPage}
          lastPage={lastPage}
          onViewPurchase={openViewPurchase}
          onPreviousPage={() => goToPage(currentPage - 1)}
          onNextPage={() => goToPage(currentPage + 1)}
        />
      </section>

      {/* ================================================================
          ADD PURCHASE MODAL
      ================================================================ */}

      <AddPurchaseModal
        show={showAddModal}
        saving={saving}
        modalError={modalError}
        onClearError={() => setModalError("")}
        onClose={closeAddModal}
        onSubmit={handleSubmit}
        supplierId={supplierId}
        onSupplierChange={setSupplierId}
        purchaseDate={purchaseDate}
        onPurchaseDateChange={setPurchaseDate}
        referenceNumber={referenceNumber}
        onReferenceNumberChange={setReferenceNumber}
        discount={discount}
        onDiscountChange={setDiscount}
        tax={tax}
        onTaxChange={setTax}
        notes={notes}
        onNotesChange={setNotes}
        suppliers={suppliers}
        loadingSuppliers={loadingSuppliers}
        products={products}
        loadingProducts={loadingProducts}
        items={items}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
        onOpenProductPicker={openProductPicker}
        subtotal={subtotal}
        grandTotal={grandTotal}
        getLineTotal={getLineTotal}
        formatCurrency={formatCurrency}
      />

      {/* ================================================================
          PRODUCT PICKER MODAL
      ================================================================ */}

      {showProductPicker && (
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
                onClick={closeProductPicker}
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
                  ref={productSearchInputRef}
                  type="text"
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                    setHighlightedProductIndex(0);
                  }}
                  onKeyDown={handleProductSearchKeyDown}
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
                        onClick={() => selectProduct(product)}
                        onMouseEnter={() => setHighlightedProductIndex(index)}
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
                              isHighlighted
                                ? "text-indigo-900"
                                : "text-slate-900"
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
                onClick={closeProductPicker}
                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          VIEW PURCHASE MODAL
      ================================================================ */}

      {viewPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-md sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
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
                      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                    />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                    Purchase Details
                  </h2>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <p className="text-xs font-medium text-slate-500">
                      {viewPurchase.purchase_number}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeViewPurchase}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-7 p-5 sm:p-6">
              {/* ====================================================
            PURCHASE INFORMATION
        ==================================================== */}

              <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Purchase Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Basic information about this received purchase.
                    </p>
                  </div>

                  <div className="hidden h-px flex-1 bg-gradient-to-r from-indigo-100 via-violet-100 to-transparent sm:block" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
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
                          d="M6 4h12v16H6z"
                        />
                        <path strokeLinecap="round" d="M9 8h6M9 12h6M9 16h3" />
                      </svg>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      Purchase Number
                    </p>

                    <p className="mt-1.5 text-sm font-bold text-slate-900">
                      {viewPurchase.purchase_number}
                    </p>
                  </div>

                  <div className="group rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                      >
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
                      </svg>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                      Purchase Date
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-700">
                      {new Date(viewPurchase.purchase_date).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>

                  <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
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
                          d="M4 20V9l8-5 8 5v11"
                        />
                        <path strokeLinecap="round" d="M8 20v-6h8v6M4 20h16" />
                      </svg>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                      Supplier
                    </p>

                    <p className="mt-1.5 text-sm font-bold text-slate-900">
                      {viewPurchase.supplier?.name || "—"}
                    </p>
                  </div>

                  <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
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
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      Status
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {viewPurchase.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* REFERENCE */}

              {viewPurchase.reference_number && (
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
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
                          d="M15 7h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3M9 17H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3"
                        />
                        <path strokeLinecap="round" d="M8 12h8" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        Reference Number
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {viewPurchase.reference_number}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================
            ITEMS
        ==================================================== */}

              <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Purchase Items
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Products included in this purchase.
                    </p>
                  </div>

                  <div className="hidden h-px flex-1 bg-gradient-to-r from-violet-100 via-indigo-100 to-transparent sm:block" />
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full min-w-[650px]">
                    <thead className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Product
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Quantity
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Unit Cost
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loadingPurchase ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center">
                            <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                              Loading purchase details...
                            </div>
                          </td>
                        </tr>
                      ) : viewPurchase.items &&
                        viewPurchase.items.length > 0 ? (
                        viewPurchase.items.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-indigo-50/40"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                                      d="m7 3 10 0 3 4v14H4V7l3-4Z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      d="M4 7h16M9 12h6M9 16h4"
                                    />
                                  </svg>
                                </div>

                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {item.product?.name || "Unknown Product"}
                                  </p>

                                  {item.product?.sku && (
                                    <p className="mt-1 text-xs font-medium text-slate-400">
                                      SKU: {item.product.sku}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
                                {item.quantity}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-medium text-slate-600">
                              ₱{formatCurrency(item.unit_cost)}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                              ₱{formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            No purchase items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ====================================================
            NOTES + TOTALS
        ==================================================== */}

              <div className="grid gap-5 lg:grid-cols-2">
                {/* NOTES */}

                <div>
                  {viewPurchase.notes ? (
                    <div className="h-full rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-white p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
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
                              d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
                            />
                            <path strokeLinecap="round" d="M8 8h8M8 12h8" />
                          </svg>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Notes
                          </p>

                          <p className="text-xs text-slate-500">
                            Additional purchase information
                          </p>
                        </div>
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {viewPurchase.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5">
                      <div className="text-center">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
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
                              d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
                            />
                          </svg>
                        </div>

                        <p className="text-sm font-medium text-slate-500">
                          No notes added.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* TOTALS */}

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50/60 to-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
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
                          d="M6 4h12M6 8h12M8 12h8M9 16h6M5 20h14"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Purchase Summary
                      </p>

                      <p className="text-xs text-slate-500">
                        Financial breakdown
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>

                      <span className="font-semibold text-slate-800">
                        ₱{formatCurrency(viewPurchase.subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Discount</span>

                      <span className="font-semibold text-slate-800">
                        ₱{formatCurrency(viewPurchase.discount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tax</span>

                      <span className="font-semibold text-slate-800">
                        ₱{formatCurrency(viewPurchase.tax)}
                      </span>
                    </div>

                    <div className="my-4 h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent" />

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Total Purchase
                        </p>

                        <p className="mt-1 text-2xl font-extrabold tracking-tight text-indigo-600">
                          ₱{formatCurrency(viewPurchase.total)}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          className="h-5 w-5"
                        >
                          <rect
                            x="3"
                            y="6"
                            width="18"
                            height="12"
                            rx="2"
                          ></rect>
                          <circle cx="12" cy="12" r="2.5"></circle>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 flex justify-end border-t border-slate-200/80 bg-white/95 p-5 backdrop-blur-md sm:px-6">
              <button
                type="button"
                onClick={closeViewPurchase}
                className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg active:translate-y-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
