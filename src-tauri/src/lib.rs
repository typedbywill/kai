mod commands;
mod models;

use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_vis = window.is_visible().unwrap_or(false);
        eprintln!("[KAI LOG] toggle_window called, currently visible: {}", is_vis);
        if is_vis {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(move |app| {
            let handle = app.handle().clone();

            eprintln!("===============================================");
            eprintln!("   KAI (Desktop AI Helper Overlay) Starting... ");
            eprintln!("===============================================");

            if let Some(window) = app.get_webview_window("main") {
                eprintln!("[KAI LOG] Showing main window on startup...");
                let _ = window.show();
                let _ = window.set_focus();
            } else {
                eprintln!("[KAI LOG] ERROR: 'main' window not found!");
            }

            let shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyX);
            let handle_shortcut = handle.clone();
            if let Err(e) = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    toggle_window(&handle_shortcut);
                }
            }) {
                eprintln!("[KAI LOG] Global shortcut warning: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::chat::stream_chat,
            commands::settings::load_settings,
            commands::settings::save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running kai application");
}
