import { useEffect, useMemo, useState } from "react";

import {
  createPurchase,
  getPurchases,
  getPurchase,
} from "../services/purchaseService";

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
  | View Purchase Modal
  |--------------------------------------------------------------------------
  */

  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Purchases
  |--------------------------------------------------------------------------
  */

  async function loadPurchases(page: number = 1) {
    try {
      setLoading(true);

      setError("");

      const response = await getPurchases(page, 20);

      setPurchases(response.data);

      setCurrentPage(response.pagination.current_page);

      setLastPage(response.pagination.last_page);

      setTotal(response.pagination.total);

      setFrom(response.pagination.from);

      setTo(response.pagination.to);
    } catch (err) {
      console.error("Load purchases error:", err);

      setError("Failed to load purchases.");
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load Products
  |--------------------------------------------------------------------------
  */

  async function loadProducts() {
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
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredPurchases = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return purchases;
    }

    return purchases.filter((purchase) => {
      return (
        purchase.purchase_number.toLowerCase().includes(keyword) ||
        purchase.supplier?.name?.toLowerCase().includes(keyword) ||
        purchase.reference_number?.toLowerCase().includes(keyword) ||
        purchase.status?.toLowerCase().includes(keyword)
      );
    });
  }, [purchases, search]);

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

    /*
    |--------------------------------------------------------------------------
    | Load products and suppliers only when modal is opened
    |--------------------------------------------------------------------------
    */

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Purchases
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage purchase orders and received inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          disabled={loadingProducts || loadingSuppliers}
          className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add Purchase
        </button>
      </div>

      {/* ================================================================
          SUCCESS MESSAGE
      ================================================================ */}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* ================================================================
          PAGE ERROR
      ================================================================ */}

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

      {/* ================================================================
          CONTENT
      ================================================================ */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ============================================================
            SEARCH
        ============================================================ */}

        <div className="border-b border-gray-200 p-4">
          <div className="max-w-md">
            <label
              htmlFor="purchase-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search Purchases
            </label>

            <input
              id="purchase-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search purchase, supplier, reference..."
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* ============================================================
            TABLE
        ============================================================ */}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                Loading purchases...
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Purchase #
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Supplier
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reference
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      {search
                        ? "No purchases match your search."
                        : "No purchases found."}
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* PURCHASE NUMBER */}

                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">
                          {purchase.purchase_number}
                        </p>
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {new Date(purchase.purchase_date).toLocaleDateString(
                          "en-PH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>

                      {/* SUPPLIER */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {purchase.supplier?.name || "—"}
                      </td>

                      {/* REFERENCE */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {purchase.reference_number || "—"}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                          {purchase.status}
                        </span>
                      </td>

                      {/* TOTAL */}

                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ₱{formatCurrency(purchase.total)}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openViewPurchase(purchase)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ============================================================
            PAGINATION
        ============================================================ */}

        {!loading && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} purchases`
                : "No purchases"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600">
                Page {currentPage} of {lastPage}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage || loading}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          ADD PURCHASE MODAL
      ================================================================ */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Add Purchase
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Create a purchase and receive inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="text-xl text-gray-400 hover:text-gray-600 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {/* MODAL ERROR */}

            {modalError && (
              <div className="mx-5 mt-5 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{modalError}</span>

                <button
                  type="button"
                  onClick={() => setModalError("")}
                  className="font-semibold"
                >
                  ×
                </button>
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6 p-5">
                {/* ====================================================
                    PURCHASE INFORMATION
                ==================================================== */}

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* SUPPLIER */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Supplier <span className="text-red-500">*</span>
                    </label>

                    <select
                      value={supplierId}
                      onChange={(event) =>
                        setSupplierId(Number(event.target.value))
                      }
                      disabled={saving || loadingSuppliers}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value={0}>
                        {loadingSuppliers
                          ? "Loading suppliers..."
                          : "Select supplier"}
                      </option>

                      {suppliers
                        .filter((supplier) => supplier.is_active)
                        .map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* PURCHASE DATE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Purchase Date <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(event) => setPurchaseDate(event.target.value)}
                      disabled={saving}
                      required
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* REFERENCE */}

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Reference Number
                    </label>

                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(event) =>
                        setReferenceNumber(event.target.value)
                      }
                      disabled={saving}
                      placeholder="Supplier invoice / reference number"
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* ====================================================
                    ITEMS
                ==================================================== */}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Purchase Items
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Add products received from the supplier.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={
                        saving || loadingProducts || products.length === 0
                      }
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Product
                          </th>

                          <th className="w-32 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Quantity
                          </th>

                          <th className="w-40 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Unit Cost
                          </th>

                          <th className="w-40 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total
                          </th>

                          <th className="w-20 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {items.map((item, index) => (
                          <tr key={index}>
                            {/* PRODUCT */}

                            <td className="px-3 py-3">
                              <select
                                value={item.product_id}
                                onChange={(event) =>
                                  handleProductChange(
                                    index,
                                    Number(event.target.value),
                                  )
                                }
                                disabled={saving || loadingProducts}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              >
                                <option value={0}>
                                  {loadingProducts
                                    ? "Loading products..."
                                    : products.length === 0
                                      ? "No products available"
                                      : "Select product"}
                                </option>

                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* QUANTITY */}

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onFocus={(event) =>
                                  event.currentTarget.select()
                                }
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    Number(event.target.value),
                                  )
                                }
                                disabled={saving}
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-right text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              />
                            </td>

                            {/* UNIT COST */}

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_cost}
                                onFocus={(event) =>
                                  event.currentTarget.select()
                                }
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "unit_cost",
                                    Number(event.target.value),
                                  )
                                }
                                disabled={saving}
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-right text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              />
                            </td>

                            {/* LINE TOTAL */}

                            <td className="px-3 py-3 text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                ₱{formatCurrency(getLineTotal(item))}
                              </span>
                            </td>

                            {/* REMOVE */}

                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                disabled={saving || items.length === 1}
                                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ====================================================
                    TOTALS + NOTES
                ==================================================== */}

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* NOTES */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Notes
                    </label>

                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={saving}
                      rows={5}
                      placeholder="Optional notes..."
                      className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* TOTALS */}

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>

                        <span className="font-medium text-gray-900">
                          ₱{formatCurrency(subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <label
                          htmlFor="purchase-discount"
                          className="text-gray-500"
                        >
                          Discount
                        </label>

                        <input
                          id="purchase-discount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={discount}
                          onFocus={(event) => event.currentTarget.select()}
                          onChange={(event) =>
                            setDiscount(Math.max(0, Number(event.target.value)))
                          }
                          disabled={saving}
                          className="h-9 w-32 rounded-lg border border-gray-300 bg-white px-3 text-right text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <label htmlFor="purchase-tax" className="text-gray-500">
                          Tax
                        </label>

                        <input
                          id="purchase-tax"
                          type="number"
                          min="0"
                          step="0.01"
                          value={tax}
                          onFocus={(event) => event.currentTarget.select()}
                          onChange={(event) =>
                            setTax(Math.max(0, Number(event.target.value)))
                          }
                          disabled={saving}
                          className="h-9 w-32 rounded-lg border border-gray-300 bg-white px-3 text-right text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-gray-900">
                            Total
                          </span>

                          <span className="text-xl font-bold text-indigo-600">
                            ₱{formatCurrency(grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-gray-200 p-5">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={saving}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingProducts ||
                    loadingSuppliers ||
                    !supplierId ||
                    items.length === 0 ||
                    products.length === 0 ||
                    suppliers.length === 0
                  }
                  className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Receive Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          VIEW PURCHASE MODAL
      ================================================================ */}

      {viewPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Purchase Details
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {viewPurchase.purchase_number}
                </p>
              </div>

              <button
                type="button"
                onClick={closeViewPurchase}
                className="text-xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* PURCHASE INFORMATION */}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Purchase Number
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {viewPurchase.purchase_number}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Purchase Date
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
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

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Supplier
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {viewPurchase.supplier?.name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Status
                  </p>

                  <span className="mt-1 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                    {viewPurchase.status}
                  </span>
                </div>
              </div>

              {/* REFERENCE */}

              {viewPurchase.reference_number && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Reference Number
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {viewPurchase.reference_number}
                  </p>
                </div>
              )}

              {/* ITEMS */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Purchase Items
                </h3>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[650px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Product
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Quantity
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Unit Cost
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {viewPurchase.items && viewPurchase.items.length > 0 ? (
                        viewPurchase.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-gray-900">
                                {item.product?.name || "Unknown Product"}
                              </p>

                              {item.product?.sku && (
                                <p className="mt-1 text-xs text-gray-500">
                                  SKU: {item.product.sku}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                              ₱{formatCurrency(item.unit_cost)}
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              ₱{formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            No purchase items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NOTES + TOTALS */}

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  {viewPurchase.notes && (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Notes
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {viewPurchase.notes}
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>

                      <span className="font-medium text-gray-900">
                        ₱{formatCurrency(viewPurchase.subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Discount</span>

                      <span className="font-medium text-gray-900">
                        ₱{formatCurrency(viewPurchase.discount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Tax</span>

                      <span className="font-medium text-gray-900">
                        ₱{formatCurrency(viewPurchase.tax)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900">
                          Total
                        </span>

                        <span className="text-xl font-bold text-indigo-600">
                          ₱{formatCurrency(viewPurchase.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={closeViewPurchase}
                className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
