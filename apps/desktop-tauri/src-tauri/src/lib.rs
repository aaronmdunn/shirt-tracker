use tauri::{
    menu::{Menu, MenuItem, Submenu},
    Emitter, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.maximize();
            }
            let export_csv =
                MenuItem::with_id(app, "export_csv", "Export CSV", true, None::<&str>)?;
            let import_csv =
                MenuItem::with_id(app, "import_csv", "Import CSV", true, None::<&str>)?;
            let event_log = MenuItem::with_id(app, "event_log", "Event Log", true, None::<&str>)?;
            let about_item = MenuItem::with_id(
                app,
                "about_shirt_tracker",
                "About Shirt Tracker",
                true,
                None::<&str>,
            )?;
            let quit_item = MenuItem::with_id(app, "quit_app", "Quit", true, Some("Cmd+Q"))?;
            let app_menu = Submenu::with_items(
                app,
                "Shirt Tracker",
                true,
                &[&about_item, &quit_item],
            )?;
            let file_menu = Submenu::with_items(app, "File", true, &[&export_csv, &import_csv, &event_log])?;
            let menu = Menu::with_items(app, &[&app_menu, &file_menu])?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().0.as_str() {
            "export_csv" => {
                let _ = app.emit("menu-export-csv", ());
            }
            "import_csv" => {
                let _ = app.emit("menu-import-csv", ());
            }
            "about_shirt_tracker" => {
                let _ = app.emit("menu-about", ());
            }
            "event_log" => {
                let _ = app.emit("menu-event-log", ());
            }
            "quit_app" => {
                app.exit(0);
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
