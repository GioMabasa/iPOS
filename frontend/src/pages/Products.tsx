import { useEffect, useState } from "react";

import {
  getProducts,
  getProductInventoryDetails,
  exportProducts,
  updateProduct,
} from "../services/productService";

import { getCategories } from "../services/categoryService";

import type { Product } from "../types/product";
import type { Category } from "../types/category";

import ProductForm from "../components/products/ProductForm";
import ProductDetails from "../components/products/ProductDetails";
import ProductHeader from "../components/products/ProductHeader";
import ProductFilters from "../components/products/ProductFilters";
import ProductTable from "../components/products/ProductTable";
import SuccessMessage from "../components/SuccessMessage";

import { useAuth } from "../context/AuthContext";

export default function Products() {
  const { user } = useAuth();

  const isCashier = user?.role === "cashier";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<boolean | "">("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [exporting, setExporting] = useState(false);

  async function loadProducts(page: number = 1) {
    try {
      setLoading(true);
      setError(null);

      const response = await getProducts({
        page,
        search,
        category_id: categoryFilter,
        is_active: statusFilter,
        per_page: perPage,
      });

      setProducts(response.data);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setTotal(response.total);
    } catch (err) {
      console.error("Load products error:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await getCategories(1);
      setCategories(response.data);
    } catch (err) {
      console.error("Load categories error:", err);
    }
  }

  /*
   * Initial load.
   * Products are loaded by the filter effect below so we avoid
   * making two product requests on the first render.
   */
  useEffect(() => {
    loadCategories();
  }, []);

  /*
   * Search / filter loading.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProducts(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, categoryFilter, statusFilter]);

  /*
   * Automatically hide success message.
   */
  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
  }

  async function handleExportProducts() {
    try {
      setExporting(true);

      const blob = await exportProducts({
        search,
        category_id: categoryFilter,
        is_active: statusFilter,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export products error:", err);

      setError("Failed to export products.");
    } finally {
      setExporting(false);
    }
  }

  function handleAddProduct() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function handleEditProduct(product: Product) {
    /*
     * Cashiers may edit inactive products only.
     * Active products remain view-only for Cashiers.
     */
    if (isCashier && product.is_active) {
      return;
    }

    setShowDetails(false);
    setSelectedProduct(null);

    setEditingProduct(product);
    setShowForm(true);
  }

  async function handleToggleProductStatus(product: Product) {
    /*
     * Cashiers cannot activate/deactivate products.
     */
    if (isCashier) {
      return;
    }

    const newStatus = !product.is_active;

    try {
      await updateProduct(product.id, {
        is_active: newStatus,
      });

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id ? { ...item, is_active: newStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Toggle product status error:", err);

      setError("Failed to update product status.");
    }
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  function handleProductSuccess(product: Product) {
    const previousProduct = editingProduct;
    const wasEditing = previousProduct !== null;

    /*
     * Capture the current filter context before changing anything.
     * This allows us to determine whether the edited product still
     * belongs to the current search/filter context.
     */
    const currentSearch = search.trim().toLowerCase();

    const oldName = previousProduct?.name?.trim().toLowerCase() ?? "";
    const oldSku = previousProduct?.sku?.trim().toLowerCase() ?? "";
    const oldBarcode = previousProduct?.barcode?.trim().toLowerCase() ?? "";

    const newName = product.name?.trim().toLowerCase() ?? "";
    const newSku = product.sku?.trim().toLowerCase() ?? "";
    const newBarcode = product.barcode?.trim().toLowerCase() ?? "";

    /*
     * Search is considered related to the product if the current
     * search term matched the product's old name, SKU, or barcode.
     *
     * If it matched before the edit but no longer matches any of
     * the updated values, clear the Search filter.
     */
    const searchMatchedOldProduct =
      wasEditing &&
      currentSearch !== "" &&
      [oldName, oldSku, oldBarcode].some(
        (value) => value !== "" && value.includes(currentSearch),
      );

    const searchStillMatchesUpdatedProduct =
      currentSearch !== "" &&
      [newName, newSku, newBarcode].some(
        (value) => value !== "" && value.includes(currentSearch),
      );

    const shouldClearSearch =
      searchMatchedOldProduct && !searchStillMatchesUpdatedProduct;

    /*
     * Category filter:
     * If the current category filter was the product's old category
     * and the product was moved to another category, clear only the
     * category filter.
     */
    const oldCategoryId =
      previousProduct?.category_id !== null &&
      previousProduct?.category_id !== undefined
        ? Number(previousProduct.category_id)
        : null;

    const newCategoryId =
      product.category_id !== null && product.category_id !== undefined
        ? Number(product.category_id)
        : null;

    const shouldClearCategory =
      wasEditing &&
      categoryFilter !== "" &&
      oldCategoryId !== null &&
      Number(categoryFilter) === oldCategoryId &&
      newCategoryId !== oldCategoryId;

    /*
     * Status filter:
     * If the current status filter matched the product's old status
     * and the product's status changed, clear only the status filter.
     */
    const shouldClearStatus =
      wasEditing &&
      statusFilter !== "" &&
      previousProduct?.is_active !== product.is_active &&
      Boolean(statusFilter) === Boolean(previousProduct?.is_active);

    handleCloseForm();

    /*
     * Apply only the filters that became invalid.
     * All other filters remain untouched.
     */
    if (shouldClearSearch) {
      setSearch("");
    }

    if (shouldClearCategory) {
      setCategoryFilter("");
    }

    if (shouldClearStatus) {
      setStatusFilter("");
    }

    if (wasEditing) {
      setSuccessMessage("Product updated successfully.");
    } else if (isCashier) {
      setSuccessMessage(
        "Product added successfully. It is currently inactive and awaiting Admin/Manager activation.",
      );
    } else {
      setSuccessMessage("Product added successfully.");
    }

    /*
     * If no filter needs to be changed, reload the current page
     * using the existing filter context.
     *
     * If a filter was cleared, the filter effect above will perform
     * the reload using the updated filter state.
     */
    if (!shouldClearSearch && !shouldClearCategory && !shouldClearStatus) {
      loadProducts(currentPage);
    }
  }

  async function handleViewProduct(product: Product) {
    try {
      const details = await getProductInventoryDetails(product.id);

      setSelectedProduct({
        ...product,
        ...details,
        category: product.category,
      });

      setShowDetails(true);
    } catch (err) {
      console.error("Load product details error:", err);

      setError("Failed to load product details.");
    }
  }

  function handleCloseDetails() {
    setShowDetails(false);
    setSelectedProduct(null);
  }

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage) {
      return;
    }

    loadProducts(page);
  }

  const showingFrom = products.length > 0 ? (currentPage - 1) * perPage + 1 : 0;

  const showingTo =
    products.length > 0 ? Math.min(currentPage * perPage, total) : 0;

  return (
    <div className="space-y-6">
      <SuccessMessage
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
        title="Product Saved"
      />

      <ProductHeader
        exporting={exporting}
        onExport={handleExportProducts}
        onAdd={handleAddProduct}
      />

      <ProductFilters
        search={search}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
        onClear={clearFilters}
      />

      <ProductTable
        products={products}
        loading={loading}
        error={error ?? ""}
        currentPage={currentPage}
        lastPage={lastPage}
        total={total}
        showingFrom={showingFrom}
        showingTo={showingTo}
        search={search}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        isCashier={isCashier}
        loadProducts={loadProducts}
        goToPage={goToPage}
        handleViewProduct={handleViewProduct}
        handleEditProduct={handleEditProduct}
        handleAddProduct={handleAddProduct}
        handleToggleProductStatus={handleToggleProductStatus}
        clearFilters={clearFilters}
      />

      <ProductForm
        isOpen={showForm || editingProduct !== null}
        product={editingProduct}
        onCancel={handleCloseForm}
        onSuccess={handleProductSuccess}
      />

      <ProductDetails
        isOpen={showDetails}
        product={selectedProduct}
        onClose={handleCloseDetails}
      />
    </div>
  );
}
