#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|_app| {
      // Window setup and additional configuration
      println!("Nova Editor starting up...");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
