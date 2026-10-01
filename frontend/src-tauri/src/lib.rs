use serde::Deserialize;

#[cfg(windows)]
use windows::{
  core::{PCWSTR, PWSTR},
  Win32::Foundation::GetLastError,
  Win32::Graphics::Printing::{
    ClosePrinter,
    EndDocPrinter,
    EndPagePrinter,
    OpenPrinterW,
    StartDocPrinterW,
    StartPagePrinter,
    WritePrinter,
    DOC_INFO_1W,
    PRINTER_HANDLE,
  },
};

#[cfg(windows)]
fn to_wide(value: &str) -> Vec<u16> {
  value.encode_utf16().chain(std::iter::once(0)).collect()
}

#[cfg(windows)]
#[derive(Debug, Deserialize)]
struct ThermalReceiptItem {
  name: String,
  qty: f64,
  price: f64,
}

#[cfg(windows)]
#[derive(Debug, Deserialize)]
struct ThermalReceipt {
  business_name: String,
  business_address: String,
  receipt_number: String,
  date: String,
  cashier: String,
  items: Vec<ThermalReceiptItem>,
  subtotal: f64,
  discount: f64,
  tax: f64,
  total: f64,
  payment_type: String,
  cash_received: Option<f64>,
  change: Option<f64>,
  customer_name: Option<String>,
  term_months: Option<u32>,
  due_date: Option<String>,
}

#[cfg(windows)]
fn format_money(value: f64) -> String {
  format!("PHP {:.2}", value)
}

#[cfg(windows)]
fn receipt_line(left: &str, right: &str, width: usize) -> String {
  let right_len = right.chars().count();

  if right_len >= width {
    return right.chars().take(width).collect();
  }

  let available_left = width - right_len - 1;

  let left_text: String = left.chars().take(available_left).collect();

  format!(
    "{:<width$}{}",
    left_text,
    right,
    width = available_left
  )
}

