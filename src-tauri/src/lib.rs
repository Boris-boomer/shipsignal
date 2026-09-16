pub mod commands;
pub mod credibility;

use std::sync::atomic::Ordering;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_sql::{Migration, MigrationKind};

use commands::window::{CloseBehavior, CloseBehaviorState, ForceQuit};

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "init",
            sql: include_str!("../migrations/001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "data_sources",
            sql: include_str!("../migrations/002_data_sources.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "sunset_conditions",
            sql: include_str!("../migrations/003_sunset_conditions.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:shipssignal.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .manage(commands::ai::CancelRegistry::new())
        .manage(CloseBehaviorState::default())
        .manage(ForceQuit::default())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("ShipSignal");
            }

            // ---------- 系统托盘 ----------
            let show_item =
                MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit_item =
                MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &sep, &quit_item])?;

            let icon = app
                .default_window_icon()
                .cloned()
                .ok_or("No default window icon")?;

            TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("ShipSignal")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => {
                        let state = app.state::<ForceQuit>();
                        state.0.store(true, Ordering::Relaxed);
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();

                // 强制退出：走默认
                if app.state::<ForceQuit>().0.load(Ordering::Relaxed) {
                    return;
                }

                let behavior = {
                    let state = app.state::<CloseBehaviorState>();
                    let result = match state.0.lock() {
                        Ok(guard) => *guard,
                        Err(_) => CloseBehavior::Ask,
                    };
                    result
                };

                match behavior {
                    CloseBehavior::Exit => {
                        // 走默认关闭
                    }
                    CloseBehavior::Tray => {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                    CloseBehavior::Ask => {
                        api.prevent_close();
                        let _ = window.emit("app://close-requested", ());
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::signals::assess_signal,
            commands::ai::ai_chat,
            commands::ai::ai_cancel,
            commands::datasource::oauth_start,
            commands::datasource::oauth_exchange_token,
            commands::datasource::oauth_refresh_token,
            commands::datasource::bili_fetch_user_info,
            commands::datasource::bili_fetch_user_stat,
            commands::datasource::bili_fetch_videos,
            commands::datasource::bili_fetch_signals,
            commands::datasource::open_external,
            commands::file_io::save_text_file,
            commands::file_io::read_text_file,
            commands::window::set_close_behavior,
            commands::window::force_quit,
            commands::window::minimize_to_tray,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ShipSignal");
}