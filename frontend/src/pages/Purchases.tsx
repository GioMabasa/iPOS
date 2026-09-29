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
import ProductPickerModal from "../components/purchases/ProductPickerModal";
import ViewPurchaseModal from "../components/purchases/ViewPurchaseModal";
import SuccessMessage from "../components/SuccessMessage";

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
  | Clear Supplier Delivery Filters
  |--------------------------------------------------------------------------
  */

  function handleClearFilters() {
    setSearch("");
    setPurchaseSupplierFilter("");
    setPurchasePeriod("all");
    setPurchaseStartDate("");
    setPurchaseEndDate("");
    setCurrentPage(1);
  }

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

      const exactMatch = filteredProducts.find((product) => {
        const barcode = product.barcode?.toLowerCase() || "";

        const sku = product.sku?.toLowerCase() || "";

        return keyword !== "" && (barcode === keyword || sku === keyword);
      });

      if (exactMatch) {
        selectProduct(exactMatch);

        return;
      }

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

      setSuccessMessage("Supplier Delivery received successfully.");

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
  | View Supplier Delivery / Purchase
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
  | Close View Supplier Deliveries / Purchase
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
                Supplier Deliveries
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage product deliveries received from suppliers.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            {exporting ? "Exporting..." : "Export Deliveries to Spreadsheet"}
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
            Add Supplier Delivery
          </button>
        </div>
      </div>

      {/* ================================================================
          SUCCESS MESSAGE
      ================================================================ */}

      <SuccessMessage
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        title="Delivery Saved"
      />

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
          onClearFilters={handleClearFilters}
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

      <ProductPickerModal
        show={showProductPicker}
        filteredProducts={filteredProducts}
        productSearch={productSearch}
        highlightedProductIndex={highlightedProductIndex}
        inputRef={productSearchInputRef}
        onSearchChange={(value) => {
          setProductSearch(value);
          setHighlightedProductIndex(0);
        }}
        onKeyDown={handleProductSearchKeyDown}
        onSelectProduct={selectProduct}
        onHighlight={setHighlightedProductIndex}
        onClose={closeProductPicker}
      />

      {/* ================================================================
          VIEW PURCHASE MODAL
      ================================================================ */}

      <ViewPurchaseModal
        viewPurchase={viewPurchase}
        loadingPurchase={loadingPurchase}
        onClose={closeViewPurchase}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
