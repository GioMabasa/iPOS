use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_printer::init())
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

let php_path = resource_dir.join("resources").join("php").join("php.exe");
let backend_path = resource_dir.join("resources").join("backend");
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

