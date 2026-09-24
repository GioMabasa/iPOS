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
        {/* ============================================================
            SECTION HEADER / SEARCH
        ============================================================ */}

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Purchase Records
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                View and manage your received inventory purchases.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <label
                htmlFor="purchase-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Purchases
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path strokeLinecap="round" d="m20 20-4-4" />
                  </svg>
                </div>

                <input
                  id="purchase-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search purchase, supplier, reference..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            TABLE
        ============================================================ */}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <span>Loading purchases...</span>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Purchase #
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Supplier
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Reference
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Total
                  </th>

                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-6 w-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 7.5 12 3l9 4.5M4.5 9.75V18L12 21.5 19.5 18V9.75M8 5l8.5 4.25M12 12v9"
                            />
                          </svg>
                        </div>

                        <p className="text-sm font-semibold text-slate-700">
                          {search
                            ? "No purchases match your search."
                            : "No purchases found."}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {search
                            ? "Try a different purchase number, supplier, or reference."
                            : "Received purchases will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      {/* PURCHASE NUMBER */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6.5 12 3l8 3.5v11L12 21l-8-3.5v-11Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 8.5h8M8 12h5"
                              />
                            </svg>
                          </div>

                          <p className="text-sm font-semibold text-slate-900">
                            {purchase.purchase_number}
                          </p>
                        </div>
                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
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

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {purchase.supplier?.name || "—"}
                        </span>
                      </td>

                      {/* REFERENCE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {purchase.reference_number || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {purchase.status}
                        </span>
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">
                          ₱{formatCurrency(purchase.total)}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openViewPurchase(purchase)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-3.5 w-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                            />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
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
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} purchases`
                : "No purchases"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                Page {currentPage} of {lastPage}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage || loading}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Add Purchase
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Create a purchase and receive inventory.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* MODAL ERROR */}

            {modalError && (
              <div className="mx-5 mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
                <div className="flex items-start gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.73 3h15.14a2 2 0 0 0 1.73-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                    />
                  </svg>

                  <span>{modalError}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setModalError("")}
                  className="shrink-0 font-semibold text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              <div className="space-y-7 p-5 sm:p-6">
                {/* ====================================================
                    PURCHASE INFORMATION
                ==================================================== */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Purchase Information
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Enter the supplier and purchase reference details.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* SUPPLIER */}

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Supplier <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={supplierId}
                        onChange={(event) =>
                          setSupplierId(Number(event.target.value))
                        }
                        disabled={saving || loadingSuppliers}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
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
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Purchase Date <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(event) =>
                          setPurchaseDate(event.target.value)
                        }
                        disabled={saving}
                        required
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>

                    {/* REFERENCE */}

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* ====================================================
                    ITEMS
                ==================================================== */}

                <div>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Purchase Items
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Add products received from the supplier.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={
                        saving || loadingProducts || products.length === 0
                      }
                      className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 5v14M5 12h14"
                        />
                      </svg>
                      Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[800px]">
                      <thead className="border-b border-slate-200 bg-slate-50/70">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Product
                          </th>

                          <th className="w-32 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Quantity
                          </th>

                          <th className="w-40 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Unit Cost
                          </th>

                          <th className="w-40 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Total
                          </th>

                          <th className="w-24 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, index) => (
                          <tr
                            key={index}
                            className="transition hover:bg-slate-50/50"
                          >
                            {/* PRODUCT */}

                            <td className="px-4 py-3">
                              <select
                                value={item.product_id}
                                onChange={(event) =>
                                  handleProductChange(
                                    index,
                                    Number(event.target.value),
                                  )
                                }
                                disabled={saving || loadingProducts}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
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

                            <td className="px-4 py-3">
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
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                              />
                            </td>

                            {/* UNIT COST */}

                            <td className="px-4 py-3">
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
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                              />
                            </td>

                            {/* LINE TOTAL */}

                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-semibold text-slate-900">
                                ₱{formatCurrency(getLineTotal(item))}
                              </span>
                            </td>

                            {/* REMOVE */}

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                disabled={saving || items.length === 1}
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Unit cost is automatically populated when the selected
                    supplier has a saved supplier price for the product.
                  </p>
                </div>

                {/* ====================================================
                    TOTALS + NOTES
                ==================================================== */}

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* NOTES */}

                  <div>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Notes
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Add any optional notes for this purchase.
                      </p>
                    </div>

                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={saving}
                      rows={6}
                      placeholder="Optional notes..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* TOTALS */}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
                        <p className="text-sm font-semibold text-slate-800">
                          Purchase Summary
                        </p>

                        <p className="text-xs text-slate-400">
                          Review the final purchase amount.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>

                        <span className="font-medium text-slate-900">
                          ₱{formatCurrency(subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <label
                          htmlFor="purchase-discount"
                          className="text-slate-500"
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
                          className="h-9 w-32 rounded-xl border border-slate-200 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <label
                          htmlFor="purchase-tax"
                          className="text-slate-500"
                        >
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
                          className="h-9 w-32 rounded-xl border border-slate-200 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        />
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Total
                            </p>

                            <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600">
                              ₱{formatCurrency(grandTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={saving}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
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
                          d="M5 12.5 9.5 17 19 7.5"
                        />
                      </svg>
                      Receive Purchase
                    </>
                  )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Purchase Details
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {viewPurchase.purchase_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeViewPurchase}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Purchase Information
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Basic information about this received purchase.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Purchase Number
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      {viewPurchase.purchase_number}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Purchase Date
                    </p>

                    <p className="mt-1.5 text-sm font-medium text-slate-700">
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

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Supplier
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      {viewPurchase.supplier?.name || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </p>

                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {viewPurchase.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* REFERENCE */}

              {viewPurchase.reference_number && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Reference Number
                  </p>

                  <p className="mt-1.5 text-sm font-medium text-slate-700">
                    {viewPurchase.reference_number}
                  </p>
                </div>
              )}

              {/* ====================================================
                  ITEMS
              ==================================================== */}

              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Purchase Items
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Products included in this purchase.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[650px]">
                    <thead className="border-b border-slate-200 bg-slate-50/70">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Product
                        </th>

                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Quantity
                        </th>

                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Unit Cost
                        </th>

                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loadingPurchase ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center">
                            <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                              Loading purchase details...
                            </div>
                          </td>
                        </tr>
                      ) : viewPurchase.items &&
                        viewPurchase.items.length > 0 ? (
                        viewPurchase.items.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-slate-900">
                                {item.product?.name || "Unknown Product"}
                              </p>

                              {item.product?.sku && (
                                <p className="mt-1 text-xs text-slate-400">
                                  SKU: {item.product.sku}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-slate-600">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-slate-600">
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

              <div className="grid gap-6 lg:grid-cols-2">
                {/* NOTES */}

                <div>
                  {viewPurchase.notes ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
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

                        <p className="text-sm font-semibold text-slate-800">
                          Notes
                        </p>
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {viewPurchase.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-5">
                      <p className="text-sm font-medium text-slate-500">
                        No notes added.
                      </p>
                    </div>
                  )}
                </div>

                {/* TOTALS */}

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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

                    <p className="text-sm font-semibold text-slate-800">
                      Purchase Summary
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>

                      <span className="font-medium text-slate-900">
                        ₱{formatCurrency(viewPurchase.subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Discount</span>

                      <span className="font-medium text-slate-900">
                        ₱{formatCurrency(viewPurchase.discount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tax</span>

                      <span className="font-medium text-slate-900">
                        ₱{formatCurrency(viewPurchase.tax)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Total
                          </p>

                          <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600">
                            ₱{formatCurrency(viewPurchase.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white p-5 sm:px-6">
              <button
                type="button"
                onClick={closeViewPurchase}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
