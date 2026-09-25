import type { RefObject } from "react";

import type { Customer } from "../../types/customer";
import type { TaxType } from "../../types/birSetting";

interface POSPaymentModalProps {
  showPaymentModal: boolean;
  submitting: boolean;

  paymentMethod: "cash" | "charge";
  setPaymentMethod: (value: "cash" | "charge") => void;

  customers: Customer[];
  customerLoading: boolean;
  defaultCustomer: string;
  selectedCustomerId: number | null;
  setSelectedCustomerId: (value: number | null) => void;
  selectedCustomer: Customer | null;

  termMonths: number | null;
  setTermMonths: (value: number | null) => void;
  termOptions: number[];

  dueDate: string | null;

  amountPaid: string;
  setAmountPaid: (value: string) => void;
  amountPaidInputRef: RefObject<HTMLInputElement | null>;

  discount: string;
  setDiscount: (value: string) => void;

  tax: string;
  setTax: (value: string) => void;
  taxType: TaxType;

  notes: string;
  setNotes: (value: string) => void;

  numericAmountPaid: number;
  insufficientPayment: boolean;
  changeAmount: number;

  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  formatCurrency: (value: unknown) => string;
  formatDate: (dateString: string) => string;

  onClose: () => void;
  onCompleteSale: () => void;
  onClearError: () => void;
}

