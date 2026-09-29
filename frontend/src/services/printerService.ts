import {
  getPrinters,
  printHtml,
} from "tauri-plugin-printer";

/*
|--------------------------------------------------------------------------
| Get Available Printers
|--------------------------------------------------------------------------
*/

export async function testPrinters() {
  const printers = await getPrinters();

  console.log("iPOS Printers:", printers);

  return printers;
}

/*
|--------------------------------------------------------------------------
| Native A4 Printer Test
|--------------------------------------------------------------------------
*/

export async function testNativePrint() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <style>
          @page {
            size: A4 portrait;
            margin: 20mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
          }

          .document {
            width: 100%;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 24px;
          }

          .subtitle {
            margin-bottom: 24px;
            color: #64748b;
            font-size: 13px;
          }

          .section {
            margin-top: 24px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
            padding: 8px 0;
            font-size: 13px;
          }

          .label {
            font-weight: 600;
          }

          .footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
            color: #64748b;
            font-size: 11px;
          }
        </style>
      </head>

      <body>
        <div class="document">
          <h1>iPOS — Inventory Print Test</h1>

          <div class="subtitle">
            Native Windows printer test — A4 Portrait
          </div>

          <div class="section">
            <div class="row">
              <span class="label">Document</span>
              <span>Inventory Product Details</span>
            </div>

            <div class="row">
              <span class="label">Printer</span>
              <span>Microsoft Print to PDF</span>
            </div>

            <div class="row">
              <span class="label">Paper Size</span>
              <span>A4</span>
            </div>

            <div class="row">
              <span class="label">Print Method</span>
              <span>Tauri Native Printing</span>
            </div>
          </div>

          <div class="footer">
            iPOS — Integrated Point of Sale &amp; Inventory System<br />
            Developed by GioTechWorks
          </div>
        </div>
      </body>
    </html>
  `;

  return await printHtml(html, {
    name: "Microsoft Print to PDF",
  });
}

/*
|--------------------------------------------------------------------------
| Inventory Management Document Printing
|--------------------------------------------------------------------------
|
| Used by:
| - Inventory List
| - Inventory Product Details
| - Other future A4 management documents
|
| Keep the actual tauri-plugin-printer printHtml call inside this service.
| Components should not import printHtml directly from the plugin.
|--------------------------------------------------------------------------
*/

export async function printInventoryDocument(html: string) {
  return await printHtml(html);
}
