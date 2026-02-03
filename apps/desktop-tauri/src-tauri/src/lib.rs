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
            let share_csv =
                MenuItem::with_id(app, "share_csv", "Share Data (CSV)", true, None::<&str>)?;
            let event_log = MenuItem::with_id(app, "event_log", "Event Log", true, None::<&str>)?;
            let icon_credits =
                MenuItem::with_id(app, "icon_credits", "Attributes", true, None::<&str>)?;
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
                &[&about_item, &icon_credits, &quit_item],
            )?;
            let file_menu = Submenu::with_items(app, "File", true, &[&share_csv, &event_log])?;
            let menu = Menu::with_items(app, &[&app_menu, &file_menu])?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().0.as_str() {
            "share_csv" => {
                let _ = app.emit("menu-share-csv", ());
            }
            "about_shirt_tracker" => {
                let _ = app.emit("menu-about", ());
            }
            "event_log" => {
                let _ = app.emit("menu-event-log", ());
            }
            "icon_credits" => {
                let _ = app.emit("menu-icon-credits", ());
            }
            "quit_app" => {
                app.exit(0);
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
