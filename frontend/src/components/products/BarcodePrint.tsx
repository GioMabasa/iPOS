import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import type { Product } from "../../types/product";

interface BarcodePrintProps {
  product: Product;
  onClose: () => void;
}

const DEFAULT_COLUMNS = 3;
const DEFAULT_ROWS = 8;
const DEFAULT_LABEL_WIDTH = 60;
const DEFAULT_LABEL_HEIGHT = 30;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_PADDING = 10;

export default function BarcodePrint({ product, onClose }: BarcodePrintProps) {
  const [quantity, setQuantity] = useState(24);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [labelWidth, setLabelWidth] = useState(DEFAULT_LABEL_WIDTH);
  const [labelHeight, setLabelHeight] = useState(DEFAULT_LABEL_HEIGHT);
  const [isPrinting, setIsPrinting] = useState(false);

  const barcodeRefs = useRef<(SVGSVGElement | null)[]>([]);

  const labelsPerPage = columns * rows;

  const totalPages = Math.ceil(quantity / labelsPerPage);

  const availableWidth = PAGE_WIDTH - PAGE_PADDING * 2;
  const availableHeight = PAGE_HEIGHT - PAGE_PADDING * 2;

  const horizontalGap =
    columns > 1
      ? Math.max(0, (availableWidth - columns * labelWidth) / (columns - 1))
      : 0;

  const verticalGap =
    rows > 1
      ? Math.max(0, (availableHeight - rows * labelHeight) / (rows - 1))
      : 0;

  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const startIndex = pageIndex * labelsPerPage;
      const remaining = quantity - startIndex;
      const labelsOnPage = Math.min(labelsPerPage, remaining);

      return {
        pageIndex,
        labelsOnPage,
      };
    });
  }, [quantity, labelsPerPage, totalPages]);

  useEffect(() => {
    if (!isPrinting || !product.barcode) {
      return;
    }

    barcodeRefs.current.forEach((barcodeElement) => {
      if (!barcodeElement) {
        return;
      }

      JsBarcode(barcodeElement, product.barcode!, {
        format: "CODE128",
        displayValue: true,
        fontSize: 12,
        height: 55,
        width: 1.5,
        margin: 0,
        textMargin: 4,
      });
    });

    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    const handleAfterPrint = () => {
      setIsPrinting(false);
      onClose();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [isPrinting, product.barcode, onClose]);

  if (!product.barcode) {
    return null;
  }

  function handleQuantityChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(event.target.value);

    if (!Number.isFinite(value)) {
      setQuantity(1);
      return;
    }

    const normalizedValue = Math.max(1, Math.min(9999, Math.floor(value)));

    setQuantity(normalizedValue);
  }

  function handleInputFocus(event: React.FocusEvent<HTMLInputElement>) {
    event.target.select();
  }

  function handlePrint() {
    setIsPrinting(true);
  }

  return (
    <>
      {!isPrinting && (
        <div className="barcode-settings-overlay">
          <div className="barcode-settings-modal">
            {/* Header */}
            <div className="barcode-settings-header">
              <div className="barcode-header-content">
                <div className="barcode-header-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 5v14" />
                    <path d="M7 5v14" />
                    <path d="M11 5v14" />
                    <path d="M15 5v14" />
                    <path d="M19 5v14" />
                    <path d="M21 5v14" />
                  </svg>
                </div>

                <div>
                  <h2 className="barcode-settings-title">Print Barcode</h2>

                  <p className="barcode-settings-subtitle">
                    Configure barcode labels for printing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="barcode-close-button"
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="barcode-settings-body">
              {/* Product */}
              <div className="barcode-product-card">
                <div className="barcode-product-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M7 8v8" />
                    <path d="M10 8v8" />
                    <path d="M14 8v8" />
                    <path d="M17 8v8" />
                  </svg>
                </div>

                <div className="barcode-product-info">
                  <span className="barcode-section-label">Product</span>

                  <div className="barcode-product-name-preview">
                    {product.name}
                  </div>

                  <div className="barcode-product-number">
                    {product.barcode}
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="barcode-section">
                <div className="barcode-section-heading">
                  <div>
                    <h3>Print Quantity</h3>

                    <p>Number of barcode labels to print</p>
                  </div>
                </div>

                <div className="barcode-quantity-wrapper">
                  <div className="barcode-quantity-input-wrap">
                    <input
                      id="barcode-quantity"
                      type="number"
                      min={1}
                      max={9999}
                      value={quantity}
                      onChange={handleQuantityChange}
                      onFocus={handleInputFocus}
                      className="barcode-quantity-input"
                    />

                    <span className="barcode-input-suffix">labels</span>
                  </div>

                  <div className="barcode-quantity-summary">
                    <strong>{quantity}</strong>

                    <span>
                      {quantity === 1 ? "label" : "labels"} will be printed
                    </span>
                  </div>
                </div>
              </div>

              {/* Layout */}
              <div className="barcode-section">
                <div className="barcode-section-heading">
                  <div>
                    <h3>Label Layout</h3>

                    <p>Adjust the size and arrangement of your labels</p>
                  </div>

                  <span className="barcode-a4-badge">A4 Portrait</span>
                </div>

                <div className="barcode-layout-grid">
                  <div className="barcode-layout-field">
                    <label htmlFor="barcode-columns">Columns</label>

                    <div className="barcode-input-with-unit">
                      <input
                        id="barcode-columns"
                        type="number"
                        min={1}
                        max={6}
                        value={columns}
                        onChange={(event) =>
                          setColumns(
                            Math.max(
                              1,
                              Math.min(
                                6,
                                Math.floor(Number(event.target.value) || 1),
                              ),
                            ),
                          )
                        }
                        onFocus={handleInputFocus}
                      />

                      <span>cols</span>
                    </div>
                  </div>

                  <div className="barcode-layout-field">
                    <label htmlFor="barcode-rows">Rows</label>

                    <div className="barcode-input-with-unit">
                      <input
                        id="barcode-rows"
                        type="number"
                        min={1}
                        max={12}
                        value={rows}
                        onChange={(event) =>
                          setRows(
                            Math.max(
                              1,
                              Math.min(
                                12,
                                Math.floor(Number(event.target.value) || 1),
                              ),
                            ),
                          )
                        }
                        onFocus={handleInputFocus}
                      />

                      <span>rows</span>
                    </div>
                  </div>

                  <div className="barcode-layout-field">
                    <label htmlFor="barcode-label-width">Label Width</label>

                    <div className="barcode-input-with-unit">
                      <input
                        id="barcode-label-width"
                        type="number"
                        min={20}
                        max={65}
                        step={0.5}
                        value={labelWidth}
                        onChange={(event) =>
                          setLabelWidth(
                            Math.max(
                              20,
                              Math.min(65, Number(event.target.value) || 20),
                            ),
                          )
                        }
                        onFocus={handleInputFocus}
                      />

                      <span>mm</span>
                    </div>
                  </div>

                  <div className="barcode-layout-field">
                    <label htmlFor="barcode-label-height">Label Height</label>

                    <div className="barcode-input-with-unit">
                      <input
                        id="barcode-label-height"
                        type="number"
                        min={10}
                        max={50}
                        step={0.5}
                        value={labelHeight}
                        onChange={(event) =>
                          setLabelHeight(
                            Math.max(
                              10,
                              Math.min(50, Number(event.target.value) || 10),
                            ),
                          )
                        }
                        onFocus={handleInputFocus}
                      />

                      <span>mm</span>
                    </div>
                  </div>
                </div>

                {/* Automatic spacing */}
                <div className="barcode-auto-spacing">
                  <div className="barcode-auto-spacing-icon">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4h16" />
                      <path d="M4 20h16" />
                      <path d="M8 8v8" />
                      <path d="M16 8v8" />
                      <path d="M12 8v8" />
                    </svg>
                  </div>

                  <div className="barcode-auto-spacing-content">
                    <strong>Automatic Spacing</strong>

                    <span>
                      Labels are evenly distributed across the A4 page.
                    </span>
                  </div>

                  <span className="barcode-auto-badge">AUTO</span>
                </div>
              </div>

              {/* Summary */}
              <div className="barcode-print-summary">
                <div className="barcode-summary-item">
                  <span className="barcode-summary-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  </span>

                  <div>
                    <span>Layout</span>

                    <strong>
                      {columns} × {rows}
                    </strong>
                  </div>
                </div>

                <div className="barcode-summary-divider" />

                <div className="barcode-summary-item">
                  <span className="barcode-summary-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M7 8h10" />
                      <path d="M7 12h10" />
                      <path d="M7 16h6" />
                    </svg>
                  </span>

                  <div>
                    <span>Labels / Page</span>

                    <strong>{labelsPerPage}</strong>
                  </div>
                </div>

                <div className="barcode-summary-divider" />

                <div className="barcode-summary-item">
                  <span className="barcode-summary-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 2h12v20H6z" />
                      <path d="M9 6h6" />
                      <path d="M9 10h6" />
                      <path d="M9 14h6" />
                    </svg>
                  </span>

                  <div>
                    <span>Total Pages</span>

                    <strong>{totalPages}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="barcode-settings-footer">
              <button
                type="button"
                onClick={onClose}
                className="barcode-cancel-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="barcode-print-button"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />

                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />

                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Labels
              </button>
            </div>
          </div>
        </div>
      )}

      {isPrinting && (
        <div className="barcode-print-overlay">
          {pages.map((page) => (
            <div className="barcode-print-sheet" key={page.pageIndex}>
              <div
                className="barcode-grid"
                style={{
                  gridTemplateColumns: `repeat(${columns}, ${labelWidth}mm)`,
                  gridAutoRows: `${labelHeight}mm`,
                  columnGap: `${horizontalGap}mm`,
                  rowGap: `${verticalGap}mm`,
                }}
              >
                {Array.from({
                  length: page.labelsOnPage,
                }).map((_, index) => {
                  const globalIndex = page.pageIndex * labelsPerPage + index;

                  return (
                    <div
                      className="barcode-label"
                      key={globalIndex}
                      style={{
                        width: `${labelWidth}mm`,
                        height: `${labelHeight}mm`,
                      }}
                    >
                      <div className="barcode-product-name">{product.name}</div>

                      <svg
                        ref={(element) => {
                          barcodeRefs.current[globalIndex] = element;
                        }}
                        className="barcode-svg"
                        aria-label={`Barcode for ${product.name}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .barcode-settings-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(3px);
        }

        .barcode-settings-modal {
          width: 100%;
          max-width: 650px;
          max-height: calc(100vh - 48px);
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 30px 70px -20px rgba(15, 23, 42, 0.35);
          display: flex;
          flex-direction: column;
        }

        .barcode-settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .barcode-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .barcode-header-icon {
          display: flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: #eff6ff;
          color: #2563eb;
        }

        .barcode-settings-title {
          margin: 0;
          font-family: Arial, sans-serif;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.25;
          color: #0f172a;
        }

        .barcode-settings-subtitle {
          margin: 3px 0 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #64748b;
        }

        .barcode-close-button {
          display: flex;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition:
            background 0.15s ease,
            color 0.15s ease,
            border-color 0.15s ease;
        }

        .barcode-close-button:hover {
          border-color: #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
        }

        .barcode-settings-body {
          overflow-y: auto;
          padding: 20px 22px;
        }

        .barcode-product-card {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 13px 14px;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          background: #f8fbff;
        }

        .barcode-product-icon {
          display: flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #dbeafe;
          color: #2563eb;
        }

        .barcode-product-info {
          min-width: 0;
        }

        .barcode-section-label {
          display: block;
          margin-bottom: 2px;
          font-family: Arial, sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #64748b;
        }

        .barcode-product-name-preview {
          overflow: hidden;
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.35;
          color: #0f172a;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .barcode-product-number {
          margin-top: 2px;
          font-family: "Courier New", monospace;
          font-size: 12px;
          color: #64748b;
        }

        .barcode-section {
          margin-bottom: 20px;
        }

        .barcode-section-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 11px;
        }

        .barcode-section-heading h3 {
          margin: 0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }

        .barcode-section-heading p {
          margin: 3px 0 0;
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #64748b;
        }

        .barcode-a4-badge {
          flex-shrink: 0;
          padding: 5px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          background: #f8fafc;
          font-family: Arial, sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #475569;
        }

        .barcode-quantity-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .barcode-quantity-input-wrap {
          position: relative;
          width: 150px;
          flex-shrink: 0;
        }

        .barcode-quantity-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 11px 52px 11px 12px;
          outline: none;
          background: #ffffff;
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .barcode-quantity-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .barcode-input-suffix {
          position: absolute;
          top: 50%;
          right: 11px;
          transform: translateY(-50%);
          font-family: Arial, sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          pointer-events: none;
        }

        .barcode-quantity-summary {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .barcode-quantity-summary strong {
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        .barcode-quantity-summary span {
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #64748b;
        }

        .barcode-layout-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
        }

        .barcode-layout-field label {
          display: block;
          margin-bottom: 6px;
          font-family: Arial, sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }

        .barcode-input-with-unit {
          position: relative;
        }

        .barcode-input-with-unit input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 9px 40px 9px 10px;
          outline: none;
          background: #ffffff;
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .barcode-input-with-unit input:focus {
          border-color: #2563eb;
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .barcode-input-with-unit span {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          font-family: Arial, sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          pointer-events: none;
        }

        .barcode-auto-spacing {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          padding: 10px 12px;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          background: #f8fbff;
        }

        .barcode-auto-spacing-icon {
          display: flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: #dbeafe;
          color: #2563eb;
        }

        .barcode-auto-spacing-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .barcode-auto-spacing-content strong {
          font-family: Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #1e40af;
        }

        .barcode-auto-spacing-content span {
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: #64748b;
        }

        .barcode-auto-badge {
          margin-left: auto;
          padding: 4px 7px;
          border-radius: 6px;
          background: #dbeafe;
          font-family: Arial, sans-serif;
          font-size: 9px;
          font-weight: 800;
          color: #2563eb;
        }

        .barcode-print-summary {
          display: flex;
          align-items: center;
          min-height: 66px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }

        .barcode-summary-item {
          display: flex;
          align-items: center;
          gap: 9px;
          flex: 1;
          min-width: 0;
          padding: 12px 13px;
        }

        .barcode-summary-icon {
          display: flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
        }

        .barcode-summary-item div {
          min-width: 0;
        }

        .barcode-summary-item div > span {
          display: block;
          margin-bottom: 2px;
          font-family: Arial, sans-serif;
          font-size: 9px;
          font-weight: 600;
          color: #94a3b8;
        }

        .barcode-summary-item strong {
          display: block;
          overflow: hidden;
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .barcode-summary-divider {
          width: 1px;
          height: 30px;
          flex-shrink: 0;
          background: #e2e8f0;
        }

        .barcode-settings-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 14px 22px;
          border-top: 1px solid #e5e7eb;
          background: #f8fafc;
        }

        .barcode-cancel-button,
        .barcode-print-button {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 9px;
          padding: 8px 15px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.1s ease;
        }

        .barcode-cancel-button {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
        }

        .barcode-cancel-button:hover {
          border-color: #94a3b8;
          background: #f8fafc;
        }

        .barcode-print-button {
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);
        }

        .barcode-print-button:hover {
          border-color: #1d4ed8;
          background: #1d4ed8;
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.25);
        }

        .barcode-print-button:active,
        .barcode-cancel-button:active {
          transform: translateY(1px);
        }

        .barcode-print-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow: auto;
          background: white;
        }

        .barcode-print-sheet {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          margin: 0 auto;
          padding: 10mm;
          background: white;
          page-break-after: always;
          break-after: page;
        }

        .barcode-print-sheet:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .barcode-grid {
          display: grid;
          align-content: start;
          justify-content: start;
        }

        .barcode-label {
          box-sizing: border-box;
          border: 1px dashed #d1d5db;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3mm;
          overflow: hidden;
          background: white;
        }

        .barcode-product-name {
          width: 100%;
          margin-bottom: 2mm;
          font-family: Arial, sans-serif;
          font-size: 10pt;
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .barcode-svg {
          display: block;
          max-width: 100%;
          height: auto;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .barcode-print-overlay,
          .barcode-print-overlay * {
            visibility: visible !important;
          }

          .barcode-print-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          .barcode-print-sheet {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-sizing: border-box !important;
            background: white !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          .barcode-print-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .barcode-label {
            border: none !important;
          }
        }

        @media (max-width: 640px) {
          .barcode-settings-overlay {
            padding: 10px;
          }

          .barcode-settings-modal {
            max-height: calc(100vh - 20px);
            border-radius: 14px;
          }

          .barcode-settings-header {
            padding: 15px 16px;
          }

          .barcode-settings-body {
            padding: 16px;
          }

          .barcode-layout-grid {
            grid-template-columns: 1fr;
          }

          .barcode-quantity-wrapper {
            align-items: stretch;
            flex-direction: column;
          }

          .barcode-quantity-input-wrap {
            width: 100%;
          }

          .barcode-print-summary {
            flex-direction: column;
            align-items: stretch;
          }

          .barcode-summary-divider {
            width: auto;
            height: 1px;
            margin: 0 13px;
          }

          .barcode-summary-item {
            padding: 10px 13px;
          }

          .barcode-settings-footer {
            padding: 12px 16px;
          }

          .barcode-cancel-button,
          .barcode-print-button {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}
