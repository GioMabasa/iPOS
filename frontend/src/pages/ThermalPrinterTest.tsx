import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ThermalReceiptItem {
  name: string;
  qty: number;
  price: number;
}

interface ThermalReceipt {
  business_name: string;
  business_address: string;
  receipt_number: string;
  date: string;
  cashier: string;
  items: ThermalReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_type: string;
  cash_received: number | null;
  change: number | null;
  customer_name: string | null;
  term_months: number | null;
  due_date: string | null;
}

function ThermalPrinterTest() {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const [printMessage, setPrintMessage] = useState("");

  const handleRawTest = async () => {
    setPrinting(true);
    setError("");
    setPrintMessage("");

    try {
      const result = await invoke<string>("test_raw_print");

      console.log("Thermal RAW print result:", result);
      setPrintMessage(result);
    } catch (err) {
      console.error("Thermal RAW print failed:", err);
      setError(String(err));
    } finally {
      setPrinting(false);
    }
  };

  const handleCashReceiptTest = async () => {
    setPrinting(true);
    setError("");
    setPrintMessage("");

    const receipt: ThermalReceipt = {
      business_name: "GioTechWorks",
      business_address: "Software & Business Solutions",
      receipt_number: "TEST-0001",
      date: "01/10/2026 11:20 PM",
      cashier: "Admin",

      items: [
        {
          name: "Sample Product A",
          qty: 2,
          price: 100,
        },
        {
          name: "Sample Product B",
          qty: 1,
          price: 150,
        },
      ],

      subtotal: 350,
      discount: 0,
      tax: 0,
      total: 350,

      payment_type: "CASH",
      cash_received: 500,
      change: 150,

      customer_name: null,
      term_months: null,
      due_date: null,
    };

    try {
      const result = await invoke<string>("print_thermal_receipt", {
        receipt,
      });

      console.log("Thermal receipt result:", result);
      setPrintMessage(result);
    } catch (err) {
      console.error("Thermal receipt failed:", err);
      setError(String(err));
    } finally {
      setPrinting(false);
    }
  };

  const handleCashDrawerTest = async () => {
    setPrinting(true);
    setError("");
    setPrintMessage("");

    try {
      const result = await invoke<string>("open_cash_drawer");

      console.log("Cash drawer result:", result);
      setPrintMessage(result);
    } catch (err) {
      console.error("Cash drawer test failed:", err);
      setError(String(err));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          iPOS Thermal Printer Test
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Temporary test for the 58mm thermal POS printer using native Windows
          RAW ESC/POS printing.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-700">Printer</span>

              <p className="text-slate-600">Generic / Text Only</p>
            </div>

            <div>
              <span className="font-semibold text-slate-700">Port</span>

              <p className="text-slate-600">USB001</p>
            </div>

            <div>
              <span className="font-semibold text-slate-700">Device</span>

              <p className="text-slate-600">XP-58H</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRawTest}
            disabled={printing}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {printing ? "Printing..." : "Print RAW Connection Test"}
          </button>

          <button
            type="button"
            onClick={handleCashReceiptTest}
            disabled={printing}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {printing ? "Printing..." : "Print Sample Cash Receipt"}
          </button>

          <button
            type="button"
            onClick={handleCashDrawerTest}
            disabled={printing}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {printing ? "Testing..." : "Test Cash Drawer"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Thermal printer test failed</p>

            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        {printMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {printMessage}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">
            Sample Receipt
          </h2>

          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-700">
            <div className="text-center font-bold">GioTechWorks</div>

            <div className="text-center">Software &amp; Business Solutions</div>

            <div className="my-2 border-t border-slate-300" />

            <div>Receipt #: TEST-0001</div>
            <div>Date: 01/10/2026 11:20 PM</div>
            <div>Cashier: Admin</div>

            <div className="my-2 border-t border-slate-300" />

            <div>Sample Product A</div>

            <div className="flex justify-between">
              <span>2 x PHP 100.00</span>
              <span>PHP 200.00</span>
            </div>

            <div className="mt-1">Sample Product B</div>

            <div className="flex justify-between">
              <span>1 x PHP 150.00</span>
              <span>PHP 150.00</span>
            </div>

            <div className="my-2 border-t border-slate-300" />

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>PHP 350.00</span>
            </div>

            <div className="flex justify-between">
              <span>Discount</span>
              <span>PHP 0.00</span>
            </div>

            <div className="flex justify-between">
              <span>Tax</span>
              <span>PHP 0.00</span>
            </div>

            <div className="my-2 border-t border-slate-300" />

            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>PHP 350.00</span>
            </div>

            <div className="mt-2">Payment: CASH</div>

            <div className="flex justify-between">
              <span>Cash Received</span>
              <span>PHP 500.00</span>
            </div>

            <div className="flex justify-between font-bold">
              <span>CHANGE</span>
              <span>PHP 150.00</span>
            </div>

            <div className="mt-4 text-center">Thank you for shopping!</div>

            <div className="text-center">Please come again.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThermalPrinterTest;
