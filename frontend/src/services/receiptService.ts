import type { Sale } from "../types/sale";

export type ReceiptWidth = "58mm" | "80mm";

export interface ReceiptPrintOptions {
  width?: ReceiptWidth;
  businessName?: string | null;
  businessAddress?: string | null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

function formatDate(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildReceiptHtml(
  sale: Sale,
  businessName: string,
  businessAddress: string,
): string {
  const itemsHtml = sale.items
    .map((item) => {
      const quantity = toNumber(item.quantity);
      const unitPrice = toNumber(item.unit_price);
      const total = toNumber(item.total);

      return `
        <div class="item">
          <div class="item-name">
            ${escapeHtml(
              item.product?.name || `Product #${item.product_id}`,
            )}
          </div>

          <div class="item-row">
            <span>${quantity} × ${formatCurrency(unitPrice)}</span>
            <strong>${formatCurrency(total)}</strong>
          </div>
        </div>
      `;
    })
    .join("");

  const discountHtml =
    toNumber(sale.discount) > 0
      ? `
        <div class="summary-row">
          <span>Discount</span>
          <strong>-${formatCurrency(sale.discount)}</strong>
        </div>
      `
      : "";

  const taxHtml =
    toNumber(sale.tax) > 0
      ? `
        <div class="summary-row">
          <span>Tax</span>
          <strong>${formatCurrency(sale.tax)}</strong>
        </div>
      `
      : "";

  const paymentDetails =
    sale.payment_method === "cash"
      ? `
        <div class="summary-row">
          <span>Amount Paid</span>
          <strong>${formatCurrency(sale.amount_paid)}</strong>
        </div>

        <div class="summary-row change-row">
          <span>Change</span>
          <strong>${formatCurrency(sale.change_amount)}</strong>
        </div>
      `
      : `
        ${
          sale.term_months
            ? `
              <div class="summary-row">
                <span>Payment Term</span>
                <strong>
                  ${sale.term_months}
                  ${sale.term_months === 1 ? "month" : "months"}
                </strong>
              </div>
            `
            : ""
        }

        ${
          sale.due_date
            ? `
              <div class="summary-row">
                <span>Due Date</span>
                <strong>${escapeHtml(formatDate(sale.due_date))}</strong>
              </div>
            `
            : ""
        }
      `;

  const notesHtml = sale.notes
    ? `
      <div class="divider"></div>

      <div class="notes">
        <div class="section-label">Notes</div>
        <div>${escapeHtml(sale.notes)}</div>
      </div>
    `
    : "";

  return `
    <div class="receipt">

      <!-- HEADER -->
      <div class="header">

        <div class="business-name">
          ${escapeHtml(businessName)}
        </div>

        ${
          businessAddress
            ? `
              <div class="business-address">
                ${escapeHtml(businessAddress)}
              </div>
            `
            : ""
        }

        <div class="receipt-title">
          OFFICIAL SALES RECEIPT
        </div>

      </div>

      <div class="divider"></div>

      <!-- TRANSACTION INFO -->
      <div class="transaction-info">

        <div class="info-row">
          <span>Invoice</span>
          <strong>${escapeHtml(sale.invoice_number)}</strong>
        </div>

        <div class="info-row">
          <span>Sale No.</span>
          <strong>${escapeHtml(sale.sale_number)}</strong>
        </div>

        <div class="info-row">
          <span>Date</span>
          <strong>${escapeHtml(formatDate(sale.sale_date))}</strong>
        </div>

        <div class="info-row">
          <span>Customer</span>
          <strong>
            ${escapeHtml(
              sale.customer?.name || "Walk-in Customer",
            )}
          </strong>
        </div>

        ${
          sale.user?.name
            ? `
              <div class="info-row">
                <span>Cashier</span>
                <strong>${escapeHtml(sale.user.name)}</strong>
              </div>
            `
            : ""
        }

      </div>

      <div class="divider"></div>

      <!-- ITEMS -->
      <div class="items">

        <div class="items-heading">
          <span>ITEM</span>
          <span>AMOUNT</span>
        </div>

        ${itemsHtml}

      </div>

      <div class="divider"></div>

      <!-- SUMMARY -->
      <div class="summary">

        <div class="summary-row">
          <span>Subtotal</span>
          <strong>${formatCurrency(sale.subtotal)}</strong>
        </div>

        ${discountHtml}

        ${taxHtml}

        <div class="total-row">
          <span>TOTAL</span>
          <strong>${formatCurrency(sale.total)}</strong>
        </div>

      </div>

      <div class="divider"></div>

      <!-- PAYMENT -->
      <div class="payment">

        <div class="payment-method">
          <span>Payment Method</span>
          <strong>
            ${sale.payment_method === "cash" ? "CASH" : "CHARGE"}
          </strong>
        </div>

        ${paymentDetails}

      </div>

      ${notesHtml}

      <div class="divider"></div>

      <!-- FOOTER -->
      <div class="footer">

        <div class="thank-you">
          Thank you for your business!
        </div>

        <div>
          Please keep this receipt for your records.
        </div>

        <div class="footer-brand">
          Powered by iPOS
        </div>

      </div>

    </div>
  `;
}

export async function printReceipt(
  sale: Sale,
  options: ReceiptPrintOptions = {},
): Promise<void> {
  const width = options.width ?? "80mm";

  const businessName =
    options.businessName?.trim() || "iPOS";

  const businessAddress =
    options.businessAddress?.trim() || "";

  const receiptHtml = buildReceiptHtml(
    sale,
    businessName,
    businessAddress,
  );

  const printFrame = document.createElement("iframe");

  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  printFrame.style.visibility = "hidden";

  document.body.appendChild(printFrame);

  try {
    const printDocument = printFrame.contentDocument;

    if (!printDocument) {
      throw new Error(
        "Unable to create the receipt print document.",
      );
    }

    printDocument.open();

    printDocument.write(`
      <!DOCTYPE html>

      <html>
        <head>

          <meta charset="UTF-8" />

          <title>
            Receipt ${escapeHtml(sale.invoice_number)}
          </title>

          <style>

            @page {
              size: ${width} auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: ${width};
              background: #ffffff;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              font-size: 10px;
              line-height: 1.35;
              color: #000000;
            }

            .receipt {
              width: ${width};
              max-width: ${width};

              padding: 4mm 3mm;

              margin: 0 auto;
            }

            /* =========================
               HEADER
            ========================= */

            .header {
              text-align: center;
            }

            .business-name {
              font-size: 20px;
              font-weight: 800;
              line-height: 1.15;
              word-break: break-word;
            }

            .business-address {
              font-size: 9px;
              line-height: 1.3;
              margin-top: 3px;
              word-break: break-word;
            }

            .receipt-title {
              font-size: 10px;
              font-weight: 700;
              margin-top: 5px;
            }

            /* =========================
               DIVIDER
            ========================= */

            .divider {
              border-top: 1px dashed #000000;
              margin: 8px 0;
            }

            /* =========================
               INFO
            ========================= */

            .transaction-info {
              width: 100%;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 10px;
              margin-bottom: 3px;
            }

            .info-row span {
              flex: 0 0 auto;
            }

            .info-row strong {
              flex: 1;
              text-align: right;
              word-break: break-word;
            }

            /* =========================
               ITEMS
            ========================= */

            .items-heading {
              display: flex;
              justify-content: space-between;

              font-size: 9px;
              font-weight: 800;

              margin-bottom: 6px;

              border-bottom: 1px solid #000000;
              padding-bottom: 4px;
            }

            .item {
              margin-bottom: 7px;
            }

            .item-name {
              font-size: 10px;
              font-weight: 700;
              word-break: break-word;
              margin-bottom: 2px;
            }

            .item-row {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              font-size: 9px;
            }

            .item-row strong {
              text-align: right;
              white-space: nowrap;
            }

            /* =========================
               SUMMARY
            ========================= */

            .summary-row {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              margin-bottom: 4px;
            }

            .summary-row strong {
              text-align: right;
              white-space: nowrap;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;

              margin-top: 7px;
              padding-top: 6px;

              border-top: 1px solid #000000;

              font-size: 14px;
              font-weight: 800;
            }

            .total-row strong {
              white-space: nowrap;
            }

            /* =========================
               PAYMENT
            ========================= */

            .payment-method {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              margin-bottom: 6px;
              font-weight: 800;
            }

            .payment-method strong {
              font-size: 11px;
            }

            .change-row {
              font-weight: 700;
            }

            /* =========================
               NOTES
            ========================= */

            .notes {
              word-break: break-word;
            }

            .section-label {
              font-weight: 800;
              margin-bottom: 3px;
            }

            /* =========================
               FOOTER
            ========================= */

            .footer {
              text-align: center;
              font-size: 8px;
              line-height: 1.45;
            }

            .thank-you {
              font-size: 10px;
              font-weight: 700;
              margin-bottom: 3px;
            }

            .footer-brand {
              margin-top: 7px;
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.5px;
            }

            /* =========================
               PRINT
            ========================= */

            @media print {

              html,
              body {
                width: ${width};
                margin: 0;
                padding: 0;
              }

              .receipt {
                width: ${width};
                max-width: ${width};
                margin: 0;
              }

            }

          </style>

        </head>

        <body>

          ${receiptHtml}

        </body>

      </html>
    `);

    printDocument.close();

    await new Promise<void>((resolve) => {
      const print = () => {
        const printWindow = printFrame.contentWindow;

        if (!printWindow) {
          resolve();
          return;
        }

        printWindow.focus();
        printWindow.print();

        setTimeout(() => {
          resolve();
        }, 500);
      };

      if (printDocument.readyState === "complete") {
        setTimeout(print, 250);
        return;
      }

      printFrame.onload = () => {
        setTimeout(print, 250);
      };
    });
  } catch (error) {
    throw error;
  } finally {
    setTimeout(() => {
      printFrame.remove();
    }, 600);
  }
}