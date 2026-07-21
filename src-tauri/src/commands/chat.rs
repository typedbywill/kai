use crate::models::config::AppConfig;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[tauri::command]
pub async fn stream_chat(
    prompt: String,
    history: Vec<ChatMessage>,
    on_chunk: Channel<String>,
) -> Result<(), String> {
    let config = AppConfig::load();

    let client = reqwest::Client::new();
    let mut messages = Vec::new();

    if !config.system_prompt.trim().is_empty() {
        messages.push(serde_json::json!({
            "role": "system",
            "content": config.system_prompt
        }));
    }

    for msg in history {
        messages.push(serde_json::json!({
            "role": msg.role,
            "content": msg.content
        }));
    }

    messages.push(serde_json::json!({
        "role": "user",
        "content": prompt
    }));

    let url = if config.base_url.ends_with('/') {
        format!("{}chat/completions", config.base_url)
    } else {
        format!("{}/chat/completions", config.base_url)
    };

    let mut req_builder = client.post(&url).json(&serde_json::json!({
        "model": config.model,
        "messages": messages,
        "stream": true
    }));

    if !config.api_key.trim().is_empty() {
        req_builder = req_builder.bearer_auth(config.api_key.trim());
    }

    let response = req_builder.send().await.map_err(|e| {
        format!(
            "Failed to connect to AI provider.\n\nURL: {}\nError: {}\n\nPlease check:\n• Is the API URL correct?\n• Is the server running?\n• Is your network connection working?",
            url, e
        )
    })?;

    if !response.status().is_success() {
        let status = response.status();
        let err_text = response.text().await.unwrap_or_default();

        let hint = match status.as_u16() {
            401 => "\n\nYour API key is invalid or missing. Check Settings → API & Model.",
            403 => "\n\nAccess forbidden. Your API key may not have the required permissions.",
            404 => "\n\nEndpoint not found. Check if the Base API URL is correct.",
            429 => "\n\nRate limited. Wait a moment and try again, or check your API plan.",
            500..=599 => "\n\nThe server returned an internal error. Try again later.",
            _ => "",
        };

        return Err(format!(
            "API Error (HTTP {}): {}{}",
            status, err_text, hint
        ));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Stream error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.starts_with("data: ") {
                let data = line.trim_start_matches("data: ").trim();
                if data == "[DONE]" {
                    break;
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        if !content.is_empty() {
                            let _ = on_chunk.send(content.to_string());
                        }
                    }
                }
            }
        }
    }

    let _ = on_chunk.send("[DONE]".to_string());
    Ok(())
}