#[cfg(windows)]
#[tauri::command]
fn print_thermal_receipt(receipt: ThermalReceipt) -> Result<String, String> {
  let printer_name = "Generic / Text Only";
  let width = 32;

  let mut data: Vec<u8> = Vec::new();

  // Initialize printer
  data.extend_from_slice(b"\x1B\x40");

  // Center alignment
  data.extend_from_slice(b"\x1B\x61\x01");

  // Bold + double height/width business name
  data.extend_from_slice(b"\x1B\x45\x01");
  data.extend_from_slice(b"\x1D\x21\x11");
  data.extend_from_slice(receipt.business_name.as_bytes());
  data.extend_from_slice(b"\r\n");

  // Normal size
  data.extend_from_slice(b"\x1D\x21\x00");
  data.extend_from_slice(b"\x1B\x45\x00");

  if !receipt.business_address.is_empty() {
    data.extend_from_slice(receipt.business_address.as_bytes());
    data.extend_from_slice(b"\r\n");
  }

  data.extend_from_slice(b"\r\n");

  // Left alignment
  data.extend_from_slice(b"\x1B\x61\x00");

  data.extend_from_slice(
    format!("Receipt #: {}\r\n", receipt.receipt_number).as_bytes(),
  );

  data.extend_from_slice(
    format!("Date: {}\r\n", receipt.date).as_bytes(),
  );

  data.extend_from_slice(
    format!("Cashier: {}\r\n", receipt.cashier).as_bytes(),
  );

  data.extend_from_slice(
    b"--------------------------------\r\n",
  );

  // Items
  for item in &receipt.items {
    let item_name: String = item.name.chars().take(width).collect();

    data.extend_from_slice(item_name.as_bytes());
    data.extend_from_slice(b"\r\n");

    let qty_price = format!(
      "{} x {}",
      item.qty,
      format_money(item.price)
    );

    let amount = format_money(item.qty * item.price);

    let line = receipt_line(
      &format!("  {}", qty_price),
      &amount,
      width,
    );

    data.extend_from_slice(line.as_bytes());
    data.extend_from_slice(b"\r\n");
  }

  data.extend_from_slice(
    b"--------------------------------\r\n",
  );

  // Summary
  data.extend_from_slice(
    receipt_line(
      "Subtotal",
      &format_money(receipt.subtotal),
      width,
    )
    .as_bytes(),
  );
  data.extend_from_slice(b"\r\n");

  data.extend_from_slice(
    receipt_line(
      "Discount",
      &format_money(receipt.discount),
      width,
    )
    .as_bytes(),
  );
  data.extend_from_slice(b"\r\n");

  data.extend_from_slice(
    receipt_line(
      "Tax",
      &format_money(receipt.tax),
      width,
    )
    .as_bytes(),
  );
  data.extend_from_slice(b"\r\n");

  data.extend_from_slice(
    b"--------------------------------\r\n",
  );

  // TOTAL
  data.extend_from_slice(b"\x1B\x45\x01");

  let total_line = receipt_line(
    "TOTAL",
    &format_money(receipt.total),
    width,
  );

  data.extend_from_slice(total_line.as_bytes());
  data.extend_from_slice(b"\r\n");

  data.extend_from_slice(b"\x1B\x45\x00");

  data.extend_from_slice(b"\r\n");

  // Payment
  data.extend_from_slice(
    format!("Payment: {}\r\n", receipt.payment_type).as_bytes(),
  );

  // Cash payment details
  if let Some(cash_received) = receipt.cash_received {
    data.extend_from_slice(
      receipt_line(
        "Cash Received",
        &format_money(cash_received),
        width,
      )
      .as_bytes(),
    );

    data.extend_from_slice(b"\r\n");
  }

  if let Some(change) = receipt.change {
    data.extend_from_slice(b"\x1B\x45\x01");

    data.extend_from_slice(
      receipt_line(
        "CHANGE",
        &format_money(change),
        width,
      )
      .as_bytes(),
    );

    data.extend_from_slice(b"\r\n");

    data.extend_from_slice(b"\x1B\x45\x00");
  }

  // Charge information
  if receipt.payment_type.to_lowercase() == "charge" {
    data.extend_from_slice(b"\r\n");

    if let Some(customer_name) = &receipt.customer_name {
      data.extend_from_slice(
        format!("Customer: {}\r\n", customer_name).as_bytes(),
      );
    }

    if let Some(term_months) = receipt.term_months {
      data.extend_from_slice(
        format!("Terms: {} month(s)\r\n", term_months).as_bytes(),
      );
    }

    if let Some(due_date) = &receipt.due_date {
      data.extend_from_slice(
        format!("Due Date: {}\r\n", due_date).as_bytes(),
      );
    }
  }

  // Footer
  data.extend_from_slice(b"\r\n");

  data.extend_from_slice(b"\x1B\x61\x01");

  data.extend_from_slice(
    b"Thank you for shopping!\r\n",
  );

  data.extend_from_slice(
    b"Please come again.\r\n",
  );

  // Feed paper
  data.extend_from_slice(b"\r\n\r\n\r\n");

  // Return to left alignment
  data.extend_from_slice(b"\x1B\x61\x00");

  let mut printer_name_wide = to_wide(printer_name);
  let mut document_name = to_wide("iPOS Thermal Receipt");
  let mut datatype = to_wide("RAW");

  let mut printer_handle = PRINTER_HANDLE::default();

  unsafe {
    OpenPrinterW(
      PCWSTR(printer_name_wide.as_ptr()),
      &mut printer_handle,
      None,
    )
    .map_err(|error| {
      format!(
        "Failed to open printer '{}': {}",
        printer_name,
        error
      )
    })?;

    let doc_info = DOC_INFO_1W {
      pDocName: PWSTR(document_name.as_mut_ptr()),
      pOutputFile: PWSTR::null(),
      pDatatype: PWSTR(datatype.as_mut_ptr()),
    };

    let job_id = StartDocPrinterW(
      printer_handle,
      1,
      &doc_info as *const DOC_INFO_1W,
    );

    if job_id == 0 {
      let error = GetLastError();

      ClosePrinter(printer_handle);

      return Err(format!(
        "StartDocPrinterW failed. Windows error: {}",
        error.0
      ));
    }

    let start_page_result = StartPagePrinter(printer_handle);

    if !start_page_result.as_bool() {
      let error = GetLastError();

      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "StartPagePrinter failed. Windows error: {}",
        error.0
      ));
    }

    let mut bytes_written = 0u32;

    let write_result = WritePrinter(
      printer_handle,
      data.as_ptr() as *const _,
      data.len() as u32,
      &mut bytes_written,
    );

    if !write_result.as_bool() {
      let error = GetLastError();

      EndPagePrinter(printer_handle);
      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "WritePrinter failed. Windows error: {}",
        error.0
      ));
    }

    EndPagePrinter(printer_handle);
    EndDocPrinter(printer_handle);
    ClosePrinter(printer_handle);

    if bytes_written != data.len() as u32 {
      return Err(format!(
        "Only {} of {} bytes were written.",
        bytes_written,
        data.len()
      ));
    }

    Ok(format!(
      "Thermal receipt job {} sent successfully to '{}'.",
      job_id,
      printer_name
    ))
  }
}

