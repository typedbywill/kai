use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatSession {
    pub id: String,
    pub title: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    pub messages: Vec<ChatMessage>,
}

fn get_chats_dir() -> PathBuf {
    let mut path = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("kai");
    path.push("chats");
    let _ = fs::create_dir_all(&path);
    path
}

fn chat_file_path(id: &str) -> PathBuf {
    get_chats_dir().join(format!("{}.json", id))
}

#[tauri::command]
pub fn load_chats() -> Vec<ChatSession> {
    let dir = get_chats_dir();
    let mut chats: Vec<ChatSession> = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(chat) = serde_json::from_str::<ChatSession>(&content) {
                        chats.push(chat);
                    }
                }
            }
        }
    }

    // Sort by updatedAt descending
    chats.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    chats
}

#[tauri::command]
pub fn load_chat(id: String) -> Option<ChatSession> {
    let path = chat_file_path(&id);
    if let Ok(content) = fs::read_to_string(&path) {
        serde_json::from_str(&content).ok()
    } else {
        None
    }
}

#[tauri::command]
pub fn save_chat(chat: ChatSession) -> Result<(), String> {
    let path = chat_file_path(&chat.id);
    let content =
        serde_json::to_string_pretty(&chat).map_err(|e| format!("Serialize error: {}", e))?;
    fs::write(path, content).map_err(|e| format!("Write error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn delete_chat(id: String) -> Result<(), String> {
    let path = chat_file_path(&id);
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("Delete error: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn rename_chat(id: String, title: String) -> Result<(), String> {
    let path = chat_file_path(&id);
    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(mut chat) = serde_json::from_str::<ChatSession>(&content) {
            chat.title = title;
            let updated =
                serde_json::to_string_pretty(&chat).map_err(|e| format!("Serialize error: {}", e))?;
            fs::write(path, updated).map_err(|e| format!("Write error: {}", e))?;
            return Ok(());
        }
    }
    Err("Chat not found".to_string())
}

#[tauri::command]
pub fn search_chats(query: String) -> Vec<ChatSession> {
    let chats = load_chats();
    let lower = query.to_lowercase();
    chats
        .into_iter()
        .filter(|c| {
            c.title.to_lowercase().contains(&lower)
                || c.messages
                    .iter()
                    .any(|m| m.content.to_lowercase().contains(&lower))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn setup_test_dir() -> PathBuf {
        let dir = std::env::temp_dir().join("kai_test_chats");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_chat_serialize_deserialize() {
        let chat = ChatSession {
            id: "test_1".to_string(),
            title: "Test Chat".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
            messages: vec![
                ChatMessage {
                    role: "user".to_string(),
                    content: "Hello".to_string(),
                },
                ChatMessage {
                    role: "assistant".to_string(),
                    content: "Hi there!".to_string(),
                },
            ],
        };

        let json = serde_json::to_string(&chat).unwrap();
        let deserialized: ChatSession = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, "test_1");
        assert_eq!(deserialized.messages.len(), 2);
    }
}
