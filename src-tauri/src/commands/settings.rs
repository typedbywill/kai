use crate::models::config::AppConfig;

#[tauri::command]
pub fn load_settings() -> AppConfig {
    AppConfig::load()
}

#[tauri::command]
pub fn save_settings(config: AppConfig) -> Result<(), String> {
    config.save()
}

#[tauri::command]
pub fn get_api_key() -> Result<String, String> {
    AppConfig::load_api_key()
}

#[tauri::command]
pub fn set_api_key(key: String) -> Result<(), String> {
    AppConfig::save_api_key(&key)
}
