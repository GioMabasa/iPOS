import { useState } from "react";

import { testNativePrint, testPrinters } from "../services/printerService";

function PrinterTest() {
  const [printers, setPrinters] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const [printMessage, setPrintMessage] = useState("");

  const handleGetPrinters = async () => {
    setLoading(true);
    setError("");
    setPrintMessage("");

    try {
      const result = await testPrinters();

      console.log("iPOS Printers:", result);
      setPrinters(result);
    } catch (err) {
      console.error("Printer discovery failed:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTest = async () => {
    setPrinting(true);
    setError("");
    setPrintMessage("");

    try {
      const result = await testNativePrint();

      console.log("Native print result:", result);

      setPrintMessage(
        "A4 print test sent successfully to Microsoft Print to PDF.",
      );
    } catch (err) {
      console.error("Native print failed:", err);
      setError(String(err));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">iPOS Printer Test</h1>

        <p className="mt-1 text-sm text-slate-500">
          Temporary test for native Windows printer discovery and A4 document
          printing.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGetPrinters}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading Printers..." : "Get Printers"}
          </button>

          <button
            type="button"
            onClick={handlePrintTest}
            disabled={printing}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {printing ? "Printing..." : "Print A4 Test"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {printMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {printMessage}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {printers.length === 0 ? (
            <p className="text-sm text-slate-500">No printers loaded yet.</p>
          ) : (
            printers.map((printer, index) => (
              <pre
                key={index}
                className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-white"
              >
                {JSON.stringify(printer, null, 2)}
              </pre>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PrinterTest;
