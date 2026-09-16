use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Emitter, Manager, Window};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AiMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AiChatInput {
    pub request_id: String,
    pub messages: Vec<AiMessage>,
    pub purpose: String,
    pub project_id: Option<String>,
    pub api_base: String,
    pub api_key: String,
    pub model: String,
    #[serde(default = "default_temperature")]
    pub temperature: f64,
}

fn default_temperature() -> f64 {
    0.4
}

#[derive(Debug, Deserialize)]
pub struct AiCancelInput {
    pub request_id: String,
}

/* ---------------- 取消注册表 ---------------- */

#[derive(Clone, Default)]
pub struct CancelRegistry {
    map: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
}

impl CancelRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    fn register(&self, request_id: &str) -> Arc<AtomicBool> {
        let flag = Arc::new(AtomicBool::new(false));
        if let Ok(mut m) = self.map.lock() {
            m.insert(request_id.to_string(), flag.clone());
        }
        flag
    }

    fn unregister(&self, request_id: &str) {
        if let Ok(mut m) = self.map.lock() {
            m.remove(request_id);
        }
    }

    fn cancel(&self, request_id: &str) -> bool {
        if let Ok(m) = self.map.lock() {
            if let Some(flag) = m.get(request_id) {
                flag.store(true, Ordering::Relaxed);
                return true;
            }
        }
        false
    }
}

/* ---------------- 事件 payload ---------------- */

#[derive(Debug, Serialize, Clone)]
struct StreamPayload<'a> {
    request_id: &'a str,
    delta: &'a str,
}

#[derive(Debug, Serialize, Clone)]
struct DonePayload<'a> {
    request_id: &'a str,
    full: &'a str,
}

#[derive(Debug, Serialize, Clone)]
struct CancelledPayload<'a> {
    request_id: &'a str,
    full: &'a str,
}

#[derive(Debug, Serialize, Clone)]
struct ErrorPayload<'a> {
    request_id: &'a str,
    message: &'a str,
}

#[derive(Debug, Serialize)]
struct ChatRequest<'a> {
    model: &'a str,
    messages: &'a [AiMessage],
    temperature: f64,
    stream: bool,
}

enum ChatOutcome {
    Completed(String),
    Cancelled(String),
}

/* ---------------- 命令 ---------------- */

#[command]
pub async fn ai_chat(
    window: Window,
    app: AppHandle,
    input: AiChatInput,
) -> Result<String, String> {
    let registry = app.state::<CancelRegistry>().inner().clone();
    let cancel_flag = registry.register(&input.request_id);

    let outcome = run_chat(&window, &input, cancel_flag).await;

    registry.unregister(&input.request_id);

    match outcome {
        Ok(ChatOutcome::Completed(full)) => {
            let _ = window.emit(
                "ai://done",
                DonePayload {
                    request_id: &input.request_id,
                    full: &full,
                },
            );
            Ok(full)
        }
        Ok(ChatOutcome::Cancelled(full)) => {
            let _ = window.emit(
                "ai://cancelled",
                CancelledPayload {
                    request_id: &input.request_id,
                    full: &full,
                },
            );
            Ok(full)
        }
        Err(e) => {
            let _ = window.emit(
                "ai://error",
                ErrorPayload {
                    request_id: &input.request_id,
                    message: &e,
                },
            );
            Err(e)
        }
    }
}

#[command]
pub fn ai_cancel(app: AppHandle, input: AiCancelInput) -> Result<(), String> {
    let registry = app.state::<CancelRegistry>().inner().clone();
    if registry.cancel(&input.request_id) {
        Ok(())
    } else {
        Err("该请求不存在或已结束".into())
    }
}

async fn run_chat(
    window: &Window,
    input: &AiChatInput,
    cancel_flag: Arc<AtomicBool>,
) -> Result<ChatOutcome, String> {
    if input.api_key.trim().is_empty() {
        return Err("缺少 API Key，请先在设置中配置。".into());
    }

    let url = format!(
        "{}/chat/completions",
        input.api_base.trim_end_matches('/')
    );

    let body = ChatRequest {
        model: &input.model,
        messages: &input.messages,
        temperature: input.temperature,
        stream: true,
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(&url)
        .bearer_auth(&input.api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("API {status}: {text}"));
    }

    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();
    let mut full = String::new();

    while let Some(chunk) = stream.next().await {
        if cancel_flag.load(Ordering::Relaxed) {
            return Ok(ChatOutcome::Cancelled(full));
        }

        let chunk = chunk.map_err(|e| format!("流式读取失败: {e}"))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let event = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            for line in event.lines() {
                let line = line.trim();
                if !line.starts_with("data:") {
                    continue;
                }
                let data = line.trim_start_matches("data:").trim();
                if data == "[DONE]" {
                    return Ok(ChatOutcome::Completed(full));
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(delta) = json
                        .get("choices")
                        .and_then(|c| c.get(0))
                        .and_then(|c| c.get("delta"))
                        .and_then(|d| d.get("content"))
                        .and_then(|c| c.as_str())
                    {
                        full.push_str(delta);
                        let _ = window.emit(
                            "ai://stream",
                            StreamPayload {
                                request_id: &input.request_id,
                                delta,
                            },
                        );
                    }
                }
            }
        }
    }

    Ok(ChatOutcome::Completed(full))
}