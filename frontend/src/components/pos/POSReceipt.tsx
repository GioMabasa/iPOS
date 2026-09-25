import type { Sale } from "../../types/sale";

interface POSReceiptProps {
  sale: Sale;
  width?: "58mm" | "80mm";
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function POSReceipt({ sale, width = "80mm" }: POSReceiptProps) {
  return (
    <div
      id="ipos-print-receipt"
      className="ipos-receipt"
      data-receipt-width={width}
    >
      <div className="receipt-header">
        <div className="receipt-business-name">iPOS</div>
        <div>Point of Sale</div>
        <div>Official Sales Receipt</div>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-info">
        <div>
          <span>Invoice:</span>
          <strong>{sale.invoice_number}</strong>
        </div>

        <div>
          <span>Sale No:</span>
          <strong>{sale.sale_number}</strong>
        </div>

        <div>
          <span>Date:</span>
          <strong>{formatDate(sale.sale_date)}</strong>
        </div>

        {sale.created_at && (
          <div>
            <span>Time:</span>
            <strong>{formatDateTime(sale.created_at)}</strong>
          </div>
        )}

        <div>
          <span>Customer:</span>
          <strong>{sale.customer?.name || "Walk-in Customer"}</strong>
        </div>

        {sale.user?.name && (
          <div>
            <span>Cashier:</span>
            <strong>{sale.user.name}</strong>
          </div>
        )}
      </div>

      <div className="receipt-divider" />

      <div className="receipt-items">
        <div className="receipt-items-header">
          <span>Item</span>
          <span>Amount</span>
        </div>

        {sale.items.map((item) => {
          const quantity = toNumber(item.quantity);
          const unitPrice = toNumber(item.unit_price);
          const itemTotal = toNumber(item.total);

          return (
            <div className="receipt-item" key={item.id}>
              <div className="receipt-item-name">
                {item.product?.name || `Product #${item.product_id}`}
              </div>

              <div className="receipt-item-details">
                <span>
                  {quantity} × {formatCurrency(unitPrice)}
                </span>

                <strong>{formatCurrency(itemTotal)}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="receipt-divider" />

      <div className="receipt-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(sale.subtotal)}</strong>
        </div>

        {toNumber(sale.discount) > 0 && (
          <div>
            <span>Discount</span>
            <strong>-{formatCurrency(sale.discount)}</strong>
          </div>
        )}

        {toNumber(sale.tax) > 0 && (
          <div>
            <span>Tax</span>
            <strong>{formatCurrency(sale.tax)}</strong>
          </div>
        )}

        <div className="receipt-total">
          <span>TOTAL</span>
          <strong>{formatCurrency(sale.total)}</strong>
        </div>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-payment">
        <div>
          <span>Payment</span>
          <strong>{sale.payment_method === "cash" ? "Cash" : "Charge"}</strong>
        </div>

        {sale.payment_method === "cash" && (
          <>
            <div>
              <span>Amount Paid</span>
              <strong>{formatCurrency(sale.amount_paid)}</strong>
            </div>

            <div>
              <span>Change</span>
              <strong>{formatCurrency(sale.change_amount)}</strong>
            </div>
          </>
        )}

        {sale.payment_method === "charge" && (
          <>
            {sale.term_months && (
              <div>
                <span>Payment Term</span>
                <strong>
                  {sale.term_months}{" "}
                  {sale.term_months === 1 ? "month" : "months"}
                </strong>
              </div>
            )}

            {sale.due_date && (
              <div>
                <span>Due Date</span>
                <strong>{formatDate(sale.due_date)}</strong>
              </div>
            )}
          </>
        )}
      </div>

      {sale.notes && (
        <>
          <div className="receipt-divider" />

          <div className="receipt-notes">
            <strong>Notes</strong>
            <div>{sale.notes}</div>
          </div>
        </>
      )}

      <div className="receipt-divider" />

      <div className="receipt-footer">
        <div>Thank you for your business!</div>
        <div>Please keep this receipt for your records.</div>
      </div>
    </div>
  );
}
