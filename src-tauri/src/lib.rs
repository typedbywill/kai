mod commands;
mod ipc_server;
mod models;
mod window;

use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check if another instance is running; if so, delegate and exit.
    ipc_server::check_and_delegate();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .on_window_event(|win, event| {
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = win.hide();
            }
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            eprintln!("===============================================");
            eprintln!("   KAI v2 (Desktop AI Helper) Starting...     ");
            eprintln!("===============================================");

            // Start IPC listener for inter-process communication
            ipc_server::start_listener(handle.clone());

            // Show main window on startup
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }

            // Register global shortcuts
            let toggle_handle = handle.clone();
            let toggle_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyX);
            if let Err(e) = app.global_shortcut().on_shortcut(
                toggle_shortcut,
                move |_app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        window::toggle_window(&toggle_handle);
                    }
                },
            ) {
                eprintln!("[KAI] Global shortcut (Super+X) warning: {}", e);
            }

            // Cursor Mode: Super+Shift+X — capture selected text
            let capture_text_handle = handle.clone();
            let capture_text_shortcut =
                Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyX);
            if let Err(e) = app.global_shortcut().on_shortcut(
                capture_text_shortcut,
                move |_app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        window::show_window(&capture_text_handle);
                        // The actual text capture is triggered from the frontend
                        // via the capture_selection IPC command
                    }
                },
            ) {
                eprintln!("[KAI] Capture text shortcut warning: {}", e);
            }

            // Cursor Mode: Super+Shift+S — capture screen region
            let capture_screen_handle = handle.clone();
            let capture_screen_shortcut =
                Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyS);
            if let Err(e) = app.global_shortcut().on_shortcut(
                capture_screen_shortcut,
                move |_app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        window::show_window(&capture_screen_handle);
                    }
                },
            ) {
                eprintln!("[KAI] Screen capture shortcut warning: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::chat::stream_chat,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::settings::get_api_key,
            commands::settings::set_api_key,
            commands::capture::capture_selection,
            commands::capture::capture_screen,
            commands::history::load_chats,
            commands::history::load_chat,
            commands::history::save_chat,
            commands::history::delete_chat,
            commands::history::rename_chat,
            commands::history::search_chats,
            commands::models::list_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running KAI application");
}
