use std::fs;
use std::io::{Read, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::PathBuf;
use std::thread;

use tauri::AppHandle;

use crate::window;

fn get_socket_path() -> PathBuf {
    if let Ok(runtime_dir) = std::env::var("XDG_RUNTIME_DIR") {
        PathBuf::from(runtime_dir).join("kai_overlay.sock")
    } else {
        let mut p = dirs::config_dir().unwrap_or_else(|| PathBuf::from("/tmp"));
        p.push("kai");
        let _ = fs::create_dir_all(&p);
        p.join("kai_overlay.sock")
    }
}

/// Try to send a command to an already-running KAI instance.
/// Returns true if the message was sent (i.e., another instance is running).
pub fn try_send_to_existing(command: &str) -> bool {
    let socket_path = get_socket_path();
    if let Ok(mut stream) = UnixStream::connect(&socket_path) {
        let _ = stream.write_all(command.as_bytes());
        eprintln!("[KAI IPC] Sent '{}' to existing instance.", command);
        true
    } else {
        false
    }
}

/// Check CLI args and delegate to existing instance if one is running.
/// If no existing instance, handle daemonization for background mode.
pub fn check_and_delegate() {
    let args: Vec<String> = std::env::args().collect();
    let is_toggle = args.iter().any(|arg| arg == "--toggle" || arg == "-t");
    let is_foreground = args.iter().any(|arg| arg == "--foreground" || arg == "-f");
    let msg = if is_toggle { "toggle" } else { "show" };

    if try_send_to_existing(msg) {
        std::process::exit(0);
    }

    // If not in foreground mode and not --daemon, daemonize
    let is_daemon = args.iter().any(|arg| arg == "--daemon");
    if !is_daemon && !is_foreground {
        // For systemd service, the process is already managed.
        // For manual launch, we just run in foreground.
        // Daemonization is handled by the systemd service unit.
        // If running without systemd, just continue in foreground.
    }
}

/// Start the IPC socket listener that receives commands from other instances.
pub fn start_listener(handle: AppHandle) {
    let socket_path = get_socket_path();
    let _ = fs::remove_file(&socket_path);

    match UnixListener::bind(&socket_path) {
        Ok(listener) => {
            thread::spawn(move || {
                for stream in listener.incoming() {
                    if let Ok(mut stream) = stream {
                        let mut buf = [0u8; 64];
                        if let Ok(n) = stream.read(&mut buf) {
                            let command = String::from_utf8_lossy(&buf[..n]);
                            let cmd = command.trim();
                            eprintln!("[KAI IPC] Received: {}", cmd);
                            match cmd {
                                "toggle" => window::toggle_window(&handle),
                                "hide" => window::hide_window(&handle),
                                _ => window::show_window(&handle),
                            }
                        }
                    }
                }
            });
        }
        Err(e) => {
            eprintln!("[KAI IPC] Failed to bind socket: {}", e);
        }
    }
}