export default function POSPaymentModal({
  showPaymentModal,
  submitting,

  paymentMethod,
  setPaymentMethod,

  customers,
  customerLoading,
  defaultCustomer,
  selectedCustomerId,
  setSelectedCustomerId,
  selectedCustomer,

  termMonths,
  setTermMonths,
  termOptions,

  dueDate,

  amountPaid,
  setAmountPaid,
  amountPaidInputRef,

  discount,
  setDiscount,

  tax,
  setTax,
  taxType,

  notes,
  setNotes,

  numericAmountPaid,
  insufficientPayment,
  changeAmount,

  subtotal,
  discountRate,
  discountAmount,
  taxRate,
  taxAmount,
  total,

  formatCurrency,
  formatDate,

  onClose,
  onCompleteSale,
  onClearError,
}: POSPaymentModalProps) {
  if (!showPaymentModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 px-5 py-5 sm:px-6">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-32 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-cyan-300/10" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm">
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
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  Complete Payment
                </h3>

                <p className="mt-0.5 text-xs text-blue-100 sm:text-sm">
                  Complete the sale transaction.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xl text-white ring-1 ring-white/10 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Close payment"
            >
              ×
            </button>
          </div>
        </div>

        {/* CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* LEFT SIDE */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path
                      strokeLinecap="round"
                      d="M12 8v8M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Payment Details
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Choose how the customer will pay.
                  </p>
                </div>
              </div>

              {/* PAYMENT METHOD */}

              <div>
                <label className="mb-2.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cash");
                      onClearError();
                    }}
                    disabled={submitting}
                    className={`group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border text-sm font-bold transition duration-200 ${
                      paymentMethod === "cash"
                        ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 shadow-sm ring-2 ring-emerald-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50"
                    }`}
                  >
                    {paymentMethod === "cash" && (
                      <span className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                    )}
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        paymentMethod === "cash"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
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
                    </span>
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("charge");
                      setAmountPaid("0");
                      onClearError();
                    }}
                    disabled={submitting}
                    className={`group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border text-sm font-bold transition duration-200 ${
                      paymentMethod === "charge"
                        ? "border-violet-400 bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-700 shadow-sm ring-2 ring-violet-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    {paymentMethod === "charge" && (
                      <span className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                    )}
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        paymentMethod === "charge"
                          ? "bg-violet-100 text-violet-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600"
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
                    </span>
                    Charge
                  </button>
                </div>
              </div>

              {/* CUSTOMER */}

              <div className="mt-5">
                <label
                  htmlFor="sale-customer"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
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
                      onClearError();
                    }}
                    disabled={submitting || customerLoading}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                  <p className="mt-1.5 text-xs font-medium text-indigo-500">
                    Loading customers...
                  </p>
                )}

                {paymentMethod === "charge" && !selectedCustomer && (
                  <p className="mt-1.5 text-xs text-slate-400">
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
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
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
                          onClearError();
                        }}
                        disabled={submitting}
                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                      >
                        <option value="">Select term</option>

                        {termOptions.map((months) => (
                          <option key={months} value={months}>
                            {months} {months === 1 ? "Month" : "Months"}
                          </option>
                        ))}
                      </select>

                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">
                          <svg
                            className="h-4 w-4"
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
                        </div>

                        <span className="text-sm font-semibold text-cyan-700">
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
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount Paid
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-emerald-500">
                      ₱
                    </span>

                    <input
                      ref={amountPaidInputRef}
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(event) => setAmountPaid(event.target.value)}
                      onFocus={(event) => event.target.select()}
                      disabled={submitting}
                      className="h-14 w-full rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 pl-9 pr-4 text-2xl font-extrabold text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              )}

              {/* CHANGE */}

              {paymentMethod === "cash" && numericAmountPaid > total && (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      ✓
                    </div>

                    <span className="text-sm font-bold text-emerald-700">
                      Change
                    </span>
                  </div>

                  <span className="text-xl font-extrabold text-emerald-700">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              )}

              {/* CHARGE INFORMATION */}

              {paymentMethod === "charge" && selectedCustomer && termMonths && (
                <div className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
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

                    <span className="text-xs font-bold uppercase tracking-wide text-violet-600">
                      Charge Summary
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-violet-600">Customer</span>

                    <span className="max-w-[180px] truncate font-semibold text-violet-950">
                      {selectedCustomer.name}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-violet-600">Term</span>

                    <span className="font-semibold text-violet-950">
                      {termMonths} {termMonths === 1 ? "Month" : "Months"}
                    </span>
                  </div>

                  {dueDate && (
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-violet-600">Due Date</span>

                      <span className="font-semibold text-violet-950">
                        {formatDate(dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDE */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  ₱
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Adjustments
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Apply discount and tax before completing the sale.
                  </p>
                </div>
              </div>

              {/* DISCOUNT / TAX */}

              <div className="grid grid-cols-2 gap-3">
                {/* DISCOUNT */}

                <div>
                  <label
                    htmlFor="sale-discount"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
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
                        onClearError();
                      }}
                      onFocus={(event) => event.target.select()}
                      disabled={submitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-right text-lg font-bold text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-400">
                      %
                    </span>
                  </div>

                  <p className="mt-1.5 text-right text-[11px] font-semibold text-rose-500">
                    - {formatCurrency(discountAmount)}
                  </p>
                </div>

                {/* TAX */}

                <div>
                  <label
                    htmlFor="sale-tax"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
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
                        onClearError();
                      }}
                      onFocus={(event) => event.target.select()}
                      disabled={submitting || taxType === "non_vat"}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-right text-lg font-bold text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-500">
                      %
                    </span>
                  </div>

                  <p className="mt-1.5 text-right text-[11px] font-semibold text-slate-400">
                    {taxType === "vat_inclusive"
                      ? "VAT included"
                      : taxType === "vat_exclusive"
                        ? "VAT added"
                        : "Non-VAT"}
                  </p>

                  <p className="mt-1 text-right text-[11px] font-medium text-slate-500">
                    {formatCurrency(taxAmount)}
                  </p>
                </div>
              </div>

              {/* SUMMARY */}

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>

                    <span className="font-semibold text-slate-700">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Discount ({discountRate.toFixed(2)}%)</span>

                    <span className="font-semibold text-rose-500">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>
                      {taxType === "non_vat" ? "Tax" : "VAT"} (
                      {taxRate.toFixed(2)}%)
                    </span>

                    <span className="font-semibold text-slate-700">
                      {taxType === "vat_inclusive" ? "" : "+ "}
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                          Total Amount
                        </p>

                        <p className="mt-1 text-sm font-semibold text-white/90">
                          Amount due
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                        ₱
                      </div>
                    </div>

                    <div className="mt-3 text-right text-3xl font-extrabold tracking-tight text-white">
                      {formatCurrency(total)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES */}

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Notes
              <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Optional sale notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {/* INSUFFICIENT */}

          {paymentMethod === "cash" && amountPaid && insufficientPayment && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-3 text-xs font-semibold text-rose-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                !
              </span>
              Amount paid is insufficient.
            </div>
          )}

          {/* CHARGE VALIDATION */}

          {paymentMethod === "charge" &&
            (!selectedCustomerId || !termMonths) && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-xs font-semibold text-amber-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  !
                </span>
                Select a customer and payment term before completing the sale.
              </div>
            )}
        </div>

        {/* FOOTER */}

        <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-white p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onCompleteSale}
            disabled={
              submitting ||
              insufficientPayment ||
              (paymentMethod === "cash" && !amountPaid) ||
              (paymentMethod === "charge" &&
                (!selectedCustomerId || !termMonths))
            }
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-sm font-bold text-white shadow-md transition hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400 disabled:shadow-none"
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
  );
}