#[cfg(not(windows))]
#[tauri::command]
fn print_thermal_receipt(
  _receipt: serde_json::Value,
) -> Result<String, String> {
  Err(
    "Thermal receipt printing is currently supported on Windows only."
      .to_string(),
  )
}

#[cfg(windows)]
#[tauri::command]
fn open_cash_drawer() -> Result<String, String> {
  let printer_name = "Generic / Text Only";

  // Standard ESC/POS cash drawer kick command.
  //
  // ESC p 0 25 250
  //
  // 0   = cash drawer pin 2
  // 25  = pulse ON time
  // 250 = pulse OFF time
  let data = b"\x1B\x70\x01\x19\xFA";

  let mut printer_name_wide = to_wide(printer_name);
  let mut document_name = to_wide("iPOS Cash Drawer");
  let mut datatype = to_wide("RAW");

  let mut printer_handle = PRINTER_HANDLE::default();

  unsafe {
    OpenPrinterW(
      PCWSTR(printer_name_wide.as_ptr()),
      &mut printer_handle,
      None,
    )
    .map_err(|error| {
      format!(
        "Failed to open printer '{}': {}",
        printer_name,
        error
      )
    })?;

    let doc_info = DOC_INFO_1W {
      pDocName: PWSTR(document_name.as_mut_ptr()),
      pOutputFile: PWSTR::null(),
      pDatatype: PWSTR(datatype.as_mut_ptr()),
    };

    let job_id = StartDocPrinterW(
      printer_handle,
      1,
      &doc_info as *const DOC_INFO_1W,
    );

    if job_id == 0 {
      let error = GetLastError();

      ClosePrinter(printer_handle);

      return Err(format!(
        "StartDocPrinterW failed. Windows error: {}",
        error.0
      ));
    }

    let start_page_result = StartPagePrinter(printer_handle);

    if !start_page_result.as_bool() {
      let error = GetLastError();

      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "StartPagePrinter failed. Windows error: {}",
        error.0
      ));
    }

    let mut bytes_written = 0u32;

    let write_result = WritePrinter(
      printer_handle,
      data.as_ptr() as *const _,
      data.len() as u32,
      &mut bytes_written,
    );

    if !write_result.as_bool() {
      let error = GetLastError();

      EndPagePrinter(printer_handle);
      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "WritePrinter failed. Windows error: {}",
        error.0
      ));
    }

    let end_page_result = EndPagePrinter(printer_handle);

    if !end_page_result.as_bool() {
      let error = GetLastError();

      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "EndPagePrinter failed. Windows error: {}",
        error.0
      ));
    }

    let end_doc_result = EndDocPrinter(printer_handle);

    if !end_doc_result.as_bool() {
      let error = GetLastError();

      ClosePrinter(printer_handle);

      return Err(format!(
        "EndDocPrinter failed. Windows error: {}",
        error.0
      ));
    }

    ClosePrinter(printer_handle);

    if bytes_written != data.len() as u32 {
      return Err(format!(
        "Only {} of {} bytes were written.",
        bytes_written,
        data.len()
      ));
    }

    Ok(format!(
      "Cash drawer kick job {} sent successfully to '{}'.",
      job_id,
      printer_name
    ))
  }
}

#[cfg(not(windows))]
#[tauri::command]
fn open_cash_drawer() -> Result<String, String> {
  Err(
    "Cash drawer control is currently supported on Windows only."
      .to_string(),
  )
}

