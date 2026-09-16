use std::time::Duration;

use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tauri::{command, Emitter, Window};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

type HmacSha256 = Hmac<Sha256>;

const CALLBACK_PORT: u16 = 53682;
const CALLBACK_TIMEOUT_SECS: u64 = 300;
const EMPTY_MD5: &str = "d41d8cd98f00b204e9800998ecf8427e";

/* ---------------- 数据结构 ---------------- */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenInfo {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<i64>,
    pub scopes: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct OAuthStartInput {
    pub provider: String,
    pub client_id: String,
}

#[derive(Debug, Serialize)]
pub struct OAuthStartOutput {
    pub auth_url: String,
    pub redirect_uri: String,
    pub state: String,
}

#[derive(Debug, Deserialize)]
pub struct OAuthExchangeInput {
    pub provider: String,
    pub client_id: String,
    pub client_secret: String,
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct OAuthRefreshInput {
    pub provider: String,
    pub client_id: String,
    pub client_secret: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BiliUserInfo {
    pub name: String,
    pub face: String,
    pub openid: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BiliUserStat {
    pub following: i64,
    pub follower: i64,
    pub arc_passed_total: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BiliVideoItem {
    #[serde(default)]
    pub resource_id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub ctime: i64,
    #[serde(default)]
    pub ptime: i64,
    #[serde(default)]
    pub video_info: BiliVideoInfo,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BiliVideoInfo {
    #[serde(default)]
    pub duration: i64,
    #[serde(default)]
    pub share_url: String,
}

#[derive(Debug, Serialize)]
pub struct FetchedSignal {
    pub signal_type: String,
    pub source: String,
    pub source_verifiability: String,
    pub payment_signal_present: bool,
    pub data: serde_json::Value,
    pub notes: String,
}

/* ---------------- OAuth: 启动授权 ---------------- */

#[command]
pub async fn oauth_start(
    window: Window,
    input: OAuthStartInput,
) -> Result<OAuthStartOutput, String> {
    let state = uuid::Uuid::new_v4().to_string();
    let redirect_uri = format!("http://127.0.0.1:{}/callback", CALLBACK_PORT);

    let auth_url = match input.provider.as_str() {
        "bilibili" => format!(
            "https://passport.bilibili.com/oauth2/authorize?client_id={}&response_type=code&redirect_uri={}&state={}",
            urlencoding(&input.client_id),
            urlencoding(&redirect_uri),
            urlencoding(&state),
        ),
        other => return Err(format!("暂不支持的数据源: {}", other)),
    };

    let provider = input.provider.clone();
    let expected_state = state.clone();
    let win = window.clone();

    tokio::spawn(async move {
        match listen_for_callback(&expected_state).await {
            Ok(code) => {
                let _ = win.emit(
                    "oauth://code",
                    serde_json::json!({
                        "provider": provider,
                        "code": code,
                    }),
                );
            }
            Err(e) => {
                let _ = win.emit(
                    "oauth://error",
                    serde_json::json!({
                        "provider": provider,
                        "message": e,
                    }),
                );
            }
        }
    });

    Ok(OAuthStartOutput {
        auth_url,
        redirect_uri,
        state,
    })
}

/* ---------------- Loopback listener ---------------- */

async fn listen_for_callback(expected_state: &str) -> Result<String, String> {
    let addr = format!("127.0.0.1:{}", CALLBACK_PORT);
    let listener = TcpListener::bind(&addr)
        .await
        .map_err(|e| format!("端口 {} 无法绑定: {}", CALLBACK_PORT, e))?;

    let deadline =
        tokio::time::Instant::now() + Duration::from_secs(CALLBACK_TIMEOUT_SECS);

    loop {
        let accept = tokio::time::timeout_at(deadline, listener.accept()).await;
        let (mut socket, _) = match accept {
            Ok(Ok(pair)) => pair,
            Ok(Err(e)) => return Err(format!("接受连接失败: {}", e)),
            Err(_) => return Err("授权超时（5 分钟未收到回调）".into()),
        };

        let mut buf = vec![0u8; 8192];
        let n = match socket.read(&mut buf).await {
            Ok(n) => n,
            Err(e) => {
                let _ = respond(&mut socket, false).await;
                return Err(format!("读取请求失败: {}", e));
            }
        };
        let request = String::from_utf8_lossy(&buf[..n]).to_string();

        let first_line = request.lines().next().unwrap_or("");
        let path = first_line.split_whitespace().nth(1).unwrap_or("");
        let query = path.split('?').nth(1).unwrap_or("");

        let mut code: Option<String> = None;
        let mut state: Option<String> = None;
        for pair in query.split('&') {
            let mut kv = pair.splitn(2, '=');
            let k = kv.next().unwrap_or("");
            let v = kv.next().unwrap_or("");
            match k {
                "code" => code = Some(v.to_string()),
                "state" => state = Some(v.to_string()),
                _ => {}
            }
        }

        let success = matches!(
            (&code, &state),
            (Some(_), Some(s)) if s == expected_state
        );
        let _ = respond(&mut socket, success).await;

        match (code, state) {
            (Some(c), Some(s)) if s == expected_state => return Ok(c),
            (Some(_), Some(_)) => {
                return Err("state 校验失败，可能是 CSRF 攻击".into())
            }
            _ => continue,
        }
    }
}

async fn respond(
    socket: &mut tokio::net::TcpStream,
    success: bool,
) -> std::io::Result<()> {
    let (title, body) = if success {
        ("授权成功", "已成功连接到 ShipSignal，可以关闭此页面返回应用。")
    } else {
        ("授权失败", "未收到有效的授权码，请返回应用重试。")
    };
    let html = format!(
        r#"<!doctype html><html><head><meta charset="utf-8"><title>{t}</title><style>body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0b0d10;color:#e5e7eb;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}}div{{text-align:center}}h1{{font-size:20px;margin-bottom:8px}}p{{color:#8b93a1;font-size:14px}}</style></head><body><div><h1>{t}</h1><p>{b}</p></div></body></html>"#,
        t = title,
        b = body
    );
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );
    socket.write_all(response.as_bytes()).await?;
    let _ = socket.shutdown().await;
    Ok(())
}

/* ---------------- OAuth: 换 token ---------------- */

#[command]
pub async fn oauth_exchange_token(
    input: OAuthExchangeInput,
) -> Result<TokenInfo, String> {
    match input.provider.as_str() {
        "bilibili" => {
            let client = reqwest::Client::new();
            let params = [
                ("client_id", input.client_id.as_str()),
                ("client_secret", input.client_secret.as_str()),
                ("grant_type", "authorization_code"),
                ("code", input.code.as_str()),
            ];
            let resp = client
                .post("https://api.bilibili.com/x/account-oauth2/v1/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .form(&params)
                .send()
                .await
                .map_err(|e| format!("Token 请求失败: {}", e))?;

            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            if !status.is_success() {
                return Err(format!("HTTP {}: {}", status, text));
            }
            parse_token_response(&text)
        }
        other => Err(format!("暂不支持的数据源: {}", other)),
    }
}

/* ---------------- OAuth: 刷新 token ---------------- */

#[command]
pub async fn oauth_refresh_token(
    input: OAuthRefreshInput,
) -> Result<TokenInfo, String> {
    match input.provider.as_str() {
        "bilibili" => {
            let client = reqwest::Client::new();
            let params = [
                ("client_id", input.client_id.as_str()),
                ("client_secret", input.client_secret.as_str()),
                ("grant_type", "refresh_token"),
                ("refresh_token", input.refresh_token.as_str()),
            ];
            let resp = client
                .post("https://api.bilibili.com/x/account-oauth2/v1/refresh_token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .form(&params)
                .send()
                .await
                .map_err(|e| format!("刷新 Token 请求失败: {}", e))?;

            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            if !status.is_success() {
                return Err(format!("HTTP {}: {}", status, text));
            }
            parse_token_response(&text)
        }
        other => Err(format!("暂不支持的数据源: {}", other)),
    }
}

fn parse_token_response(text: &str) -> Result<TokenInfo, String> {
    let json: serde_json::Value = serde_json::from_str(text)
        .map_err(|e| format!("解析响应失败: {} 原文: {}", e, text))?;

    let code = json.get("code").and_then(|v| v.as_i64()).unwrap_or(-1);
    if code != 0 {
        let msg = json
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("未知错误");
        return Err(format!("B站返回业务错误 code={} message={}", code, msg));
    }

    let data = json
        .get("data")
        .ok_or_else(|| format!("响应缺少 data 字段: {}", text))?;

    let access_token = data
        .get("access_token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("响应缺少 access_token: {}", text))?
        .to_string();

    let refresh_token = data
        .get("refresh_token")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let expires_at = data.get("expires_in").and_then(|v| v.as_i64());

    let scopes = data
        .get("scopes")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    Ok(TokenInfo {
        access_token,
        refresh_token,
        expires_at,
        scopes,
    })
}

/* ---------------- B站 API: 签名 ---------------- */

struct BiliSign<'a> {
    client_id: &'a str,
    client_secret: &'a str,
}

impl<'a> BiliSign<'a> {
    fn headers(&self, body: Option<&str>) -> Vec<(&'static str, String)> {
        let timestamp = chrono::Utc::now().timestamp();
        let nonce = uuid::Uuid::new_v4().to_string().replace('-', "");
        let content_md5 = compute_content_md5(body);
        let signature = build_signature(
            self.client_id,
            self.client_secret,
            timestamp,
            &nonce,
            &content_md5,
        );

        vec![
            ("X-Bili-Accesskeyid", self.client_id.to_string()),
            ("X-Bili-Content-Md5", content_md5),
            ("X-Bili-Signature-Method", "HMAC-SHA256".to_string()),
            ("X-Bili-Signature-Nonce", nonce),
            ("X-Bili-Signature-Version", "2.0".to_string()),
            ("X-Bili-Timestamp", timestamp.to_string()),
            ("Authorization", signature),
        ]
    }
}

fn build_signature(
    client_id: &str,
    client_secret: &str,
    timestamp: i64,
    nonce: &str,
    content_md5: &str,
) -> String {
    let sign_str = format!(
        "x-bili-accesskeyid:{}\nx-bili-content-md5:{}\nx-bili-signature-method:HMAC-SHA256\nx-bili-signature-nonce:{}\nx-bili-signature-version:2.0\nx-bili-timestamp:{}",
        client_id, content_md5, nonce, timestamp
    );
    let mut mac =
        HmacSha256::new_from_slice(client_secret.as_bytes()).expect("HMAC key");
    mac.update(sign_str.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

fn compute_content_md5(body: Option<&str>) -> String {
    match body {
        Some(s) if !s.is_empty() => format!("{:x}", md5::compute(s)),
        _ => EMPTY_MD5.to_string(),
    }
}

/* ---------------- B站 API: 用户信息 ---------------- */

#[tauri::command(rename_all = "snake_case")]
pub async fn bili_fetch_user_info(
    client_id: String,
    client_secret: String,
    access_token: String,
) -> Result<BiliUserInfo, String> {
    let sign = BiliSign {
        client_id: &client_id,
        client_secret: &client_secret,
    };
    let client = reqwest::Client::new();
    let mut req = client
        .get("https://member.bilibili.com/arcopen/fn/user/account/info")
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .header("Access-Token", &access_token)
        .header("User-Agent", "ShipSignal/0.1.0");
    for (k, v) in sign.headers(None) {
        req = req.header(k, v);
    }
    let resp = req
        .send()
        .await
        .map_err(|e| format!("请求用户信息失败: {}", e))?;
    let text = resp.text().await.unwrap_or_default();
    parse_bili_data::<BiliUserInfo>(&text)
}

/* ---------------- B站 API: 用户数据 ---------------- */

#[tauri::command(rename_all = "snake_case")]
pub async fn bili_fetch_user_stat(
    client_id: String,
    client_secret: String,
    access_token: String,
) -> Result<BiliUserStat, String> {
    let sign = BiliSign {
        client_id: &client_id,
        client_secret: &client_secret,
    };
    let client = reqwest::Client::new();
    let mut req = client
        .get("https://member.bilibili.com/arcopen/fn/data/user/stat")
        .header("Accept", "application/json")
        .header("Access-Token", &access_token)
        .header("User-Agent", "ShipSignal/0.1.0");
    for (k, v) in sign.headers(None) {
        req = req.header(k, v);
    }
    let resp = req
        .send()
        .await
        .map_err(|e| format!("请求用户数据失败: {}", e))?;
    let text = resp.text().await.unwrap_or_default();
    parse_bili_data::<BiliUserStat>(&text)
}

/* ---------------- B站 API: 视频列表 ---------------- */

#[tauri::command(rename_all = "snake_case")]
pub async fn bili_fetch_videos(
    client_id: String,
    client_secret: String,
    access_token: String,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<Vec<BiliVideoItem>, String> {
    let sign = BiliSign {
        client_id: &client_id,
        client_secret: &client_secret,
    };
    let pn = page.unwrap_or(1).max(1);
    let ps = page_size.unwrap_or(20).clamp(1, 50);

    let client = reqwest::Client::new();
    let mut req = client
        .get("https://member.bilibili.com/arcopen/fn/archive/viewlist")
        .query(&[
            ("pn", pn.to_string()),
            ("ps", ps.to_string()),
            ("status", "all".to_string()),
        ])
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .header("Access-Token", &access_token)
        .header("User-Agent", "ShipSignal/0.1.0");
    for (k, v) in sign.headers(None) {
        req = req.header(k, v);
    }

    let resp = req
        .send()
        .await
        .map_err(|e| format!("请求视频列表失败: {}", e))?;
    let status = resp.status();
    let text = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(format!("HTTP {}: {}", status, text));
    }

    let json: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| format!("解析视频列表响应失败: {} 原文: {}", e, text))?;

    let code = json.get("code").and_then(|v| v.as_i64()).unwrap_or(-1);
    if code != 0 {
        let msg = json
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("未知错误");
        return Err(format!("B站返回业务错误 code={} message={}", code, msg));
    }

    let data = json.get("data").cloned().unwrap_or(serde_json::Value::Null);
    let arr = if data.is_array() {
        data.as_array().cloned().unwrap_or_default()
    } else if let Some(list) = data.get("list").and_then(|v| v.as_array()) {
        list.clone()
    } else {
        Vec::new()
    };

    let mut out = Vec::new();
    for v in arr {
        let item: BiliVideoItem = serde_json::from_value(v).unwrap_or_default();
        out.push(item);
    }
    Ok(out)
}

fn parse_bili_data<T: for<'de> Deserialize<'de>>(text: &str) -> Result<T, String> {
    let json: serde_json::Value = serde_json::from_str(text)
        .map_err(|e| format!("解析响应失败: {} 原文: {}", e, text))?;
    let code = json.get("code").and_then(|v| v.as_i64()).unwrap_or(-1);
    if code != 0 {
        let msg = json
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("未知错误");
        return Err(format!("B站返回业务错误 code={} message={}", code, msg));
    }
    let data = json
        .get("data")
        .ok_or_else(|| format!("响应缺少 data 字段: {}", text))?;
    serde_json::from_value(data.clone())
        .map_err(|e| format!("解析 data 失败: {} 原文: {}", e, data))
}

/* ---------------- 数据映射 ---------------- */

#[tauri::command(rename_all = "snake_case")]
pub async fn bili_fetch_signals(
    client_id: String,
    client_secret: String,
    access_token: String,
    limit: Option<u32>,
) -> Result<Vec<FetchedSignal>, String> {
    let videos =
        bili_fetch_videos(client_id, client_secret, access_token, Some(1), limit).await?;
    let signals = videos
        .into_iter()
        .map(|v| FetchedSignal {
            signal_type: "platform_metric".to_string(),
            source: "bilibili".to_string(),
            source_verifiability: "medium".to_string(),
            payment_signal_present: false,
            data: serde_json::json!({
                "resource_id": v.resource_id,
                "title": v.title,
                "cover": v.cover,
                "duration": v.video_info.duration,
                "share_url": v.video_info.share_url,
                "ctime": v.ctime,
                "ptime": v.ptime,
            }),
            notes: format!("B站视频《{}》", v.title),
        })
        .collect();
    Ok(signals)
}

/* ---------------- 打开外部浏览器 ---------------- */

#[tauri::command]
pub async fn open_external(url: String) -> Result<(), String> {
    // 白名单协议，避免被滥用
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("仅支持 http/https 链接".into());
    }

    #[cfg(target_os = "windows")]
    let spawn_result = std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", &url])
        .spawn();

    #[cfg(target_os = "macos")]
    let spawn_result = std::process::Command::new("open").arg(&url).spawn();

    #[cfg(all(unix, not(target_os = "macos")))]
    let spawn_result = std::process::Command::new("xdg-open")
        .arg(&url)
        .spawn();

    spawn_result
        .map(|_| ())
        .map_err(|e| format!("打开浏览器失败: {}", e))
}

/* ---------------- URL encoding ---------------- */

fn urlencoding(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}