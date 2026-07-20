use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use std::str::FromStr;

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[tauri::command]
fn toggle_window(window: tauri::Window) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_window,
            toggle_window
        ])
        .setup(|app| {
            // Build Tray Menu
            let toggle_i = MenuItem::with_id(app, "toggle", "Toggle Overlay (Meta+X)", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit KAI", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            // Register Global Shortcut Super+X / Meta+X
            let app_handle = app.handle().clone();
            if let Ok(shortcut) = Shortcut::from_str("Super+X") {
                let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(false) = event {
                // Optionally hide when losing focus if user enabled auto-hide
                window.emit("window-blur", ()).ok();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
