use crate::models::config::AppConfig;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
}

/// Lists available models from the configured API endpoint.
#[tauri::command]
pub async fn list_models() -> Result<Vec<ModelInfo>, String> {
    let config = AppConfig::load();

    let url = if config.base_url.ends_with('/') {
        format!("{}models", config.base_url)
    } else {
        format!("{}/models", config.base_url)
    };

    let client = reqwest::Client::new();
    let mut req = client.get(&url);

    let api_key = AppConfig::load_api_key().unwrap_or_default();
    if !api_key.trim().is_empty() {
        req = req.bearer_auth(api_key.trim());
    }

    let response = req
        .send()
        .await
        .map_err(|e| format!("Failed to fetch models from {}: {}", url, e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!(
            "Models endpoint returned {} — {}",
            status, body
        ));
    }

    #[derive(Deserialize)]
    struct ModelsResponse {
        data: Option<Vec<ModelEntry>>,
    }

    #[derive(Deserialize)]
    struct ModelEntry {
        id: String,
    }

    let body: ModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse models response: {}", e))?;

    let models = body
        .data
        .unwrap_or_default()
        .into_iter()
        .map(|m| ModelInfo {
            name: m.id.clone(),
            id: m.id,
        })
        .collect();

    Ok(models)
}
