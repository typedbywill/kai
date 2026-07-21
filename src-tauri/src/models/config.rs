use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const KEYRING_SERVICE: &str = "kai-overlay";
const KEYRING_USER: &str = "api_key";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub base_url: String,
    /// API key is NOT serialized to disk — stored in the OS keyring.
    /// This field is populated at load time and sent to the frontend.
    #[serde(skip_serializing, default)]
    pub api_key: String,
    pub model: String,
    pub system_prompt: String,
    #[serde(default = "default_shortcut")]
    pub shortcut: String,
}

fn default_shortcut() -> String {
    "Super+X".to_string()
}

/// On-disk representation (without api_key)
#[derive(Debug, Serialize, Deserialize)]
struct DiskConfig {
    pub base_url: String,
    pub model: String,
    pub system_prompt: String,
    #[serde(default = "default_shortcut")]
    pub shortcut: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            base_url: "https://api.openai.com/v1".to_string(),
            api_key: String::new(),
            model: "gpt-4o-mini".to_string(),
            system_prompt: "You are KAI, a helpful, ultra-fast AI assistant desktop overlay."
                .to_string(),
            shortcut: default_shortcut(),
        }
    }
}

impl AppConfig {
    pub fn get_config_path() -> PathBuf {
        let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push("kai");
        fs::create_dir_all(&path).ok();
        path.push("config.json");
        path
    }

    pub fn load() -> Self {
        let path = Self::get_config_path();
        let mut config = if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(disk) = serde_json::from_str::<DiskConfig>(&content) {
                AppConfig {
                    base_url: disk.base_url,
                    api_key: String::new(),
                    model: disk.model,
                    system_prompt: disk.system_prompt,
                    shortcut: disk.shortcut,
                }
            } else {
                // Try loading old format (with api_key in JSON) for migration
                if let Ok(old) = serde_json::from_str::<serde_json::Value>(&content) {
                    let mut cfg = Self::default();
                    if let Some(url) = old.get("base_url").and_then(|v| v.as_str()) {
                        cfg.base_url = url.to_string();
                    }
                    if let Some(model) = old.get("model").and_then(|v| v.as_str()) {
                        cfg.model = model.to_string();
                    }
                    if let Some(prompt) = old.get("system_prompt").and_then(|v| v.as_str()) {
                        cfg.system_prompt = prompt.to_string();
                    }
                    if let Some(sc) = old.get("shortcut").and_then(|v| v.as_str()) {
                        cfg.shortcut = sc.to_string();
                    }
                    // Migrate api_key from JSON to keyring
                    if let Some(key) = old.get("api_key").and_then(|v| v.as_str()) {
                        if !key.is_empty() {
                            let _ = Self::save_api_key(key);
                            cfg.api_key = key.to_string();
                            let _ = cfg.save_disk();
                        }
                    }
                    cfg
                } else {
                    Self::default()
                }
            }
        } else {
            Self::default()
        };

        // Load api_key from keyring
        if config.api_key.is_empty() {
            config.api_key = Self::load_api_key().unwrap_or_default();
        }

        config
    }

    fn save_disk(&self) -> Result<(), String> {
        let path = Self::get_config_path();
        let disk = DiskConfig {
            base_url: self.base_url.clone(),
            model: self.model.clone(),
            system_prompt: self.system_prompt.clone(),
            shortcut: self.shortcut.clone(),
        };
        let content = serde_json::to_string_pretty(&disk).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn save(&self) -> Result<(), String> {
        self.save_disk()?;

        // Save api_key to keyring
        if !self.api_key.is_empty() {
            Self::save_api_key(&self.api_key)?;
        }

        Ok(())
    }

    pub fn load_api_key() -> Result<String, String> {
        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
            .map_err(|e| format!("Keyring error: {}", e))?;
        match entry.get_password() {
            Ok(key) => Ok(key),
            Err(keyring::Error::NoEntry) => Ok(String::new()),
            Err(e) => Err(format!("Failed to read API key from keyring: {}", e)),
        }
    }

    pub fn save_api_key(key: &str) -> Result<(), String> {
        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
            .map_err(|e| format!("Keyring error: {}", e))?;
        if key.is_empty() {
            let _ = entry.delete_credential();
            Ok(())
        } else {
            entry
                .set_password(key)
                .map_err(|e| format!("Failed to save API key to keyring: {}", e))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.base_url, "https://api.openai.com/v1");
        assert_eq!(config.model, "gpt-4o-mini");
        assert_eq!(config.shortcut, "Super+X");
        assert!(config.api_key.is_empty());
    }

    #[test]
    fn test_disk_config_no_api_key() {
        let disk = DiskConfig {
            base_url: "http://localhost:11434/v1".to_string(),
            model: "llama3".to_string(),
            system_prompt: "Test".to_string(),
            shortcut: "Super+X".to_string(),
        };
        let json = serde_json::to_string(&disk).unwrap();
        assert!(!json.contains("api_key"));
    }
}
