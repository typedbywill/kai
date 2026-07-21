mod commands;
mod models;

use std::fs;
use std::io::{Read, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::PathBuf;
use std::thread;

use std::os::unix::process::CommandExt;
use std::process::{Command, Stdio};
use libc;

use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn get_ipc_socket_path() -> PathBuf {
    if let Ok(runtime_dir) = std::env::var("XDG_RUNTIME_DIR") {
        PathBuf::from(runtime_dir).join("kai_overlay.sock")
    } else {
        let mut p = dirs::config_dir().unwrap_or_else(|| PathBuf::from("/tmp"));
        p.push("kai");
        let _ = fs::create_dir_all(&p);
        p.join("kai_overlay.sock")
    }
}

pub fn check_ipc_client() {
    let args: Vec<String> = std::env::args().collect();
    let is_toggle = args.iter().any(|arg| arg == "--toggle" || arg == "-t");
    let is_daemon = args.iter().any(|arg| arg == "--daemon");
    let is_foreground = args.iter().any(|arg| arg == "--foreground" || arg == "-f");
    let msg = if is_toggle { "toggle" } else { "show" };

    let socket_path = get_ipc_socket_path();
    if let Ok(mut stream) = UnixStream::connect(&socket_path) {
        let _ = stream.write_all(msg.as_bytes());
        eprintln!("[KAI IPC] Sent command '{}' to existing KAI instance.", msg);
        std::process::exit(0);
    }

    if !is_daemon && !is_foreground {
        if let Ok(exe) = std::env::current_exe() {
            let mut cmd = Command::new(exe);
            cmd.arg("--daemon");
            if is_toggle {
                cmd.arg("--toggle");
            }
            unsafe {
                cmd.pre_exec(|| {
                    let _ = libc::setsid();
                    Ok(())
                });
            }
            cmd.stdin(Stdio::null())
               .stdout(Stdio::null())
               .stderr(Stdio::null());

            if let Err(e) = cmd.spawn() {
                eprintln!("[KAI WARNING] Failed to spawn background process: {}", e);
            } else {
                std::process::exit(0);
            }
        }
    }
}

pub fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_vis = window.is_visible().unwrap_or(false);
        eprintln!("[KAI LOG] toggle_window called, currently visible: {}", is_vis);
        if is_vis {
            let _ = window.hide();
        } else {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    check_ipc_client();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = window.hide();
            }
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            eprintln!("===============================================");
            eprintln!("   KAI (Desktop AI Helper Overlay) Starting... ");
            eprintln!("===============================================");

            let socket_path = get_ipc_socket_path();
            let _ = fs::remove_file(&socket_path);

            match UnixListener::bind(&socket_path) {
                Ok(listener) => {
                    let ipc_handle = handle.clone();
                    thread::spawn(move || {
                        for stream in listener.incoming() {
                            if let Ok(mut stream) = stream {
                                let mut buf = [0u8; 64];
                                if let Ok(n) = stream.read(&mut buf) {
                                    let command = String::from_utf8_lossy(&buf[..n]);
                                    let cmd = command.trim();
                                    eprintln!("[KAI IPC] Received command: {}", cmd);
                                    if cmd == "toggle" {
                                        toggle_window(&ipc_handle);
                                    } else {
                                        if let Some(window) = ipc_handle.get_webview_window("main") {
                                            let _ = window.unminimize();
                                            let _ = window.show();
                                            let _ = window.set_focus();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                Err(e) => {
                    eprintln!("[KAI IPC WARNING] Failed to bind IPC listener socket: {}", e);
                }
            }

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
