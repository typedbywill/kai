use arboard::Clipboard;
use std::thread;
use std::time::Duration;

/// Captures the currently selected text by simulating Ctrl+C and reading the clipboard.
/// This is the primary approach that works across both X11 and Wayland.
#[tauri::command]
pub async fn capture_selection() -> Result<String, String> {
    // Run clipboard read in a blocking thread since arboard doesn't support async
    tokio::task::spawn_blocking(|| {
        // Brief delay to allow any ongoing selection to stabilize
        thread::sleep(Duration::from_millis(50));

        let mut clipboard =
            Clipboard::new().map_err(|e| format!("Failed to access clipboard: {}", e))?;

        match clipboard.get_text() {
            Ok(text) if !text.trim().is_empty() => Ok(text),
            Ok(_) => Err("Clipboard is empty or contains no text".to_string()),
            Err(e) => Err(format!("Failed to read clipboard: {}", e)),
        }
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?
}

/// Captures a screen region as a base64-encoded PNG image.
/// Currently delegates to external tools based on the display server.
#[tauri::command]
pub async fn capture_screen() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        let session_type =
            std::env::var("XDG_SESSION_TYPE").unwrap_or_else(|_| "x11".to_string());

        match session_type.as_str() {
            "wayland" => capture_screen_wayland(),
            _ => capture_screen_x11(),
        }
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?
}

fn capture_screen_x11() -> Result<String, String> {
    // Use 'import' from ImageMagick or 'scrot' for region capture
    // Fallback: try gnome-screenshot, spectacle, etc.
    let tools = [
        ("scrot", vec!["-s", "-o", "/tmp/kai_capture.png"]),
        (
            "gnome-screenshot",
            vec!["-a", "-f", "/tmp/kai_capture.png"],
        ),
        (
            "spectacle",
            vec!["-r", "-b", "-n", "-o", "/tmp/kai_capture.png"],
        ),
    ];

    for (tool, args) in &tools {
        if let Ok(status) = std::process::Command::new(tool).args(args).status() {
            if status.success() {
                return read_file_as_base64("/tmp/kai_capture.png");
            }
        }
    }

    Err("No screenshot tool available. Install scrot, gnome-screenshot, or spectacle.".to_string())
}

fn capture_screen_wayland() -> Result<String, String> {
    // On Wayland, use slurp + grim for region selection
    // slurp provides region selection, grim captures the region
    let slurp = std::process::Command::new("slurp")
        .output()
        .map_err(|_| "slurp not found. Install slurp for Wayland region selection.".to_string())?;

    if !slurp.status.success() {
        return Err("Region selection cancelled.".to_string());
    }

    let geometry = String::from_utf8_lossy(&slurp.stdout).trim().to_string();

    let grim = std::process::Command::new("grim")
        .args(["-g", &geometry, "/tmp/kai_capture.png"])
        .status()
        .map_err(|_| "grim not found. Install grim for Wayland screen capture.".to_string())?;

    if !grim.success() {
        return Err("Screen capture failed.".to_string());
    }

    read_file_as_base64("/tmp/kai_capture.png")
}

fn read_file_as_base64(path: &str) -> Result<String, String> {
    use std::fs;
    let bytes = fs::read(path).map_err(|e| format!("Failed to read capture file: {}", e))?;
    let _ = fs::remove_file(path); // Clean up
    let base64 = base64_encode(&bytes);
    Ok(format!("data:image/png;base64,{}", base64))
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let combined = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((combined >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((combined >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((combined >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(combined & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base64_encode() {
        assert_eq!(base64_encode(b"Hello"), "SGVsbG8=");
        assert_eq!(base64_encode(b""), "");
        assert_eq!(base64_encode(b"ab"), "YWI=");
    }
}