#[cfg(windows)]
#[tauri::command]
fn test_raw_print() -> Result<String, String> {
  let printer_name = "Generic / Text Only";

  let mut printer_name_wide = to_wide(printer_name);
  let mut document_name = to_wide("iPOS Native RAW Test");
  let mut datatype = to_wide("RAW");

  let mut printer_handle = PRINTER_HANDLE::default();

  unsafe {
    OpenPrinterW(
      PCWSTR(printer_name_wide.as_ptr()),
      &mut printer_handle,
      None,
    )
    .map_err(|error| {
      format!(
        "Failed to open printer '{}': {}",
        printer_name,
        error
      )
    })?;

    let doc_info = DOC_INFO_1W {
      pDocName: PWSTR(document_name.as_mut_ptr()),
      pOutputFile: PWSTR::null(),
      pDatatype: PWSTR(datatype.as_mut_ptr()),
    };

    let job_id = StartDocPrinterW(
      printer_handle,
      1,
      &doc_info as *const DOC_INFO_1W,
    );

    if job_id == 0 {
      let error = GetLastError();
      ClosePrinter(printer_handle);

      return Err(format!(
        "StartDocPrinterW failed. Windows error: {}",
        error.0
      ));
    }

    let start_page_result = StartPagePrinter(printer_handle);

    if !start_page_result.as_bool() {
      let error = GetLastError();

      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "StartPagePrinter failed. Windows error: {}",
        error.0
      ));
    }

    let data = b"\x1B\x40\
iPOS NATIVE RAW TEST\r\n\
==============================\r\n\
Printer: Generic / Text Only\r\n\
Port: USB001\r\n\
Tauri + Windows RAW Printing\r\n\
==============================\r\n\
\r\n\r\n";

    let mut bytes_written = 0u32;

    let write_result = WritePrinter(
      printer_handle,
      data.as_ptr() as *const _,
      data.len() as u32,
      &mut bytes_written,
    );

    if !write_result.as_bool() {
      let error = GetLastError();

      EndPagePrinter(printer_handle);
      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "WritePrinter failed. Windows error: {}",
        error.0
      ));
    }

    let end_page_result = EndPagePrinter(printer_handle);

    if !end_page_result.as_bool() {
      let error = GetLastError();

      EndDocPrinter(printer_handle);
      ClosePrinter(printer_handle);

      return Err(format!(
        "EndPagePrinter failed. Windows error: {}",
        error.0
      ));
    }

    let end_doc_result = EndDocPrinter(printer_handle);

    if !end_doc_result.as_bool() {
      let error = GetLastError();

      ClosePrinter(printer_handle);

      return Err(format!(
        "EndDocPrinter failed. Windows error: {}",
        error.0
      ));
    }

    ClosePrinter(printer_handle);

    if bytes_written != data.len() as u32 {
      return Err(format!(
        "Only {} of {} bytes were written.",
        bytes_written,
        data.len()
      ));
    }

    Ok(format!(
      "RAW print job {} sent successfully to '{}'.",
      job_id,
      printer_name
    ))
  }
}

#[cfg(not(windows))]
#[tauri::command]
fn test_raw_print() -> Result<String, String> {
  Err(
    "RAW printer test is currently supported on Windows only."
      .to_string(),
  )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_printer::init())
    .invoke_handler(tauri::generate_handler![
      test_raw_print,
      print_thermal_receipt,
      open_cash_drawer
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      #[cfg(not(debug_assertions))]
      {
        if let Ok(program_data) = std::env::var("ProgramData") {
          let app_data_path =
            std::path::PathBuf::from(program_data)
              .join("GioTechWorks")
              .join("iPOS");

          let storage_path = app_data_path.join("storage");

          std::fs::create_dir_all(&storage_path)?;

          std::env::set_var(
            "IPOS_ENVIRONMENT_PATH",
            app_data_path.to_string_lossy().to_string(),
          );

          std::env::set_var(
            "IPOS_STORAGE_PATH",
            storage_path.to_string_lossy().to_string(),
          );

          let resource_dir = app.path().resource_dir()?;

          let resource_dir = if cfg!(windows) {
            let path = resource_dir.to_string_lossy();

            if let Some(stripped) = path.strip_prefix(r"\\?\") {
              std::path::PathBuf::from(stripped)
            } else {
              resource_dir
            }
          } else {
            resource_dir
          };

          let php_path = resource_dir
            .join("resources")
            .join("php")
            .join("php.exe");

          let backend_path = resource_dir
            .join("resources")
            .join("backend");

          let public_path = backend_path.join("public");

          println!("RESOURCE DIR: {:?}", resource_dir);
          println!("PHP PATH: {:?}", php_path);
          println!("PHP EXISTS: {}", php_path.exists());
          println!("BACKEND PATH: {:?}", backend_path);
          println!("BACKEND EXISTS: {}", backend_path.exists());
          println!("PUBLIC PATH: {:?}", public_path);
          println!("PUBLIC EXISTS: {}", public_path.exists());

          #[cfg(windows)]
          {
            use std::os::windows::process::CommandExt;

            std::process::Command::new(&php_path)
              .arg("-S")
              .arg("127.0.0.1:8001")
              .arg("-t")
              .arg(&public_path)
              .current_dir(&backend_path)
              .spawn()?;
          }

          #[cfg(not(windows))]
          {
            std::process::Command::new(&php_path)
              .arg("-S")
              .arg("127.0.0.1:8001")
              .arg("-t")
              .arg(&public_path)
              .current_dir(&backend_path)
              .spawn()?;
          }
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}