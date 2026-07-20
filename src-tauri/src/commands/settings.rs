use crate::models::config::AppConfig;

#[tauri::command]
pub fn load_settings() -> AppConfig {
    AppConfig::load()
}

#[tauri::command]
pub fn save_settings(config: AppConfig) -> Result<(), String> {
    config.save()
}
