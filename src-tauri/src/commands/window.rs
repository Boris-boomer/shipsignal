use std::sync::Mutex;
use tauri::{command, AppHandle, Manager, Window};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CloseBehavior {
    Ask,
    Exit,
    Tray,
}

pub struct CloseBehaviorState(pub Mutex<CloseBehavior>);

impl Default for CloseBehaviorState {
    fn default() -> Self {
        Self(Mutex::new(CloseBehavior::Ask))
    }
}

/// 标记"真的退出"，绕过 CloseRequested 拦截
pub struct ForceQuit(pub std::sync::atomic::AtomicBool);

impl Default for ForceQuit {
    fn default() -> Self {
        Self(std::sync::atomic::AtomicBool::new(false))
    }
}

#[command]
pub fn set_close_behavior(
    app: AppHandle,
    behavior: String,
) -> Result<(), String> {
    let next = match behavior.as_str() {
        "ask" => CloseBehavior::Ask,
        "exit" => CloseBehavior::Exit,
        "tray" => CloseBehavior::Tray,
        other => return Err(format!("unknown close behavior: {}", other)),
    };
    let state = app.state::<CloseBehaviorState>();
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = next;
    Ok(())
}

#[command]
pub fn force_quit(app: AppHandle) -> Result<(), String> {
    let state = app.state::<ForceQuit>();
    state.0.store(true, std::sync::atomic::Ordering::Relaxed);
    app.exit(0);
    Ok(())
}

#[command]
pub fn minimize_to_tray(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}