// Temporarily disabled so release startup errors are visible during testing.
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  app_lib::run();
}
